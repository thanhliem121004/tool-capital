import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const RESULTS_FILE = path.join(process.cwd(), 'check_results.json');

function readResults() {
  if (!fs.existsSync(RESULTS_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8'));
  } catch (e) {
    return {};
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ success: false, error: 'Thiếu email' }, { status: 400 });
    }

    const emailKey = email.toLowerCase().trim();
    const data = readResults();

    if (data[emailKey]) {
      const result = data[emailKey];
      
      // Xóa kết quả sau khi đã đọc để tránh trùng lặp
      delete data[emailKey];
      try {
        fs.writeFileSync(RESULTS_FILE, JSON.stringify(data, null, 2), 'utf8');
      } catch (e) {}

      return NextResponse.json({ success: true, hasResult: true, result });
    }

    return NextResponse.json({ success: true, hasResult: false });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || String(err) }, { status: 500 });
  }
}
