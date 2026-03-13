-- Fix broken product images for vendor-created products
-- These products currently point to /uploads/UUID.jpg files that return 401
-- Replace them with the new images added to frontend/public/images/

-- Product "phở" -> Chicken Pho image
UPDATE product_images
SET image_url = '/images/Chicken Pho (Vietnamese Phở Gà) - Taming of the Spoon.jpg'
WHERE image_url = '/uploads/16b7c717-f301-4b31-9eb8-d1772193f0a1.jpg';

-- Product "bún" -> Bún Thịt Nướng image
UPDATE product_images
SET image_url = '/images/Bún Thịt Nướng (Grilled Pork Noodle Salad).jpg'
WHERE image_url = '/uploads/94ed7639-b0ad-4fff-ab90-fad3dbe42063.jpg';

-- Product "Bún" -> Cá Ba Sa Kho Tộ image
UPDATE product_images
SET image_url = '/images/Cách Làm Cá Ba Sa Kho Tộ Ngon, Cá Màu Đẹp Không Tanh.jpg'
WHERE image_url = '/uploads/0adc58f5-3f70-4839-8c5c-8e87a998bc16.jpg';
