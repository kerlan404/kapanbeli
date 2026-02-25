-- ============================================
-- ADMIN PANEL DATABASE FIX
-- Menyatukan kolom status dan login_time
-- ============================================

-- Set timezone to Jakarta
SET time_zone = '+07:00';

-- ============================================
-- 1. FIX: Tambah kolom account_status jika belum ada
-- ============================================
-- Kita akan menggunakan account_status sebagai standar baru
-- Tapi tetap support status untuk backward compatibility

ALTER TABLE users
ADD COLUMN IF NOT EXISTS account_status ENUM('active', 'inactive', 'suspended') DEFAULT 'active';

-- ============================================
-- 2. FIX: Sinkronisasi status dan account_status
-- ============================================
-- Copy data dari status ke account_status jika account_status masih NULL
UPDATE users
SET account_status = CASE
    WHEN status = 'active' THEN 'active'
    WHEN status = 'inactive' THEN 'inactive'
    WHEN status = 'banned' THEN 'suspended'
    ELSE 'active'
END
WHERE account_status IS NULL OR account_status = 'active';

-- ============================================
-- 3. FIX: Tambah kolom login_time jika belum ada
-- ============================================
-- login_logs menggunakan login_time di beberapa tempat dan login_at di tempat lain
-- Kita standardisasi ke login_time

ALTER TABLE login_logs
ADD COLUMN IF NOT EXISTS login_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Copy data dari login_at ke login_time jika login_time masih NULL
UPDATE login_logs
SET login_time = login_at
WHERE login_time IS NULL AND login_at IS NOT NULL;

-- ============================================
-- 4. FIX: Tambah kolom logout_time jika belum ada
-- ============================================
ALTER TABLE login_logs
ADD COLUMN IF NOT EXISTS logout_time DATETIME NULL;

-- Copy data dari logout_at ke logout_time jika logout_time masih NULL
UPDATE login_logs
SET logout_time = logout_at
WHERE logout_time IS NULL AND logout_at IS NOT NULL;

-- ============================================
-- 5. CREATE VIEW: v_login_logs_unified
-- ============================================
-- View untuk menyatukan login_time dan login_at
CREATE OR REPLACE VIEW v_login_logs_unified AS
SELECT
    id,
    user_id,
    COALESCE(login_time, login_at) as login_time,
    COALESCE(logout_time, logout_at) as logout_time,
    ip_address,
    user_agent,
    session_id,
    created_at
FROM login_logs;

-- ============================================
-- 6. CREATE VIEW: v_users_unified
-- ============================================
-- View untuk menyatukan status dan account_status
CREATE OR REPLACE VIEW v_users_unified AS
SELECT
    id,
    name,
    email,
    password,
    role,
    COALESCE(account_status, status, 'active') as account_status,
    profile_photo,
    last_login,
    last_logout,
    last_ip,
    is_banned,
    ban_reason,
    banned_at,
    banned_by,
    login_count,
    status,
    created_at,
    updated_at
FROM users;

-- ============================================
-- 7. ADD INDEXES untuk performa
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_login_logs_login_time ON login_logs(login_time);

-- ============================================
-- REFERENSI QUERY STANDAR
-- ============================================
-- Gunakan query berikut untuk konsistensi:

-- Total users by account_status
-- SELECT account_status, COUNT(*) as count FROM users GROUP BY account_status;

-- Login logs hari ini
-- SELECT COUNT(*) FROM login_logs WHERE DATE(login_time) = CURDATE();

-- Users online hari ini
-- SELECT COUNT(DISTINCT user_id) FROM login_logs WHERE DATE(login_time) = CURDATE();

-- Most active users
-- SELECT u.id, u.name, u.email, COUNT(ll.id) as total_logins
--   FROM users u LEFT JOIN login_logs ll ON u.id = ll.user_id
--   GROUP BY u.id ORDER BY total_logins DESC LIMIT 5;
