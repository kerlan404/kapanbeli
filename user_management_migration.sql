-- ============================================
-- USER MANAGEMENT SYSTEM - DATABASE MIGRATION
-- ============================================
-- Optimized for production with proper indexes

SET time_zone = '+07:00';

-- ============================================
-- 1. UPDATE USERS TABLE
-- ============================================

-- Add profile_image column if not exists
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_image VARCHAR(255) DEFAULT NULL 
AFTER password;

-- Add status column if not exists (for soft delete / account status)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS account_status ENUM('active', 'inactive', 'suspended') DEFAULT 'active'
AFTER role;

-- Add last_login column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL DEFAULT NULL
AFTER account_status;

-- Add index for profile_image
CREATE INDEX IF NOT EXISTS idx_users_profile_image ON users(profile_image);

-- Add index for account_status
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);

-- Add index for last_login
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);

-- Add composite index for common queries
CREATE INDEX IF NOT EXISTS idx_users_status_role ON users(account_status, role);
CREATE INDEX IF NOT EXISTS idx_users_email_status ON users(email, account_status);
CREATE INDEX IF NOT EXISTS idx_users_name_status ON users(name, account_status);

-- Add fulltext index for search
CREATE FULLTEXT INDEX IF NOT EXISTS idx_users_search ON users(name, email);

-- ============================================
-- 2. OPTIMIZE LOGIN_LOGS TABLE
-- ============================================

-- Add index for user_id and login_time
CREATE INDEX IF NOT EXISTS idx_login_logs_user_time ON login_logs(user_id, login_time DESC);

-- Add index for login_time alone for date-based queries
CREATE INDEX IF NOT EXISTS idx_login_logs_time ON login_logs(login_time DESC);

-- ============================================
-- 3. CREATE USER STATISTICS VIEW
-- ============================================

-- Drop view if exists
DROP VIEW IF EXISTS v_user_statistics;

-- Create view for user statistics
CREATE VIEW v_user_statistics AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.role,
    u.account_status,
    u.profile_image,
    u.created_at,
    u.last_login,
    COUNT(DISTINCT ll.id) as total_logins,
    COUNT(DISTINCT p.id) as total_products,
    COUNT(DISTINCT s.id) as total_suggestions,
    COUNT(DISTINCT n.id) as total_notes
FROM users u
LEFT JOIN login_logs ll ON u.id = ll.user_id
LEFT JOIN products p ON u.id = p.user_id
LEFT JOIN suggestions s ON u.id = s.user_id
LEFT JOIN notes n ON u.id = n.user_id
GROUP BY u.id, u.name, u.email, u.role, u.account_status, u.profile_image, u.created_at, u.last_login;

-- ============================================
-- 4. CREATE INDEXES FOR RELATED TABLES
-- ============================================

-- Products table indexes
CREATE INDEX IF NOT EXISTS idx_products_user ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_user_created ON products(user_id, created_at DESC);

-- Suggestions table indexes
CREATE INDEX IF NOT EXISTS idx_suggestions_user ON suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_created ON suggestions(created_at DESC);

-- Notes table indexes
CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_created ON notes(created_at DESC);

-- ============================================
-- 5. SEED DATA (OPTIONAL - FOR TESTING)
-- ============================================

-- Uncomment to add test data
/*
INSERT INTO users (name, email, password, role, account_status) VALUES
('Test User 1', 'test1@example.com', '$2b$10$...', 'user', 'active'),
('Test User 2', 'test2@example.com', '$2b$10$...', 'user', 'active'),
('Test User 3', 'test3@example.com', '$2b$10$...', 'user', 'inactive')
ON DUPLICATE KEY UPDATE name=name;
*/

-- ============================================
-- 6. VERIFICATION QUERIES
-- ============================================

-- Show all indexes on users table
-- SHOW INDEX FROM users;

-- Show table status
-- SHOW TABLE STATUS LIKE 'users';

SELECT 'Migration completed successfully!' as status;
