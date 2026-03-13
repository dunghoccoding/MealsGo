-- Fix all user passwords with proper BCrypt hash for 'admin123'
-- The original V2 seed data used invalid placeholder hashes

UPDATE users SET password = '$2b$10$BHUv55.ZAUvOoQew4T2xZOFOQSQT0drkLf2rAgI5YqnE4ULTADiQy'
WHERE email IN ('admin@dacsan.vn', 'vendor.hanoi@dacsan.vn', 'vendor.hue@dacsan.vn', 'vendor.saigon@dacsan.vn', 'customer1@gmail.com', 'customer2@gmail.com');
