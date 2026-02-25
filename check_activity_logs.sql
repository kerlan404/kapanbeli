-- Script untuk memastikan tabel activity_logs ada dan memiliki data
-- Jalankan script ini di MySQL

USE kapanbeli;

-- 1. Pastikan tabel activity_logs ada
CREATE TABLE IF NOT EXISTS activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_activity_type (activity_type),
    INDEX idx_created_at (created_at),
    CONSTRAINT fk_activity_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Cek apakah ada user di database
SELECT id, name, email FROM users LIMIT 5;

-- 3. Insert data dummy jika tabel kosong
-- Ganti user_id dengan ID user yang ada di database Anda
INSERT INTO activity_logs (user_id, activity_type, description, ip_address, created_at)
SELECT 
    u.id as user_id,
    'LOGIN' as activity_type,
    'User login berhasil' as description,
    '127.0.0.1' as ip_address,
    DATE_SUB(NOW(), INTERVAL 1 HOUR) as created_at
FROM users u
LIMIT 1;

INSERT INTO activity_logs (user_id, activity_type, description, ip_address, created_at)
SELECT 
    u.id as user_id,
    'CREATE' as activity_type,
    'Menciptakan produk baru: "Produk Test"' as description,
    '127.0.0.1' as ip_address,
    DATE_SUB(NOW(), INTERVAL 2 HOUR) as created_at
FROM users u
LIMIT 1;

INSERT INTO activity_logs (user_id, activity_type, description, ip_address, created_at)
SELECT 
    u.id as user_id,
    'UPDATE' as activity_type,
    'Mengupdate produk "Produk Test"' as description,
    '127.0.0.1' as ip_address,
    DATE_SUB(NOW(), INTERVAL 3 HOUR) as created_at
FROM users u
LIMIT 1;

INSERT INTO activity_logs (user_id, activity_type, description, ip_address, created_at)
SELECT 
    u.id as user_id,
    'DELETE' as activity_type,
    'Menghapus produk lama' as description,
    '127.0.0.1' as ip_address,
    DATE_SUB(NOW(), INTERVAL 4 HOUR) as created_at
FROM users u
LIMIT 1;

INSERT INTO activity_logs (user_id, activity_type, description, ip_address, created_at)
SELECT 
    u.id as user_id,
    'LOGOUT' as activity_type,
    'User logout' as description,
    '127.0.0.1' as ip_address,
    DATE_SUB(NOW(), INTERVAL 5 HOUR) as created_at
FROM users u
LIMIT 1;

-- 4. Tampilkan semua activity logs
SELECT 
    al.id,
    al.user_id,
    u.name as user_name,
    u.email as user_email,
    al.activity_type,
    al.description,
    al.ip_address,
    al.created_at
FROM activity_logs al
LEFT JOIN users u ON al.user_id = u.id
ORDER BY al.created_at DESC
LIMIT 20;

-- 5. Hitung total activity logs
SELECT COUNT(*) as total FROM activity_logs;
