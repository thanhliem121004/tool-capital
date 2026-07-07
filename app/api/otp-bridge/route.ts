import { NextRequest, NextResponse } from 'next/server';

// Global in-memory cache for OTPs
// Key: email (lowercase), Value: { otp, timestamp }
// Bằng cách lưu ở global, dữ liệu sẽ chia sẻ được giữa các request trong quá trình dev
const globalForOtp = global as unknown as {
  otpCache?: Map<string, { otp: string; timestamp: number }>;
  lastScrapeTime?: Map<string, number>;
};

if (!globalForOtp.otpCache) {
  globalForOtp.otpCache = new Map();
}
if (!globalForOtp.lastScrapeTime) {
  globalForOtp.lastScrapeTime = new Map();
}

const otpCache = globalForOtp.otpCache;
const lastScrapeTime = globalForOtp.lastScrapeTime;

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
    const { email, otp } = await request.json();
    if (!email || !otp) {
      return NextResponse.json({ success: false, error: 'Thiếu email hoặc otp' }, { status: 400, headers: corsHeaders });
    }

    const key = String(email).trim().toLowerCase();
    otpCache.set(key, { otp: String(otp).trim(), timestamp: Date.now() });
    console.log(`[otp-bridge] Nhận OTP mới cho ${key}: ${otp}`);

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500, headers: corsHeaders });
  }
}

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');
    const otp = request.nextUrl.searchParams.get('otp'); // Đọc tham số otp nếu có
    
    if (!email) {
      return NextResponse.json({ success: false, error: 'Thiếu email' }, { status: 400, headers: corsHeaders });
    }

    const key = email.trim().toLowerCase();

    // NẾU CÓ THAM SỐ OTP TRONG QUERY: Ghi nhận OTP (Image Beacon / GET fallback)
    if (otp) {
      otpCache.set(key, { otp: String(otp).trim(), timestamp: Date.now() });
      console.log(`[otp-bridge-GET] Ghi nhận OTP mới qua GET/Beacon cho ${key}: ${otp}`);
      
      const buf = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
      return new NextResponse(buf, {
        headers: {
          'Content-Type': 'image/gif',
          'Content-Length': buf.length.toString(),
          ...corsHeaders
        }
      });
    }

    // NẾU CHỈ CÓ EMAIL: Truy vấn OTP
    const entry = otpCache.get(key);
    
    if (entry && Date.now() - entry.timestamp <= 10 * 60 * 1000) {
      return NextResponse.json({ success: true, otp: entry.otp }, { headers: corsHeaders });
    }
    
    if (entry) otpCache.delete(key);

    // NẾU CHƯA CÓ OTP, KIỂM TRA XEM CÓ PHẢI EMAIL TRANGCODE KHÔNG VÀ TỰ ĐỘNG FETCH
    const domain = key.split('@')[1] || '';
    const fviaDomains = ['fviainboxes.com', 'fviadropinbox.com', 'fviamail.work', 'dropinboxes.com'];
    const inboxesDomains = [
      'inboxes.com', 'blondmail.com', 'chapsmail.com', 'clowmail.com', 'dropjar.com', 
      'fivermail.com', 'getairmail.com', 'getmule.com', 'getnada.com', 'gimpmail.com', 
      'givmail.com', 'guysmail.com', 'inboxbear.com', 'replyloop.com', 'robot-mail.com', 
      'tafmail.com', 'temptami.com', 'tupmail.com', 'vomoto.com', 'kapsule.info', 'getinbox.work',
      'smvmail.com'
    ];
    
    const isFvia = fviaDomains.some(d => domain.includes(d));
    const isInboxes = inboxesDomains.some(d => domain.includes(d));
    
    if (!isFvia && !isInboxes && domain.length > 0) {
      // Throttle: Chỉ fetch tối đa 1 lần mỗi 4 giây
      const lastFetch = lastScrapeTime.get(key) || 0;
      if (Date.now() - lastFetch > 4000) {
        lastScrapeTime.set(key, Date.now());
        try {
          const fetchRes = await fetch(`http://127.0.0.1:3000/api/scrape-trangcode?email=${encodeURIComponent(key)}`);
          const fetchData = await fetchRes.json();
          if (fetchData.success && fetchData.html) {
            // Parse HTML tìm OTP 6 số
            const plainText = fetchData.html.replace(/<[^>]+>/g, ' '); // Xóa HTML tags
            const matches = plainText.match(/\b\d{6}\b/g);
            if (matches) {
              const cleanMatches = matches.filter((m: string) => m !== '707070');
              if (cleanMatches.length > 0) {
                const latestOtp = cleanMatches[cleanMatches.length - 1];
                otpCache.set(key, { otp: latestOtp, timestamp: Date.now() });
                console.log(`[otp-bridge-auto] Tự động fetch OTP thành công cho Trangcode ${key}: ${latestOtp}`);
                return NextResponse.json({ success: true, otp: latestOtp }, { headers: corsHeaders });
              }
            }
          }
        } catch (e) {
          console.error('[otp-bridge-auto] Lỗi fetch Trangcode:', e);
        }
      }
    }

    return NextResponse.json({ success: true, otp: null }, { headers: corsHeaders });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500, headers: corsHeaders });
  }
}
