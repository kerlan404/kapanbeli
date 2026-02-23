-- Database Migration for Login Tracking and User Ban Features
-- Run this SQL script to update your database schema

-- 1. Add login tracking columns to users table
ALTER TABLE users 
ADD COLUMN last_login DATETIME NULL,
ADD COLUMN last_logout DATETIME NULL,
ADD COLUMN last_ip VARCHAR(45) NULL,
ADD COLUMN is_banned BOOLEAN DEFAULT FALSE,
ADD COLUMN ban_reason VARCHAR(255) NULL,
ADD COLUMN banned_at DATETIME NULL,
ADD COLUMN banned_by INT NULL,
ADD COLUMN login_count INT DEFAULT 0,
ADD COLUMN status ENUM('active', 'inactive', 'banned') DEFAULT 'active';

-- 2. Create login_logs table for tracking all login/logout activities
CREATE TABLE IF NOT EXISTS login_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    login_time DATETIME NOT NULL,
    logout_time DATETIME NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    session_id VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Create user_stats table for automatic statistics
CREATE TABLE IF NOT EXISTS user_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_products INT DEFAULT 0,
    total_notes INT DEFAULT 0,
    total_logins INT DEFAULT 0,
    last_activity DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Add index for better query performance
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_login_logs_user_id ON login_logs(user_id);
CREATE INDEX idx_login_logs_login_time ON login_logs(login_time);
