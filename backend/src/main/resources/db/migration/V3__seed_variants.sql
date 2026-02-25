-- Add variant groups for Phở Bò Hà Nội
INSERT INTO variant_groups (product_id, name, is_multi_select, is_required, display_order)
SELECT p.id, 'Kích thước', FALSE, TRUE, 1
FROM products p WHERE p.name = 'Phở Bò Hà Nội';

INSERT INTO variants (variant_group_id, name, price_adjustment, display_order)
SELECT vg.id, 'Tô nhỏ', 0, 1
FROM variant_groups vg 
JOIN products p ON vg.product_id = p.id
WHERE p.name = 'Phở Bò Hà Nội' AND vg.name = 'Kích thước';

INSERT INTO variants (variant_group_id, name, price_adjustment, display_order)
SELECT vg.id, 'Tô vừa', 10000, 2
FROM variant_groups vg 
JOIN products p ON vg.product_id = p.id
WHERE p.name = 'Phở Bò Hà Nội' AND vg.name = 'Kích thước';

INSERT INTO variants (variant_group_id, name, price_adjustment, display_order)
SELECT vg.id, 'Tô lớn', 20000, 3
FROM variant_groups vg 
JOIN products p ON vg.product_id = p.id
WHERE p.name = 'Phở Bò Hà Nội' AND vg.name = 'Kích thước';

-- Add topping group (multi-select)
INSERT INTO variant_groups (product_id, name, is_multi_select, is_required, display_order)
SELECT p.id, 'Topping thêm', TRUE, FALSE, 2
FROM products p WHERE p.name = 'Phở Bò Hà Nội';

INSERT INTO variants (variant_group_id, name, price_adjustment, display_order)
SELECT vg.id, 'Thêm trứng', 5000, 1
FROM variant_groups vg 
JOIN products p ON vg.product_id = p.id
WHERE p.name = 'Phở Bò Hà Nội' AND vg.name = 'Topping thêm';

INSERT INTO variants (variant_group_id, name, price_adjustment, display_order)
SELECT vg.id, 'Thêm bò viên', 10000, 2
FROM variant_groups vg 
JOIN products p ON vg.product_id = p.id
WHERE p.name = 'Phở Bò Hà Nội' AND vg.name = 'Topping thêm';

INSERT INTO variants (variant_group_id, name, price_adjustment, display_order)
SELECT vg.id, 'Thêm nạm', 15000, 3
FROM variant_groups vg 
JOIN products p ON vg.product_id = p.id
WHERE p.name = 'Phở Bò Hà Nội' AND vg.name = 'Topping thêm';

-- Add customization group (single select)
INSERT INTO variant_groups (product_id, name, is_multi_select, is_required, display_order)
SELECT p.id, 'Tùy chỉnh', FALSE, FALSE, 3
FROM products p WHERE p.name = 'Phở Bò Hà Nội';

INSERT INTO variants (variant_group_id, name, price_adjustment, display_order)
SELECT vg.id, 'Bình thường', 0, 1
FROM variant_groups vg 
JOIN products p ON vg.product_id = p.id
WHERE p.name = 'Phở Bò Hà Nội' AND vg.name = 'Tùy chỉnh';

INSERT INTO variants (variant_group_id, name, price_adjustment, display_order)
SELECT vg.id, 'Ít hành', 0, 2
FROM variant_groups vg 
JOIN products p ON vg.product_id = p.id
WHERE p.name = 'Phở Bò Hà Nội' AND vg.name = 'Tùy chỉnh';

INSERT INTO variants (variant_group_id, name, price_adjustment, display_order)
SELECT vg.id, 'Không hành', 0, 3
FROM variant_groups vg 
JOIN products p ON vg.product_id = p.id
WHERE p.name = 'Phở Bò Hà Nội' AND vg.name = 'Tùy chỉnh';

-- Add variants for Bún Bò Huế
INSERT INTO variant_groups (product_id, name, is_multi_select, is_required, display_order)
SELECT p.id, 'Kích thước', FALSE, TRUE, 1
FROM products p WHERE p.name = 'Bún Bò Huế';

INSERT INTO variants (variant_group_id, name, price_adjustment, display_order)
SELECT vg.id, 'Tô nhỏ', 0, 1
FROM variant_groups vg
JOIN products p ON vg.product_id = p.id
WHERE p.name = 'Bún Bò Huế' AND vg.name = 'Kích thước';

INSERT INTO variants (variant_group_id, name, price_adjustment, display_order)
SELECT vg.id, 'Tô vừa', 10000, 2
FROM variant_groups vg
JOIN products p ON vg.product_id = p.id
WHERE p.name = 'Bún Bò Huế' AND vg.name = 'Kích thước';

INSERT INTO variants (variant_group_id, name, price_adjustment, display_order)
SELECT vg.id, 'Tô lớn', 20000, 3
FROM variant_groups vg
JOIN products p ON vg.product_id = p.id
WHERE p.name = 'Bún Bò Huế' AND vg.name = 'Kích thước';

-- Add variants for Bánh Xèo
INSERT INTO variant_groups (product_id, name, is_multi_select, is_required, display_order)
SELECT p.id, 'Số lượng', FALSE, TRUE, 1
FROM products p WHERE p.name = 'Bánh Xèo Miền Tây';

INSERT INTO variants (variant_group_id, name, price_adjustment, display_order)
SELECT vg.id, '1 bánh', 0, 1
FROM variant_groups vg
JOIN products p ON vg.product_id = p.id
WHERE p.name = 'Bánh Xèo Miền Tây' AND vg.name = 'Số lượng';

INSERT INTO variants (variant_group_id, name, price_adjustment, display_order)
SELECT vg.id, '2 bánh', 40000, 2
FROM variant_groups vg
JOIN products p ON vg.product_id = p.id
WHERE p.name = 'Bánh Xèo Miền Tây' AND vg.name = 'Số lượng';

INSERT INTO variants (variant_group_id, name, price_adjustment, display_order)
SELECT vg.id, '3 bánh', 75000, 3
FROM variant_groups vg
JOIN products p ON vg.product_id = p.id
WHERE p.name = 'Bánh Xèo Miền Tây' AND vg.name = 'Số lượng';

INSERT INTO variant_groups (product_id, name, is_multi_select, is_required, display_order)
SELECT p.id, 'Độ cay', FALSE, FALSE, 2
FROM products p WHERE p.name = 'Bánh Xèo Miền Tây';

INSERT INTO variants (variant_group_id, name, price_adjustment, display_order)
SELECT vg.id, 'Không cay', 0, 1
FROM variant_groups vg
JOIN products p ON vg.product_id = p.id
WHERE p.name = 'Bánh Xèo Miền Tây' AND vg.name = 'Độ cay';

INSERT INTO variants (variant_group_id, name, price_adjustment, display_order)
SELECT vg.id, 'Ít cay', 0, 2
FROM variant_groups vg
JOIN products p ON vg.product_id = p.id
WHERE p.name = 'Bánh Xèo Miền Tây' AND vg.name = 'Độ cay';

INSERT INTO variants (variant_group_id, name, price_adjustment, display_order)
SELECT vg.id, 'Cay vừa', 0, 3
FROM variant_groups vg
JOIN products p ON vg.product_id = p.id
WHERE p.name = 'Bánh Xèo Miền Tây' AND vg.name = 'Độ cay';

INSERT INTO variants (variant_group_id, name, price_adjustment, display_order)
SELECT vg.id, 'Cay nhiều', 0, 4
FROM variant_groups vg
JOIN products p ON vg.product_id = p.id
WHERE p.name = 'Bánh Xèo Miền Tây' AND vg.name = 'Độ cay';
