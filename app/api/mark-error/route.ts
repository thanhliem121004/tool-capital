import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const { sheetId, sheetName = 'Sheet1', rowIndex, mode = 'default', errorType = 'mail' } = await request.json();

    if (!sheetId || !rowIndex) {
      return NextResponse.json(
        { success: false, error: 'Thiếu tham số: sheetId hoặc rowIndex' },
        { status: 400 }
      );
    }

    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

    if (!privateKey || !clientEmail) {
      return NextResponse.json(
        { success: false, error: 'Thiếu biến môi trường Google Service Account' },
        { status: 500 }
      );
    }

    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // 1. LẤY METADATA ĐỂ TÌM GRID_ID CỦA SHEET_NAME
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
    });

    const sheet = spreadsheet.data.sheets?.find(
      (s) => s.properties?.title?.toLowerCase() === sheetName.toLowerCase()
    );

    if (!sheet || sheet.properties?.sheetId === undefined) {
      return NextResponse.json(
        { success: false, error: `Không tìm thấy tab sheet có tên: ${sheetName}` },
        { status: 404 }
      );
    }

    const gridId = sheet.properties.sheetId;

    // 2. GHI CHỮ "SAI MẬT KHẨU" VÀO SHEET
    if (mode === 'capital') {
      if (errorType === 'capital') {
        // Sai Capital -> Ghi vào cột N (MK Capital mới)
        await sheets.spreadsheets.values.update({
          spreadsheetId: sheetId,
          range: `'${sheetName}'!N${rowIndex}`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [['SAI MẬT KHẨU CAPITAL']]
          },
        });
      } else {
        // Sai Mail -> Ghi vào cột L (Mật khẩu Hotmail mới)
        await sheets.spreadsheets.values.update({
          spreadsheetId: sheetId,
          range: `'${sheetName}'!L${rowIndex}`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [['SAI MẬT KHẨU MAIL']]
          },
        });
      }
    } else {
      // Ở chế độ default: Ghi chữ "SAI MẬT KHẨU" vào cột E (Mail khôi phục mới)
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `'${sheetName}'!E${rowIndex}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [['SAI MẬT KHẨU']]
        },
      });
    }

    // 3. TÔ MÀU ĐỎ PASTEL DÒNG TƯƠNG ỨNG TRONG GOOGLE SHEET (Cột A đến N, index 0 đến 14)
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
                  backgroundColor: {
                    red: 1.0,
                    green: 0.85,
                    blue: 0.85, // Màu đỏ nhạt pastel
                  },
                },
              },
              fields: 'userEnteredFormat.backgroundColor',
            },
          },
        ],
      },
    });

    return NextResponse.json({ success: true, rowIndex });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[mark-error] error:', err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
