import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const { sheetId, sheetName = 'Sheet1', rowIndex, recovery, code, mode = 'default', newMkHotmail = '', newMkCapital = '', email = '' } = await request.json();

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

    if (mode === 'capital') {
      // Ghi 4 cột bắt đầu từ cột K: K (Email Hotmail), L (MK Hotmail mới), M (Mail khôi phục mới), N (MK Capital mới)
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `'${sheetName}'!K${rowIndex}`,
        valueInputOption: 'RAW',
        requestBody: { 
          values: [[email, newMkHotmail, recovery, newMkCapital]] 
        },
      });
    } else if (mode === 'capital_reg') {
      // 1. Tính toán ngày hiện tại định dạng DD/MM/YYYY theo giờ VN (GMT+7)
      const now = new Date();
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const vnTime = new Date(utc + (3600000 * 7));
      const day = String(vnTime.getDate()).padStart(2, '0');
      const month = String(vnTime.getMonth() + 1).padStart(2, '0');
      const year = vnTime.getFullYear();
      const dateStr = `${day}/${month}/${year}`;

      // 2. Ghi Ngày tạo vào cột B (Cột B là cột 2, range: B${rowIndex})
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `'${sheetName}'!B${rowIndex}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[dateStr]] },
      });

      // 3. Ghi Mật khẩu Capital vào cột F (Cột F là cột 6, range: F${rowIndex})
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `'${sheetName}'!F${rowIndex}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[newMkCapital]] },
      });
    } else {
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `'${sheetName}'!E${rowIndex}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[recovery]] },
      });
    }


    return NextResponse.json({ success: true, rowIndex, recovery, code });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[complete-row] error:', err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
