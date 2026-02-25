-- ============================================
-- ADMIN PANEL DATABASE STANDARDIZATION
-- ============================================
-- This migration standardizes the users table for consistent admin panel statistics
-- 
-- Standards:
-- - status ENUM('active','inactive','suspended')
-- - role ENUM('admin','user')
-- - totalUsers = activeUsers + inactiveUsers + suspendedUsers
-- ============================================

-- Step 1: Add new columns if they don't exist
-- ============================================

-- Add account_status column with proper ENUM
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS account_status ENUM('active', 'inactive', 'suspended') DEFAULT 'active';

-- Add role column with proper ENUM if it doesn't exist
ALTER TABLE users 
MODIFY COLUMN role ENUM('admin', 'user') DEFAULT 'user';

-- Step 2: Migrate old status values to new account_status
-- ============================================

-- Map old 'status' column values to new 'account_status'
-- Assuming old status might have values like: 'aktif', 'nonaktif', 'banned', etc.

-- Update 'aktif' or 'active' to 'active'
UPDATE users 
SET account_status = 'active' 
WHERE (status = 'aktif' OR status = 'active' OR account_status = 'active');

-- Update 'nonaktif' or 'inactive' to 'inactive'
UPDATE users 
SET account_status = 'inactive' 
WHERE (status = 'nonaktif' OR status = 'inactive' OR account_status = 'inactive');

-- Update 'banned' or 'suspended' to 'suspended'
UPDATE users 
SET account_status = 'suspended' 
WHERE (status = 'banned' OR status = 'suspended' OR account_status = 'suspended' OR is_banned = TRUE);

-- Step 3: Ensure all users have a valid account_status
-- ============================================

-- Set default 'active' for any NULL or unmapped values
UPDATE users 
SET account_status = 'active' 
WHERE account_status IS NULL OR account_status = '';

-- Step 4: Ensure all users have a valid role
-- ============================================

-- Set default 'user' for any NULL role values
UPDATE users 
SET role = 'user' 
WHERE role IS NULL OR role = '';

-- Step 5: Add indexes for better query performance
-- ============================================

-- Add index on account_status for faster filtering
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);

-- Add index on role for faster filtering
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Add composite index for common queries
CREATE INDEX IF NOT EXISTS idx_users_status_role ON users(account_status, role);

-- Step 6: Update is_banned to use account_status instead
-- ============================================

-- If is_banned is TRUE, ensure account_status is 'suspended'
UPDATE users 
SET account_status = 'suspended' 
WHERE is_banned = TRUE AND account_status != 'suspended';

-- Step 7: Create view for user statistics (optional but helpful)
-- ============================================

CREATE OR REPLACE VIEW v_user_stats AS
SELECT 
    COUNT(*) as total_users,
    SUM(CASE WHEN account_status = 'active' THEN 1 ELSE 0 END) as active_users,
    SUM(CASE WHEN account_status = 'inactive' THEN 1 ELSE 0 END) as inactive_users,
    SUM(CASE WHEN account_status = 'suspended' THEN 1 ELSE 0 END) as suspended_users,
    SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_users,
    SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as regular_users
FROM users;

-- Step 8: Verification Query
-- ============================================
-- Run this to verify the migration was successful:

SELECT 
    'User Status Distribution' as report_title,
    account_status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM users), 2) as percentage
FROM users 
GROUP BY account_status
ORDER BY count DESC;

-- ============================================
-- NOTES FOR DEVELOPERS
-- ============================================
-- 1. Always use 'account_status' column, NOT 'status'
-- 2. Valid values: 'active', 'inactive', 'suspended'
-- 3. For banning users, UPDATE account_status TO 'suspended'
-- 4. totalUsers = activeUsers + inactiveUsers + suspendedUsers
-- 5. Use adminService.getStats() for consistent statistics
-- ============================================
