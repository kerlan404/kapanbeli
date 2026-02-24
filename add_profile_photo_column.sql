-- Add profile photo column to users table
ALTER TABLE users 
ADD COLUMN profile_photo VARCHAR(500) NULL AFTER email;

-- Add index for faster lookups
ALTER TABLE users 
ADD INDEX idx_profile_photo (profile_photo);
