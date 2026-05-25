# 📋 BÁO CÁO KIẾN TRÚC HỆ THỐNG VÀ CÔNG NGHỆ SỬ DỤNG
## **Dự Án: MealsGo - Nền Tảng Đặt Hàng Thức Ăn Đặc Sản 3 Miền**

---

## **MỤC LỤC**
1. [Tổng Quan Dự Án](#tổng-quan-dự-án)
2. [Mô Hình Kiến Trúc](#mô-hình-kiến-trúc)
3. [Tech Stack Chi Tiết](#tech-stack-chi-tiết)
4. [Cấu Trúc Dự Án](#cấu-trúc-dự-án)
5. [Database Schema](#database-schema)
6. [API Architecture](#api-architecture)
7. [Bảo Mật Hệ Thống](#bảo-mật-hệ-thống)
8. [Real-time Communication](#real-time-communication)
9. [Thanh Toán Online (VNPAY)](#thanh-toán-online-vnpay)
10. [Triển Khai & Deployment](#triển-khai--deployment)

---

## **TỔNG QUAN DỰ ÁN**

### **Định Nghĩa**
MealsGo là một nền tảng thương mại điện tử (E-commerce) toàn diện dành cho việc đặt hàng thức ăn đặc sản 3 miền Việt Nam. Hệ thống kết nối ba thực thể chính: **Người mua (Customer)**, **Chủ cửa hàng (Vendor)**, và **Quản trị viên (Admin)**.

### **Mục Đích & Giải Quyết Vấn Đề**
- **Thương mại điện tử hiệu quả**: Cung cấp nền tảng để khách hàng mua sắm trực tuyến
- **Quản lý thực đơn thông minh**: Chủ cửa hàng quản lý sản phẩm với hỗ trợ biến thể (variants)
- **Thanh toán trực tuyến an toàn**: Tích hợp VNPAY Sandbox cho thanh toán điện tử
- **Truyền thông real-time**: WebSocket đồng bộ trạng thái đơn hàng ngay lập tức
- **Phân quyền chặt chẽ**: RBAC (Role-Based Access Control) bảo vệ dữ liệu

### **Phạm Vi Chức Năng**
| Vai Trò | Chức Năng Chính |
|---------|-----------------|
| **Customer** | Xem danh mục, thêm giỏ hàng, thanh toán, theo dõi đơn hàng real-time |
| **Vendor** | Quản lý thực đơn, cập nhật trạng thái đơn hàng, nhận thông báo |
| **Admin** | Dashboard quản lý, phê duyệt vendor, kiểm duyệt người dùng |

---

## **MÔ HÌNH KIẾN TRÚC**

### **1. Kiến Trúc Tổng Quát (3-Tier Architecture)**

```
┌────────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                              │
│  React 19.2.0 + TypeScript + Redux Toolkit + Tailwind CSS         │
│  (Giao diện người dùng, State Management, Styling)                │
└──────────────────────┬─────────────────────────────────────────────┘
                       │ HTTP REST API + WebSocket (STOMP/SockJS)
                       │
┌──────────────────────▼─────────────────────────────────────────────┐
│                    APPLICATION LAYER                               │
│  Spring Boot 3.1.5 + Spring Web + Spring Security + JWT           │
│  (REST Controllers, Business Logic, Authentication)                │
└──────────────────────┬─────────────────────────────────────────────┘
                       │
┌──────────────────────▼─────────────────────────────────────────────┐
│                    SERVICE LAYER                                   │
│  Service Classes (UserService, OrderService, ProductService...)   │
│  (Xử lý logic nghiệp vụ, tính toán, validation)                   │
└──────────────────────┬─────────────────────────────────────────────┘
                       │
┌──────────────────────▼─────────────────────────────────────────────┐
│                    DATA ACCESS LAYER                               │
│  Spring Data JPA + Hibernate + Repository Pattern                 │
│  (Truy vấn database, ORM mapping)                                  │
└──────────────────────┬─────────────────────────────────────────────┘
                       │ JDBC
┌──────────────────────▼─────────────────────────────────────────────┐
│                    DATABASE LAYER                                  │
│  MySQL 8.0+ (Relational Database)                                 │
│  (Data Persistence - Users, Products, Orders, Transactions)       │
└────────────────────────────────────────────────────────────────────┘
```

### **2. Mô Hình Client-Server**

```
CLIENT (Frontend)                          SERVER (Backend)
┌──────────────────────┐                ┌──────────────────────┐
│  React Application   │                │  Spring Boot API     │
│  - UI Components     │ ──HTTP/REST──> │  - Controllers       │
│  - Redux State       │ <──JSON────    │  - Services          │
│  - WebSocket STOMP   │ <──WebSocket── │  - Repositories      │
│                      │ ────STOMP────> │  - JWT Validation    │
└──────────────────────┘                └──────────────────────┘
                                                  │
                                                  │ SQL
                                        ┌─────────▼──────────┐
                                        │   MySQL Database   │
                                        └────────────────────┘
```

### **3. Mô Hình Event-Driven (Real-time)**

```
User Action (Frontend)
         │
         ▼
┌─────────────────────────────┐
│  WebSocket STOMP Event      │
│  /app/orders/update         │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  Backend Message Handler            │
│  @MessageMapping("/orders/update")  │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────┐
│  Update Database            │
│  & Process Logic            │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  simpMessagingTemplate      │
│  .convertAndSend()          │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  Broadcast to All           │
│  Connected Clients          │
│  /user/queue/notifications │
└─────────────────────────────┘
```

---

## **TECH STACK CHI TIẾT**

### **A. BACKEND STACK**

| Layer | Công Nghệ | Phiên Bản | Mục Đích |
|-------|-----------|---------|---------|
| **Runtime** | Java | 21 | JVM runtime language |
| **Framework** | Spring Boot | 3.1.5 | Main application framework |
| **Web** | Spring Web MVC | - | REST API endpoints, @RestController |
| **Database** | Spring Data JPA | - | ORM (Object-Relational Mapping) |
| **ORM** | Hibernate | - | Java object ↔ Database mapping |
| **JDBC Driver** | MySQL Connector/J | Latest | MySQL database connection |
| **Security** | Spring Security | - | Authentication & Authorization |
| **Token Auth** | JJWT (Java JWT) | 0.12.3 | JWT token generation & validation |
| **Password Hash** | BCrypt | - | Secure password encryption |
| **Real-time** | Spring WebSocket | - | WebSocket support |
| **Protocol** | STOMP + SockJS | 7.3.0 | Messaging protocol + fallback |
| **Validation** | Hibernate Validator | - | Bean validation (@Valid, @NotNull) |
| **API Doc** | Swagger/OpenAPI | 3.0 (2.3.0) | Auto-generated API documentation |
| **Image Upload** | Cloudinary | 1.36.0 | Cloud-based image storage |
| **DB Migration** | Flyway | Latest | Schema versioning & migration |
| **Reduce Boilerplate** | Lombok | Latest | @Getter, @Setter, @Builder |
| **Health Check** | Spring Actuator | - | /health, /info endpoints |
| **Build Tool** | Maven | 3.8+ | Dependency management |

### **Backend 주요 Dependencies**

```xml
<!-- Core Dependencies -->
spring-boot-starter-web (REST API)
spring-boot-starter-data-jpa (Database)
spring-boot-starter-security (Auth)
spring-boot-starter-websocket (Real-time)
spring-boot-starter-validation (Validation)

<!-- JWT & Security -->
jjwt-api, jjwt-impl, jjwt-jackson (JWT)

<!-- Database -->
mysql-connector-j (MySQL driver)
flyway-core, flyway-mysql (Migrations)

<!-- Image & Documentation -->
cloudinary-http44 (Image storage)
springdoc-openapi-starter-webmvc-ui (Swagger)

<!-- Testing -->
spring-boot-starter-test
spring-security-test
```

### **B. FRONTEND STACK**

| Layer | Công Nghệ | Phiên Bản | Mục Đích |
|-------|-----------|---------|---------|
| **Framework** | React | 19.2.0 | UI library, component-based |
| **Language** | TypeScript | 5.9 | Type-safe JavaScript |
| **Build Tool** | Vite | 7.3.1 | Fast build & dev server |
| **State Management** | Redux Toolkit | 2.11.2 | Global state management |
| **Routing** | React Router | 7.13.0 | Client-side routing |
| **Styling** | Tailwind CSS | 3.4.19 | Utility-first CSS framework |
| **Form Library** | React Hook Form | 7.71.1 | Efficient form state |
| **Form Validation** | Zod | 4.3.6 | TypeScript-first schema validation |
| **Form Resolver** | @hookform/resolvers | 5.2.2 | Form + Zod integration |
| **Real-time** | @stomp/stompjs | 7.3.0 | STOMP protocol client |
| **WebSocket Fallback** | sockjs-client | 1.6.1 | WebSocket fallback |
| **Charts** | Recharts | 3.7.0 | Data visualization |
| **UI Icons** | lucide-react | 0.577.0 | Icon library |
| **Notifications** | sonner | 2.0.7 | Toast notifications |
| **CSS Utilities** | clsx, tailwind-merge | Latest | CSS class management |
| **HTTP Client** | Fetch API | Native | HTTP requests (built-in) |
| **Dev Tool** | ESLint | 9.39.1 | Code quality |
| **TypeScript Compiler** | tsc | 5.9 | TypeScript checking |

### **Frontend 주요 Dependencies**

```json
{
  "dependencies": {
    "react": "^19.2.0",              // UI Framework
    "react-router-dom": "^7.13.0",   // Routing
    "@reduxjs/toolkit": "^2.11.2",   // State management
    "react-hook-form": "^7.71.1",    // Form handling
    "zod": "^4.3.6",                 // Validation
    "tailwindcss": "^3.4.19",        // Styling
    "@stomp/stompjs": "^7.3.0",      // WebSocket STOMP
    "sockjs-client": "^1.6.1",       // WebSocket fallback
    "recharts": "^3.7.0",            // Charts
    "sonner": "^2.0.7"               // Notifications
  }
}
```

### **C. DATABASE STACK**

| Komponen | Spesifikasi |
|----------|-----------|
| **DBMS** | MySQL 8.0+ |
| **Encoding** | UTF-8 (Default) |
| **Normalization** | 3NF (Third Normal Form) |
| **Connection Pool** | HikariCP (Default Spring Boot) |
| **Migration Tool** | Flyway (Versioned migrations) |

### **D. INFRASTRUCTURE & TOOLS**

| Tool | Versi | Fungsi |
|------|-------|--------|
| **Docker** | Latest | Containerization (Optional) |
| **Docker Compose** | Latest | Multi-container orchestration |
| **Git** | Latest | Version control |
| **Postman** | - | API testing (postman_collection.json) |
| **Maven** | 3.8+ | Java dependency management |
| **npm** | Latest | JavaScript dependency management |

---

## **CẤU TRÚC DỰ ÁN**

### **Directory Structure - Backend**

```
backend/
├── src/main/
│   ├── java/com/dacsan/
│   │   ├── DacsanApplication.java           # Main Spring Boot Application
│   │   │
│   │   ├── config/                          # Configuration Classes
│   │   │   ├── SecurityConfig.java          # Spring Security config, JWT config
│   │   │   ├── WebSocketConfig.java         # WebSocket STOMP config
│   │   │   ├── CorsConfig.java              # CORS configuration
│   │   │   └── CloudinaryConfig.java        # Cloudinary integration
│   │   │
│   │   ├── controller/                      # REST API Endpoints
│   │   │   ├── AuthController.java          # Login, Register, Logout
│   │   │   ├── ProductController.java       # GET products, search, filter
│   │   │   ├── CartController.java          # Add to cart, remove, update
│   │   │   ├── OrderController.java         # Create order, list, tracking
│   │   │   ├── VendorController.java        # Vendor dashboard, menu management
│   │   │   ├── AddressController.java       # Manage delivery addresses
│   │   │   ├── AdminController.java         # Admin dashboard, user management
│   │   │   ├── UploadController.java        # Image upload endpoint
│   │   │   └── WebSocketController.java     # Real-time message handling
│   │   │
│   │   ├── service/                         # Business Logic Layer
│   │   │   ├── AuthService.java             # User authentication & registration
│   │   │   ├── ProductService.java          # Product operations
│   │   │   ├── CartService.java             # Shopping cart logic
│   │   │   ├── OrderService.java            # Order processing
│   │   │   ├── VendorService.java           # Vendor operations
│   │   │   ├── AddressService.java          # Address management
│   │   │   ├── UploadService.java           # File upload handling
│   │   │   ├── NotificationService.java     # Send notifications via WebSocket
│   │   │   ├── VNPayService.java            # VNPAY payment integration
│   │   │   └── UserService.java             # User profile management
│   │   │
│   │   ├── repository/                      # Data Access Layer (Spring Data JPA)
│   │   │   ├── UserRepository.java          # @Repository for User entity
│   │   │   ├── ProductRepository.java       # Product queries with JPA
│   │   │   ├── OrderRepository.java         # Order data access
│   │   │   ├── VendorRepository.java        # Vendor data access
│   │   │   ├── CartRepository.java          # Cart operations
│   │   │   ├── CartItemRepository.java      # Cart item queries
│   │   │   ├── VariantGroupRepository.java  # Variant management
│   │   │   ├── VariantRepository.java       # Variant options
│   │   │   └── AddressRepository.java       # Address data access
│   │   │
│   │   ├── entity/                          # JPA Entities (Database Models)
│   │   │   ├── User.java                    # @Entity users (with UserDetails)
│   │   │   ├── Vendor.java                  # @Entity vendors (store info)
│   │   │   ├── Product.java                 # @Entity products (menu items)
│   │   │   ├── ProductImage.java            # @Entity product_images
│   │   │   ├── VariantGroup.java            # @Entity variant_groups
│   │   │   ├── Variant.java                 # @Entity variants (options)
│   │   │   ├── Cart.java                    # @Entity carts
│   │   │   ├── CartItem.java                # @Entity cart_items
│   │   │   ├── Order.java                   # @Entity orders (main order)
│   │   │   ├── SubOrder.java                # @Entity sub_orders (per vendor)
│   │   │   ├── OrderItem.java               # @Entity order_items (line items)
│   │   │   ├── Address.java                 # @Entity addresses
│   │   │   ├── Payment.java                 # @Entity payments (transaction info)
│   │   │   └── Review.java                  # @Entity reviews & ratings
│   │   │
│   │   ├── dto/                             # Data Transfer Objects
│   │   │   ├── AuthRequest.java             # Login request DTO
│   │   │   ├── AuthResponse.java            # Login response + JWT token
│   │   │   ├── ProductDTO.java              # Product response DTO
│   │   │   ├── CartItemDTO.java             # Cart item DTO
│   │   │   ├── OrderDTO.java                # Order response DTO
│   │   │   ├── VendorDTO.java               # Vendor info DTO
│   │   │   ├── UserProfileDTO.java          # User profile DTO
│   │   │   └── PaymentDTO.java              # Payment info DTO
│   │   │
│   │   ├── security/                        # Security & JWT Components
│   │   │   ├── JwtTokenProvider.java        # Generate/validate JWT tokens
│   │   │   ├── JwtAuthenticationFilter.java # @Component servlet filter for JWT
│   │   │   ├── CustomUserDetailsService.java # Load user from database
│   │   │   └── SecurityUtils.java           # Helper functions for security
│   │   │
│   │   ├── exception/                       # Custom Exceptions & Handlers
│   │   │   ├── ResourceNotFoundException.java
│   │   │   ├── InvalidCredentialsException.java
│   │   │   ├── GlobalExceptionHandler.java  # @ControllerAdvice
│   │   │   └── ApiErrorResponse.java        # Error response DTO
│   │   │
│   │   ├── util/                            # Utility Classes
│   │   │   ├── PaginationUtil.java
│   │   │   ├── DateTimeUtil.java
│   │   │   └── ValidationUtil.java
│   │   │
│   │   └── constant/                        # Constants
│   │       ├── RoleConstant.java            # CUSTOMER, VENDOR, ADMIN
│   │       ├── OrderStatus.java             # Order statuses
│   │       ├── RegionConstant.java          # NORTH, CENTRAL, SOUTH
│   │       └── CategoryConstant.java        # Product categories
│   │
│   └── resources/
│       ├── application.yml                  # Main configuration file
│       ├── application-dev.yml              # Dev environment config
│       ├── application-prod.yml             # Production environment config
│       └── db/migration/                    # Flyway SQL migrations
│           ├── V1__init_schema.sql          # Initial database schema
│           ├── V2__seed_data.sql            # Sample data
│           ├── V3__seed_variants.sql        # Sample variants
│           └── V10__fix_password_hash_prefix.sql (Others...)
│
├── pom.xml                                  # Maven POM (dependencies, plugins)
├── postman_collection.json                  # API testing collection
└── websocket_test.html                      # WebSocket testing file
```

### **Directory Structure - Frontend**

```
frontend/
├── src/
│   ├── main.tsx                    # React app entry point
│   ├── App.tsx                     # Main React component
│   ├── App.css                     # Global styles
│   ├── index.css                   # Global CSS
│   │
│   ├── app/                        # Redux store setup
│   │   ├── store.ts                # Redux store configuration
│   │   ├── hooks.ts                # useAppDispatch, useAppSelector
│   │   └── api.ts                  # API base configuration
│   │
│   ├── features/                   # Redux slices & API calls
│   │   ├── auth/
│   │   │   ├── authSlice.ts        # Redux slice (login/logout)
│   │   │   └── authApi.ts          # API calls (login, register)
│   │   ├── products/
│   │   │   ├── productSlice.ts     # Product state management
│   │   │   └── productApi.ts       # Fetch products, search
│   │   ├── cart/
│   │   │   ├── cartSlice.ts        # Cart state
│   │   │   └── cartApi.ts          # Cart API calls
│   │   ├── orders/
│   │   │   ├── orderSlice.ts       # Order state
│   │   │   └── orderApi.ts         # Order operations
│   │   ├── vendors/
│   │   │   ├── vendorSlice.ts      # Vendor state
│   │   │   └── vendorApi.ts        # Vendor API
│   │   ├── addresses/
│   │   │   ├── addressSlice.ts     # Address state
│   │   │   └── addressApi.ts       # Address CRUD
│   │   ├── admin/
│   │   │   ├── adminSlice.ts       # Admin panel state
│   │   │   └── adminApi.ts         # Admin API calls
│   │   └── upload/
│   │       ├── uploadSlice.ts      # Upload state
│   │       └── uploadApi.ts        # Upload endpoint
│   │
│   ├── components/                 # Reusable React components
│   │   ├── common/
│   │   │   ├── NotificationToast.tsx  # Toast notifications (sonner)
│   │   │   ├── Loading.tsx            # Loading spinner
│   │   │   ├── Modal.tsx              # Modal component
│   │   │   └── ErrorBoundary.tsx      # Error handling
│   │   ├── layout/
│   │   │   ├── MainLayout.tsx       # Main layout wrapper
│   │   │   ├── Navbar.tsx           # Navigation bar
│   │   │   └── Footer.tsx           # Footer component
│   │   └── product/
│   │       ├── ProductCard.tsx      # Product card display
│   │       ├── ProductFilter.tsx    # Product filters
│   │       └── ProductGrid.tsx      # Grid of products
│   │
│   ├── pages/                       # Page components (one per route)
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx        # /login
│   │   │   └── RegisterPage.tsx     # /register
│   │   ├── customer/
│   │   │   ├── HomePage.tsx         # / (home)
│   │   │   ├── ProductDetailPage.tsx # /products/:id
│   │   │   ├── CartPage.tsx         # /cart
│   │   │   ├── CheckoutPage.tsx     # /checkout
│   │   │   └── ProfilePage.tsx      # /profile
│   │   ├── vendor/
│   │   │   └── VendorDashboardPage.tsx # /vendor/dashboard
│   │   └── admin/
│   │       └── AdminDashboardPage.tsx  # /admin/dashboard
│   │
│   ├── types/                       # TypeScript types & interfaces
│   │   └── common.ts                # Shared TypeScript interfaces
│   │
│   ├── assets/                      # Static assets (images, SVG)
│   └── ...
│
├── public/                          # Public assets
│   └── images/
├── index.html                       # HTML entry point
├── package.json                     # npm dependencies
├── vite.config.ts                   # Vite build configuration
├── tsconfig.json                    # TypeScript configuration
├── tsconfig.app.json                # App-specific TypeScript config
├── tailwind.config.js               # Tailwind CSS configuration
├── postcss.config.js                # PostCSS configuration
├── eslint.config.js                 # ESLint configuration
└── README.md                        # Project documentation
```

---

## **DATABASE SCHEMA**

### **1. Entity Relationship Diagram (ERD)**

```
┌─────────────────────────────────────────────────────────────────┐
│                          USERS                                  │
├─────────────────────────────────────────────────────────────────┤
│ PK: id (BIGINT)                                                 │
│ • full_name (VARCHAR 255)                                       │
│ • email (VARCHAR 255) - UNIQUE                                  │
│ • password (VARCHAR 255) - BCrypt hashed                        │
│ • phone (VARCHAR 50)                                            │
│ • role (VARCHAR 20) - ENUM: CUSTOMER, VENDOR, ADMIN            │
│ • avatar (TEXT) - Image URL                                    │
│ • active (BOOLEAN)                                              │
│ • created_at (TIMESTAMP)                                        │
│ • updated_at (TIMESTAMP)                                        │
└──────────────┬──────────────────────────────────────────────────┘
               │ 1:1
               │
       ┌───────▼────────┐
       │    VENDORS     │ (Store Info)
       ├────────────────┤
       │ user_id (FK)   │
       │ store_name     │
       │ description    │
       │ region         │ (NORTH, CENTRAL, SOUTH)
       │ address        │
       │ verified       │
       └────────┬───────┘
                │ 1:N
        ┌───────▼─────────────┐
        │    PRODUCTS         │
        ├─────────────────────┤
        │ vendor_id (FK)      │
        │ name                │
        │ base_price          │
        │ category            │ (MAIN_DISH, SIDE, DESSERT...)
        │ region              │
        │ available           │
        │ rating / reviews    │
        │ sold_count          │
        └──────┬──────────────┘
               │ 1:N
       ┌───────▼──────────────┐
       │  PRODUCT_IMAGES      │
       ├──────────────────────┤
       │ product_id (FK)      │
       │ image_url            │
       └──────────────────────┘

        ┌───────────────────────┐
        │   VARIANT_GROUPS      │
        ├───────────────────────┤
        │ product_id (FK)       │
        │ name                  │
        │ is_multi_select       │
        │ is_required           │
        └───────┬───────────────┘
                │ 1:N
        ┌───────▼──────────┐
        │   VARIANTS       │
        ├──────────────────┤
        │ variant_group_id │ (FK)
        │ name             │
        │ price_adjustment │
        │ available        │
        └──────────────────┘


    ┌──────────────────────────────────────────┐
    │         CARTS (Shopping Cart)            │
    ├──────────────────────────────────────────┤
    │ PK: id                                   │
    │ user_id (FK) - UNIQUE                    │
    │ created_at                               │
    └──────────┬───────────────────────────────┘
               │ 1:N
        ┌──────▼──────────────┐
        │   CART_ITEMS        │
        ├─────────────────────┤
        │ cart_id (FK)        │
        │ product_id (FK)     │
        │ quantity            │
        │ selected_variants_json (TEXT - JSON)
        └─────────────────────┘


┌──────────────────────────────────────┐
│         ORDERS (Main Order)          │
├──────────────────────────────────────┤
│ PK: id                               │
│ user_id (FK) - Customer              │
│ total_amount (DECIMAL)               │
│ status - PENDING, CONFIRMED, SHIPPED │
│ delivery_address_id (FK)             │
│ payment_status - UNPAID, PAID        │
│ created_at                           │
└──────────┬──────────────────────────┘
           │ 1:N
    ┌──────▼──────────────────┐
    │   SUB_ORDERS           │ (Per Vendor)
    ├────────────────────────┤
    │ order_id (FK)          │
    │ vendor_id (FK)         │
    │ subtotal_amount        │
    │ status (for vendor)    │
    └──────┬─────────────────┘
           │ 1:N
    ┌──────▼─────────────────┐
    │   ORDER_ITEMS          │
    ├────────────────────────┤
    │ sub_order_id (FK)      │
    │ product_id (FK)        │
    │ quantity               │
    │ unit_price             │
    │ total_price            │
    │ selected_variants      │
    └────────────────────────┘


┌──────────────────────────────────────┐
│      ADDRESSES (Delivery)            │
├──────────────────────────────────────┤
│ PK: id                               │
│ user_id (FK)                         │
│ street_address                       │
│ ward                                 │
│ district                             │
│ province                             │
│ is_default (BOOLEAN)                 │
└──────────────────────────────────────┘


┌──────────────────────────────────────┐
│         PAYMENTS (Transaction)       │
├──────────────────────────────────────┤
│ PK: id                               │
│ order_id (FK)                        │
│ amount                               │
│ payment_method - VNPAY, COD          │
│ transaction_id (VNPAY ref)           │
│ status - SUCCESS, FAILED, PENDING    │
│ created_at                           │
└──────────────────────────────────────┘
```

### **2. Key Database Constraints**

```sql
-- Foreign Key Relationships
ALTER TABLE vendors ADD FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE products ADD FOREIGN KEY (vendor_id) REFERENCES vendors(id);
ALTER TABLE variant_groups ADD FOREIGN KEY (product_id) REFERENCES products(id);
ALTER TABLE variants ADD FOREIGN KEY (variant_group_id) REFERENCES variant_groups(id);
ALTER TABLE cart_items ADD FOREIGN KEY (cart_id) REFERENCES carts(id);
ALTER TABLE orders ADD FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE sub_orders ADD FOREIGN KEY (order_id) REFERENCES orders(id);
ALTER TABLE order_items ADD FOREIGN KEY (sub_order_id) REFERENCES sub_orders(id);

-- Unique Constraints
UNIQUE(users.email)
UNIQUE(vendors.user_id)
UNIQUE(carts.user_id)

-- Check Constraints
CHECK (users.role IN ('CUSTOMER', 'VENDOR', 'ADMIN'))
CHECK (products.category IN ('MAIN_DISH', 'SIDE_DISH', 'DESSERT', 'DRINK', 'SNACK'))
CHECK (vendors.region IN ('NORTH', 'CENTRAL', 'SOUTH'))
```

### **3. Database Indices (Performance Optimization)**

```sql
-- Frequently Queried Columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_vendors_user_id ON vendors(user_id);
CREATE INDEX idx_products_vendor_id ON products(vendor_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_addresses_user_id ON addresses(user_id);
```

### **4. Flyway Migration Strategy**

```
db/migration/
├── V1__init_schema.sql              # 初期スキーマ作成
├── V2__seed_data.sql                # Test users & vendors
├── V3__seed_variants.sql            # Product variants
├── V4__verify_all_vendors.sql       # Update vendor verification
├── V5__add_product_images.sql       # Add image URLs
├── V6__fix_mi_quang_image.sql       # Fix data
├── V7__update_vendor_product_images.sql
├── V8__fix_vendor_product_images.sql
├── V9__fix_password_hash_format.sql
└── V10__fix_password_hash_prefix.sql
```

---

## **API ARCHITECTURE**

### **1. REST Endpoint Overview**

```
┌───────────────────────────────────────────────────────────────────┐
│ Authentication & User Management                                  │
├───────────────────────────────────────────────────────────────────┤
│ POST   /api/auth/register         - User registration             │
│ POST   /api/auth/login            - User login (return JWT token) │
│ POST   /api/auth/logout           - User logout                   │
│ GET    /api/auth/verify           - Verify JWT token              │
│ GET    /api/users/profile         - Get current user profile      │
│ PUT    /api/users/profile         - Update profile                │
│ POST   /api/users/change-password - Change password              │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│ Product Management                                                │
├───────────────────────────────────────────────────────────────────┤
│ GET    /api/products              - List all products with filter │
│ GET    /api/products/:id          - Get product details           │
│ GET    /api/products/search       - Full-text search              │
│ GET    /api/products/category/:cat - Filter by category           │
│ GET    /api/products/vendor/:vendorId - Get vendor's products     │
│ POST   /api/products              - Create product (VENDOR)       │
│ PUT    /api/products/:id          - Update product (VENDOR)       │
│ DELETE /api/products/:id          - Delete product (VENDOR)       │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│ Shopping Cart                                                     │
├───────────────────────────────────────────────────────────────────┤
│ GET    /api/cart                  - Get user's cart               │
│ POST   /api/cart/items            - Add to cart                   │
│ PUT    /api/cart/items/:itemId    - Update quantity               │
│ DELETE /api/cart/items/:itemId    - Remove from cart              │
│ DELETE /api/cart                  - Clear cart                    │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│ Order Management                                                  │
├───────────────────────────────────────────────────────────────────┤
│ POST   /api/orders                - Create order from cart        │
│ GET    /api/orders                - Get user's orders             │
│ GET    /api/orders/:id            - Get order details             │
│ PUT    /api/orders/:id/status     - Update order status           │
│ GET    /api/orders/:id/tracking   - Real-time order tracking      │
│ POST   /api/orders/:id/cancel     - Cancel order                  │
│ PUT    /api/orders/:id/delivery   - Update delivery status        │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│ Payment (VNPAY)                                                   │
├───────────────────────────────────────────────────────────────────┤
│ POST   /api/payments/vnpay        - Create VNPAY payment URL      │
│ GET    /api/payments/vnpay/return - VNPAY callback handler        │
│ GET    /api/payments/status/:orderId - Check payment status       │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│ Vendor Management                                                 │
├───────────────────────────────────────────────────────────────────┤
│ POST   /api/vendors/register      - Register new vendor           │
│ GET    /api/vendors               - List vendors                  │
│ GET    /api/vendors/:id           - Get vendor details            │
│ PUT    /api/vendors/:id           - Update vendor profile         │
│ GET    /api/vendors/:id/analytics - Vendor dashboard analytics    │
│ PUT    /api/vendors/:id/orders    - Update order status (vendor)  │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│ Address Management                                                │
├───────────────────────────────────────────────────────────────────┤
│ GET    /api/addresses             - List user addresses           │
│ POST   /api/addresses             - Add new address               │
│ PUT    /api/addresses/:id         - Update address                │
│ DELETE /api/addresses/:id         - Delete address                │
│ PUT    /api/addresses/:id/default - Set as default                │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│ Admin Dashboard                                                   │
├───────────────────────────────────────────────────────────────────┤
│ GET    /api/admin/dashboard       - Dashboard statistics          │
│ GET    /api/admin/users           - List all users                │
│ GET    /api/admin/vendors         - List all vendors              │
│ PUT    /api/admin/vendors/:id/verify - Approve vendor             │
│ DELETE /api/admin/users/:id       - Ban/delete user               │
│ GET    /api/admin/orders          - All orders list               │
│ GET    /api/admin/payments        - Payment statistics            │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│ File Upload                                                       │
├───────────────────────────────────────────────────────────────────┤
│ POST   /api/upload                - Upload image (multipart/form) │
└───────────────────────────────────────────────────────────────────┘
```

### **2. Request/Response Format**

**Authentication Request:**
```json
POST /api/auth/login
{
  "email": "customer@example.com",
  "password": "password123"
}
```

**Authentication Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "type": "Bearer",
  "expiresIn": 86400000,
  "user": {
    "id": 1,
    "email": "customer@example.com",
    "fullName": "John Doe",
    "role": "CUSTOMER"
  }
}
```

**Product Response:**
```json
GET /api/products/1
{
  "id": 1,
  "name": "Phở Bò Hà Nội",
  "basePrice": 50000,
  "description": "Traditional North Vietnamese beef noodle soup",
  "category": "MAIN_DISH",
  "region": "NORTH",
  "available": true,
  "rating": 4.8,
  "reviewCount": 124,
  "images": ["https://...image1.jpg", "https://...image2.jpg"],
  "variantGroups": [
    {
      "id": 1,
      "name": "Size",
      "isMultiSelect": false,
      "isRequired": true,
      "variants": [
        { "id": 1, "name": "Small", "priceAdjustment": 0 },
        { "id": 2, "name": "Large", "priceAdjustment": 10000 }
      ]
    }
  ],
  "vendor": {
    "id": 5,
    "storeName": "Phở Hà Nội",
    "region": "NORTH"
  }
}
```

**Order Response:**
```json
GET /api/orders/100
{
  "id": 100,
  "userId": 1,
  "totalAmount": 150000,
  "status": "CONFIRMED",
  "paymentStatus": "PAID",
  "deliveryAddress": {
    "street": "123 Main St",
    "district": "District 1",
    "city": "Ho Chi Minh"
  },
  "subOrders": [
    {
      "id": 200,
      "vendorId": 5,
      "vendorName": "Phở Hà Nội",
      "items": [
        {
          "productName": "Phở Bò",
          "quantity": 2,
          "unitPrice": 50000,
          "variants": { "Size": "Large" }
        }
      ],
      "subtotal": 100000,
      "status": "PREPARING"
    }
  ],
  "payment": {
    "method": "VNPAY",
    "transactionId": "vnpay_12345",
    "paidAt": "2026-05-04T10:30:00Z"
  },
  "createdAt": "2026-05-04T10:00:00Z"
}
```

### **3. HTTP Status Codes**

| Status | Meaning | Example |
|--------|---------|---------|
| **200** | OK | Successful GET, PUT, DELETE |
| **201** | Created | Resource created (POST) |
| **400** | Bad Request | Invalid input data |
| **401** | Unauthorized | Missing/invalid JWT token |
| **403** | Forbidden | User doesn't have permission |
| **404** | Not Found | Resource not found |
| **409** | Conflict | Email already exists |
| **500** | Server Error | Unexpected error |

---

## **BẢO MẬT HỆ THỐNG**

### **1. Authentication Flow (JWT)**

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ POST /api/auth/login
       │ { email, password }
       │
       ▼
┌──────────────────────────────────┐
│  Backend - AuthController        │
├──────────────────────────────────┤
│ 1. Find user by email            │
│ 2. BCrypt.matches(password)      │
│ 3. Generate JWT token            │
│ 4. Set token expiration (24hrs)  │
└──────┬───────────────────────────┘
       │ Response + JWT Token
       │
       ▼
┌─────────────────────────────────┐
│   Client (Store Token)          │
│   localStorage/sessionStorage   │
└──────┬──────────────────────────┘
       │ Subsequent Request
       │ Header: "Authorization: Bearer <token>"
       │
       ▼
┌──────────────────────────────────┐
│ JwtAuthenticationFilter          │
├──────────────────────────────────┤
│ 1. Extract token from header     │
│ 2. Validate signature            │
│ 3. Check expiration              │
│ 4. Extract claims (userId)       │
│ 5. Load user from DB             │
│ 6. Set SecurityContext           │
└──────┬───────────────────────────┘
       │ Access Granted/Denied
       │
       ▼
  @RestController
  (Permission Check via @PreAuthorize)
```

### **2. Password Security**

```
User Password Input
       │
       ▼ BCrypt (Cost Factor 12)
┌──────────────────────────┐
│ Hashed Password          │ (e.g., $2a$12$abcdefgh...)
│ Database Storage         │
└──────┬───────────────────┘
       │ Verification
       │ BCrypt.matches(plainPassword, hash)
       │
       ▼ Constant Time Comparison
   Match or No Match
   (Resistant to timing attacks)
```

**Configuration:**
```yaml
# application.yml
app:
  jwt:
    secret: ZGFjc2FuU2VjcmV0S2V5Q2hhbmdlVGhpc0luUHJvZHVjdGlvblBsZWFzZU1ha2VJdFZlcnlMb25nQW5kU2VjdXJl
    expiration: 86400000  # 24 hours in milliseconds
```

### **3. Role-Based Access Control (RBAC)**

```
User Roles:
├── CUSTOMER
│   ├── ✓ Browse products
│   ├── ✓ Manage cart
│   ├── ✓ Create orders
│   ├── ✓ Make payments
│   └── ✓ Track orders
│
├── VENDOR
│   ├── ✓ Manage products (own store)
│   ├── ✓ View orders (own store)
│   ├── ✓ Update order status
│   ├── ✗ View other vendors' data
│   └── ✗ Access admin panel
│
└── ADMIN
    ├── ✓ View all users
    ├── ✓ View all vendors
    ├── ✓ Verify new vendors
    ├── ✓ Ban users/vendors
    ├── ✓ View all orders
    └── ✓ View payment analytics

Enforcement: @PreAuthorize("hasRole('CUSTOMER')")
             @PreAuthorize("hasRole('VENDOR')")
             @PreAuthorize("hasRole('ADMIN')")
```

### **4. CORS Configuration**

```java
// SecurityConfig.java
@Configuration
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.cors().and()
           .csrf().disable()
           .authorizeRequests()
            .antMatchers("/api/auth/**").permitAll()
            .antMatchers("/api/products/**").permitAll()
            .anyRequest().authenticated();
        return http.build();
    }
}
```

### **5. Security Headers**

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
```

### **6. Payment Security (VNPAY)**

```
Payment Flow Security:
1. Generate checksum from order data + secret key
2. Redirect to VNPAY with checksummed payload
3. VNPAY processes payment
4. VNPAY returns to callback URL with response data
5. Backend verifies return checksum
6. Only if checksum valid → Update order status
7. Log all transactions for audit

Checksum Algorithm: HMAC-SHA256
Secret Key: Stored in environment variable (not in code)
```

---

## **REAL-TIME COMMUNICATION**

### **1. WebSocket + STOMP Architecture**

```
Client (Browser)
       │
       ▼ WebSocket Upgrade (HTTP → WS)
┌────────────────────────────────────────┐
│ STOMP Protocol (Messaging Layer)       │
├────────────────────────────────────────┤
│ Fallback: SockJS (HTTP long-polling)   │
└────────┬─────────────────────────────────┘
         │
         ▼ /app/orders/update
    ┌────────────────────────────────────┐
    │ Backend WebSocket Handler          │
    │ @MessageMapping("/orders/update")  │
    └────────┬─────────────────────────────┘
             │
             ▼ Process & Update DB
        ┌────────────────────────────────┐
        │ NotificationService            │
        │ simpMessagingTemplate.convert… │
        └────────┬─────────────────────────┘
                 │
         ┌───────┴────────┐
         │                │
         ▼                ▼
    Broadcast         Direct Queue
    /topic/orders     /user/{userId}/queue/
    (All clients)     (Specific client)
```

### **2. STOMP Message Mapping**

```yaml
# Frontend Subscriptions (Client)
/user/queue/notifications         # Direct messages to user
/topic/orders                     # Broadcast to all connected clients
/topic/order-updates-{orderId}   # Broadcast for specific order

# Backend Endpoints (Server)
/app/orders/update                # Update order status
/app/orders/notify                # Trigger notification
/app/vendor/status-change         # Vendor updates status
```

### **3. Real-time Notification Example**

```typescript
// Frontend (React)
const { stomp, connected } = useStompClient();

useEffect(() => {
  if (connected) {
    // Subscribe to user notifications
    stomp.subscribe('/user/queue/notifications', (message) => {
      const notification = JSON.parse(message.body);
      console.log('Order updated:', notification);
      // Update Redux state
      dispatch(updateOrderStatus(notification));
    });
  }
}, [connected]);

// Send update
const sendUpdate = () => {
  stomp.send('/app/orders/update', {}, JSON.stringify({
    orderId: 100,
    status: 'SHIPPED'
  }));
};
```

```java
// Backend (Spring)
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
    }
}

@Controller
public class OrderWebSocketController {
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @MessageMapping("/orders/update")
    public void updateOrderStatus(OrderUpdateMessage message) {
        // Process update
        orderService.updateStatus(message.getOrderId(), message.getStatus());
        
        // Broadcast to specific user
        messagingTemplate.convertAndSendToUser(
            message.getUserId().toString(),
            "/queue/notifications",
            new NotificationDTO("Order status updated", message.getStatus())
        );
    }
}
```

---

## **THANH TOÁN ONLINE (VNPAY)**

### **1. VNPAY Integration Flow**

```
┌──────────────────┐
│  Customer        │
│  (Checkout Page) │
└────────┬─────────┘
         │ Click "Pay with VNPAY"
         │
         ▼
┌──────────────────────────────────────────┐
│ Frontend                                 │
│ POST /api/payments/vnpay                 │
│ { orderId, amount }                      │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ Backend - PaymentController              │
│ 1. Generate transaction code             │
│ 2. Calculate HMAC checksum               │
│ 3. Create VNPAY payment URL              │
│ 4. Return URL to frontend                │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ Frontend                                 │
│ Redirect to VNPAY payment gateway        │
│ https://sandbox.vnpayment.vn/...         │
└────────┬─────────────────────────────────┘
         │ User enters card info
         │ (Secure form on VNPAY)
         │
         ▼
┌──────────────────────────────────────────┐
│ VNPAY Server                             │
│ Processes payment                        │
│ (Success/Fail/Pending)                   │
└────────┬─────────────────────────────────┘
         │ Redirect back to callback URL
         │ GET /api/payments/vnpay/return?vnp_*
         │
         ▼
┌──────────────────────────────────────────┐
│ Backend - Payment Callback Handler       │
│ 1. Extract response params               │
│ 2. Verify checksum signature             │
│ 3. Check amount matches                  │
│ 4. Update order payment_status           │
│ 5. Trigger WebSocket notification        │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ Frontend (WebSocket)                     │
│ Receives payment confirmation            │
│ Display success/error message            │
│ Redirect to order tracking page          │
└──────────────────────────────────────────┘
```

### **2. VNPAY Configuration**

```yaml
# application.yml
vnpay:
  sandbox-url: https://sandbox.vnpayment.vn/paygate
  tmnCode: ${VNPAY_TMN_CODE}          # Terminal merchant code
  secretKey: ${VNPAY_SECRET_KEY}      # Secret key for checksum
  returnUrl: http://localhost:3000/checkout/result
  notifyUrl: http://localhost:8080/api/payments/vnpay/notify
  timeZone: Asia/Ho_Chi_Minh
  currencyCode: VND
```

### **3. Checksum Verification**

```java
// VNPayService.java
public class VNPayService {
    
    public String generatePaymentUrl(String orderId, Long amount) {
        Map<String, String> vnpParams = new TreeMap<>();
        vnpParams.put("vnp_Version", "2.1.0");
        vnpParams.put("vnp_Command", "pay");
        vnpParams.put("vnp_TmnCode", tmnCode);
        vnpParams.put("vnp_Amount", String.valueOf(amount * 100)); // In VND cents
        vnpParams.put("vnp_CurrCode", "VND");
        vnpParams.put("vnp_TxnRef", orderId);
        vnpParams.put("vnp_OrderInfo", "Payment for order " + orderId);
        vnpParams.put("vnp_OrderType", "other");
        vnpParams.put("vnp_ReturnUrl", returnUrl);
        vnpParams.put("vnp_CreateDate", getCurrentDateTime());
        
        // Calculate checksum
        String queryString = buildQueryString(vnpParams);
        String hash = hmacSHA512(secretKey, queryString);
        vnpParams.put("vnp_SecureHash", hash);
        
        return vnpayUrl + "?" + buildQueryString(vnpParams);
    }
    
    public boolean verifyReturnChecksum(Map<String, String> vnpParams) {
        String vnpSecureHash = vnpParams.get("vnp_SecureHash");
        vnpParams.remove("vnp_SecureHash");
        
        String queryString = buildQueryString(vnpParams);
        String calculatedHash = hmacSHA512(secretKey, queryString);
        
        // Constant time comparison (prevent timing attack)
        return MessageDigest.isEqual(
            vnpSecureHash.getBytes(), 
            calculatedHash.getBytes()
        );
    }
}
```

### **4. Payment Status Handling**

```
VNPAY Response Codes:
00 - Transaction success
01 - Transaction failed
02 - Transaction pending
...

Order Payment Status Transitions:
UNPAID
  ├─ PAID (payment success)
  ├─ FAILED (payment failed)
  └─ PENDING (awaiting confirmation)

Order Status Transitions:
PENDING
  ├─ CONFIRMED (payment verified)
  ├─ PREPARING (vendor preparing)
  ├─ SHIPPING (delivery in progress)
  ├─ DELIVERED (completed)
  └─ CANCELLED (order cancelled)
```

---

## **TRIỂN KHAI & DEPLOYMENT**

### **1. Local Development Setup**

```bash
# Backend Setup
cd backend
mvn clean install
mvn spring-boot:run -Dspring-boot.run.profiles=dev
# Server runs on http://localhost:8080

# Frontend Setup
cd frontend
npm install
npm run dev
# Client runs on http://localhost:3000
# Vite proxy: /api → http://localhost:8080
```

### **2. Docker Deployment**

```yaml
# docker-compose.yml
version: '3.8'

services:
  # MySQL Database
  mysql:
    image: mysql:8.0
    container_name: mealsgo-db
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: mealsgo_db
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - mealsgo-network

  # Backend Service
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: mealsgo-backend
    environment:
      DATABASE_URL: jdbc:mysql://mysql:3306/mealsgo_db
      JWT_SECRET: ${JWT_SECRET}
      VNPAY_SECRET_KEY: ${VNPAY_SECRET_KEY}
    ports:
      - "8080:8080"
    depends_on:
      - mysql
    networks:
      - mealsgo-network

  # Frontend Service
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: mealsgo-frontend
    ports:
      - "3000:3000"
    networks:
      - mealsgo-network

volumes:
  mysql_data:

networks:
  mealsgo-network:
    driver: bridge
```

### **3. Production Configuration**

```yaml
# application-prod.yml
spring:
  datasource:
    url: ${DATABASE_URL}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000
  
  jpa:
    hibernate:
      ddl-auto: validate  # 不自动修改数据库
    properties:
      hibernate:
        format_sql: false
        use_sql_comments: false

server:
  port: 8080
  servlet:
    context-path: /api
  ssl:
    enabled: true
    key-store: ${KEY_STORE_PATH}
    key-store-password: ${KEY_STORE_PASSWORD}

logging:
  level:
    ROOT: WARN
    com.dacsan: INFO
  file:
    name: logs/application.log
```

### **4. Environment Variables**

```bash
# .env file
DATABASE_URL=jdbc:mysql://mysql-server:3306/mealsgo_db
DB_USERNAME=admin
DB_PASSWORD=secure_password_here

JWT_SECRET=your-very-long-secure-secret-key-min-256-characters

VNPAY_TMN_CODE=sandbox_merchant_code
VNPAY_SECRET_KEY=sandbox_secret_key

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### **5. CI/CD Pipeline (Example with GitHub Actions)**

```yaml
# .github/workflows/deploy.yml
name: Deploy MealsGo

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Build Backend
      run: |
        cd backend
        mvn clean package -DskipTests
    
    - name: Build Frontend
      run: |
        cd frontend
        npm install
        npm run build
    
    - name: Push to Docker Registry
      run: docker push myregistry/mealsgo:latest
    
    - name: Deploy to Server
      run: |
        ssh deploy@server "cd /app && docker-compose up -d"
```

### **6. Performance Optimization**

```
Frontend:
- Code splitting with React Router
- Lazy loading components
- Image optimization
- Caching with service workers

Backend:
- Database query optimization with indices
- Caching frequently accessed data (Redis optional)
- Connection pooling (HikariCP)
- Gzip compression
- Pagination for large result sets

Database:
- Index on frequently queried columns
- Archive old orders (older than 1 year)
- Query optimization with EXPLAIN PLAN
```

### **7. Monitoring & Logging**

```
Backend Monitoring:
- Spring Actuator endpoints (/health, /metrics)
- Application logs (DEBUG in dev, INFO in prod)
- Error tracking (Sentry optional)
- Database performance monitoring

Frontend Monitoring:
- Google Analytics
- Error logging (Sentry optional)
- Performance metrics (Web Vitals)
- User behavior tracking
```

---

## **TÓMLƯỚI CẤU TRÚC DỰ ÁN**

```
┌─────────────────────────────────────────────────────────────┐
│              MEALSGO SYSTEM ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐           ┌─────────────────┐           │
│  │   FRONTEND   │           │  BACKEND (Java) │           │
│  │  (React+TS)  │◄─────────►│ (Spring Boot)   │           │
│  │ • Redux      │ HTTP REST │ • JWT Auth      │           │
│  │ • Tailwind   │ WebSocket │ • REST API      │           │
│  │ • Vite       │           │ • Services      │           │
│  └──────────────┘           └────────┬────────┘           │
│                                      │                    │
│                                      ▼                    │
│                          ┌──────────────────┐             │
│                          │   MYSQL 8.0+     │             │
│                          │  • Users         │             │
│                          │  • Products      │             │
│                          │  • Orders        │             │
│                          │  • Payments      │             │
│                          │  • 3NF Schema    │             │
│                          └──────────────────┘             │
│                                                             │
│  Integration Services:                                    │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐     │
│  │   VNPAY      │  │ Cloudinary  │  │   Email      │     │
│  │  Payment     │  │   Image     │  │ Notification │     │
│  │  Gateway     │  │   Storage   │  │   Service    │     │
│  └──────────────┘  └─────────────┘  └──────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## **KẾT LUẬN**

MealsGo là một hệ thống thương mại điện tử **toàn diện, hiện đại** với:

✅ **Kiến trúc chắc chắn**: Layered Architecture, tách biệt rõ ràng giữa các lớp
✅ **Bảo mật toàn diện**: JWT authentication, BCrypt hashing, RBAC
✅ **Real-time communication**: WebSocket/STOMP cho truyền thông tức thì
✅ **Thanh toán trực tuyến**: Tích hợp VNPAY với verification an toàn
✅ **Scalability**: MySQL database chuẩn hóa, indexed queries
✅ **Developer-friendly**: REST API, Swagger documentation, Type-safe (TypeScript)
✅ **Production-ready**: Docker deployment, env configuration, monitoring

Dự án là một mẫu hoàn hảo cho **enterprise-level e-commerce application** sử dụng **Java Spring Boot + React** stack!

---

*Báo cáo này được cập nhật vào ngày 4 tháng 5 năm 2026*
*Phiên bản dự án: MealsGo v1.0.0*
