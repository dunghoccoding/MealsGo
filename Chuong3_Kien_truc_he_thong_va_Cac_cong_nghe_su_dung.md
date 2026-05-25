3. KIẾN TRÚC HỆ THỐNG VÀ CÁC CÔNG NGHỆ SỬ DỤNG
3.1. Kiến trúc hệ thống
3.1.1. Tổng quan kiến trúc
Hệ thống MealsGo được xây dựng theo mô hình kiến trúc Client – Server kết hợp với kiến trúc 3-Tier Architecture (3 lớp) nhằm đảm bảo tính mở rộng, dễ bảo trì và hiệu năng cao.
Cụ thể, hệ thống được chia thành các lớp chính:
Presentation Layer (Frontend): chịu trách nhiệm hiển thị giao diện và tương tác với người dùng.
Application Layer (Backend): xử lý logic nghiệp vụ, xác thực và cung cấp API.
Data Layer (Database): lưu trữ và quản lý dữ liệu.
Luồng hoạt động tổng quát của hệ thống như sau:
Người dùng thao tác trên giao diện web.
Frontend gửi request đến Backend thông qua HTTP REST API hoặc WebSocket.
Backend xử lý logic, truy vấn cơ sở dữ liệu.
Kết quả được trả về dưới dạng JSON cho Frontend hiển thị.
Ngoài ra, hệ thống còn áp dụng mô hình Event-driven (hướng sự kiện) thông qua WebSocket để hỗ trợ các chức năng thời gian thực như cập nhật trạng thái đơn hàng.

3.1.2. Kiến trúc phân lớp (Layered Architecture)

Hệ thống backend được thiết kế theo mô hình phân lớp gồm các thành phần:
Controller Layer
 Tiếp nhận request từ client, định nghĩa các API endpoint.
Service Layer
 Xử lý logic nghiệp vụ như quản lý đơn hàng, sản phẩm, người dùng.
Repository Layer
 Thực hiện truy vấn cơ sở dữ liệu thông qua JPA.
Entity Layer
 Định nghĩa các đối tượng ánh xạ với bảng trong cơ sở dữ liệu.
Cách phân chia này giúp:
Tách biệt rõ ràng trách nhiệm từng phần
Dễ kiểm thử và mở rộng
Giảm sự phụ thuộc giữa các module

3.1.3. Kiến trúc Client – Server

Hệ thống sử dụng mô hình Client – Server, Client là các máy tính truy cập để sử dụng dịch vụ (còn gọi là Host) và có khả năng nhận thông tin cụ thể từ nhà cung cấp dịch vụ (Server).
Client (Frontend):
Xây dựng bằng React
Giao tiếp với server qua REST API và WebSocket
Server (Backend):
Xây dựng bằng Spring Boot
Xử lý request và trả về dữ liệu JSON
Việc sử dụng mô hình này giúp:
Tách biệt giao diện và logic xử lý
Cho phép phát triển độc lập frontend và backend
Dễ dàng tích hợp với các nền tảng khác (mobile, API bên thứ 3)
Hệ thống website được xây dựng theo mô hình Client – Server. 
3.1.4. Giao tiếp thời gian thực (Real-time)
Để đáp ứng yêu cầu cập nhật trạng thái đơn hàng ngay lập tức, hệ thống sử dụng:
WebSocket kết hợp STOMP protocol
Cơ chế publish/subscribe
Luồng xử lý:
Client gửi event lên server
Server xử lý và cập nhật dữ liệu
Server broadcast thông tin đến các client liên quan
Ứng dụng:
Cập nhật trạng thái đơn hàng
Thông báo cho người dùng và vendor

3.2. Các công nghệ sử dụng
3.2.1. Công nghệ Backend
Hệ thống sử dụng Spring Boot làm framework chính để phát triển backend.
Các thành phần chính:
Spring Web MVC: xây dựng RESTful API
Spring Data JPA + Hibernate: ánh xạ đối tượng và truy vấn database
Spring Security: xác thực và phân quyền
JWT (JSON Web Token): quản lý phiên đăng nhập
BCrypt: mã hóa mật khẩu
Spring WebSocket: hỗ trợ real-time
Ưu điểm:
Phát triển nhanh, cấu hình đơn giản
Tích hợp sẵn nhiều module mạnh
Dễ mở rộng và bảo trì

3.2.2. Công nghệ Frontend
Frontend được xây dựng bằng ReactJS kết hợp TypeScript.
Các công nghệ chính:
React: xây dựng UI theo component
TypeScript: tăng tính an toàn kiểu dữ liệu
Redux Toolkit: quản lý state toàn cục
React Router: điều hướng trang
Tailwind CSS: thiết kế giao diện nhanh
Ưu điểm:
Hiệu suất cao nhờ Virtual DOM
Dễ tái sử dụng component
Trải nghiệm người dùng tốt

3.2.3. Cơ sở dữ liệu
Hệ thống sử dụng MySQL làm hệ quản trị cơ sở dữ liệu.
Đặc điểm:
Cơ sở dữ liệu quan hệ
Thiết kế chuẩn hóa (3NF)
Hỗ trợ transaction đảm bảo toàn vẹn dữ liệu
Ngoài ra:
Flyway được sử dụng để quản lý migration database
HikariCP dùng để tối ưu connection pool

3.2.4. Công nghệ bảo mật
Hệ thống áp dụng nhiều cơ chế bảo mật:
JWT Authentication: xác thực người dùng
RBAC (Role-Based Access Control): phân quyền theo vai trò (Admin, Vendor, Customer)
BCrypt: mã hóa mật khẩu
Spring Security: bảo vệ API
Lợi ích:
Ngăn chặn truy cập trái phép
Bảo vệ dữ liệu người dùng
Đảm bảo an toàn hệ thống

3.2.5. Giao tiếp và API
Hệ thống sử dụng:
RESTful API: giao tiếp chính giữa client và server
JSON: định dạng dữ liệu
Swagger/OpenAPI: tài liệu API
Ưu điểm:
Dễ tích hợp
Chuẩn hóa
Dễ test bằng Postman

3.2.6. Công nghệ thời gian thực
Để hỗ trợ real-time, hệ thống sử dụng:
WebSocket
STOMP + SockJS
Chức năng:
Đồng bộ trạng thái đơn hàng
Gửi thông báo tức thời

3.2.7. Thanh toán trực tuyến
Hệ thống tích hợp:
VNPAY Sandbox
Chức năng:
Thanh toán online
Xử lý giao dịch
Lưu thông tin payment

3.2.8. Các công cụ hỗ trợ
Một số công cụ được sử dụng:
Maven: quản lý dependency backend
npm/Vite: build frontend
Docker (tùy chọn): triển khai container
Postman: test API
Git: quản lý phiên bản
