-- ============================================
-- ADD PRODUCT STATUS COLUMN
-- ============================================
-- Menambahkan kolom is_active untuk fitur non-aktifkan produk

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE 
AFTER category;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_expiry ON products(expiry_date);
CREATE INDEX IF NOT EXISTS idx_products_user_active ON products(user_id, is_active);

-- Update existing products to active
UPDATE products SET is_active = TRUE WHERE is_active IS NULL;

-- Verification query
SELECT 
    id,
    name,
    category,
    is_active,
    created_at
FROM products
ORDER BY created_at DESC
LIMIT 10;
