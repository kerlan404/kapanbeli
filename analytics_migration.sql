-- ============================================
-- ANALYTICS SYSTEM MIGRATION
-- Kapan Beli Admin Panel
-- Timezone: Asia/Jakarta (WIB)
-- ============================================

-- Set timezone to Jakarta
SET time_zone = '+07:00';

-- ============================================
-- 1. TABEL USERS (Struktur Lengkap)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    confirmation_token VARCHAR(255),
    is_confirmed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_role (role),
    INDEX idx_users_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. TABEL LOGIN_LOGS (Struktur Lengkap)
-- ============================================
CREATE TABLE IF NOT EXISTS login_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    login_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    session_id VARCHAR(255),
    logout_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_login_logs_user_id (user_id),
    INDEX idx_login_logs_login_at (login_at),
    INDEX idx_login_logs_ip (ip_address)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. VIEW: Statistik Harian Pengguna
-- ============================================
CREATE OR REPLACE VIEW v_daily_user_stats AS
SELECT 
    DATE(created_at) AS stat_date,
    COUNT(*) AS new_users
FROM users
GROUP BY DATE(created_at);

-- ============================================
-- 4. VIEW: Statistik Harian Login
-- ============================================
CREATE OR REPLACE VIEW v_daily_login_stats AS
SELECT 
    DATE(login_at) AS stat_date,
    COUNT(*) AS total_logins,
    COUNT(DISTINCT user_id) AS unique_users
FROM login_logs
GROUP BY DATE(login_at);

-- ============================================
-- 5. STORED PROCEDURE: Get Analytics Data
-- ============================================
DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS sp_get_analytics_data(
    IN p_range VARCHAR(20),
    IN p_timezone VARCHAR(50)
)
BEGIN
    DECLARE v_days INT;
    DECLARE v_date_format VARCHAR(20);
    
    -- Set timezone
    SET @tz_query = CONCAT('SET time_zone = ''', 
        CASE p_timezone
            WHEN 'Asia/Jakarta' THEN '+07:00'
            WHEN 'Asia/Makassar' THEN '+08:00'
            WHEN 'Asia/Jayapura' THEN '+09:00'
            ELSE '+07:00'
        END,
        '''');
    PREPARE stmt FROM @tz_query;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    
    -- Determine days and format based on range
    CASE p_range
        WHEN 'today' THEN
            SET v_days = 1;
            SET v_date_format = '%H:00';
        WHEN '7days' THEN
            SET v_days = 7;
            SET v_date_format = '%Y-%m-%d';
        WHEN 'month' THEN
            SET v_days = 30;
            SET v_date_format = '%Y-%m-%d';
        ELSE
            SET v_days = 7;
            SET v_date_format = '%Y-%m-%d';
    END CASE;
    
    -- Return new users per period
    SELECT 
        DATE_FORMAT(u.created_at, v_date_format) AS period,
        COUNT(*) AS new_users
    FROM users u
    WHERE 
        CASE 
            WHEN p_range = 'today' THEN DATE(u.created_at) = CURDATE()
            WHEN p_range = '7days' THEN DATE(u.created_at) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
            WHEN p_range = 'month' THEN DATE(u.created_at) >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
        END
    GROUP BY DATE_FORMAT(u.created_at, v_date_format)
    ORDER BY period ASC;
    
    -- Return logins per period
    SELECT 
        DATE_FORMAT(l.login_at, v_date_format) AS period,
        COUNT(*) AS total_logins,
        COUNT(DISTINCT l.user_id) AS unique_users
    FROM login_logs l
    WHERE 
        CASE 
            WHEN p_range = 'today' THEN DATE(l.login_at) = CURDATE()
            WHEN p_range = '7days' THEN DATE(l.login_at) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
            WHEN p_range = 'month' THEN DATE(l.login_at) >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
        END
    GROUP BY DATE_FORMAT(l.login_at, v_date_format)
    ORDER BY period ASC;
    
END$$

DELIMITER ;

-- ============================================
-- 6. SEED DATA (Untuk Testing)
-- ============================================
-- Uncomment untuk insert data testing

-- Insert sample users (last 30 days)
-- INSERT INTO users (name, email, password, role, created_at)
-- SELECT 
--     CONCAT('User ', n) AS name,
--     CONCAT('user', n, '@example.com') AS email,
--     '$2b$10$example_hash' AS password,
--     'user' AS role,
--     DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 30) DAY) AS created_at
-- FROM (
--     SELECT 1 AS n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5
--     UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10
--     UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15
--     UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20
-- ) numbers;

-- Insert sample login logs
-- INSERT INTO login_logs (user_id, login_at, ip_address)
-- SELECT 
--     FLOOR(1 + RAND() * 20) AS user_id,
--     DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 30) DAY) AS login_at,
--     CONCAT('192.168.1.', FLOOR(1 + RAND() * 254)) AS ip_address
-- FROM (
--     SELECT 1 AS n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5
--     UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10
--     UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15
--     UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20
--     UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25
--     UNION SELECT 26 UNION SELECT 27 UNION SELECT 28 UNION SELECT 29 UNION SELECT 30
--     UNION SELECT 31 UNION SELECT 32 UNION SELECT 33 UNION SELECT 34 UNION SELECT 35
--     UNION SELECT 36 UNION SELECT 37 UNION SELECT 38 UNION SELECT 39 UNION SELECT 40
--     UNION SELECT 41 UNION SELECT 42 UNION SELECT 43 UNION SELECT 44 UNION SELECT 45
--     UNION SELECT 46 UNION SELECT 47 UNION SELECT 48 UNION SELECT 49 UNION SELECT 50
-- ) numbers;

-- ============================================
-- 7. QUERY CONTOH (Untuk Referensi)
-- ============================================

-- Query 1: Pengguna Baru Hari Ini
-- SELECT COUNT(*) AS new_users_today 
-- FROM users 
-- WHERE DATE(created_at) = CURDATE();

-- Query 2: Pengguna Baru 7 Hari Terakhir (Grouped by Date)
-- SELECT 
--     DATE_FORMAT(created_at, '%Y-%m-%d') AS date,
--     COUNT(*) AS new_users
-- FROM users
-- WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
-- GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
-- ORDER BY date ASC;

-- Query 3: Pengguna Baru Bulan Ini (Grouped by Date)
-- SELECT 
--     DATE_FORMAT(created_at, '%Y-%m-%d') AS date,
--     COUNT(*) AS new_users
-- FROM users
-- WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
-- GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
-- ORDER BY date ASC;

-- Query 4: Login Harian Hari Ini
-- SELECT COUNT(*) AS logins_today 
-- FROM login_logs 
-- WHERE DATE(login_at) = CURDATE();

-- Query 5: Login Harian 7 Hari Terakhir (Grouped by Date)
-- SELECT 
--     DATE_FORMAT(login_at, '%Y-%m-%d') AS date,
--     COUNT(*) AS total_logins,
--     COUNT(DISTINCT user_id) AS daily_active_users
-- FROM login_logs
-- WHERE DATE(login_at) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
-- GROUP BY DATE_FORMAT(login_at, '%Y-%m-%d')
-- ORDER BY date ASC;

-- Query 6: Login Harian Bulan Ini (Grouped by Date)
-- SELECT 
--     DATE_FORMAT(login_at, '%Y-%m-%d') AS date,
--     COUNT(*) AS total_logins,
--     COUNT(DISTINCT user_id) AS daily_active_users
-- FROM login_logs
-- WHERE DATE(login_at) >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
-- GROUP BY DATE_FORMAT(login_at, '%Y-%m-%d')
-- ORDER BY date ASC;

-- Query 7: Total Users
-- SELECT COUNT(*) AS total_users FROM users;

-- Query 8: Total Login (sesuai range)
-- SELECT COUNT(*) AS total_logins 
-- FROM login_logs 
-- WHERE DATE(login_at) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY);

-- Query 9: Daily Active Users (DAU)
-- SELECT COUNT(DISTINCT user_id) AS dau 
-- FROM login_logs 
-- WHERE DATE(login_at) = CURDATE();

-- Query 10: Growth Percentage (vs Previous Period)
-- SELECT 
--     ((curr.new_users - prev.new_users) / NULLIF(prev.new_users, 0)) * 100 AS growth_percentage
-- FROM 
--     (SELECT COUNT(*) AS new_users FROM users WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)) curr,
--     (SELECT COUNT(*) AS new_users FROM users WHERE DATE(created_at) BETWEEN DATE_SUB(CURDATE(), INTERVAL 13 DAY) AND DATE_SUB(CURDATE(), INTERVAL 7 DAY)) prev;
