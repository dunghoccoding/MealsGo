# 🍔 MealsGo - Mang hương vị ba miền về căn bếp của bạn 

![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3-brightgreen?logo=springboot)
![React](https://img.shields.io/badge/React-18-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?logo=typescript)
![MySQL](https://img.shields.io/badge/MySQL-8.0-orange?logo=mysql)
![Docker](https://img.shields.io/badge/Docker-Enabled-blue?logo=docker)
![WebSocket](https://img.shields.io/badge/Real--time-WebSocket-red)

**MealsGo** là một hệ sinh thái thương mại điện tử khép kín kết nối **Người mua**, **Chủ cửa hàng** và **Quản trị viên**. Dự án được thiết kế với tư duy hệ thống cao, giải quyết bài toán đồng bộ dữ liệu thời gian thực và quản lý luồng giao dịch phức tạp một cách mượt mà.

---

## 🚀 Điểm Sáng Kỹ Thuật (Technical Highlights)

Dự án không chỉ dừng lại ở các thao tác CRUD cơ bản mà tập trung giải quyết các bài toán thực tế của một hệ thống có tính đồng thời:

* **Giao tiếp Real-time:** Tích hợp WebSockets (STOMP/SockJS) để đồng bộ trạng thái đơn hàng ngay lập tức giữa bếp của nhà hàng và thiết bị của khách hàng mà không cần tải lại trang.
* **Thanh toán trực tuyến:** Triển khai luồng thanh toán qua cổng **VNPAY Sandbox**, xử lý an toàn các callback và xác thực chữ ký (checksum) để đảm bảo tính toàn vẹn của giao dịch.
* **Bảo mật toàn diện:** * Áp dụng cơ chế xác thực phi trạng thái (Stateless Authentication) với **JWT** kết hợp Spring Security. 
  * Mật khẩu được băm bằng thuật toán **BCrypt** độ an toàn cao.
  * Ngăn chặn triệt để SQL Injection thông qua Parameterized Queries của Spring Data JPA.

---

## 🎯 Hệ Thống Phân Quyền (RBAC)

Hệ thống được thiết kế chặt chẽ với 3 vai trò biệt lập, đảm bảo bảo mật và ranh giới quyền hạn rõ ràng:

### 1. 🙋‍♂️ Người Mua (Customer)
* **Trải nghiệm mua sắm:** Tìm kiếm, lọc món ăn thông minh theo danh mục và đánh giá.
* **Theo dõi đơn hàng:** Quản lý giỏ hàng và theo dõi hành trình đơn hàng theo thời gian thực (Real-time tracking).
* **Thanh toán:** Tùy chọn thanh toán linh hoạt qua VNPAY hoặc COD.

### 2. 🏪 Chủ Cửa Hàng (Store Owner)
* **Quản lý thực đơn:** Thêm, sửa, xóa món ăn, cập nhật tình trạng món (hết/còn).
* **Live Order Board:** Bảng điều khiển nhận đơn và đẩy trạng thái (Đang chuẩn bị -> Đang giao -> Hoàn thành) bắn thông báo trực tiếp về máy khách hàng.

### 3. 🛡️ Quản Trị Viên (System Admin)
* **Master Control:** Giám sát toàn bộ hoạt động, luồng tiền và người dùng trên nền tảng.
* **Kiểm duyệt:** Phê duyệt yêu cầu mở cửa hàng mới, đình chỉ các tài khoản/cửa hàng vi phạm chính sách hoạt động.

---

## 💻 Tech Stack & Kiến Trúc Dữ Liệu

> Hệ thống được xây dựng trên nguyên tắc **Layered Architecture**, tách biệt rõ ràng giữa logic nghiệp vụ, bảo mật và truy xuất dữ liệu.

* **Core Backend:** Java 21 + Spring Boot 3.3.
* **Frontend Client:** React.js kết hợp Vite và **TypeScript** giúp bắt lỗi chặt chẽ từ lúc code, tăng tính ổn định cho UI.
* **Database:** **MySQL** với Database Schema được chuẩn hóa (3NF) để tối ưu hóa truy vấn phức tạp khi JOIN dữ liệu giữa User, Order, Store và Payment.
* **Giao diện:** Tailwind CSS mang lại trải nghiệm UI/UX nhất quán và responsive.

---

## ⚙️ Hướng Dẫn Khởi Chạy (Local & Docker)

*Yêu cầu môi trường: Java 21, MySQL 8.0+ hoặc Docker.*

### Cách 1: Chạy thủ công (Manual Setup)

**1. Khởi tạo Database:**
* Tạo schema `mealsgo_db` trong MySQL.
* Cập nhật thông tin credentials tại `backend/src/main/resources/application.properties`.

**2. Đánh thức Backend:**
```bash
cd backend
./mvnw clean install
./mvnw spring-boot:run

```
**3. Đánh thức Frontend:**
```bash
cd frontend
npm install
npm run dev
```
## Cách 2: Chạy bằng Docker (Khuyên dùng)
Nếu máy bạn đã cài Docker và muốn triển khai môi trường nhất quán, độc lập:
```bash
# Build và chạy toàn bộ cụm Backend, Frontend và MySQL DB
docker-compose up -d --build
```
