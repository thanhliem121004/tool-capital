import { NextRequest, NextResponse } from 'next/server';

let activeRegData: any = null;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

export async function GET() {
  return NextResponse.json({ success: true, data: activeRegData }, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    activeRegData = data;
    console.log(`[Active Reg API] Đã cập nhật tài khoản hoạt động hiện tại: ${data?.email}`);
    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500, headers: corsHeaders });
  }
}
