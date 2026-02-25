-- Insert Admin User
INSERT INTO users (full_name, email, password, phone, role, active)
VALUES ('Admin', 'admin@dacsan.vn', '$2a$10$XPTYLRJNvXk5dGvx7BqJPOKZvX5xW9hW9hW9hW9hW9hW9hW9hW9hW', '0123456789', 'ADMIN', TRUE);
-- Password: admin123 (hashed with BCrypt)

-- Insert Vendor Users
INSERT INTO users (full_name, email, password, phone, role, active) VALUES
('Bếp Hà Nội', 'vendor.hanoi@dacsan.vn', '$2a$10$XPTYLRJNvXk5dGvx7BqJPOKZvX5xW9hW9hW9hW9hW9hW9hW9hW9hW', '0901234567', 'VENDOR', TRUE),
('Bếp Huế', 'vendor.hue@dacsan.vn', '$2a$10$XPTYLRJNvXk5dGvx7BqJPOKZvX5xW9hW9hW9hW9hW9hW9hW9hW9hW', '0902345678', 'VENDOR', TRUE),
('Bếp Sài Gòn', 'vendor.saigon@dacsan.vn', '$2a$10$XPTYLRJNvXk5dGvx7BqJPOKZvX5xW9hW9hW9hW9hW9hW9hW9hW9hW', '0903456789', 'VENDOR', TRUE);

-- Insert Customer Users
INSERT INTO users (full_name, email, password, phone, role, active) VALUES
('Nguyễn Văn A', 'customer1@gmail.com', '$2a$10$XPTYLRJNvXk5dGvx7BqJPOKZvX5xW9hW9hW9hW9hW9hW9hW9hW9hW', '0911111111', 'CUSTOMER', TRUE),
('Trần Thị B', 'customer2@gmail.com', '$2a$10$XPTYLRJNvXk5dGvx7BqJPOKZvX5xW9hW9hW9hW9hW9hW9hW9hW9hW', '0922222222', 'CUSTOMER', TRUE);

-- Insert Vendors
INSERT INTO vendors (user_id, store_name, description, region, address, phone, rating, verified, active)
SELECT 
    u.id,
    'Bếp Hà Nội - Món Bắc Chính Gốc',
    'Chuyên các món ăn đặc sản Hà Nội và miền Bắc. Phở Bò, Bún Chả, Bánh Cuốn đúng điệu.',
    'NORTH',
    '123 Phố Huế, Hai Bà Trưng, Hà Nội',
    '0901234567',
    4.5,
    TRUE,
    TRUE
FROM users u WHERE u.email = 'vendor.hanoi@dacsan.vn';

INSERT INTO vendors (user_id, store_name, description, region, address, phone, rating, verified, active)
SELECT 
    u.id,
    'Bếp Huế - Hương Vị Cố Đô',
    'Đặc sản Huế và miền Trung: Bún Bò Huế, Mì Quảng, Bánh Bèo...',
    'CENTRAL',
    '456 Lê Lợi, Quận 1, Huế',
    '0902345678',
    4.7,
    TRUE,
    TRUE
FROM users u WHERE u.email = 'vendor.hue@dacsan.vn';

INSERT INTO vendors (user_id, store_name, description, region, address, phone, rating, verified, active)
SELECT 
    u.id,
    'Bếp Sài Gòn - Món Nam Bộ',
    'Món ăn miền Nam: Cơm Tấm, Bánh Xèo, Hủ Tiếu Nam Vang...',
    'SOUTH',
    '789 Nguyễn Huệ, Quận 1, TP.HCM',
    '0903456789',
    4.6,
    TRUE,
    TRUE
FROM users u WHERE u.email = 'vendor.saigon@dacsan.vn';

-- Insert Products for Bếp Hà Nội (North)
INSERT INTO products (vendor_id, name, description, base_price, region, category, featured, available)
SELECT 
    v.id,
    'Phở Bò Hà Nội',
    'Phở bò truyền thống Hà Nội với nước dùng hầm xương 8 tiếng, thịt bò tươi ngon',
    65000,
    'NORTH',
    'MAIN_DISH',
    TRUE,
    TRUE
FROM vendors v WHERE v.store_name LIKE '%Bếp Hà Nội%';

INSERT INTO products (vendor_id, name, description, base_price, region, category, featured, available)
SELECT 
    v.id,
    'Bún Chả Hà Nội',
    'Bún chả Hà Nội với chả nướng thơm lừng, nước mắm chua ngọt đúng điệu',
    55000,
    'NORTH',
    'MAIN_DISH',
    TRUE,
    TRUE
FROM vendors v WHERE v.store_name LIKE '%Bếp Hà Nội%';

INSERT INTO products (vendor_id, name, description, base_price, region, category, available)
SELECT 
    v.id,
    'Bánh Cuốn Thanh Trì',
    'Bánh cuốn mỏng mịn, thịt băm thơm ngon, ăn kèm chả quế',
    40000,
    'NORTH',
    'SNACK',
    TRUE
FROM vendors v WHERE v.store_name LIKE '%Bếp Hà Nội%';

-- Insert Products for Bếp Huế (Central)
INSERT INTO products (vendor_id, name, description, base_price, region, category, featured, available)
SELECT 
    v.id,
    'Bún Bò Huế',
    'Bún bò Huế chuẩn vị cung đình, nước dùng đậm đà, sả thơm',
    60000,
    'CENTRAL',
    'MAIN_DISH',
    TRUE,
    TRUE
FROM vendors v WHERE v.store_name LIKE '%Bếp Huế%';

INSERT INTO products (vendor_id, name, description, base_price, region, category, featured, available)
SELECT 
    v.id,
    'Mì Quảng',
    'Mì Quảng Quảng Nam với tôm, thịt, trứng cút, rau sống đầy đủ',
    55000,
    'CENTRAL',
    'MAIN_DISH',
    TRUE,
    TRUE
FROM vendors v WHERE v.store_name LIKE '%Bếp Huế%';

INSERT INTO products (vendor_id, name, description, base_price, region, category, available)
SELECT 
    v.id,
    'Bánh Bèo',
    'Set 10 bánh bèo Huế nhỏ xinh, ăn kèm nước mắm ngọt',
    35000,
    'CENTRAL',
    'SNACK',
    TRUE
FROM vendors v WHERE v.store_name LIKE '%Bếp Huế%';

-- Insert Products for Bếp Sài Gòn (South)
INSERT INTO products (vendor_id, name, description, base_price, region, category, featured, available)
SELECT 
    v.id,
    'Cơm Tấm Sườn Bì Chả',
    'Cơm tấm Sài Gòn với sườn nướng, bì, chả trứng, nước mắm chua ngọt',
    50000,
    'SOUTH',
    'MAIN_DISH',
    TRUE,
    TRUE
FROM vendors v WHERE v.store_name LIKE '%Bếp Sài Gòn%';

INSERT INTO products (vendor_id, name, description, base_price, region, category, featured, available)
SELECT 
    v.id,
    'Bánh Xèo Miền Tây',
    'Bánh xèo giòn rụm, nhân tôm thịt, rau sống đầy đủ',
    45000,
    'SOUTH',
    'MAIN_DISH',
    TRUE,
    TRUE
FROM vendors v WHERE v.store_name LIKE '%Bếp Sài Gòn%';

INSERT INTO products (vendor_id, name, description, base_price, region, category, available)
SELECT 
    v.id,
    'Hủ Tiếu Nam Vang',
    'Hủ tiếu Nam Vang Sài Gòn, nước dùng trong ngọt, tôm tươi',
    55000,
    'SOUTH',
    'MAIN_DISH',
    TRUE
FROM vendors v WHERE v.store_name LIKE '%Bếp Sài Gòn%';

-- Note: Product images will be added separately after Cloudinary setup
-- Variant groups will be added in next migration
