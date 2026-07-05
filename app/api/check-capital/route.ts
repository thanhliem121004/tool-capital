import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

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

    // Tạo file script PowerShell tạm để đóng cửa sổ ẩn danh cũ bằng Win32 API
    const scratchDir = path.join(process.cwd(), 'scratch');
    if (!fs.existsSync(scratchDir)) {
      fs.mkdirSync(scratchDir, { recursive: true });
    }
    
    const psScriptContent = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public class Win32 {
    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
    [DllImport("user32.dll", EntryPoint = "SendMessage", CharSet = CharSet.Auto)]
    public static extern int SendMessage(IntPtr hWnd, uint Msg, int wParam, int lParam);
}
"@

[Win32]::EnumWindows({
    param($hWnd, $lParam)
    $sb = New-Object System.Text.StringBuilder 256
    [Win32]::GetWindowText($hWnd, $sb, 256) | Out-Null
    $title = $sb.ToString()
    if ($title -like "*CAPITAL_AUTO_CHECK_WINDOW*") {
        # Gửi thông điệp WM_CLOSE (0x0010) để đóng cửa sổ
        [Win32]::SendMessage($hWnd, 0x0010, 0, 0) | Out-Null
    }
    $true
}, [IntPtr]::Zero)
`.trim();

    const psScriptPath = path.join(scratchDir, 'close_incognito.ps1');
    fs.writeFileSync(psScriptPath, psScriptContent, 'utf-8');

    const killCmd = `powershell -ExecutionPolicy Bypass -File "${psScriptPath}"`;
    
    exec(killCmd, (killErr, killStdout, killStderr) => {
      if (killErr) {
        console.error('[Check Capital] Lỗi thực thi lệnh close_incognito.ps1:', killErr);
      }
      
      // Xóa file script tạm sau khi chạy xong
      try {
        fs.unlinkSync(psScriptPath);
      } catch (unlinkErr) {
        console.error('[Check Capital] Không thể xóa file ps1 tạm:', unlinkErr);
      }

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
