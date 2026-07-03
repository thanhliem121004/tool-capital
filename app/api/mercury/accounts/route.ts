import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const maxDuration = 30;

export async function GET() {
  try {
    const jsonPath = path.join(process.cwd(), 'mercury_accounts.json');
    if (!fs.existsSync(jsonPath)) {
      return NextResponse.json({ success: true, rows: [] });
    }

    const fileContent = fs.readFileSync(jsonPath, 'utf-8');
    const rows = JSON.parse(fileContent);

    return NextResponse.json({ success: true, rows });
  } catch (err: any) {
    console.error('[mercury-accounts] error:', err);
    return NextResponse.json({ success: false, error: err.message || String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { rows } = await request.json();
    const jsonPath = path.join(process.cwd(), 'mercury_accounts.json');
    fs.writeFileSync(jsonPath, JSON.stringify(rows, null, 2), 'utf-8');
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[mercury-accounts] update error:', err);
    return NextResponse.json({ success: false, error: err.message || String(err) }, { status: 500 });
  }
}
