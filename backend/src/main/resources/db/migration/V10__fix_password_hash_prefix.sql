-- Fix password hash prefix: Spring BCryptPasswordEncoder requires $2a$ prefix
-- The V9 migration used $2b$ prefix from Python bcrypt which may not be compatible

UPDATE users SET password = '$2a$10$BHUv55.ZAUvOoQew4T2xZOFOQSQT0drkLf2rAgI5YqnE4ULTADiQy'
WHERE email IN ('admin@dacsan.vn', 'vendor.hanoi@dacsan.vn', 'vendor.hue@dacsan.vn', 'vendor.saigon@dacsan.vn', 'customer1@gmail.com', 'customer2@gmail.com');
