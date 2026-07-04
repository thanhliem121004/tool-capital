import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

const RESULTS_FILE = path.join(process.cwd(), 'check_results.json');

function readResults() {
  if (!fs.existsSync(RESULTS_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8'));
  } catch (e) {
    return {};
  }
}

function writeResult(email: string, result: any) {
  const data = readResults();
  data[email.toLowerCase().trim()] = {
    ...result,
    timestamp: Date.now()
  };
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

export async function POST(request: NextRequest) {
  try {
    const { sheetId, sheetName = 'Sheet1', rowIndex, email, status, error } = await request.json();

    if (!sheetId || !rowIndex || !email || !status) {
      return NextResponse.json(
        { success: false, error: 'Thiếu tham số bắt buộc' },
        { status: 400 }
      );
    }

    console.log(`[Check Capital Report] Nhận báo cáo từ trình duyệt: ${email} | Status: ${status} | Error: ${error || 'Không có'}`);

    // 1. Lưu kết quả vào file JSON tạm để frontend polling đọc
    writeResult(email, { status, error });

    // 2. CẬP NHẬT GOOGLE SHEET
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

    if (!privateKey || !clientEmail) {
      return NextResponse.json({ success: true, warning: 'Lưu kết quả tạm OK nhưng thiếu biến môi trường Google Sheets' });
    }

    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });

    // Lấy metadata để lấy gridId
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    const sheet = spreadsheet.data.sheets?.find(
      (s) => s.properties?.title?.toLowerCase() === sheetName.toLowerCase()
    );

    if (!sheet || sheet.properties?.sheetId === undefined) {
      return NextResponse.json({ success: true, warning: 'Không tìm thấy tab sheet tương ứng để tô màu' });
    }

    const gridId = sheet.properties.sheetId;

    if (status === 'ok') {
      // Đăng nhập THÀNH CÔNG: Tô màu xanh lá pastel cho dòng đó trên sheet
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: {
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: gridId,
                  startRowIndex: rowIndex - 1,
                  endRowIndex: rowIndex,
                  startColumnIndex: 0,
                  endColumnIndex: 15,
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.85, green: 1.0, blue: 0.85 }, // Màu xanh lá pastel
                  },
                },
                fields: 'userEnteredFormat.backgroundColor',
              },
            },
          ],
        },
      });

      // Nếu cột L hoặc N trước đó đang chứa chữ lỗi, ta xóa nó đi để sẵn sàng hoạt động
      const rowRes = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `'${sheetName}'!L${rowIndex}:N${rowIndex}`,
      });
      const rowVals = rowRes.data.values?.[0] || [];
      const oldValL = String(rowVals[0] ?? '').trim();
      const oldValN = String(rowVals[2] ?? '').trim();
      
      if (oldValL.includes('SAI')) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: sheetId,
          range: `'${sheetName}'!L${rowIndex}`,
          valueInputOption: 'RAW',
          requestBody: { values: [['']] },
        });
      }
      if (oldValN.includes('SAI')) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: sheetId,
          range: `'${sheetName}'!N${rowIndex}`,
          valueInputOption: 'RAW',
          requestBody: { values: [['']] },
        });
      }
    } else {
      // Đăng nhập THẤT BẠI: Tô màu đỏ pastel và ghi "SAI CAPITAL" vào cột N
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `'${sheetName}'!N${rowIndex}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [['SAI CAPITAL']],
        },
      });

      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: {
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: gridId,
                  startRowIndex: rowIndex - 1,
                  endRowIndex: rowIndex,
                  startColumnIndex: 0,
                  endColumnIndex: 15,
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 1.0, green: 0.85, blue: 0.85 }, // Màu đỏ pastel
                  },
                },
                fields: 'userEnteredFormat.backgroundColor',
              },
            },
          ],
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Check Capital Report] Lỗi xử lý báo cáo:', err);
    return NextResponse.json({ success: false, error: err.message || String(err) }, { status: 500 });
  }
}
