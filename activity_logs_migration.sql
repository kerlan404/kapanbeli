-- Activity Logs Table Migration
-- Table untuk menyimpan log aktivitas user

CREATE TABLE IF NOT EXISTS activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    activity_type VARCHAR(50) NOT NULL COMMENT 'LOGIN, LOGOUT, CREATE, UPDATE, DELETE, VIEW',
    description TEXT NOT NULL,
    ip_address VARCHAR(45) DEFAULT NULL COMMENT 'IPv4 atau IPv6',
    user_agent TEXT DEFAULT NULL COMMENT 'Browser user agent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Index untuk performa
    INDEX idx_user_id (user_id),
    INDEX idx_activity_type (activity_type),
    INDEX idx_created_at (created_at),
    INDEX idx_user_activity (user_id, activity_type),
    
    -- Foreign key ke users table
    CONSTRAINT fk_activity_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Set timezone ke Asia/Jakarta
SET time_zone = '+07:00';
