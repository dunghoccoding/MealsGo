# Hướng Dẫn Chạy Dự Án MealsGo Local

Tài liệu này hướng dẫn các bước cần thiết để cài đặt và chạy dự án **MealsGo** (Đặc Sản Việt Nam) trên máy tính cá nhân của bạn.

---

## 🛠 Yêu Cầu Hệ Thống (Prerequisites)

Trước khi bắt đầu, hãy đảm bảo máy bạn đã cài đặt các công cụ sau:
- **Java 21 SDK** (Ví dụ: OpenJDK 21)
- **Node.js** (Phiên bản LTS mới nhất - 18.x trở lên)
- **MySQL Server** (Phiên bản 8.0 trở lên)
- **Maven** (Để build backend)
- **Git**

---

## 1. Thiết Lập Cơ Sở Dữ Liệu (MySQL)

1. Mở MySQL Workbench hoặc Command Line.
2. Tạo một database mới tên là `dacsan_db`:
   ```sql
   CREATE DATABASE dacsan_db;
   ```
3. (Tùy chọn) Kiểm tra cấu hình trong file `backend/src/main/resources/application-dev.yml`:
   - Mặc định sử dụng user: `root`
   - Password: ` ` (Để trống)
   - Nếu bạn dùng user khác, hãy cập nhật file này.

---

## 2. Chạy Backend (Spring Boot)

1. Mở terminal và di chuyển vào thư mục `backend`:
   ```bash
   cd backend
   ```
2. Cài đặt các dependencies và build dự án:
   ```bash
   mvn clean install
   ```
3. Chạy ứng dụng với profile `dev`:
   ```bash
   mvn spring-boot:run -Dspring-boot.run.profiles=dev
   ```
   *Backend sẽ khởi chạy tại: `http://localhost:8080`*

4. **Kiểm tra API:** Bạn có thể xem tài liệu API (Swagger UI) tại:
   `http://localhost:8080/swagger-ui.html`

---

## 3. Chạy Frontend (React + Vite)

1. Mở một cửa sổ terminal mới và di chuyển vào thư mục `frontend`:
   ```bash
   cd frontend
   ```
2. Cài đặt các gói npm:
   ```bash
   npm install
   ```
3. Khởi động môi trường phát triển:
   ```bash
   npm run dev
   ```
   *Frontend sẽ khởi chạy tại: `http://localhost:3000`*

---

## 📝 Thông Tin Quan Trọng

- **Tính năng Upload ảnh:** Hiện tại dự án đang sử dụng lưu trữ cục bộ (local storage) thay vì Cloudinary. Các ảnh tải lên sẽ được lưu vào thư mục `backend/uploads`.
- **Dữ liệu mẫu:** Hệ thống sử dụng **Flyway** để tự động quản lý version database. Khi chạy backend lần đầu, các bảng sẽ tự động được tạo.

### Tài khoản đăng nhập mặc định (nếu có dữ liệu mẫu):
| Vai trò | Email / Username | Mật khẩu |
| :--- | :--- | :--- |
| Admin | admin@gmail.com | 123456 |
| Vendor | vendor@gmail.com | 123456 |
| Customer | customer@gmail.com | 123456 |
*(Lưu ý: Nếu chưa có dữ liệu, hãy sử dụng tính năng Đăng ký trên giao diện)*

---

## 🆘 Troubleshooting

- **Lỗi cổng 8080 hoặc 3000 bị chiếm:** Hãy kiểm tra xem có ứng dụng nào khác đang chạy trên các cổng này không.
- **Lỗi kết nối Database:** Kiểm tra lại MySQL Service đã chạy chưa và thông tin đăng nhập trong `application-dev.yml` có khớp không.
