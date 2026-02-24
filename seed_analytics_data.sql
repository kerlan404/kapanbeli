-- ============================================
-- SEED DATA UNTUK TESTING ANALYTICS
-- Kapan Beli Admin Panel
-- ============================================

-- Set timezone
SET time_zone = '+07:00';

-- ============================================
-- 1. DELETE EXISTING DATA (OPTIONAL - HATI-HATI!)
-- ============================================
-- Uncomment baris berikut jika ingin reset data
-- DELETE FROM login_logs;
-- DELETE FROM users WHERE email LIKE 'testuser%';

-- ============================================
-- 2. INSERT SAMPLE USERS (30 hari terakhir)
-- ============================================

-- User 1-10: Hari ini
INSERT INTO users (name, email, password, role, created_at) VALUES
('Test User 1', 'testuser1@kapanbeli.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', DATE_SUB(NOW(), INTERVAL HOUR(NOW()) HOUR)),
('Test User 2', 'testuser2@kapanbeli.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', DATE_SUB(NOW(), INTERVAL HOUR(NOW()) - 2 HOUR)),
('Test User 3', 'testuser3@kapanbeli.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', DATE_SUB(NOW(), INTERVAL HOUR(NOW()) - 4 HOUR)),
('Test User 4', 'testuser4@kapanbeli.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', DATE_SUB(NOW(), INTERVAL 3 HOUR)),
('Test User 5', 'testuser5@kapanbeli.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', DATE_SUB(NOW(), INTERVAL 6 HOUR));

-- User 6-15: 7 hari terakhir
INSERT INTO users (name, email, password, role, created_at) VALUES
('Test User 6', 'testuser6@kapanbeli.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', DATE_SUB(NOW(), INTERVAL 1 DAY)),
('Test User 7', 'testuser7@kapanbeli.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', DATE_SUB(NOW(), INTERVAL 1 DAY)),
('Test User 8', 'testuser8@kapanbeli.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', DATE_SUB(NOW(), INTERVAL 2 DAY)),
('Test User 9', 'testuser9@kapanbeli.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', DATE_SUB(NOW(), INTERVAL 2 DAY)),
('Test User 10', 'testuser10@kapanbeli.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', DATE_SUB(NOW(), INTERVAL 3 DAY)),
('Test User 11', 'testuser11@kapanbeli.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', DATE_SUB(NOW(), INTERVAL 4 DAY)),
('Test User 12', 'testuser12@kapanbeli.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', DATE_SUB(NOW(), INTERVAL 5 DAY)),
('Test User 13', 'testuser13@kapanbeli.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', DATE_SUB(NOW(), INTERVAL 6 DAY)),
('Test User 14', 'testuser14@kapanbeli.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', DATE_SUB(NOW(), INTERVAL 6 DAY)),
('Test User 15', 'testuser15@kapanbeli.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', DATE_SUB(NOW(), INTERVAL 6 DAY));

-- User 16-30: 30 hari terakhir
INSERT INTO users (name, email, password, role, created_at) VALUES
('Test User 16', 'testuser16@kapanbeli.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', DATE_SUB(NOW(), INTERVAL 7 DAY)),
('Test User 17', 'testuser17@kapanbeli.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', DATE_SUB(NOW(), INTERVAL 8 DAY)),
('Test User 18', 'testuser18@kapanbeli.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', DATE_SUB(NOW(), INTERVAL 10 DAY)),
('Test User 19', 'testuser19@kapanbeli.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', DATE_SUB(NOW(), INTERVAL 12 DAY)),
('Test User 20', 'testuser20@kapanbeli.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', DATE_SUB(NOW(), INTERVAL 14 DAY)),
('Test User 21', 'testuser21@kapanbeli.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', DATE_SUB(NOW(), INTERVAL 16 DAY)),
('Test User 22', 'testuser22@kapanbeli.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', DATE_SUB(NOW(), INTERVAL 18 DAY)),
('Test User 23', 'testuser23@kapanbeli.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', DATE_SUB(NOW(), INTERVAL 20 DAY)),
('Test User 24', 'testuser24@kapanbeli.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', DATE_SUB(NOW(), INTERVAL 22 DAY)),
('Test User 25', 'testuser25@kapanbeli.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', DATE_SUB(NOW(), INTERVAL 24 DAY)),
('Test User 26', 'testuser26@kapanbeli.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', DATE_SUB(NOW(), INTERVAL 26 DAY)),
('Test User 27', 'testuser27@kapanbeli.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', DATE_SUB(NOW(), INTERVAL 27 DAY)),
('Test User 28', 'testuser28@kapanbeli.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', DATE_SUB(NOW(), INTERVAL 28 DAY)),
('Test User 29', 'testuser29@kapanbeli.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', DATE_SUB(NOW(), INTERVAL 29 DAY)),
('Test User 30', 'testuser30@kapanbeli.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', DATE_SUB(NOW(), INTERVAL 29 DAY));

-- ============================================
-- 3. INSERT SAMPLE LOGIN LOGS
-- ============================================

-- Login logs untuk hari ini (beberapa user login berkali-kali)
INSERT INTO login_logs (user_id, login_at, ip_address) VALUES
(1, DATE_SUB(NOW(), INTERVAL 1 HOUR), '192.168.1.100'),
(1, DATE_SUB(NOW(), INTERVAL 3 HOUR), '192.168.1.100'),
(2, DATE_SUB(NOW(), INTERVAL 2 HOUR), '192.168.1.101'),
(3, DATE_SUB(NOW(), INTERVAL 4 HOUR), '192.168.1.102'),
(4, DATE_SUB(NOW(), INTERVAL 5 HOUR), '192.168.1.103'),
(5, DATE_SUB(NOW(), INTERVAL 6 HOUR), '192.168.1.104'),
(6, DATE_SUB(NOW(), INTERVAL 1 HOUR), '192.168.1.105'),
(7, DATE_SUB(NOW(), INTERVAL 2 HOUR), '192.168.1.106'),
(8, DATE_SUB(NOW(), INTERVAL 3 HOUR), '192.168.1.107'),
(9, DATE_SUB(NOW(), INTERVAL 4 HOUR), '192.168.1.108');

-- Login logs 7 hari terakhir
INSERT INTO login_logs (user_id, login_at, ip_address) VALUES
(1, DATE_SUB(NOW(), INTERVAL 1 DAY), '192.168.1.100'),
(2, DATE_SUB(NOW(), INTERVAL 1 DAY), '192.168.1.101'),
(3, DATE_SUB(NOW(), INTERVAL 1 DAY), '192.168.1.102'),
(4, DATE_SUB(NOW(), INTERVAL 2 DAY), '192.168.1.103'),
(5, DATE_SUB(NOW(), INTERVAL 2 DAY), '192.168.1.104'),
(6, DATE_SUB(NOW(), INTERVAL 2 DAY), '192.168.1.105'),
(7, DATE_SUB(NOW(), INTERVAL 3 DAY), '192.168.1.106'),
(8, DATE_SUB(NOW(), INTERVAL 3 DAY), '192.168.1.107'),
(9, DATE_SUB(NOW(), INTERVAL 4 DAY), '192.168.1.108'),
(10, DATE_SUB(NOW(), INTERVAL 4 DAY), '192.168.1.109'),
(11, DATE_SUB(NOW(), INTERVAL 5 DAY), '192.168.1.110'),
(12, DATE_SUB(NOW(), INTERVAL 5 DAY), '192.168.1.111'),
(13, DATE_SUB(NOW(), INTERVAL 6 DAY), '192.168.1.112'),
(14, DATE_SUB(NOW(), INTERVAL 6 DAY), '192.168.1.113'),
(15, DATE_SUB(NOW(), INTERVAL 6 DAY), '192.168.1.114'),
(1, DATE_SUB(NOW(), INTERVAL 2 DAY), '192.168.1.100'),
(2, DATE_SUB(NOW(), INTERVAL 3 DAY), '192.168.1.101'),
(3, DATE_SUB(NOW(), INTERVAL 4 DAY), '192.168.1.102'),
(4, DATE_SUB(NOW(), INTERVAL 5 DAY), '192.168.1.103'),
(5, DATE_SUB(NOW(), INTERVAL 6 DAY), '192.168.1.104');

-- Login logs 30 hari terakhir (lebih banyak untuk variasi)
INSERT INTO login_logs (user_id, login_at, ip_address) VALUES
(16, DATE_SUB(NOW(), INTERVAL 7 DAY), '192.168.1.116'),
(17, DATE_SUB(NOW(), INTERVAL 8 DAY), '192.168.1.117'),
(18, DATE_SUB(NOW(), INTERVAL 9 DAY), '192.168.1.118'),
(19, DATE_SUB(NOW(), INTERVAL 10 DAY), '192.168.1.119'),
(20, DATE_SUB(NOW(), INTERVAL 11 DAY), '192.168.1.120'),
(21, DATE_SUB(NOW(), INTERVAL 12 DAY), '192.168.1.121'),
(22, DATE_SUB(NOW(), INTERVAL 13 DAY), '192.168.1.122'),
(23, DATE_SUB(NOW(), INTERVAL 14 DAY), '192.168.1.123'),
(24, DATE_SUB(NOW(), INTERVAL 15 DAY), '192.168.1.124'),
(25, DATE_SUB(NOW(), INTERVAL 16 DAY), '192.168.1.125'),
(26, DATE_SUB(NOW(), INTERVAL 17 DAY), '192.168.1.126'),
(27, DATE_SUB(NOW(), INTERVAL 18 DAY), '192.168.1.127'),
(28, DATE_SUB(NOW(), INTERVAL 19 DAY), '192.168.1.128'),
(29, DATE_SUB(NOW(), INTERVAL 20 DAY), '192.168.1.129'),
(30, DATE_SUB(NOW(), INTERVAL 21 DAY), '192.168.1.130'),
(16, DATE_SUB(NOW(), INTERVAL 14 DAY), '192.168.1.116'),
(17, DATE_SUB(NOW(), INTERVAL 15 DAY), '192.168.1.117'),
(18, DATE_SUB(NOW(), INTERVAL 16 DAY), '192.168.1.118'),
(19, DATE_SUB(NOW(), INTERVAL 17 DAY), '192.168.1.119'),
(20, DATE_SUB(NOW(), INTERVAL 18 DAY), '192.168.1.120'),
(21, DATE_SUB(NOW(), INTERVAL 19 DAY), '192.168.1.121'),
(22, DATE_SUB(NOW(), INTERVAL 20 DAY), '192.168.1.122'),
(23, DATE_SUB(NOW(), INTERVAL 21 DAY), '192.168.1.123'),
(24, DATE_SUB(NOW(), INTERVAL 22 DAY), '192.168.1.124'),
(25, DATE_SUB(NOW(), INTERVAL 23 DAY), '192.168.1.125'),
(26, DATE_SUB(NOW(), INTERVAL 24 DAY), '192.168.1.126'),
(27, DATE_SUB(NOW(), INTERVAL 25 DAY), '192.168.1.127'),
(28, DATE_SUB(NOW(), INTERVAL 26 DAY), '192.168.1.128'),
(29, DATE_SUB(NOW(), INTERVAL 27 DAY), '192.168.1.129'),
(30, DATE_SUB(NOW(), INTERVAL 28 DAY), '192.168.1.130'),
(16, DATE_SUB(NOW(), INTERVAL 21 DAY), '192.168.1.116'),
(17, DATE_SUB(NOW(), INTERVAL 22 DAY), '192.168.1.117'),
(18, DATE_SUB(NOW(), INTERVAL 23 DAY), '192.168.1.118'),
(19, DATE_SUB(NOW(), INTERVAL 24 DAY), '192.168.1.119'),
(20, DATE_SUB(NOW(), INTERVAL 25 DAY), '192.168.1.120'),
(21, DATE_SUB(NOW(), INTERVAL 26 DAY), '192.168.1.121'),
(22, DATE_SUB(NOW(), INTERVAL 27 DAY), '192.168.1.122'),
(23, DATE_SUB(NOW(), INTERVAL 28 DAY), '192.168.1.123'),
(24, DATE_SUB(NOW(), INTERVAL 29 DAY), '192.168.1.124'),
(25, DATE_SUB(NOW(), INTERVAL 29 DAY), '192.168.1.125');

-- ============================================
-- 4. VERIFY DATA
-- ============================================

-- Cek jumlah users
SELECT 'Total Users' AS description, COUNT(*) AS count FROM users
UNION ALL
SELECT 'Users Hari Ini', COUNT(*) FROM users WHERE DATE(created_at) = CURDATE()
UNION ALL
SELECT 'Users 7 Hari Terakhir', COUNT(*) FROM users WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
UNION ALL
SELECT 'Users 30 Hari Terakhir', COUNT(*) FROM users WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 29 DAY);

-- Cek jumlah login logs
SELECT 'Total Login Logs' AS description, COUNT(*) AS count FROM login_logs
UNION ALL
SELECT 'Login Hari Ini', COUNT(*) FROM login_logs WHERE DATE(login_at) = CURDATE()
UNION ALL
SELECT 'Login 7 Hari Terakhir', COUNT(*) FROM login_logs WHERE DATE(login_at) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
UNION ALL
SELECT 'Login 30 Hari Terakhir', COUNT(*) FROM login_logs WHERE DATE(login_at) >= DATE_SUB(CURDATE(), INTERVAL 29 DAY);

-- Cek Daily Active Users
SELECT 'DAU Hari Ini' AS description, COUNT(DISTINCT user_id) AS count FROM login_logs WHERE DATE(login_at) = CURDATE()
UNION ALL
SELECT 'DAU 7 Hari Terakhir', COUNT(DISTINCT user_id) FROM login_logs WHERE DATE(login_at) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
UNION ALL
SELECT 'DAU 30 Hari Terakhir', COUNT(DISTINCT user_id) FROM login_logs WHERE DATE(login_at) >= DATE_SUB(CURDATE(), INTERVAL 29 DAY);
