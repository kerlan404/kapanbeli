-- ============================================
-- UPDATE USER STATUS
-- Real users = active, Dummy users = inactive
-- ============================================

SET time_zone = '+07:00';

-- Update semua user dengan email domain example.com atau test sebagai inactive (dummy)
UPDATE users 
SET account_status = 'inactive'
WHERE email LIKE '%@example.com' 
   OR email LIKE '%@test.com'
   OR email LIKE '%@dummy.com'
   OR name LIKE '%Test%'
   OR name LIKE '%Dummy%';

-- Update semua user lainnya sebagai active (real users)
UPDATE users 
SET account_status = 'active'
WHERE email NOT LIKE '%@example.com' 
  AND email NOT LIKE '%@test.com'
  AND email NOT LIKE '%@dummy.com'
  AND name NOT LIKE '%Test%'
  AND name NOT LIKE '%Dummy%';

-- Tambahkan kolom profile_image jika belum ada
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_image VARCHAR(255) DEFAULT NULL
AFTER password;

-- Verifikasi
SELECT 
    id,
    name,
    email,
    account_status,
    profile_image,
    created_at
FROM users
ORDER BY 
    CASE 
        WHEN account_status = 'active' THEN 0 
        ELSE 1 
    END,
    created_at DESC;
