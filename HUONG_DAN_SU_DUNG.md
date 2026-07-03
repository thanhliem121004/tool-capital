# 🚀 TIỆN ÍCH TỰ ĐỘNG HÓA MMO PRO (BẢN ĐỒNG BỘ SONG SONG HOTMAIL & CAPITAL ONE)

Tài liệu này hướng dẫn chi tiết cách cài đặt, khởi động và sử dụng Tool tự động hóa từ A-Z dành cho bạn và các thành viên trong nhóm.

---

## 📁 1. CÁC THƯ MỤC & FILE CẦN THIẾT
Khi bạn giải nén thư mục Tool này ra, hãy chắc chắn có đầy đủ các file sau:
1. **`start-tool.bat`**: File khởi động nhanh Tool chỉ bằng 1 cú click đúp.
2. **`.env.local`**: File chứa thông tin kết nối Google Sheet API (Service Account).
3. **`node_modules/`** *(Đã nén sẵn)*: Thư mục chứa toàn bộ thư viện cần thiết để chạy Tool mà không cần tải lại từ internet.
4. **`HUONG_DAN_SU_DUNG.md`**: Chính là file hướng dẫn này.

---

## 💻 2. HƯỚNG DẪN KHỞI ĐỘNG TOOL (DÀNH CHO NGƯỜI MỚI)

### **Bước 1: Cài đặt Node.js**
* Nếu máy tính của bạn chưa cài đặt Node.js, hãy tải và cài đặt bản LTS tại trang chủ: [https://nodejs.org/](https://nodejs.org/) (chỉ cần bấm Next liên tục đến khi hoàn tất).

### **Bước 2: Khởi động Tool**
* Hãy **click đúp chuột (Double click)** vào file **`start-tool.bat`** ở thư mục gốc của Tool.
* Chương trình sẽ tự động kiểm tra môi trường, khởi động server local và tự động mở trình duyệt Chrome thường của bạn tới địa chỉ giao diện: **`http://localhost:3000`**

---

## 🔌 3. HƯỚNG DẪN CÀI ĐẶT 4 SCRIPT TAMPERMONKEY (TRÊN CHROME THƯỜNG)
Để tính năng tự động điền và đổi mật khẩu hoạt động, bạn cần cài đặt **Tampermonkey** trên trình duyệt Chrome thường và thêm 4 đoạn script sau:

> [!IMPORTANT]
> Toàn bộ code của 4 Script Tampermonkey đã được cập nhật phiên bản mới nhất, sửa lỗi kẹt accordion và cào OTP Inboxes/SMVmail chuẩn xác 100%. Bạn có thể lấy code của cả 4 Script này trực tiếp trong file text nằm trong project:
> 👉 **[Mở file CAC_SCRIPT_TAMPERMONKEY.txt để lấy code](file:///F:/temp-google-sheet-tool/temp-google-sheet-tool/CAC_SCRIPT_TAMPERMONKEY.txt)**

### **Script 1: Tự động hóa đăng nhập Hotmail & Đổi cài đặt bảo mật**
* *Tác dụng:* Tự động điền email, mật khẩu khi login Hotmail. Tự động thêm mail khôi phục mới, tự động điền OTP gửi về mail khôi phục mới, tự động click mở rộng và xóa mail khôi phục cũ, tự động đổi mật khẩu Hotmail mới.

### **Script 2: Tampermonkey Proxy & Scrape Trangcode OTP**
* *Tác dụng:* Tự động cào OTP từ trang `sellallmail.com` (Trangcode) và gửi lên server local khi đăng nhập yêu cầu OTP gửi về mail khôi phục cũ dạng Trangcode.

### **Script 3: Tự động hóa đăng nhập & Đổi mật khẩu Capital One Shopping**
* *Tác dụng:* Tự động đăng nhập vào Capital One Shopping bằng mật khẩu cũ, tự động chuyển sang trang Profile cài đặt, tự động click **Change** mật khẩu, tự động điền mật khẩu cũ + mật khẩu mới để lưu lại.

### **Script 4: Tự động cào OTP Inboxes.com & SMVmail.com (Tác vụ phụ)**
* *Tác dụng:* Tự động cào OTP từ trang hòm thư phụ `inboxes.com` hoặc `smvmail.com` khi tab này được mở song song và gửi lên server local để điền tự động.

### **Bổ sung quan trọng: Giải Captcha tự động**
Để tránh bị kẹt khi đăng nhập do dính Captcha liên tục trên Capital One, hãy cài đặt thêm tiện ích giải captcha tự động **Buster: Captcha Solver for Humans** trên trình duyệt Chrome:
* **Link tải tiện ích:** [Tải Buster Captcha Solver từ Chrome Web Store](https://chromewebstore.google.com/detail/buster-captcha-solver-for/mpbjkejclgfgadiemmefgebjfooflfjl)
* > [!IMPORTANT]
  > Sau khi cài đặt, bạn **bắt buộc phải vào trang quản lý Tiện ích của Chrome (gõ `chrome://extensions` trên thanh địa chỉ)** -> Tìm tiện ích **Buster** -> Bấm **Chi tiết (Details)** -> Gạt bật công tắc **`Cho phép ở chế độ ẩn danh (Allow in incognito)`**. 
  > *(Nếu không bật, extension Buster sẽ không thể chạy khi tool mở tab ẩn danh để giải captcha tự động!).*

---

## 🛠 4. QUY TRÌNH SỬ DỤNG TOOL THỰC TẾ

1. **Kết nối Google Sheet:**
   * Dán đường link Google Sheet của bạn vào ô **Google Sheet URL** trên giao diện Tool local (`http://localhost:3000`).
   * Chọn Tên trang tính (ví dụ: `Sheet1`) và chọn chế độ làm việc (chọn **Capital**).
   * Nhấn **Kết nối Sheet**.

2. **Chạy tài khoản (Song song siêu tốc):**
   * Đối với dòng tài khoản cần làm, bạn nhấn nút **`✨ Tạo thông tin mới`** (để Tool tự sinh email khôi phục mới và tự sinh mật khẩu mới cho Hotmail & Capital).
   * Sau khi tạo xong thông tin, bạn nhấn nút **`🔑 Vào Hotmail`** màu xanh.
   * **Hành động tự động của Tool:**
     1. Tool sẽ tự động mở **1 cửa sổ ẩn danh duy nhất** chứa song song các tab: **Tab Hotmail**, **Tab Capital One**, **Tab Hòm thư Trangcode cũ** (nếu có), và **Tab Hòm thư mới Fivermail/SMVmail** (để lấy OTP).
     2. **Script 4** chạy trên tab hòm thư mới sẽ tự động lấy OTP gửi về và đẩy lên server local.
     3. **Script 1** chạy bên tab Hotmail tự động lấy OTP từ server local về điền vào trang đăng ký bảo mật của Microsoft.
     4. **Script 3** chạy bên tab Capital One tự động đăng nhập và đổi mật khẩu mới.
     5. Mọi thứ diễn ra song song và hoàn toàn tự động giúp tăng tốc độ làm việc lên gấp 2 lần!

3. **Lưu dữ liệu:**
   * Sau khi cả 2 bên Hotmail và Capital đã đổi mật khẩu và đổi thông tin thành công, bạn quay lại giao diện Tool local bấm nút **`✅ Hoàn thành & Lưu`** để ghi đè toàn bộ thông tin mới lên Google Sheet.

4. **Đánh dấu tài khoản lỗi:**
   * Nếu tài khoản bị sai mật khẩu ngay từ đầu, bạn chỉ cần bấm nút **`❌ Sai MK`** màu đỏ bên cạnh nút Vào Hotmail.
   * Tool sẽ tự động **tô màu đỏ pastel cả dòng đó** trên Google Sheet của bạn và ghi chữ **`SAI MẬT KHẨU`** để dễ lọc lại sau này.
