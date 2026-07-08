import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// In-memory cache to store the status of the capital registration process
const statusCache: Record<string, { status: string, mkCapital?: string, errorMsg?: string, resetLink?: string }> = {};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  
  if (!email) {
    return NextResponse.json({ success: false, error: 'Thiếu tham số email' }, { headers: corsHeaders });
  }

  const result = statusCache[email];
  if (result) {
    return NextResponse.json({ success: true, hasResult: true, result }, { headers: corsHeaders });
  } else {
    return NextResponse.json({ success: true, hasResult: false }, { headers: corsHeaders });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, sheetId, sheetName = 'Sheet1', rowIndex, status, mkCapital, errorMsg, resetLink } = await request.json();
    
    if (!email || !status) {
      return NextResponse.json({ success: false, error: 'Thiếu tham số' }, { status: 400, headers: corsHeaders });
    }

    statusCache[email] = { status, mkCapital, errorMsg, resetLink };
    
    // Nếu thành công và có đầy đủ thông tin, ghi trực tiếp mật khẩu vào Google Sheet!
    if (status === 'ok' && mkCapital && sheetId && rowIndex) {
      console.log(`[Status API] Đăng ký thành công cho ${email}. Đang ghi mật khẩu ${mkCapital} vào cột F hàng ${rowIndex} trên sheet ${sheetId}...`);
      
      const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
      const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
      
      if (privateKey && clientEmail) {
        const auth = new google.auth.JWT({
          email: clientEmail,
          key: privateKey,
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        
        const sheets = google.sheets({ version: 'v4', auth });
        
        // Ghi mật khẩu Capital One vào cột F (Mật khẩu Capital)
        await sheets.spreadsheets.values.update({
          spreadsheetId: sheetId,
          range: `'${sheetName}'!F${rowIndex}`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [[mkCapital]]
          }
        });
        console.log(`[Status API] Đã ghi thành công mật khẩu vào Google Sheet!`);
      } else {
        console.warn(`[Status API] Thiếu cấu hình Google Service Account, bỏ qua việc ghi trực tiếp vào Sheet.`);
      }
    }
    
    // Clear cache sau 5 phút để tránh rò rỉ bộ nhớ
    setTimeout(() => {
      delete statusCache[email];
    }, 5 * 60 * 1000);

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[capital-reg-status] error:', err);
    return NextResponse.json({ success: false, error: message }, { status: 500, headers: corsHeaders });
  }
}
