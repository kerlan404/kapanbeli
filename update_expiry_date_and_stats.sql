-- Migration: Update expiry_date to be nullable and ensure user_stats table exists
-- Run this file to update your database schema

-- 1. Make expiry_date nullable in products table
ALTER TABLE products 
MODIFY COLUMN expiry_date DATE NULL;

-- 2. Ensure user_stats table exists with proper structure
CREATE TABLE IF NOT EXISTS user_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_products INT DEFAULT 0,
    total_notes INT DEFAULT 0,
    total_logins INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_stats (user_id)
);

-- 3. Ensure login_logs table exists for tracking user activity
CREATE TABLE IF NOT EXISTS login_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    logout_time TIMESTAMP NULL,
    ip_address VARCHAR(45),
    session_id VARCHAR(255),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_login_time (login_time),
    INDEX idx_user_id (user_id)
);

-- 4. Add necessary columns to users table if they don't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS last_logout TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS last_ip VARCHAR(45) NULL,
ADD COLUMN IF NOT EXISTS login_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ban_reason TEXT NULL,
ADD COLUMN IF NOT EXISTS banned_by INT NULL,
ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP NULL;

-- 5. Initialize user_stats for existing users
INSERT INTO user_stats (user_id, total_products, total_notes, total_logins)
SELECT u.id, 
       COALESCE((SELECT COUNT(*) FROM products p WHERE p.user_id = u.id), 0),
       COALESCE((SELECT COUNT(*) FROM notes n WHERE n.user_id = u.id), 0),
       COALESCE((SELECT COUNT(*) FROM login_logs ll WHERE ll.user_id = u.id), 0)
FROM users u
WHERE NOT EXISTS (SELECT 1 FROM user_stats us WHERE us.user_id = u.id)
ON DUPLICATE KEY UPDATE 
    total_products = VALUES(total_products),
    total_notes = VALUES(total_notes),
    total_logins = VALUES(total_logins);

-- Verification queries
SELECT 'Products table expiry_date column:' as info;
DESCRIBE products;

SELECT 'User stats table structure:' as info;
DESCRIBE user_stats;

SELECT 'Current user stats:' as info;
SELECT * FROM user_stats;

SELECT 'Total products per user:' as info;
SELECT user_id, COUNT(*) as product_count FROM products GROUP BY user_id;

SELECT 'Total notes per user:' as info;
SELECT user_id, COUNT(*) as note_count FROM notes GROUP BY user_id;
