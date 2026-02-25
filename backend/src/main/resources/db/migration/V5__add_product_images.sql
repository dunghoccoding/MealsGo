-- Add product images from local /images/ folder
-- Map each food image to its corresponding product

INSERT INTO product_images (product_id, image_url)
SELECT p.id, '/images/phở bò Hà Nội.jpg'
FROM products p WHERE p.name = 'Phở Bò Hà Nội';

INSERT INTO product_images (product_id, image_url)
SELECT p.id, '/images/Bún chả Hà Nội.jpg'
FROM products p WHERE p.name = 'Bún Chả Hà Nội';

INSERT INTO product_images (product_id, image_url)
SELECT p.id, '/images/Bánh Cuốn.jpg'
FROM products p WHERE p.name = 'Bánh Cuốn Thanh Trì';

INSERT INTO product_images (product_id, image_url)
SELECT p.id, '/images/Bún bò Huế.jpg'
FROM products p WHERE p.name = 'Bún Bò Huế';

INSERT INTO product_images (product_id, image_url)
SELECT p.id, '/images/Mì Quảng.jpg'
FROM products p WHERE p.name = 'Mì Quảng';

INSERT INTO product_images (product_id, image_url)
SELECT p.id, '/images/Bánh bèo.jpg'
FROM products p WHERE p.name = 'Bánh Bèo';

INSERT INTO product_images (product_id, image_url)
SELECT p.id, '/images/Cơm tấm.jpg'
FROM products p WHERE p.name = 'Cơm Tấm Sườn Bì Chả';

INSERT INTO product_images (product_id, image_url)
SELECT p.id, '/images/Bánh Xèo.jpg'
FROM products p WHERE p.name = 'Bánh Xèo Miền Tây';

INSERT INTO product_images (product_id, image_url)
SELECT p.id, '/images/Hủ tiếu.jpg'
FROM products p WHERE p.name = 'Hủ Tiếu Nam Vang';
