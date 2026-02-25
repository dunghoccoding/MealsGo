-- Fix Mì Quảng image filename (no accent on 'i' in actual file)
UPDATE product_images SET image_url = '/images/Mi Quảng.jpg' WHERE image_url = '/images/Mì Quảng.jpg';
