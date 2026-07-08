import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const { sheetId, sheetName = 'Sheet1', rowIndex, email, pass, code, recovery, oldRecovery, customUrl, firstName, lastName, zipCode } = await request.json();
 
     if (!sheetId || !rowIndex || !email) {
       return NextResponse.json(
         { success: false, error: 'Thiếu thông tin (Sheet ID, Row, hoặc Email) để chạy Capital Reg!' },
         { status: 400 }
       );
     }
 
     console.log(`[Capital Reg] Yêu cầu mở tab ẩn danh đăng ký: ${email}`);
 
     // Chuẩn bị dữ liệu mã hóa để truyền qua URL Hash
     const accData = {
       sheetId,
       sheetName,
       rowIndex,
       email,
       pass,
       code,
       recovery,
       oldRecovery,
       firstName,
       lastName,
       zipCode,
       isAutoReg: true
     };

    const base64Data = Buffer.from(JSON.stringify(accData)).toString('base64');
    let checkUrl = customUrl || `https://capitaloneshopping.com/onboarding/base#capitalReg=${base64Data}`;
    const oauthUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=9199bf20-a13f-4107-85dc-02114787ef48&scope=https%3A%2F%2Foutlook.office.com%2F.default%20openid%20profile%20offline_access&redirect_uri=https%3A%2F%2Foutlook.live.com%2Fmail%2F&client-request-id=ccdd58c9-ae4b-3c55-0ffa-c890dfa17330&response_mode=fragment&client_info=1&clidata=1&prompt=select_account&nonce=019f4231-f4ad-74cb-8f28-7ffa09210948&state=eyJpZCI6IjAxOWY0MjMxLWY0YWQtNzY1YS1hYjViLThiMDJiNGY1ZDAwZCIsIm1ldGEiOnsiaW50ZXJhY3Rpb25UeXBlIjoicmVkaXJlY3QifX0%3D%7CaHR0cHM6Ly9vdXRsb29rLmxpdmUuY29tL21haWwv&claims=%7B%22access_token%22%3A%7B%22xms_cc%22%3A%7B%22values%22%3A%5B%22CP1%22%5D%7D%7D%7D&x-client-SKU=msal.js.browser&x-client-VER=5.12.0&response_type=code&code_challenge=ODz59kCxQQ4SOagHJIdLUBvPIKLbvUc-t70OHFFwS-w&code_challenge_method=S256&cobrandid=ab0455a0-8d03-46b9-b18b-df2f57b9e44c&fl=dob%2Cflname%2Cwld#capitalReg=${base64Data}`;

    // Tạo file script PowerShell tạm để đóng cửa sổ ẩn danh cũ
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
    if ($title -like "*CAPITAL_AUTO_REG_WINDOW*") {
        [Win32]::SendMessage($hWnd, 0x0010, 0, 0) | Out-Null
    }
    $true
}, [IntPtr]::Zero)
`.trim();

    const psScriptPath = path.join(scratchDir, 'close_incognito_reg.ps1');
    fs.writeFileSync(psScriptPath, psScriptContent, 'utf-8');

    const killCmd = `powershell -ExecutionPolicy Bypass -File "${psScriptPath}"`;
    
    exec(killCmd, (killErr, killStdout, killStderr) => {
      if (killErr) {
        console.error('[Capital Reg] Lỗi thực thi lệnh close_incognito_reg.ps1:', killErr);
      }
      
      try {
        fs.unlinkSync(psScriptPath);
      } catch (unlinkErr) {}

      // Khởi chạy cửa sổ ẩn danh mới, mở song song 2 tab
      const cmd = `start chrome.exe --incognito "${checkUrl}" "${oauthUrl}"`;
      
      exec(cmd, (err) => {
        if (err) {
          console.error('[Capital Reg] Lỗi khởi chạy chrome.exe qua cmd:', err);
          exec(`start "" "${checkUrl}"`);
          exec(`start "" "${oauthUrl}"`);
        }
      });
    });

    return NextResponse.json({ 
      success: true, 
      message: `Đã mở tab ẩn danh đăng ký cho ${email}` 
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Capital Reg] error:', err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
