import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const STATE_FILE_PATH = path.join(process.cwd(), 'sprint-state.json');

// Khởi tạo file json lưu state nếu chưa tồn tại
function ensureStateFile() {
  if (!fs.existsSync(STATE_FILE_PATH)) {
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify({}), 'utf8');
  }
}

export async function GET(request: NextRequest) {
  try {
    ensureStateFile();
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    if (!key) {
      return NextResponse.json({ success: false, error: 'Thiếu key' }, { status: 400 });
    }

    const data = JSON.parse(fs.readFileSync(STATE_FILE_PATH, 'utf8'));
    return NextResponse.json({ success: true, value: data[key] || null });
  } catch (err) {
    console.error('Lỗi GET sprint-state:', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    ensureStateFile();
    const { key, value } = await request.json();
    if (!key) {
      return NextResponse.json({ success: false, error: 'Thiếu key' }, { status: 400 });
    }

    const data = JSON.parse(fs.readFileSync(STATE_FILE_PATH, 'utf8'));
    data[key] = value;
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Lỗi POST sprint-state:', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
