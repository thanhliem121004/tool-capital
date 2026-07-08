import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ success: false, error: 'Thiếu tham số email hoặc code' }, { status: 400 });
    }

    // Parse code: email|pass|refresh_token|client_id
    const parts = code.split('|');
    if (parts.length < 4) {
      return NextResponse.json({ success: false, error: 'Sai định dạng Code ID (yêu cầu email|pass|refresh_token|client_id)' }, { status: 400 });
    }

    const refreshToken = parts[2];
    const clientId = parts[3];

    const khommoApiKey = 'rmh_3fa416a1a97f42e6dc911e36485df26f3cecdcb2d8cbcd46';
    const khommoUrl = 'https://getcode.khommo.vn/api/v1/read-mail';

    const res = await fetch(khommoUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': khommoApiKey
      },
      body: JSON.stringify({
        email: email,
        refreshToken: refreshToken,
        clientId: clientId
      })
    });

    if (!res.ok) {
      return NextResponse.json({ success: false, error: `Khommo API error: ${res.status}` });
    }

    const data = await res.json();
    const rawText = JSON.stringify(data);

    let resetLink: string | null = null;
    const linkMatch = rawText.match(/(https:\/\/(?:www\.)?capitaloneshopping\.com\/[^\s"'\\]+)/gi);
    
    if (linkMatch) {
      const resetLinks = linkMatch.filter(link => link.includes('reset') || link.includes('recover') || link.includes('token='));
      if (resetLinks.length > 0) {
        resetLink = resetLinks[0];
        resetLink = resetLink.replace(/\\\//g, '/');
      }
    }

    if (resetLink) {
      return NextResponse.json({ success: true, link: resetLink });
    } else {
      return NextResponse.json({ success: false, error: 'Không tìm thấy link reset password' });
    }

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Get Capital Link] error:', err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
