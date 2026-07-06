'use client';

import React, { useState, useEffect } from 'react';

type MercuryAccount = {
  "Name Org": string;
  "businessAddress": string;
  "EIN": string;
  "businessState": string;
  "Full name": string;
  "SSN": string;
  "DOB(mm/dd/yyyy)": string;
  "personalAddress": string;
  "City": string;
  "Zipcode": number | string;
  "personalState": string;
  "rowIndex": number;
  "isDone": boolean;
  "isPasswordError"?: boolean;
  "email"?: string;
  "password"?: string;
};

type Props = {
  row: MercuryAccount;
  onUpdated: (rowIndex: number, updates: Partial<MercuryAccount>) => void;
  mailProvider: 'fvia' | 'inboxes';
  preferredDomain?: string;
  activeEmail?: string;
  onActive?: (email: string) => void;
};

function CopyField({ label, value, color = 'blue' }: { label: string; value: string; color?: 'blue' | 'green' | 'purple' | 'gray' }) {
  const [copied, setCopied] = useState(false);
  const colorClass: Record<string, string> = {
    blue: 'text-blue-600',
    green: 'text-green-700 bg-green-100 border-green-200 hover:bg-green-200',
    purple: 'text-purple-700 bg-purple-100 border-purple-200 hover:bg-purple-200',
    gray: 'text-gray-900',
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { }
  };
  if (!value) return null;
  return (
    <div className="mb-2">
      <label className="block text-[10px] text-gray-500 mb-0.5">{label}</label>
      <div
        onClick={copy}
        className={`flex items-center justify-between bg-white rounded px-2 py-1.5 border border-gray-200 cursor-pointer transition-colors ${colorClass[color] ?? colorClass.blue}`}
        title="Click để copy"
      >
        <span className="text-xs font-semibold truncate">{value}</span>
        <span className="ml-2 text-xs flex-shrink-0">{copied ? '✅' : '📋'}</span>
      </div>
    </div>
  );
}

export function MercuryCard({ row, onUpdated, mailProvider, preferredDomain = 'random', activeEmail, onActive }: Props) {
  const [email, setEmail] = useState(row.email || '');
  const [password, setPassword] = useState(row.password || '');
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [loadingError, setLoadingError] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (row.email) setEmail(row.email);
    if (row.password) setPassword(row.password);
  }, [row.email, row.password]);

  const generateRandomPassword = () => {
    // Đảm bảo KHÔNG có 2 ký tự nào giống nhau đứng liền kề nhau
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let pass = '';
    let lastChar = '';
    for (let i = 0; i < 10; i++) {
      let char = '';
      do {
        char = chars.charAt(Math.floor(Math.random() * chars.length));
      } while (char === lastChar);
      pass += char;
      lastChar = char;
    }
    return pass + 'A!';
  };

  const handleCreateEmailAndPass = async () => {
    setLoadingCreate(true);
    setErr('');
    try {
      // Sinh email dựa trên tên chủ sở hữu + tên công ty rút gọn
      const baseName = (row["Full name"] || 'user').toLowerCase().split(' ')[0] || 'user';
      const orgName = (row["Name Org"] || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8);
      const rnd = Math.floor(100 + Math.random() * 900);
      const name = `${baseName}.${orgName}${rnd}`;

      const res = await fetch('/api/create-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          domain: preferredDomain && preferredDomain !== 'Ngẫu nhiên (Tự động)' ? preferredDomain : undefined,
          provider: mailProvider,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Không tạo được email ảo');
      
      const generatedEmail = data.email;
      const generatedPass = generateRandomPassword();

      setEmail(generatedEmail);
      setPassword(generatedPass);
      onUpdated(row.rowIndex, { email: generatedEmail, password: generatedPass });
    } catch (e: any) {
      setErr(e.message || String(e));
    } finally {
      setLoadingCreate(false);
    }
  };

  const handleOpenMercury = async () => {
    if (onActive) onActive(row.email || '');

    // Đồng bộ thông tin đầy đủ của doanh nghiệp và cá nhân lên current-account
    const accData = {
      email: email || row.email || '',
      password: password || row.password || '',
      isMercury: true, // Tag nhận diện cho Script 5
      nameOrg: row["Name Org"],
      businessAddress: row["businessAddress"],
      ein: row["EIN"],
      businessState: row["businessState"],
      fullName: row["Full name"],
      ssn: row["SSN"],
      dob: row["DOB(mm/dd/yyyy)"],
      personalAddress: row["personalAddress"],
      city: row["City"],
      zipcode: row["Zipcode"],
      personalState: row["personalState"],
    };

    try {
      await fetch('/api/current-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accData)
      });
    } catch (e) {
      console.error('Lỗi đặt current-account cho Mercury:', e);
    }

    // Mở trang đăng ký của Mercury
    const loginUrl = 'https://dashboard.mercury.co/signup';

    // Mở hòm thư ảo song song để lấy OTP kích hoạt gửi về
    let recoveryMailboxUrl = '';
    const activeMail = email || row.email || '';
    if (activeMail) {
      const domain = activeMail.split('@')[1]?.toLowerCase() || '';
      const inboxesDomains = [
        'inboxes.com', 'blondmail.com', 'chapsmail.com', 'clowmail.com', 'dropjar.com', 
        'fivermail.com', 'getairmail.com', 'getmule.com', 'getnada.com', 'gimpmail.com', 
        'givmail.com', 'guysmail.com', 'inboxbear.com', 'replyloop.com', 'robot-mail.com', 
        'tafmail.com', 'temptami.com', 'tupmail.com', 'vomoto.com', 'kapsule.info', 'getinbox.work'
      ];
      const isSmv = domain === 'smvmail.com';
      const isInboxes = inboxesDomains.some(d => domain.includes(d));
      if (isSmv) {
        recoveryMailboxUrl = `https://smvmail.com/email/${encodeURIComponent(activeMail)}`;
      } else if (isInboxes) {
        recoveryMailboxUrl = 'https://inboxes.com';
      }
    }

    try {
      const openRes = await fetch('/api/open-incognito', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: loginUrl, recoveryMailboxUrl })
      });
      const openData = await openRes.json();
      if (!openData.success) {
        window.open(loginUrl, '_blank');
        if (recoveryMailboxUrl) window.open(recoveryMailboxUrl, '_blank');
      }
    } catch (e) {
      console.error('Lỗi gọi API mở ẩn danh Mercury:', e);
      window.open(loginUrl, '_blank');
    }
  };

  const handleOpenRelay = async () => {
    if (onActive) onActive(row.email || '');

    // Đồng bộ thông tin đầy đủ của doanh nghiệp và cá nhân lên current-account
    const accData = {
      email: email || row.email || '',
      password: password || row.password || '',
      isRelay: true, // Tag nhận diện cho Script 6
      nameOrg: row["Name Org"],
      businessAddress: row["businessAddress"],
      ein: row["EIN"],
      businessState: row["businessState"],
      fullName: row["Full name"],
      ssn: row["SSN"],
      dob: row["DOB(mm/dd/yyyy)"],
      personalAddress: row["personalAddress"],
      city: row["City"],
      zipcode: row["Zipcode"],
      personalState: row["personalState"],
    };

    try {
      await fetch('/api/current-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accData)
      });
    } catch (e) {
      console.error('Lỗi đặt current-account cho Relay:', e);
    }

    // Mở trang đăng ký của Relay
    const loginUrl = 'https://app.relayfi.com/register';

    // Mở hòm thư ảo song song để lấy OTP kích hoạt gửi về
    let recoveryMailboxUrl = '';
    const activeMail = email || row.email || '';
    if (activeMail) {
      const domain = activeMail.split('@')[1]?.toLowerCase() || '';
      const inboxesDomains = [
        'inboxes.com', 'blondmail.com', 'chapsmail.com', 'clowmail.com', 'dropjar.com', 
        'fivermail.com', 'getairmail.com', 'getmule.com', 'getnada.com', 'gimpmail.com', 
        'givmail.com', 'guysmail.com', 'inboxbear.com', 'replyloop.com', 'robot-mail.com', 
        'tafmail.com', 'temptami.com', 'tupmail.com', 'vomoto.com', 'kapsule.info', 'getinbox.work'
      ];
      const isSmv = domain === 'smvmail.com';
      const isInboxes = inboxesDomains.some(d => domain.includes(d));
      if (isSmv) {
        recoveryMailboxUrl = `https://smvmail.com/email/${encodeURIComponent(activeMail)}`;
      } else if (isInboxes) {
        recoveryMailboxUrl = 'https://inboxes.com';
      }
    }

    try {
      const openRes = await fetch('/api/open-incognito', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: loginUrl, recoveryMailboxUrl })
      });
      const openData = await openRes.json();
      if (!openData.success) {
        window.open(loginUrl, '_blank');
        if (recoveryMailboxUrl) window.open(recoveryMailboxUrl, '_blank');
      }
    } catch (e) {
      console.error('Lỗi gọi API mở ẩn danh Relay:', e);
      window.open(loginUrl, '_blank');
    }
  };

  const handleComplete = async () => {
    setLoadingComplete(true);
    setErr('');
    try {
      const res = await fetch('/api/mercury/complete-row', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rowIndex: row.rowIndex,
          isDone: true,
          email,
          password,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Lỗi cập nhật trạng thái');
      onUpdated(row.rowIndex, { isDone: true, isPasswordError: false });
    } catch (e: any) {
      setErr(e.message || String(e));
    } finally {
      setLoadingComplete(false);
    }
  };

  const handleMarkError = async () => {
    if (!window.confirm('Đánh dấu tài khoản này bị lỗi đăng ký?')) return;
    setLoadingError(true);
    setErr('');
    try {
      const res = await fetch('/api/mercury/mark-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rowIndex: row.rowIndex,
          isPasswordError: true,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Lỗi đánh dấu lỗi');
      onUpdated(row.rowIndex, { isPasswordError: true });
    } catch (e: any) {
      setErr(e.message || String(e));
    } finally {
      setLoadingError(false);
    }
  };

  const isActive = activeEmail === (email || row.email);
  const isDone = row.isDone;
  const isPasswordError = row.isPasswordError;

  return (
    <div
      className={`bg-white rounded-lg shadow-md p-4 border-2 transition-all duration-300 relative ${
        isActive
          ? 'border-blue-500 ring-4 ring-blue-400 ring-opacity-40 shadow-blue-200'
          : isPasswordError
            ? 'border-red-400 bg-red-50/50 opacity-50 hover:opacity-100'
            : isDone
              ? 'border-green-400 bg-green-50'
              : 'border-indigo-100 hover:border-indigo-300 bg-indigo-50/10'
      }`}
    >
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs text-gray-500 font-bold">
          #{row.rowIndex} · {row["Name Org"]}
        </span>
        <span
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
            isPasswordError
              ? 'bg-red-500 text-white'
              : isDone
                ? 'bg-green-500 text-white'
                : 'bg-indigo-500 text-white'
          }`}
        >
          {isPasswordError ? '❌ Lỗi đăng ký' : isDone ? '✅ Mercury OK' : '⏳ Chưa đăng ký'}
        </span>
      </div>

      {/* Thông tin doanh nghiệp */}
      <div className="bg-gray-50 p-2.5 rounded border border-gray-100 mb-3 text-xs space-y-1">
        <div className="text-gray-700">🏢 <b>Địa chỉ cty:</b> {row["businessAddress"]} ({row["businessState"]})</div>
        <div className="text-purple-700">💳 <b>EIN:</b> {row["EIN"]}</div>
      </div>

      {/* Thông tin chủ sở hữu cá nhân */}
      <div className="bg-blue-50/20 p-2.5 rounded border border-blue-50 mb-3 text-xs space-y-1">
        <div className="text-gray-700">👤 <b>Chủ sở hữu:</b> {row["Full name"]}</div>
        <div className="text-red-700">🔐 <b>SSN:</b> {row["SSN"]} · <b>DOB:</b> {row["DOB(mm/dd/yyyy)"]}</div>
        <div className="text-gray-500">🏠 <b>Địa chỉ riêng:</b> {row["personalAddress"]}, {row["City"]}, {row["personalState"]} {row["Zipcode"]}</div>
      </div>

      {/* Email và Mật khẩu tự động */}
      {email && <CopyField label="📧 Email đăng ký" value={email} color="blue" />}
      {password && <CopyField label="🔑 Mật khẩu" value={password} color="purple" />}

      {/* Nút bấm điều khiển */}
      <div className="space-y-2 mt-3">
        {!isDone && !isPasswordError && (
          <>
            {!email ? (
              <button
                onClick={handleCreateEmailAndPass}
                disabled={loadingCreate}
                className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 transition-colors"
              >
                {loadingCreate ? '⏳ Đang tạo hòm thư...' : '✨ Tạo email & mật khẩu đăng ký'}
              </button>
            ) : (
              <div className="space-y-2">
                {/* Hàng nút 1: Mở trình duyệt */}
                <div className="flex gap-2">
                  <button
                    onClick={handleOpenMercury}
                    className="flex-1 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1 shadow-sm"
                  >
                    🔑 Vào Mercury
                  </button>
                  <button
                    onClick={handleOpenRelay}
                    className="flex-1 py-2 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-1 shadow-sm"
                  >
                    🛍️ Vào Relay
                  </button>
                </div>
                {/* Hàng nút 2: Xác nhận trạng thái */}
                <div className="flex gap-2">
                  <button
                    onClick={handleComplete}
                    disabled={loadingComplete}
                    className="flex-1 py-2 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                  >
                    {loadingComplete ? 'Saving...' : '✅ Hoàn thành'}
                  </button>
                  <button
                    onClick={handleMarkError}
                    disabled={loadingError}
                    className="px-3 py-2 bg-red-100 text-red-700 text-xs font-bold rounded-lg hover:bg-red-200 disabled:bg-gray-300 transition-colors"
                    title="Đánh dấu lỗi đăng ký"
                  >
                    ❌ Lỗi
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {(isDone || isPasswordError) && (
          <button
            onClick={() => {
              if (window.confirm('Khôi phục tài khoản này về trạng thái chưa làm?')) {
                onUpdated(row.rowIndex, { isDone: false, isPasswordError: false });
              }
            }}
            className="w-full py-1.5 bg-gray-100 text-gray-600 text-[11px] font-semibold rounded hover:bg-gray-200 transition-colors"
          >
            🔄 Reset trạng thái làm lại
          </button>
        )}
      </div>

      {err && <div className="mt-2 text-[10px] text-red-600 font-semibold">{err}</div>}
    </div>
  );
}
