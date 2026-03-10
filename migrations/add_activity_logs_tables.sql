-- Migration Script for Activity Logs
-- Run this script to add activity_logs and login_logs tables to existing database
-- Date: 2026-03-10

-- Create activity_logs table if not exists
CREATE TABLE IF NOT EXISTS activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    activity_type ENUM('LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'EXPORT', 'IMPORT', 'BAN', 'UNBAN') NOT NULL,
    description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_activity_type (activity_type),
    INDEX idx_created_at (created_at)
);

-- Create login_logs table if not exists (skip if already exists)
CREATE TABLE IF NOT EXISTS login_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    logout_time TIMESTAMP NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    activity_type ENUM('login', 'logout', 'register') DEFAULT 'login',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_login_time (login_time)
);

-- Add columns to users table if not exists (using ALTER with checks)
-- Note: MySQL 8.0.29+ supports IF NOT EXISTS for ADD COLUMN
-- For older versions, you may need to run these without IF NOT EXISTS

SET @dbname = DATABASE();

-- Check and add last_login column
SET @sql = (
    SELECT IF(
        EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'users' AND COLUMN_NAME = 'last_login'),
        'SELECT 1',
        'ALTER TABLE users ADD COLUMN last_login TIMESTAMP NULL'
    )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add last_logout column
SET @sql = (
    SELECT IF(
        EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'users' AND COLUMN_NAME = 'last_logout'),
        'SELECT 1',
        'ALTER TABLE users ADD COLUMN last_logout TIMESTAMP NULL'
    )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add last_ip column
SET @sql = (
    SELECT IF(
        EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'users' AND COLUMN_NAME = 'last_ip'),
        'SELECT 1',
        'ALTER TABLE users ADD COLUMN last_ip VARCHAR(45) NULL'
    )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add login_count column
SET @sql = (
    SELECT IF(
        EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'users' AND COLUMN_NAME = 'login_count'),
        'SELECT 1',
        'ALTER TABLE users ADD COLUMN login_count INT DEFAULT 0'
    )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add account_status column
SET @sql = (
    SELECT IF(
        EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'users' AND COLUMN_NAME = 'account_status'),
        'SELECT 1',
        'ALTER TABLE users ADD COLUMN account_status ENUM(\'active\', \'suspended\', \'banned\') DEFAULT \'active\''
    )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add profile_photo column
SET @sql = (
    SELECT IF(
        EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'users' AND COLUMN_NAME = 'profile_photo'),
        'SELECT 1',
        'ALTER TABLE users ADD COLUMN profile_photo VARCHAR(500) NULL'
    )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verify tables were created
SELECT 'Migration completed successfully!' as status;
SELECT COUNT(*) as activity_logs_count FROM information_schema.tables WHERE table_schema = @dbname AND table_name = 'activity_logs';
SELECT COUNT(*) as login_logs_count FROM information_schema.tables WHERE table_schema = @dbname AND table_name = 'login_logs';
