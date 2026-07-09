'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { SheetRow } from '../hooks/useSheet';

declare global {
  interface Window {
    GM_fetch?: (url: string, options?: any) => Promise<any>;
  }
}

const MICROSOFT_OTP_REGEX = /(?:Security code|M[ãa]\s*b[ảaáo]o?\s*m[ậa]t|Mã bảo mật):\s*(\d{6})/i;
const GENERIC_6_DIGIT_REGEX = /\b(\d{6})\b/;

function extractOtp(rawText: string): string | null {
  let html = rawText;
  try {
    const parsed = JSON.parse(rawText);
    if (typeof parsed === 'string') html = parsed;
  } catch (e) { }

  const cleanText = html.replace(/<[^>]*>/g, '').normalize("NFC");

  const m = cleanText.match(MICROSOFT_OTP_REGEX);
  if (m) return m[1];

  const m2 = cleanText.match(GENERIC_6_DIGIT_REGEX);
  return m2?.[1] ?? null;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ');
}

function extractLatestOtpFromHtml(html: string): string | null {
  const plainText = stripHtml(html);
  
  // Cắt văn bản theo tiêu đề mỗi khối thư
  const blocks = plainText.split(/CHI TIẾT THƯ Click Chuột Ở ĐÂY/i);
  let newestOtp: string | null = null;
  let minSeconds = Infinity;
  
  for (let i = 1; i < blocks.length; i++) {
    const blockText = blocks[i];
    
    // Quét tìm các số 6 chữ số
    const matches = blockText.match(/\b\d{6}\b/g);
    if (!matches) continue;
    
    const blockOtp = matches[matches.length - 1]; // Lấy mã số cuối cùng trong khối (OTP)
    
    // Tính toán thời gian thực tế của thư
    let seconds = 9999999;
    const secMatch = blockText.match(/(\d+)\s*giây/i);
    const minMatch = blockText.match(/(\d+)\s*phút/i);
    const hourMatch = blockText.match(/(\d+)\s*giờ/i);
    const dayMatch = blockText.match(/(\d+)\s*ngày/i);
    
    if (secMatch) {
      seconds = parseInt(secMatch[1], 10);
    } else if (minMatch) {
      seconds = parseInt(minMatch[1], 10) * 60;
    } else if (hourMatch) {
      seconds = parseInt(hourMatch[1], 10) * 3600;
    } else if (dayMatch) {
      seconds = parseInt(dayMatch[1], 10) * 86400;
    }
    
    if (seconds < minSeconds) {
      minSeconds = seconds;
      newestOtp = blockOtp;
    }
  }
  
  return newestOtp;
}

const firstNames = ["James", "John", "Robert", "Michael", "William", "David", "Richard", "Charles", "Joseph", "Thomas", "Christopher", "Daniel", "Paul", "Mark", "Donald", "George", "Kenneth", "Steven", "Edward", "Brian", "Ronald", "Anthony", "Kevin", "Jason", "Matthew", "Gary", "Timothy", "Jose", "Larry", "Jeffrey", "Frank", "Scott", "Eric", "Stephen", "Andrew", "Raymond", "Gregory", "Joshua", "Jerry", "Dennis", "Walter", "Patrick", "Peter", "Harold", "Douglas", "Henry", "Carl", "Arthur", "Ryan", "Roger", "Joe", "Juan", "Jack", "Albert", "Jonathan", "Justin", "Terry", "Gerald", "Keith", "Samuel", "Ralph", "Lawrence", "Nicholas", "Roy", "Benjamin", "Bruce", "Brandon", "Adam", "Harry", "Fred", "Wayne", "Billy", "Steve", "Louis", "Jeremy", "Aaron", "Randy", "Howard", "Eugene", "Carlos", "Russell", "Bobby", "Victor", "Martin", "Ernest", "Phillip", "Todd", "Jesse", "Craig", "Alan", "Shawn", "Clarence", "Sean", "Philip", "Chris", "Johnny", "Earl", "Jimmy", "Antonio", "Danny", "Bryan", "Tony", "Luis", "Mike", "Stanley", "Leonard", "Nathan", "Dale", "Manuel", "Rodney", "Curtis", "Norman", "Allen", "Marvin", "Vincent", "Glenn", "Jeffery", "Travis", "Jeff", "Chad", "Jacob", "Lee", "Melvin", "Alfred", "Bradley", "Francis", "Stephen", "Mary", "Patricia", "Linda", "Barbara", "Elizabeth", "Jennifer", "Maria", "Susan", "Margaret", "Dorothy", "Lisa", "Nancy", "Karen", "Betty", "Helen", "Sandra", "Donna", "Carol", "Ruth", "Sharon", "Michelle", "Laura", "Sarah", "Kimberly", "Deborah", "Jessica", "Shirley", "Cynthia", "Angela", "Melissa", "Brenda", "Amy", "Anna", "Rebecca", "Virginia", "Kathleen", "Pamela", "Martha", "Debra", "Amanda", "Stephanie", "Carolyn", "Christine", "Marie", "Janet", "Catherine", "Frances", "Ann", "Joyce", "Diane", "Alice", "Julie", "Heather", "Teresa", "Doris", "Gloria", "Evelyn", "Jean", "Cheryl", "Mildred", "Katherine", "Joan", "Ashley", "Judith", "Rose", "Janice", "Kelly", "Nicole", "Judy", "Christina", "Kathy", "Theresa", "Beverly", "Denise", "Tammy", "Irene", "Jane", "Lori", "Rachel", "Marilyn", "Andrea", "Kathryn", "Louise", "Sara", "Anne", "Jacqueline", "Wanda", "Bonnie", "Julia", "Ruby", "Lois", "Tina", "Phyllis", "Norma", "Paula", "Diana", "Annie", "Lillian", "Emily", "Robin", "Peggy", "Crystal", "Gladys", "Rita", "Dawn", "Connie", "Florence", "Tracy", "Edna", "Tiffany", "Carmen", "Rosa", "Cindy", "Grace", "Wendy", "Victoria", "Edith", "Kim", "Sherry", "Sylvia", "Josephine", "Thelma", "Shannon", "Sheila", "Ethel", "Ellen", "Elaine", "Marjorie", "Carrie", "Charlotte", "Monica", "Esther", "Pauline", "Emma", "Juanita", "Anita", "Rhonda", "Hazel", "Amber", "Eva", "Debbie", "April", "Leslie", "Clara", "Lucille", "Jamie", "Joanne", "Eleanor", "Valerie", "Danielle", "Megan", "Alicia", "Suzanne", "Michele", "Gail", "Bertha", "Darlene", "Veronica", "Jill", "Erin", "Geraldine", "Lauren", "Cathy", "Joann", "Lorraine", "Lynn", "Sally", "Regina", "Erica", "Beatrice", "Dolores", "Bernice", "Audrey", "Yvonne", "Annette", "June", "Samantha", "Marion", "Dana", "Stacy", "Ana", "Renee", "Ida", "Vivian", "Roberta", "Holly", "Brittany", "Melanie", "Loretta", "Yolanda", "Jeanette", "Laurie", "Katie", "Kristen", "Vanessa", "Alma", "Sue", "Elsie", "Beth", "Jeanne"];
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts", "Gomez", "Phillips", "Evans", "Turner", "Diaz", "Parker", "Cruz", "Edwards", "Collins", "Reyes", "Stewart", "Morris", "Morales", "Murphy", "Cook", "Rogers", "Gutierrez", "Ortiz", "Morgan", "Cooper", "Peterson", "Bailey", "Reed", "Kelly", "Howard", "Ramos", "Kim", "Cox", "Ward", "Richardson", "Watson", "Brooks", "Chavez", "Wood", "James", "Bennett", "Gray", "Mendoza", "Ruiz", "Hughes", "Price", "Alvarez", "Castillo", "Sanders", "Patel", "Myers", "Long", "Ross", "Foster", "Jimenez"];

function getRandomUSName(existingRows: any[] = []) {
  let first = '';
  let last = '';
  let retries = 0;
  while (retries < 200) {
    first = firstNames[Math.floor(Math.random() * firstNames.length)];
    last = lastNames[Math.floor(Math.random() * lastNames.length)];
    const isDup = existingRows.some(
      r => (r.firstName || '').toLowerCase() === first.toLowerCase() && 
           (r.lastName || '').toLowerCase() === last.toLowerCase()
    );
    if (!isDup) {
      return { first, last };
    }
    retries++;
  }
  // Nếu thử 200 lần vẫn trùng (rất hiếm), thêm chữ lót viết tắt ngẫu nhiên làm hậu tố để đảm bảo duy nhất
  const middleInitials = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const middle = middleInitials[Math.floor(Math.random() * middleInitials.length)];
  return { first: `${first} ${middle}.`, last };
}

function getRandomUSZip() {
  const zips = ["10001", "90001", "33101", "60601", "77001", "19101", "85001", "92101", "75201", "95101", "78701", "32201", "94101", "43201", "46201", "76101", "28201", "98101", "80201", "20001"];
  return zips[Math.floor(Math.random() * zips.length)];
}

function triggerTampermonkeyScrape(email: string): Promise<string | null> {
  return new Promise((resolve) => {
    const handler = (e: any) => {
      if (e.detail && e.detail.email === email) {
        document.removeEventListener('SCRAPE_TRANGCODE_RESPONSE', handler);
        resolve(e.detail.html);
      }
    };
    document.addEventListener('SCRAPE_TRANGCODE_RESPONSE', handler);
    document.dispatchEvent(new CustomEvent('SCRAPE_TRANGCODE_REQUEST', { detail: { email } }));
    
    // Timeout 3.5 giây nếu không có Tampermonkey phản hồi thì resolve null để fallback gọi API route Next.js
    setTimeout(() => {
      document.removeEventListener('SCRAPE_TRANGCODE_RESPONSE', handler);
      resolve(null);
    }, 3500);
  });
}

type Props = {
  row: SheetRow;
  index: number;
  sheetId: string;
  sheetName: string;
  onUpdated: (rowIndex: number, updates: any) => void;
  fviaToken?: string;
  preferredDomain?: string;
  mailProvider: 'fvia' | 'inboxes';
  mode?: 'default' | 'capital' | 'capital_reg';
  activeEmail?: string;
  onActive?: (email: string) => void;
  runDirectly?: boolean;
  allRows?: SheetRow[];
};

function CopyField({ label, value, color = 'blue', noMargin = false }: { label: string; value: string; color?: 'blue' | 'green' | 'purple' | 'gray'; noMargin?: boolean }) {
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
    <div className={noMargin ? "" : "mb-3"}>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <div
        onClick={copy}
        className={`flex items-center justify-between bg-white rounded p-2 border border-gray-200 cursor-pointer transition-colors ${colorClass[color] ?? colorClass.blue}`}
        title="Click để copy"
      >
        <span className="text-sm font-medium truncate">{value}</span>
        <span className="ml-2 text-xs flex-shrink-0">{copied ? '✅' : '📋'}</span>
      </div>
    </div>
  );
}

function generateMkCapitalPreview(pass: string): string {
  if (!pass) return '';
  let newPass = pass + "A!";
  // Replace consecutive duplicate characters with a single one (e.g. 11 -> 1, aa -> a)
  return newPass.replace(/(.)\1+/g, "$1");
}

export function RowCard({ row, index, sheetId, sheetName, onUpdated, fviaToken, preferredDomain, mailProvider, mode = 'default', activeEmail, onActive, runDirectly, allRows = [] }: Props) {
  const [isCreatingMail, setIsCreatingMail] = useState(false);
  const [generated, setGenerated] = useState<string>(row.recovery);
  const [createdAt, setCreatedAt] = useState<number | null>(null);
  const [otp, setOtp] = useState<string>('');
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [err, setErr] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [newMkCapital, setNewMkCapital] = useState('');
  const [oldOtp, setOldOtp] = useState('');
  const [loadingMarkError, setLoadingMarkError] = useState(false);

  const [checkingCapital, setCheckingCapital] = useState(false);
  const [checkCapitalResult, setCheckCapitalResult] = useState<'idle' | 'checking' | 'ok' | 'error' | 'cf_block'>('idle');
  const [checkCapitalError, setCheckCapitalError] = useState('');

  async function ensureUSInfoPopulatedFor(r: SheetRow) {
    let currentFirst = r.firstName;
    let currentLast = r.lastName;
    let currentZip = r.zipCode;

    if (!currentFirst || !currentLast || !currentZip) {
      const name = getRandomUSName(allRows);
      const zip = getRandomUSZip();
      currentFirst = name.first;
      currentLast = name.last;
      currentZip = zip;

      try {
        const res = await fetch('/api/update-sheet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sheetId,
            rowIndex: r.rowIndex,
            firstName: currentFirst,
            lastName: currentLast,
            zipCode: currentZip
          })
        });
        if (res.ok) {
          onUpdated(r.rowIndex, {
            firstName: currentFirst,
            lastName: currentLast,
            zipCode: currentZip
          });
        }
      } catch (e) {
        console.error('Lỗi tự động sinh và lưu Tên & Zip:', e);
      }
    }
    return {
      firstName: currentFirst,
      lastName: currentLast,
      zipCode: currentZip
    };
  }

  async function ensureUSInfoPopulated() {
    return ensureUSInfoPopulatedFor(row);
  }

  async function handleOpenMailRealMachineFor(r: SheetRow) {
    const info = await ensureUSInfoPopulatedFor(r);
    const accData = {
      sheetId,
      sheetName,
      rowIndex: r.rowIndex,
      email: r.email,
      pass: r.password,
      code: r.code,
      recovery: r.recovery,
      oldRecovery: r.oldRecovery,
      firstName: info.firstName,
      lastName: info.lastName,
      zipCode: info.zipCode,
      isAutoReg: true
    };
    
    // Lưu lên active-reg-data của máy chủ và chờ hoàn tất
    try {
      await fetch('/api/active-reg-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accData)
      });
    } catch (err) {
      console.error('Lỗi lưu active reg:', err);
    }

    const base64Data = btoa(unescape(encodeURIComponent(JSON.stringify(accData))));
    const oauthUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=9199bf20-a13f-4107-85dc-02114787ef48&scope=https%3A%2F%2Foutlook.office.com%2F.default%20openid%20profile%20offline_access&redirect_uri=https%3A%2F%2Foutlook.live.com%2Fmail%2F&client-request-id=ccdd58c9-ae4b-3c55-0ffa-c890dfa17330&response_mode=fragment&client_info=1&clidata=1&prompt=select_account&nonce=019f4231-f4ad-74cb-8f28-7ffa09210948&state=eyJpZCI6IjAxOWY0MjMxLWY0YWQtNzY1YS1hYjViLThiMDJiNGY1ZDAwZCIsIm1ldGEiOnsiaW50ZXJhY3Rpb25UeXBlIjoicmVkaXJlY3QifX0%3D%7CaHR0cHM6Ly9vdXRsb29rLmxpdmUuY29tL21haWwv&claims=%7B%22access_token%22%3A%7B%22xms_cc%22%3A%7B%22values%22%3A%5B%22CP1%22%5D%7D%7D%7D&x-client-SKU=msal.js.browser&x-client-VER=5.12.0&response_type=code&code_challenge=ODz59kCxQQ4SOagHJIdLUBvPIKLbvUc-t70OHFFwS-w&code_challenge_method=S256&cobrandid=ab0455a0-8d03-46b9-b18b-df2f57b9e44c&fl=dob%2Cflname%2Cwld#capitalReg=${base64Data}`;
    
    fetch('/api/open-incognito', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: oauthUrl })
    }).catch(err => {
      console.error('Lỗi gọi open-incognito:', err);
      window.open(oauthUrl, '_blank');
    });
  }

  useEffect(() => {
    const capitalStr = typeof row.newMkCapital === 'string' ? row.newMkCapital.toUpperCase() : '';
    const hasCapitalError = capitalStr.includes('SAI CAPITAL') || capitalStr.includes('SAI MẬT KHẨU CAPITAL');
    
    if (hasCapitalError || row.isPasswordError) {
      setCheckCapitalResult('error');
    } else if (row.isDone) {
      setCheckCapitalResult('ok');
    } else {
      setCheckCapitalResult('idle');
    }
  }, [row.newMkCapital, row.isPasswordError, row.isDone]);

  const handleCheckCapital = async () => {
    setCheckingCapital(true);
    setCheckCapitalResult('checking');
    setCheckCapitalError('');
    try {
      const res = await fetch('/api/check-capital', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheetId,
          sheetName,
          rowIndex: row.rowIndex,
          email: row.email,
          mkCapital: row.mkCapital,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Không mở được tab ẩn danh check');
      }

      // Đã mở tab ẩn danh thành công, tiến hành Polling chờ kết quả từ Tampermonkey gửi về
      const startTime = Date.now();
      const maxWaitTime = 120 * 1000; // Đợi tối đa 2 phút
      
      while (Date.now() - startTime < maxWaitTime) {
        // Đợi 1.5 giây giữa mỗi lần check
        await new Promise(r => setTimeout(r, 1500));
        
        const statusRes = await fetch(`/api/check-capital/status?email=${encodeURIComponent(row.email)}&_t=${Date.now()}`);
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          if (statusData.success && statusData.hasResult) {
            const result = statusData.result;
            if (result.status === 'ok') {
              setCheckCapitalResult('ok');
              onUpdated(row.rowIndex, { isPasswordError: false, newPassword: '' });
            } else {
              setCheckCapitalResult('error');
              setCheckCapitalError(result.error || 'Sai tài khoản/mật khẩu Capital');
              onUpdated(row.rowIndex, { newMkCapital: 'SAI CAPITAL' }); // Bỏ isPasswordError: true để không khóa hàng
              
              // Tự động ghi "SAI MẬT KHẨU CAPITAL" vào cột N
              fetch('/api/mark-error', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  sheetId,
                  sheetName,
                  rowIndex: row.rowIndex,
                  mode,
                  errorType: 'capital'
                }),
              }).catch(console.error);
            }
            setCheckingCapital(false);
            return; // Đã nhận được kết quả, thoát hàm
          }
        }
      }

      // Quá thời gian chờ
      setCheckCapitalResult('cf_block');
      setCheckCapitalError('Quá thời gian chờ (2 phút). Vui lòng check bằng tay!');
    } catch (e: any) {
      setCheckCapitalResult('cf_block');
      setCheckCapitalError(e.message || String(e));
    } finally {
      setCheckingCapital(false);
    }
  };

  const handleMarkPasswordError = async () => {
    if (!window.confirm(`Bạn có chắc chắn muốn đánh dấu dòng #${row.rowIndex} (${row.email}) là SAI MẬT KHẨU MAIL và tô đỏ trên Google Sheet không?`)) {
      return;
    }
    setLoadingMarkError(true);
    setErr('');
    try {
      const res = await fetch('/api/mark-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheetId,
          sheetName,
          rowIndex: row.rowIndex,
          mode,
          errorType: 'mail',
          newMkCapital: newMkCapital || row.newMkCapital
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Lỗi đánh dấu sai mật khẩu');
      
      onUpdated(row.rowIndex, { isPasswordError: true });
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoadingMarkError(false);
    }
  };

  const generateRandomPassword = () => {
    // Chỉ tạo chữ và số dài 10 ký tự, sau đó thêm A! ở dưới
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
    return pass;
  };

  const isDone = row.isDone;

  const [serverStatus, setServerStatus] = useState<string>('');
  const [serverResetLink, setServerResetLink] = useState<string>('');

  useEffect(() => {
    if (row.isDone) return;
    
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/capital-reg-status?email=${encodeURIComponent(row.email)}&_t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.hasResult) {
            setServerStatus(data.result.status);
            if (data.result.resetLink) {
              setServerResetLink(data.result.resetLink);
            }
            if (data.result.status === 'ok') {
              onUpdated(row.rowIndex, { isDone: true, mkCapital: data.result.mkCapital });
            }
          }
        }
      } catch (e) {}
    }, 4000);
    
    return () => clearInterval(interval);
  }, [row.isDone, row.email, row.rowIndex, onUpdated]);

  const pollingRef = useRef(false);
  const latestTokenRef = useRef(fviaToken);

  useEffect(() => {
    latestTokenRef.current = fviaToken;
  }, [fviaToken]);

  useEffect(() => {
    if (row.newPassword) setNewPassword(row.newPassword);
    if (row.newMkCapital) setNewMkCapital(row.newMkCapital);
  }, [row.newPassword, row.newMkCapital]);

  // Polling để lấy OTP đăng nhập gửi về hòm thư cũ
  useEffect(() => {
    if (isDone || mode !== 'capital' || !row.oldRecovery || activeEmail !== row.email) return;

    let active = true;
    const parts = row.oldRecovery.split('@');
    const username = parts[0] || '';
    const domain = parts[1] || '';
    
    const fviaDomains = ['fviainboxes.com', 'fviadropinbox.com', 'fviamail.work', 'dropinboxes.com'];
    const inboxesDomains = [
      'inboxes.com', 'blondmail.com', 'chapsmail.com', 'clowmail.com', 'dropjar.com', 
      'fivermail.com', 'getairmail.com', 'getmule.com', 'getnada.com', 'gimpmail.com', 
      'givmail.com', 'guysmail.com', 'inboxbear.com', 'replyloop.com', 'robot-mail.com', 
      'tafmail.com', 'temptami.com', 'tupmail.com', 'vomoto.com', 'kapsule.info', 'getinbox.work',
      'smvmail.com'
    ];
    
    const isFvia = fviaDomains.includes(domain);
    const isInboxes = inboxesDomains.includes(domain);

    const poll = async () => {
      try {
        let foundOtp = null;

        if (isFvia || isInboxes) {
          // TOOL TỰ CÀO OTP CHO CÁC DOMAIN INBOXES/FVIA CŨ BẰNG API TỪ CỬA SỔ THƯỜNG
          if (isFvia && username && domain) {
            if (window.GM_fetch) {
              const listUrl = `https://fviainboxes.com/messages?username=${encodeURIComponent(username)}&domain=${encodeURIComponent(domain)}&_t=${Date.now()}`;
              const res = await window.GM_fetch(listUrl, {
                method: 'GET',
                headers: {
                  'Accept': 'application/json, text/plain, */*',
                  'Accept-Language': 'en-US,en;q=0.9',
                  'Authorization': fviaToken ? `Bearer ${fviaToken}` : ''
                }
              });
              if (res.ok) {
                const data = await res.json();
                const messages = data.result || [];
                for (const msg of messages) {
                  if (msg.from.toLowerCase().includes('microsoft')) {
                    const bodyUrl = `https://fviainboxes.com/message?username=${encodeURIComponent(username)}&domain=${encodeURIComponent(domain)}&id=${encodeURIComponent(msg.id)}`;
                    const bodyRes = await window.GM_fetch(bodyUrl, {
                      method: 'GET',
                      headers: { 'Authorization': fviaToken ? `Bearer ${fviaToken}` : '' }
                    });
                    if (bodyRes.ok) {
                      const bodyText = await bodyRes.text();
                      const code = extractOtp(bodyText);
                      if (code) {
                        foundOtp = code;
                        break;
                      }
                    }
                  }
                }
              }
            }
          } else if (isInboxes && row.oldRecovery) {
            try {
              const res = await fetch(`/api/scrape-inboxes?email=${encodeURIComponent(row.oldRecovery)}`);
              if (res.ok) {
                const data = await res.json();
                if (data.success && data.otp) {
                  foundOtp = data.otp;
                }
              }
            } catch (e) {
              console.error('Lỗi cào email cũ qua backend:', e);
            }
          }

          // Khi cào được OTP bằng API, POST lên bridge để tab ẩn danh đọc được
          if (foundOtp) {
            setOldOtp(foundOtp);
            try {
              await fetch('/api/otp-bridge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: row.oldRecovery, otp: foundOtp })
              });
            } catch (postErr) {
              console.error('Lỗi POST OTP cũ lên bridge:', postErr);
            }
          }
        } else {
          // VỚI MAIL TRANGCODE: Chỉ cần đọc từ API bridge (vì Script 2 chạy trên tab ẩn danh hòm thư phụ sẽ tự động cào và đẩy lên bridge)
          if (row.oldRecovery) {
            try {
              const res = await fetch(`/api/otp-bridge?email=${encodeURIComponent(row.oldRecovery)}&_t=${Date.now()}`);
              if (res.ok) {
                const data = await res.json();
                if (data.success && data.otp) {
                  foundOtp = data.otp;
                }
              }
            } catch (err) {
              console.error('Lỗi đọc OTP Trangcode từ bridge:', err);
            }
          }
        }

        // Đồng bộ OTP lên API bridge để tab ẩn danh Microsoft tự đọc và tự điền
        if (foundOtp) {
          setOldOtp(foundOtp);
          try {
            await fetch('/api/otp-bridge', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: row.oldRecovery, otp: foundOtp })
            });
          } catch (postErr) {
            console.error('Lỗi POST OTP Trangcode lên bridge:', postErr);
          }
        }
      } catch (e) {
        console.error('Lỗi khi poll OTP cũ:', e);
      }
    };

    const timer = setInterval(() => {
      if (active) void poll();
    }, 7000); // 7s check 1 lần để tránh Rate Limit 429 của Trangcode

    void poll();

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [isDone, mode, row.oldRecovery, fviaToken, activeEmail, row.email]);

  const handleCreate = async () => {
    setLoadingCreate(true);
    setErr('');
    try {
      const baseName = row.email.split('@')[0] || 'user';
      const rnd = Math.floor(1000 + Math.random() * 9000);
      const name = `${baseName}${rnd}`;
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
      if (!data.success) throw new Error(data.error || 'Không tạo được email');
      setGenerated(data.email);
      setCreatedAt(Date.now());
      
      const updates: any = { recovery: data.email };
      if (mode === 'capital') {
        const generatedPass = generateRandomPassword(); // Hotmail mới (không có A!)
        setNewPassword(generatedPass);
        updates.newPassword = generatedPass;
        
        // Chỉ tạo pass Capital mới nếu KHÔNG bị lỗi Capital
        const capitalStr = typeof row.newMkCapital === 'string' ? row.newMkCapital.toUpperCase() : '';
        const isCapitalError = checkCapitalResult === 'error' || capitalStr.includes('SAI CAPITAL') || capitalStr.includes('SAI MẬT KHẨU CAPITAL');
        if (!isCapitalError) {
          const generatedCap = generatedPass + 'A!';     // Capital mới (bằng MK Hotmail + 'A!')
          setNewMkCapital(generatedCap);
          updates.newMkCapital = generatedCap;
        } else {
          // Giữ nguyên lỗi
          updates.newMkCapital = row.newMkCapital;
        }
      }
      onUpdated(row.rowIndex, updates);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoadingCreate(false);
    }
  };

  const handleGetOtp = async () => {
    if (!generated) return;
    if (pollingRef.current) return;

    setLoadingOtp(true);
    setErr('');
    pollingRef.current = true;

    const maxWaitTime = 10 * 60 * 1000; // Đợi tối đa 10 phút
    const startTime = Date.now();

    const [username, domain] = generated.split('@');
    if (!username || !domain) {
      setErr('Email lấy thư bị lỗi định dạng.');
      setLoadingOtp(false);
      return;
    }

    const fviaDomains = ['fviainboxes.com', 'fviadropinbox.com', 'fviamail.work', 'dropinboxes.com'];
    const isFvia = fviaDomains.includes(domain);

    while (pollingRef.current && (Date.now() - startTime < maxWaitTime)) {
      let currentWaitMs = isFvia ? 2000 : 4000; // Mặc định 2s cho Fvia, 4s cho Inboxes
      try {
        let foundOtp: string | null = null;
        let isAuthError = false;

        if (isFvia) {
          if (!window.GM_fetch) {
            throw new Error('Chưa cài đặt Tampermonkey Proxy Script! Không tìm thấy window.GM_fetch.');
          }

          const listUrl = `https://fviainboxes.com/messages?username=${encodeURIComponent(username)}&domain=${encodeURIComponent(domain)}&_t=${Date.now()}`;
          const res = await window.GM_fetch(listUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json, text/plain, */*',
              'Accept-Language': 'en-US,en;q=0.9',
              'Origin': 'https://fviainboxes.com',
              'Referer': 'https://fviainboxes.com/',
              'Authorization': latestTokenRef.current ? `Bearer ${latestTokenRef.current}` : ''
            }
          });

          if (res.ok) {
            const data = await res.json();
            const messages = data.result || [];

            for (const msg of messages) {
              const fromLower = msg.from.toLowerCase();
              if (!fromLower.includes('microsoft')) continue;

              const bodyUrl = `https://fviainboxes.com/message?username=${encodeURIComponent(username)}&domain=${encodeURIComponent(domain)}&id=${encodeURIComponent(msg.id)}`;
              const bodyRes = await window.GM_fetch(bodyUrl, {
                method: 'GET',
                headers: {
                  'Accept': 'application/json, text/plain, */*',
                  'Accept-Language': 'en-US,en;q=0.9',
                  'Origin': 'https://fviainboxes.com',
                  'Referer': 'https://fviainboxes.com/',
                  'Authorization': latestTokenRef.current ? `Bearer ${latestTokenRef.current}` : ''
                }
              });

              if (bodyRes.ok) {
                const bodyText = await bodyRes.text();
                const code = extractOtp(bodyText);
                if (code) {
                  foundOtp = code;
                  break;
                }
              }
            }
          } else if (res.status === 403 || res.status === 401) {
            isAuthError = true;
            console.error('Token Fvia bị từ chối hoặc hết hạn!');
          }
        } else {
          // Inboxes.com logic gọi qua backend Next.js để vượt CORS 100%
          try {
            const res = await fetch(`/api/scrape-inboxes?email=${encodeURIComponent(generated)}`);
            if (res.ok) {
              const data = await res.json();
              if (data.success && data.otp) {
                foundOtp = data.otp;
              }
            } else if (res.status === 429 || res.status === 403) {
              console.warn(`[Inboxes.com] Bị giới hạn rate limit (Lỗi ${res.status}). Sẽ đợi thêm 15 giây...`);
              currentWaitMs = 15000;
            }
          } catch (e) {
            console.error('Lỗi cào email mới qua backend:', e);
          }
        }

          if (foundOtp) {
            // Đã lấy được OTP, chỉ lưu vào State, KHÔNG ghi lên sheet tự động
            setOtp(foundOtp);
            onUpdated(row.rowIndex, { code: foundOtp });
            pollingRef.current = false;
            setLoadingOtp(false);
            return;
          }
      } catch (e) {
        console.error('Lỗi khi lấy OTP:', e);
        if (e instanceof Error && e.message.includes('GM_fetch')) {
          setErr(e.message);
          pollingRef.current = false;
          setLoadingOtp(false);
          return;
        }
      }

      // Đợi trước khi hỏi lại (sử dụng currentWaitMs thay vì 200ms)
      await new Promise(r => setTimeout(r, currentWaitMs));
    }

    if (pollingRef.current) {
      setErr('Quá thời gian chờ OTP (10 phút). Hãy thử lại.');
      pollingRef.current = false;
      setLoadingOtp(false);
    }
  };

  const handleComplete = async () => {
    setLoadingComplete(true);
    setErr('');
    try {
      const capitalStr = typeof row.newMkCapital === 'string' ? row.newMkCapital.toUpperCase() : '';
      const isCurrentlyCapitalError = checkCapitalResult === 'error' || capitalStr.includes('SAI CAPITAL') || capitalStr.includes('SAI MẬT KHẨU CAPITAL');
      const finalMkCapital = isCurrentlyCapitalError ? row.newMkCapital : newMkCapital;
      
      const isMailError = newPassword === 'SAI MẬT KHẨU MAIL';
      const isCapError = typeof finalMkCapital === 'string' && finalMkCapital.toUpperCase().includes('SAI');
      
      const finalRecovery = isMailError ? '' : generated;
      const finalEmail = (isMailError && isCapError) ? '' : row.email;

      const body: any = {
        sheetId,
        sheetName,
        rowIndex: row.rowIndex,
        recovery: finalRecovery,
        code: otp,
        mode,
      };

      if (mode === 'capital') {
        body.email = finalEmail;
        body.newMkHotmail = newPassword;
        body.newMkCapital = finalMkCapital;
      }

      const res = await fetch('/api/complete-row', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Lỗi cập nhật Sheet');
      
      const updates: any = { recovery: generated };
      if (mode === 'capital') {
        updates.newPassword = newPassword;
        updates.newMkCapital = finalMkCapital;
        if (isCurrentlyCapitalError) {
          updates.isPasswordError = true;
          updates.isDone = false;
        } else {
          updates.isDone = true;
          updates.isPasswordError = false;
        }
      } else {
        updates.isDone = true;
      }
      onUpdated(row.rowIndex, updates);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoadingComplete(false);
    }
  };

  const oldRecoveryUser = row.oldRecovery ? row.oldRecovery.split('@')[0] : '';

  const isActive = activeEmail === row.email;
  const isPasswordError = row.isPasswordError || false;
  const isCapitalErrorUI = checkCapitalResult === 'error';

  return (
    <div
      className={`bg-white rounded-lg shadow-md p-5 border-2 transition-all duration-300 relative ${
        isActive 
          ? 'border-blue-500 ring-4 ring-blue-400 ring-opacity-40 shadow-blue-200 shadow-xl z-10 bg-blue-50/10 active-bounce-effect' 
          : isPasswordError
            ? 'border-red-500 bg-red-50 opacity-40 grayscale-[30%] hover:opacity-100'
            : isCapitalErrorUI
              ? 'border-red-400 bg-red-50' // Màu đỏ nhưng không bị mờ hay vô hiệu hóa
              : isDone 
                ? 'border-green-400 bg-green-50' 
                : 'border-orange-200 bg-orange-50 hover:border-blue-300 gentle-bounce-effect'
      }`}
    >
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes gentle-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .gentle-bounce-effect {
          animation: gentle-bounce 3.5s infinite ease-in-out;
        }
        .active-bounce-effect {
          animation: gentle-bounce 1.5s infinite ease-in-out;
        }
      `}} />
      <div className="flex justify-between items-center mb-4">
        <div className="text-xs text-gray-500 flex items-center gap-2">
          #{row.rowIndex} · <span className="font-medium text-gray-700">{row.name || '—'}</span>
          {isActive && (
            <span className="flex h-2.5 w-2.5 relative" title="Tài khoản đang xử lý">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
            </span>
          )}
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${
            isActive
              ? 'bg-blue-600 text-white shadow-md shadow-blue-200 animate-pulse'
              : isPasswordError
                ? 'bg-red-500 text-white shadow-md shadow-red-200'
                : isDone 
                  ? 'bg-green-500 text-white' 
                  : 'bg-orange-400 text-white'
          }`}
        >
          {isActive ? '⚡ Đang chạy...' : isPasswordError ? (mode === 'capital' ? '❌ Sai Capital' : '❌ Sai mật khẩu') : isDone ? (mode === 'capital' ? '✅ Capital OK' : '✓ Đã làm') : '⏳ Đang làm'}
        </span>
      </div>

      <div className="mb-3">
        <CopyField label={mode === 'capital_reg' ? "📧 Mail" : "📧 Email Hotmail"} value={row.email} color="blue" />
        <div className="flex gap-2">
          <button
            onClick={async () => {
              if (onActive) onActive(row.email);
              const accData = {
                email: row.email,
                password: row.password,
                newPassword: newPassword,
                newRecovery: generated,
                recovery: generated, // Đồng bộ thuộc tính recovery để các script Tampermonkey đọc chính xác
                oldRecovery: row.oldRecovery || '',
                mkCapital: row.mkCapital,
                newMkCapital: newMkCapital || row.newMkCapital || ''
              };
              try {
                await fetch('/api/current-account', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(accData)
                });
              } catch (e) {
                console.error('Lỗi đặt current-account:', e);
              }
              // Thiết lập mailboxUrl đối với email Trangcode để mở song song trong cửa sổ ẩn danh
              let mailboxUrl = '';
              if (row.oldRecovery) {
                const domain = row.oldRecovery.split('@')[1]?.toLowerCase() || '';
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
                if (!isFvia && !isInboxes) {
                  // Đây là email thuộc Trangcode (sellallmail.com) -> bắt buộc phải mở tab hòm thư Trangcode ẩn danh
                  mailboxUrl = `https://sellallmail.com/mailbox/${encodeURIComponent(row.oldRecovery)}`;
                }
              }

              // Mở song song link Capital One Shopping nếu ở chế độ Capital
              let capitalUrl = '';
              if (mode === 'capital') {
                capitalUrl = 'https://capitaloneshopping.com/sign-in';
              }

              // Thiết lập recoveryMailboxUrl đối với email khôi phục mới (Inboxes hoặc SMVmail) để mở song song
              let recoveryMailboxUrl = '';
              if (generated) {
                const domain = generated.split('@')[1]?.toLowerCase() || '';
                const inboxesDomains = [
                  'inboxes.com', 'blondmail.com', 'chapsmail.com', 'clowmail.com', 'dropjar.com', 
                  'fivermail.com', 'getairmail.com', 'getmule.com', 'getnada.com', 'gimpmail.com', 
                  'givmail.com', 'guysmail.com', 'inboxbear.com', 'replyloop.com', 'robot-mail.com', 
                  'tafmail.com', 'temptami.com', 'tupmail.com', 'vomoto.com', 'kapsule.info', 'getinbox.work'
                ];
                const isSmv = domain === 'smvmail.com';
                const isInboxes = inboxesDomains.some(d => domain.includes(d));
                if (isSmv) {
                  recoveryMailboxUrl = `https://smvmail.com/email/${encodeURIComponent(generated)}`;
                } else if (isInboxes) {
                  recoveryMailboxUrl = 'https://inboxes.com';
                }
              } else {
                // Fallback nếu chưa có email khôi phục mới, vẫn mở trang chủ hòm thư ẩn danh để làm việc
                if (mailProvider === 'inboxes') {
                  recoveryMailboxUrl = 'https://inboxes.com';
                } else {
                  recoveryMailboxUrl = 'https://fviainboxes.com';
                }
              }

              // Mã hóa Base64 an toàn để truyền qua URL Hash
              const base64Data = btoa(unescape(encodeURIComponent(JSON.stringify(accData))));
              const loginUrl = `https://login.live.com/login.srf?wa=wsignin1.0&rpsnv=198&ct=1782607399&rver=7.5.2211.0&wp=SA_20MIN&wreply=https%3A%2F%2Faccount.live.com%2Fproofs%2FManage%2Fadditional%3Fuaid%3D233239318fd1447bab2b4edd22546006&lc=1033&id=38936&mkt=vi-VN#acc=${base64Data}`;
              
               try {
                 const openRes = await fetch('/api/open-incognito', {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({ url: loginUrl, mailboxUrl, capitalUrl, recoveryMailboxUrl })
                 });
                 const openData = await openRes.json();
                 if (!openData.success) {
                   window.open(loginUrl, '_blank');
                   if (capitalUrl) window.open(capitalUrl, '_blank');
                   if (recoveryMailboxUrl) window.open(recoveryMailboxUrl, '_blank');
                 }
              } catch (e) {
                console.error('Lỗi khi gọi API mở ẩn danh:', e);
                window.open(loginUrl, '_blank');
                if (capitalUrl) window.open(capitalUrl, '_blank');
              }
            }}
            disabled={isPasswordError}
            className="flex-1 mt-1 px-3 py-2 bg-blue-100 text-blue-700 rounded border border-blue-200 hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed transition-colors font-medium text-xs flex items-center h-[38px] justify-center whitespace-nowrap animate-pulse"
            title="Đăng nhập tự động vào Hotmail"
          >
            🔑 Vào Hotmail
          </button>
          
          <button
            onClick={handleMarkPasswordError}
            disabled={isPasswordError || loadingMarkError}
            className="mt-1 px-3 py-2 bg-red-100 text-red-700 rounded border border-red-200 hover:bg-red-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed transition-colors font-medium text-xs flex items-center h-[38px] justify-center whitespace-nowrap"
            title="Đánh dấu tài khoản bị sai mật khẩu và tô đỏ trên Google Sheet"
          >
            ❌ {loadingMarkError ? 'Đang lưu...' : 'Sai MK Mail'}
          </button>
        </div>
        {mode === 'capital' && (
          <div className="flex flex-col gap-1.5 mt-2">
            <button
              onClick={handleCheckCapital}
              disabled={isPasswordError || checkingCapital}
              className={`w-full px-3 py-2 rounded border text-xs font-semibold flex items-center justify-center h-[38px] transition-all duration-300 ${
                checkCapitalResult === 'ok'
                  ? 'bg-green-600 text-white border-green-700 hover:bg-green-700 shadow-md shadow-green-100'
                  : checkCapitalResult === 'error'
                    ? 'bg-red-600 text-white border-red-700 hover:bg-red-700 shadow-md shadow-red-100'
                    : checkCapitalResult === 'cf_block'
                      ? 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600'
                      : 'bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700'
              }`}
            >
              {checkingCapital ? '⏳ Đang check...' : checkCapitalResult === 'ok' ? '✅ Capital OK' : checkCapitalResult === 'error' ? '❌ Sai Capital' : checkCapitalResult === 'cf_block' ? '⚠️ Check bị chặn' : '🔍 Check Capital ngầm'}
            </button>
            {checkCapitalError && (
              <div className="text-[10px] text-red-600 bg-red-50 border border-red-100 rounded px-2 py-1 font-medium text-center">
                ⚠️ {checkCapitalError}
              </div>
            )}
            {checkCapitalResult === 'error' && !isDone && (
              <div className="text-[11px] text-orange-700 bg-orange-50 border border-orange-200 rounded px-2 py-1.5 font-medium text-center mt-1">
                ⚠️ Capital đã sai, giờ check Hotmail nhé.
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Hiển thị mật khẩu cũ khi chưa làm, hoặc mật khẩu mới khi đã làm */}
      {mode === 'capital_reg' ? (
        <CopyField label="🔑 Mk mail" value={row.password} color="gray" />
      ) : !isDone ? (
        <CopyField label="🔑 Mật khẩu Hotmail (cũ)" value={row.password} color="gray" />
      ) : (
        mode === 'capital' && row.newPassword && (
          <CopyField label="🔑 Mật khẩu Hotmail (MỚI)" value={row.newPassword} color="green" />
        )
      )}

      {mode === 'capital' && row.oldRecovery && (
        <>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <CopyField label="📬 Mail khôi phục cũ" value={row.oldRecovery} color="blue" />
            </div>
            <a
              href={`https://sellallmail.com/mailbox/${row.oldRecovery}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`mb-3 px-3 py-2 bg-blue-100 text-blue-700 rounded border border-blue-200 hover:bg-blue-200 transition-colors font-medium text-xs flex items-center h-[38px] justify-center whitespace-nowrap ${isPasswordError ? 'pointer-events-none opacity-50 bg-gray-100 text-gray-400 border-gray-200' : ''}`}
              title="Mở hòm thư cũ trên sellallmail.com"
            >
              📬 Vào Mailbox
            </a>
          </div>
          <CopyField label="👤 User khôi phục cũ" value={oldRecoveryUser} color="green" />

          {/* Hiển thị OTP đăng nhập lấy tự động từ mailbox cũ */}
          {oldOtp && (
            <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-3 my-2 animate-bounce">
              <CopyField label="🔐 OTP Đăng nhập (Mail cũ)" value={oldOtp} color="purple" />
            </div>
          )}
        </>
      )}

      {/* Hiển thị mật khẩu Capital cũ khi chưa làm, hoặc mật khẩu mới khi đã làm, kèm nút mở Capital */}
      {mode === 'capital' && (
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            {!isDone ? (
              row.mkCapital && <CopyField label="💳 Mật khẩu Capital (cũ)" value={row.mkCapital} color="purple" />
            ) : (
              row.newMkCapital && <CopyField label="💳 Mật khẩu Capital (MỚI)" value={row.newMkCapital} color="green" />
            )}
          </div>
          <button
            onClick={async () => {
              const capitalUrl = 'https://capitaloneshopping.com/sign-in';
              try {
                await fetch('/api/current-account', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    email: row.email,
                    password: row.password,
                    newPassword: newPassword,
                    newRecovery: generated,
                    oldRecovery: row.oldRecovery || '',
                    mkCapital: row.mkCapital,
                    newMkCapital: newMkCapital || row.newMkCapital || ''
                  })
                });
              } catch (e) {
                console.error('Lỗi đặt current-account:', e);
              }
              
              try {
                const openRes = await fetch('/api/open-incognito', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ url: capitalUrl })
                });
                const openData = await openRes.json();
                if (!openData.success) {
                  window.open(capitalUrl, '_blank');
                }
              } catch (e) {
                console.error('Lỗi khi gọi API mở ẩn danh:', e);
                window.open(capitalUrl, '_blank');
              }
            }}
            disabled={isPasswordError}
            className="mb-3 px-3 py-2 bg-purple-100 text-purple-700 rounded border border-purple-200 hover:bg-purple-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed transition-colors font-medium text-xs flex items-center h-[38px] justify-center whitespace-nowrap"
            title="Mở trang đăng nhập Capital One Shopping"
          >
            🛍️ Vào Capital
          </button>
        </div>
      )}

      <div className="border-t border-dashed border-gray-300 my-3" />

      {mode === 'capital_reg' ? (
        <>
          {/* 1. Hiển thị mail khôi phục có sẵn */}
          {row.recovery && (
            <CopyField label="📬 Mail khôi phục" value={row.recovery} color="blue" />
          )}

           {/* Hiển thị & Sinh thông tin Tên/Zip Mỹ */}
           <div className="mt-2 text-xs p-2.5 rounded border border-indigo-100 bg-indigo-50/30 mb-2">
             <div className="flex justify-between items-center mb-1.5">
               <span className="font-bold text-indigo-800">🇺🇸 Thông tin đăng ký Mỹ:</span>
               {!row.isDone && (
                 <button
                   onClick={async () => {
                     const randomName = getRandomUSName(allRows);
                     const randomZip = getRandomUSZip();
                     try {
                       const res = await fetch('/api/update-sheet', {
                         method: 'POST',
                         headers: { 'Content-Type': 'application/json' },
                         body: JSON.stringify({
                           sheetId,
                           rowIndex: row.rowIndex,
                           firstName: randomName.first,
                           lastName: randomName.last,
                           zipCode: randomZip
                         })
                       });
                       if (res.ok) {
                         onUpdated(row.rowIndex, {
                           firstName: randomName.first,
                           lastName: randomName.last,
                           zipCode: randomZip
                         });
                       } else {
                         alert('Lỗi lưu thông tin lên Google Sheet!');
                       }
                     } catch (e) {
                       alert('Lỗi kết nối API lưu thông tin!');
                     }
                   }}
                   type="button"
                   className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] rounded font-bold transition-colors"
                 >
                   🎲 Sinh Tên & Zip
                 </button>
               )}
             </div>
             <div className="grid grid-cols-3 gap-2 font-mono text-[11px] text-gray-700">
                <div 
                  onClick={() => row.firstName && navigator.clipboard.writeText(row.firstName)}
                  className="bg-white p-1 rounded border cursor-pointer hover:bg-indigo-50/50 transition-colors"
                  title="Click để copy First Name"
                >
                  <span className="text-[9px] text-gray-400 block font-sans">First Name 📋</span>
                  <span className="font-bold text-indigo-700 break-all select-all">{row.firstName || '—'}</span>
                </div>
                <div 
                  onClick={() => row.lastName && navigator.clipboard.writeText(row.lastName)}
                  className="bg-white p-1 rounded border cursor-pointer hover:bg-indigo-50/50 transition-colors"
                  title="Click để copy Last Name"
                >
                  <span className="text-[9px] text-gray-400 block font-sans">Last Name 📋</span>
                  <span className="font-bold text-indigo-700 break-all select-all">{row.lastName || '—'}</span>
                </div>
                <div 
                  onClick={() => row.zipCode && navigator.clipboard.writeText(row.zipCode)}
                  className="bg-white p-1 rounded border cursor-pointer hover:bg-indigo-50/50 transition-colors"
                  title="Click để copy Zip Code"
                >
                  <span className="text-[9px] text-gray-400 block font-sans">Zip Code 📋</span>
                  <span className="font-bold text-indigo-700 break-all select-all">{row.zipCode || '—'}</span>
                </div>
              </div>
           </div>

          {/* 2. Hiển thị dự kiến Mk Capital */}
          <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2.5 rounded border border-dashed border-gray-300 mb-3">
            <div className="flex justify-between items-center gap-2">
              <div className="truncate">
                🔑 <b>Dự kiến Mk Capital:</b>{' '}
                <span 
                  className="font-mono text-indigo-600 select-all cursor-pointer font-bold bg-white px-1.5 py-0.5 rounded border shadow-sm hover:text-indigo-800 transition-colors" 
                  title="Click để copy" 
                  onClick={() => navigator.clipboard.writeText(generateMkCapitalPreview(row.password))}
                >
                  {generateMkCapitalPreview(row.password) || '—'}
                </span>
              </div>
              
              {!row.isDone && (
                <button
                  onClick={async () => {
                    setLoadingMarkError(true);
                    try {
                      const expectedPass = generateMkCapitalPreview(row.password);
                      const res = await fetch('/api/complete-row', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          sheetId,
                          sheetName,
                          rowIndex: row.rowIndex,
                          newMkCapital: expectedPass,
                          mode: 'capital_reg'
                        })
                      });
                      const data = await res.json();
                      if (!data.success) throw new Error(data.error || 'Lỗi lưu vào sheet');
                      
                      onUpdated(row.rowIndex, { 
                        isDone: true, 
                        mkCapital: expectedPass 
                      });
                      alert(`Đã lưu mật khẩu ${expectedPass} và ngày hôm nay vào Sheet!`);

                      // Tự động copy email và mở mail của hàng tiếp theo chưa làm của cùng một người
                      const nextRow = allRows.find(r => 
                        r.rowIndex > row.rowIndex && 
                        !r.isDone && 
                        !r.isPasswordError &&
                        (!row.name || r.name === row.name)
                      );
                      if (nextRow) {
                        try {
                          await navigator.clipboard.writeText(nextRow.email);
                        } catch (clipErr) {
                          console.error('Lỗi copy email hàng tiếp theo:', clipErr);
                        }
                        handleOpenMailRealMachineFor(nextRow);
                      }
                    } catch (e: any) {
                      alert('Lỗi khi lưu: ' + (e.message || String(e)));
                    } finally {
                      setLoadingMarkError(false);
                    }
                  }}
                  disabled={loadingMarkError}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-lg shadow text-xs flex items-center gap-1 transition-all flex-shrink-0"
                >
                  💾 Lưu
                </button>
              )}
            </div>
          </div>

          {/* 3. Hiển thị mật khẩu Capital đã tạo (nếu có) */}
          {row.mkCapital && (
            <CopyField label="💳 Mk capital" value={row.mkCapital} color="green" />
          )}

          {/* 4. Nút bấm Tạo cho riêng tài khoản này */}
          {!row.isDone && (
            <div className="flex gap-2 mt-2 w-full">
              <button
                onClick={async () => {
                  setErr('');
                  setLoadingComplete(true);
                  try {
                    const info = await ensureUSInfoPopulated();
                    const accData = {
                        sheetId,
                        sheetName,
                        rowIndex: row.rowIndex,
                        email: row.email,
                        pass: row.password,
                        code: row.code,
                        recovery: row.recovery,
                        oldRecovery: row.oldRecovery,
                        firstName: info.firstName,
                        lastName: info.lastName,
                        zipCode: info.zipCode,
                        isAutoReg: true
                      };
                      const jsonStr = JSON.stringify(accData);
                      const base64Data = btoa(unescape(encodeURIComponent(jsonStr)));
                      const checkUrl = `https://capitaloneshopping.com/onboarding/base#capitalReg=${base64Data}`;
                      const oauthUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=9199bf20-a13f-4107-85dc-02114787ef48&scope=https%3A%2F%2Foutlook.office.com%2F.default%20openid%20profile%20offline_access&redirect_uri=https%3A%2F%2Foutlook.live.com%2Fmail%2F&client-request-id=ccdd58c9-ae4b-3c55-0ffa-c890dfa17330&response_mode=fragment&client_info=1&clidata=1&prompt=select_account&nonce=019f4231-f4ad-74cb-8f28-7ffa09210948&state=eyJpZCI6IjAxOWY0MjMxLWY0YWQtNzY1YS1hYjViLThiMDJiNGY1ZDAwZCIsIm1ldGEiOnsiaW50ZXJhY3Rpb25UeXBlIjoicmVkaXJlY3QifX0%3D%7CaHR0cHM6Ly9vdXRsb29rLmxpdmUuY29tL21haWwv&claims=%7B%22access_token%22%3A%7B%22xms_cc%22%3A%7B%22values%22%3A%5B%22CP1%22%5D%7D%7D%7D&x-client-SKU=msal.js.browser&x-client-VER=5.12.0&response_type=code&code_challenge=ODz59kCxQQ4SOagHJIdLUBvPIKLbvUc-t70OHFFwS-w&code_challenge_method=S256&cobrandid=ab0455a0-8d03-46b9-b18b-df2f57b9e44c&fl=dob%2Cflname%2Cwld#capitalReg=${base64Data}`;
                      
                      // Chỉ cần mở 1 tab Capital, tab Hotmail sẽ được SCRIPT 8 tự mở ngầm qua Tampermonkey
                      const win = window.open(checkUrl, '_blank');
                      if (!win) {
                        throw new Error('Trình duyệt chặn mở Tab mới (Popup Blocker)! Vui lòng cho phép popup rồi thử lại.');
                      }
                    
                    // Bắt đầu polling tìm kết quả cho riêng tài khoản này
                    const startTime = Date.now();
                    const maxWaitTime = 180 * 1000;
                    while (Date.now() - startTime < maxWaitTime) {
                      await new Promise(r => setTimeout(r, 3000));
                      const statusRes = await fetch(`/api/capital-reg-status?email=${encodeURIComponent(row.email)}&_t=${Date.now()}`);
                      if (statusRes.ok) {
                        const statusData = await statusRes.json();
                        if (statusData.success && statusData.hasResult) {
                          const result = statusData.result;
                          if (result.status === 'ok') {
                            onUpdated(row.rowIndex, { isDone: true, mkCapital: result.mkCapital });
                            alert(`Đăng ký thành công cho ${row.email}!`);
                          } else {
                            setErr(`Lỗi: ${result.errorMsg}`);
                          }
                          break;
                        }
                      }
                    }
                  } catch (e: any) {
                    setErr(e.message || String(e));
                  } finally {
                    setLoadingComplete(false);
                  }
                }}
                disabled={loadingComplete}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs h-[38px] flex items-center justify-center transition-colors animate-pulse"
              >
                {loadingComplete ? '⏳ Đang tạo...' : '🚀 Tạo Capital'}
              </button>

              <button
                onClick={async () => {
                  try {
                    const info = await ensureUSInfoPopulated();
                    const accData = {
                      sheetId,
                      sheetName,
                      rowIndex: row.rowIndex,
                      email: row.email,
                      pass: row.password,
                      code: row.code,
                      recovery: row.recovery,
                      oldRecovery: row.oldRecovery,
                      firstName: info.firstName,
                      lastName: info.lastName,
                      zipCode: info.zipCode,
                      isAutoReg: true
                    };
                    const jsonStr = JSON.stringify(accData);
                    const base64Data = btoa(unescape(encodeURIComponent(jsonStr)));
                    const checkUrl = `https://capitaloneshopping.com/onboarding/base#capitalReg=${base64Data}`;
                    
                    navigator.clipboard.writeText(checkUrl);
                    alert('Đã copy Link đăng ký! Hãy dán (Paste & Go) vào trình duyệt AdsPower.');
                  } catch (err) {
                    alert('Lỗi copy link: ' + String(err));
                  }
                }}
                type="button"
                className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-bold text-xs h-[38px] flex items-center justify-center transition-colors whitespace-nowrap"
                title="Copy Link đăng ký để dán vào AdsPower"
              >
                📋 Copy Link
              </button>
            </div>
          )}

          {/* Nút thao tác trên máy thật khi chạy chế độ capital_reg */}
          {!row.isDone && (
            <div className="flex flex-col gap-2 mt-2 w-full p-2.5 bg-indigo-50/50 rounded-lg border border-dashed border-indigo-200">
              <div className="text-[11px] font-bold text-indigo-800 flex items-center gap-1">
                💻 Thao tác liên kết máy thật:
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenMailRealMachineFor(row)}
                  type="button"
                  className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-[11px] transition-colors"
                  title="Mở link đăng nhập Hotmail trên Chrome thường của máy chính"
                >
                  📬 Mở Mail (Máy thật)
                </button>
                
                {(serverStatus === 'reset_link_found' || serverResetLink) && (
                  <>
                    <button
                      onClick={async () => {
                        setLoadingComplete(true);
                        try {
                          const info = await ensureUSInfoPopulated();
                          const accData = {
                            sheetId,
                            sheetName,
                            rowIndex: row.rowIndex,
                            email: row.email,
                            pass: row.password,
                            code: row.code,
                            recovery: row.recovery,
                            oldRecovery: row.oldRecovery,
                            firstName: info.firstName,
                            lastName: info.lastName,
                            zipCode: info.zipCode,
                            isAutoReg: true
                          };
                          const base64Data = btoa(unescape(encodeURIComponent(JSON.stringify(accData))));
                          const targetUrl = serverResetLink + `#capitalReg=${base64Data}`;
                          const win = window.open(targetUrl, '_blank');
                          if (!win) {
                            throw new Error('Trình duyệt chặn mở Tab mới (Popup Blocker)! Vui lòng cho phép popup rồi thử lại.');
                          }
                        } catch (e: any) {
                          alert('Lỗi: ' + String(e));
                        } finally {
                          setLoadingComplete(false);
                        }
                      }}
                      disabled={loadingComplete}
                      type="button"
                      className="flex-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] transition-colors"
                      title="Mở link reset mật khẩu trực tiếp trong AdsPower để đổi mật khẩu và zip/tên"
                    >
                      🔗 Tiếp tục (AdsPower)
                    </button>
                    
                    <button
                      onClick={async () => {
                        const info = await ensureUSInfoPopulated();
                        const accData = {
                          sheetId,
                          sheetName,
                          rowIndex: row.rowIndex,
                          email: row.email,
                          pass: row.password,
                          code: row.code,
                          recovery: row.recovery,
                          oldRecovery: row.oldRecovery,
                          firstName: info.firstName,
                          lastName: info.lastName,
                          zipCode: info.zipCode,
                          isAutoReg: true
                        };
                        const base64Data = btoa(unescape(encodeURIComponent(JSON.stringify(accData))));
                        navigator.clipboard.writeText(serverResetLink + `#capitalReg=${base64Data}`);
                        alert('Đã copy Link Reset! Hãy dán vào AdsPower.');
                      }}
                      type="button"
                      className="px-2.5 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded font-bold text-[11px] transition-colors"
                      title="Copy Link Reset để dán vào AdsPower thủ công"
                    >
                      📋 Copy Link Reset
                    </button>
                  </>
                )}
              </div>
              
              {serverResetLink && (() => {
                const accData = {
                  sheetId,
                  sheetName,
                  rowIndex: row.rowIndex,
                  email: row.email,
                  pass: row.password,
                  code: row.code,
                  recovery: row.recovery,
                  oldRecovery: row.oldRecovery,
                  firstName: row.firstName,
                  lastName: row.lastName,
                  zipCode: row.zipCode,
                  isAutoReg: true
                };
                const base64Data = btoa(unescape(encodeURIComponent(JSON.stringify(accData))));
                const fullLink = serverResetLink + `#capitalReg=${base64Data}`;
                return (
                  <div className="text-[10px] text-emerald-700 bg-emerald-50 p-1.5 rounded border border-emerald-100 break-all select-all font-mono">
                    <b>Link Reset đầy đủ:</b> {fullLink}
                  </div>
                );
              })()}
            </div>
          )}
        </>
      ) : generated ? (
        <>
          <CopyField label={mode === 'capital' ? "✨ Mail khôi phục mới" : "✨ Mail khôi phục đã tạo"} value={generated} color="green" />
          {otp && <CopyField label="🔐 Code (OTP Microsoft)" value={otp} color="purple" />}
          
          {/* Form điền mật khẩu mới khi đang tiến hành (chỉ ở chế độ capital) */}
          {mode === 'capital' && !isDone && (
            <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 mb-3 space-y-3">
              <div className="font-semibold text-xs text-blue-800">✍️ Điền thông tin mới sau khi đổi:</div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">🔑 Mật khẩu Hotmail mới</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập MK Hotmail mới..."
                    className={`flex-1 text-sm bg-white border border-gray-300 rounded p-1.5 outline-none focus:ring-1 focus:ring-blue-500 font-medium ${newPassword === 'SAI MẬT KHẨU MAIL' ? 'bg-red-100 text-red-700' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const generatedVal = generateRandomPassword(); // Không có A!
                      setNewPassword(generatedVal);
                      setNewMkCapital(generatedVal + 'A!');
                    }}
                    className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300 whitespace-nowrap"
                    title="Tự động tạo mật khẩu ngẫu nhiên"
                  >
                    🎲 Ngẫu nhiên
                  </button>
                  <label className="flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-200 rounded text-red-600 text-xs font-semibold cursor-pointer hover:bg-red-100 whitespace-nowrap" title="Đánh dấu lỗi Mật khẩu Mail và không lưu MK này">
                    <input
                      type="checkbox"
                      checked={newPassword === 'SAI MẬT KHẨU MAIL'}
                      onChange={async (e) => {
                        if (e.target.checked) {
                          if (window.confirm('Xác nhận tài khoản này bị SAI MAIL và lưu/tô đỏ trên Sheet ngay lập tức?')) {
                            setNewPassword('SAI MẬT KHẨU MAIL');
                            try {
                              await fetch('/api/mark-error', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ sheetId, sheetName, rowIndex: row.rowIndex, mode, errorType: 'mail', newMkCapital: newMkCapital || row.newMkCapital })
                              });
                              onUpdated(row.rowIndex, { isPasswordError: true, newPassword: 'SAI MẬT KHẨU MAIL' });
                            } catch (error) {
                              console.error('Lỗi khi lưu sai mail:', error);
                            }
                          }
                        } else {
                          setNewPassword('');
                        }
                      }}
                    />
                    Sai Mail
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">💳 Mật khẩu Capital mới</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={isCapitalErrorUI ? row.newMkCapital : newMkCapital}
                    onChange={(e) => setNewMkCapital(e.target.value)}
                    disabled={isCapitalErrorUI}
                    placeholder="Nhập MK Capital mới..."
                    className={`flex-1 text-sm bg-white border border-gray-300 rounded p-1.5 outline-none focus:ring-1 focus:ring-blue-500 font-medium ${isCapitalErrorUI ? 'bg-red-100 text-red-700 cursor-not-allowed' : ''}`}
                  />
                  {!isCapitalErrorUI && (
                    <button
                      type="button"
                      onClick={() => {
                        const base = newPassword && newPassword !== 'SAI MẬT KHẨU MAIL' ? newPassword : generateRandomPassword();
                        setNewMkCapital(base + 'A!');
                      }}
                      className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300 whitespace-nowrap"
                      title="Tự động tạo mật khẩu ngẫu nhiên"
                    >
                      🎲 Ngẫu nhiên
                    </button>
                  )}
                  <label className="flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-200 rounded text-red-600 text-xs font-semibold cursor-pointer hover:bg-red-100 whitespace-nowrap" title="Đánh dấu lỗi Mật khẩu Capital">
                    <input
                      type="checkbox"
                      checked={isCapitalErrorUI}
                      onChange={async (e) => {
                        if (e.target.checked) {
                          if (window.confirm('Xác nhận lỗi Sai Capital và lưu lên Google Sheet ngay lập tức?')) {
                            setNewMkCapital('SAI MẬT KHẨU CAPITAL');
                            try {
                              await fetch('/api/mark-error', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ sheetId, sheetName, rowIndex: row.rowIndex, mode, errorType: 'capital' })
                              });
                              // Bỏ isPasswordError: true để không nhảy dòng, chỉ hiện lỗi ở ô Capital
                              onUpdated(row.rowIndex, { newMkCapital: 'SAI MẬT KHẨU CAPITAL' });
                            } catch (error) {
                              console.error('Lỗi khi lưu sai capital:', error);
                            }
                          }
                        } else {
                          setNewMkCapital('');
                          onUpdated(row.rowIndex, { newMkCapital: '' });
                        }
                      }}
                    />
                    Sai Capital
                  </label>
                </div>
              </div>
            </div>
          )}

          {!otp && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={loadingOtp ? () => { pollingRef.current = false; setLoadingOtp(false); } : handleGetOtp}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors font-medium ${loadingOtp ? 'bg-orange-500 hover:bg-orange-600' : 'bg-purple-600 hover:bg-purple-700'
                  }`}
              >
                {loadingOtp ? '⏹ Dừng chờ OTP' : '🔐 Lấy code'}
              </button>

              {!loadingOtp && (
                <button
                  onClick={() => {
                    setGenerated('');
                    setOtp('');
                    onUpdated(row.rowIndex, { recovery: '' });
                  }}
                  className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium text-sm flex-shrink-0"
                  title="Xóa mail ảo này để tạo mail mới"
                >
                  🔄 Đổi mail khác
                </button>
              )}
            </div>
          )}
          
          {!isDone && !isPasswordError && (
            <button
              onClick={handleComplete}
              disabled={loadingComplete}
              className="w-full px-4 py-2 mt-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-bold"
            >
              {loadingComplete ? '⏳ Đang lưu...' : '✅ Hoàn thành & Lưu'}
            </button>
          )}
        </>
      ) : (
        <button
          onClick={handleCreate}
          disabled={isPasswordError || loadingCreate}
          className="w-full px-4 py-2 mt-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
        >
          {loadingCreate ? '⏳ Đang tạo...' : (mode === 'capital' ? '✨ Tạo thông tin mới' : '✨ Tạo mail khôi phục')}
        </button>
      )}

      {err && <div className="mt-3 text-xs text-red-600">{err}</div>}
    </div>
  );
}
