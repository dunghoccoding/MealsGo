# Đặc Sản Việt Nam - Backend

Backend cho hệ thống đặt món ăn đặc sản Việt Nam 3 miền.

## 🛠️ Tech Stack

- **Spring Boot**: 3.2.0
- **Java**: 21
- **Database**: MySQL
- **ORM**: Spring Data JPA + Hibernate
- **Security**: Spring Security + JWT (JJWT 0.12.3)
- **Real-time**: Spring WebSocket (SockJS + STOMP)
- **Migrations**: Flyway
- **Documentation**: Swagger/OpenAPI 3.0
- **Image Upload**: Cloudinary
- **Build Tool**: Maven

## 📁 Project Structure

```
backend/
├── src/main/java/com/dacsan/
│   ├── DacsanApplication.java          # Main application
│   ├── entity/                          # JPA Entities
│   │   ├── User.java                   # User + UserDetails
│   │   ├── Vendor.java                 # Vendor info
│   │   ├── Product.java                # Product
│   │   ├── VariantGroup.java           # ⭐ Multi-select support
│   │   ├── Variant.java                # Variant options
│   │   ├── Order.java                  # Main order
│   │   ├── SubOrder.java               # ⭐ Per-vendor orders
│   │   ├── OrderItem.java              # Order line items
│   │   ├── Cart.java                   # Shopping cart
│   │   ├── CartItem.java               # Cart items
│   │   └── Address.java                # Delivery addresses
│   ├── repository/                      # Spring Data Repositories
│   ├── service/                         # Business logic
│   ├── controller/                      # REST Controllers
│   ├── dto/                            # DTOs (request/response)
│   ├── security/                        # JWT + Security config
│   ├── config/                          # Configuration classes
│   ├── exception/                       # Exception handling
│   └── util/                           # Utilities
├── src/main/resources/
│   ├── application.yml                  # Main config
│   ├── application-dev.yml              # Dev config
│   ├── application-prod.yml             # Production config
│   └── db/migration/                    # Flyway migrations
└── pom.xml
```

## 🚀 Getting Started

### Prerequisites

- Java 21 (or Java 17)
- Maven 3.8+
- PostgreSQL 15+

### 1. Setup Database

```bash
# Create database
createdb dacsan_db

# Or using psql
psql -U postgres
CREATE DATABASE dacsan_db;
```

### 2. Configure Application

Update `src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/dacsan_db
    username: your_username
    password: your_password
```

### 3. Run Application

```bash
# Install dependencies
mvn clean install

# Run with dev profile
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

Application will start on `http://localhost:8080`

### 4. API Documentation

Swagger UI: `http://localhost:8080/swagger-ui.html`

## 📊 Database Schema Highlights

### Multi-Vendor Order Splitting ⭐

```
Order (Main order with delivery info)
  └── SubOrder (One per vendor)
        └── OrderItem (Products from that vendor)
```

**Example:**
- Cart has: Phở Bò (Vendor A) + Bánh Xèo (Vendor B)
- Checkout creates:
  - 1 Order: `ORD-20260209-00001`
  - 2 SubOrders: `ORD-20260209-00001-A`, `ORD-20260209-00001-B`

### Product Variants ⭐

```
Product
  └── VariantGroup (e.g., "Size")
        ├── isMultiSelect: false → Radio button
        ├── isRequired: true
        └── Variant[]
              ├── "Nhỏ" (+0đ)
              ├── "Vừa" (+5000đ)
              └── "Lớn" (+10000đ)
              
Product
  └── VariantGroup (e.g., "Topping")
        ├── isMultiSelect: true → Checkbox
        ├── isRequired: false
        └── Variant[]
              ├── "Thêm trứng" (+5000đ)
              ├── "Thêm chả" (+8000đ)
              └── "Thêm hành" (+2000đ)
```

## 🔐 Authentication

JWT-based authentication with 3 roles:
- `CUSTOMER`: Browse and order food
- `VENDOR`: Manage products and receive orders
- `ADMIN`: System administration

**Endpoints:**
- `POST /api/auth/register`
- `POST /api/auth/login` → Returns JWT token
- `GET /api/auth/me` → Get current user (requires JWT)

## 📦 Key Features

- ✅ Multi-vendor marketplace
- ✅ Product variants (Size, Toppings, Customization)
- ✅ Order splitting by vendor (SubOrders)
- ✅ Real-time notifications (WebSocket)
- ✅ Image upload (Cloudinary)
- ✅ Database migrations (Flyway)
- ✅ API documentation (Swagger)

## 🧪 Testing

```bash
# Run all tests
mvn test

# Run with coverage
mvn test jacoco:report
```

## 🚢 Deployment

### Railway (Recommended)

1. Push to GitHub
2. Connect Railway to your repo
3. Add PostgreSQL plugin
4. Set environment variables:
   ```
   DATABASE_URL=<from Railway>
   JWT_SECRET=<generate secure key>
   CLOUDINARY_CLOUD_NAME=<your cloud>
   CLOUDINARY_API_KEY=<your key>
   CLOUDINARY_API_SECRET=<your secret>
   ```

### Render

Similar to Railway, add PostgreSQL and set env vars.

## 📝 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `jdbc:postgresql://...` |
| `JWT_SECRET` | Secret key for JWT | Min 32 characters |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `your-cloud` |
| `CLOUDINARY_API_KEY` | API key | `123456789` |
| `CLOUDINARY_API_SECRET` | API secret | `abc123...` |

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Write tests
4. Submit PR

## 📄 License

MIT
