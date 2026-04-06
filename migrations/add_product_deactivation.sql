-- Migration: Add product deactivation by admin
-- Date: 2026-04-06

-- Add deactivation column to products table
ALTER TABLE products 
ADD COLUMN is_deactivated_by_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN deactivated_at TIMESTAMP NULL,
ADD COLUMN deactivated_reason TEXT,
ADD COLUMN deactivated_by INT NULL,
ADD CONSTRAINT fk_deactivated_by FOREIGN KEY (deactivated_by) REFERENCES users(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX idx_products_deactivated ON products(is_deactivated_by_admin);
