import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const { sheetId, sheetName = 'Sheet1', rowIndex, email, mkCapital } = await request.json();

    if (!sheetId || !rowIndex || !email || !mkCapital) {
      return NextResponse.json(
        { success: false, error: 'Thiếu mật khẩu Capital One (hoặc mật khẩu Hotmail dự phòng) cho dòng này!' },
        { status: 400 }
      );
    }

    console.log(`[Check Capital] Yêu cầu mở tab ẩn danh kiểm tra: ${email}`);

    // 1. Chuẩn bị dữ liệu mã hóa để truyền qua URL Hash
    const accData = {
      sheetId,
      sheetName,
      rowIndex,
      email,
      mkCapital,
      isAutoCheck: true // Đánh dấu cho Script 3 biết đây là luồng tự động check đăng nhập
    };

    // Mã hóa Base64 an toàn trong Node.js (Buffer)
    const base64Data = Buffer.from(JSON.stringify(accData)).toString('base64');
    const checkUrl = `https://capitaloneshopping.com/sign-in#check=${base64Data}`;

    // 2. Chạy lệnh PowerShell gửi phím tắt Alt+F4 siêu an toàn để tắt cửa sổ Chrome ẩn danh cũ (chỉ nhắm vào tiêu đề Incognito hoặc Ẩn danh)
    const killCmd = `powershell -ExecutionPolicy Bypass -Command "$wshell = New-Object -ComObject wscript.shell; if ($wshell.AppActivate('Incognito')) { $wshell.SendKeys('%{F4}') } elseif ($wshell.AppActivate('Ẩn danh')) { $wshell.SendKeys('%{F4}') }"`;
    
    exec(killCmd, () => {
      // 3. Khởi chạy cửa sổ ẩn danh mới bằng Profile mặc định (để có sẵn các Extension của người dùng)
      const cmd = `start chrome.exe --incognito "${checkUrl}"`;
      
      exec(cmd, (err) => {
        if (err) {
          console.error('[Check Capital] Lỗi khởi chạy chrome.exe qua cmd:', err);
          // Fallback: Mở bằng link mặc định nếu lệnh Chrome lỗi
          exec(`start "" "${checkUrl}"`);
        }
      });
    });

    return NextResponse.json({ 
      success: true, 
      status: 'LAUNCHED', 
      message: 'Đã mở trình duyệt ẩn danh kiểm tra tự động.' 
    });
  } catch (err: any) {
    console.error('[Check Capital] Lỗi khởi tạo check:', err);
    return NextResponse.json({ success: false, error: err.message || String(err) }, { status: 500 });
  }
}
