import { NextRequest, NextResponse } from 'next/server';

// Global variable for current active account
const globalForAccount = global as unknown as {
  currentAccount?: {
    email: string;
    password: string;
    newPassword?: string;
    newRecovery?: string;
    recovery?: string; // Đồng bộ thuộc tính recovery để TypeScript biên dịch tốt
    oldRecovery?: string;
    mkCapital?: string;
    newMkCapital?: string;
    timestamp: number;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, newPassword, newRecovery, recovery, oldRecovery, mkCapital, newMkCapital } = body;
    if (!email) {
      return NextResponse.json({ success: false, error: 'Thiếu email' }, { status: 400, headers: corsHeaders });
    }

    const finalRecovery = String(newRecovery || recovery || '').trim();

    globalForAccount.currentAccount = {
      email: String(email).trim(),
      password: password ? String(password).trim() : '',
      newPassword: newPassword ? String(newPassword).trim() : '',
      newRecovery: finalRecovery,
      recovery: finalRecovery, // Lưu cả thuộc tính recovery để đồng bộ hoàn toàn với các script
      oldRecovery: oldRecovery ? String(oldRecovery).trim() : '',
      mkCapital: mkCapital ? String(mkCapital).trim() : '',
      newMkCapital: newMkCapital ? String(newMkCapital).trim() : '',
      timestamp: Date.now()
    };
    
    console.log(`[current-account] Đặt tài khoản hiện tại (kèm Capital info): ${email}`);
    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500, headers: corsHeaders });
  }
}

export async function GET(request: NextRequest) {
  try {
    const account = globalForAccount.currentAccount;
    if (!account) {
      return NextResponse.json({ success: true, account: null }, { headers: corsHeaders });
    }

    // Thời gian hết hạn là 5 phút
    if (Date.now() - account.timestamp > 5 * 60 * 1000) {
      globalForAccount.currentAccount = undefined;
      return NextResponse.json({ success: true, account: null }, { headers: corsHeaders });
    }

    return NextResponse.json({ success: true, account }, { headers: corsHeaders });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500, headers: corsHeaders });
  }
}
