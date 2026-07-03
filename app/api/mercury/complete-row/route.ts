import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { rowIndex, isDone = true, email = '', password = '' } = await request.json();
    const jsonPath = path.join(process.cwd(), 'mercury_accounts.json');
    if (!fs.existsSync(jsonPath)) {
      return NextResponse.json({ success: false, error: 'File mercury_accounts.json không tồn tại' }, { status: 400 });
    }

    const fileContent = fs.readFileSync(jsonPath, 'utf-8');
    const rows = JSON.parse(fileContent);

    const updatedRows = rows.map((r: any) => {
      if (r.rowIndex === rowIndex) {
        return {
          ...r,
          isDone,
          email: email || r.email || '',
          password: password || r.password || '',
        };
      }
      return r;
    });

    fs.writeFileSync(jsonPath, JSON.stringify(updatedRows, null, 2), 'utf-8');

    return NextResponse.json({ success: true, rowIndex });
  } catch (err: any) {
    console.error('[mercury-complete] error:', err);
    return NextResponse.json({ success: false, error: err.message || String(err) }, { status: 500 });
  }
}
