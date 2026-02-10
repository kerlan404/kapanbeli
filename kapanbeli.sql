-- Schema database untuk aplikasi Kapan Beli
-- File ini berisi semua tabel yang diperlukan untuk aplikasi catatan stok bahan masak

-- Membuat database
CREATE DATABASE IF NOT EXISTS kapanbeli_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE kapanbeli_db;

-- Tabel pengguna (users)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    is_confirmed BOOLEAN DEFAULT FALSE,
    confirmation_token VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel kategori produk (categories)
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel produk (products)
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INT,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INT DEFAULT 0,
    min_stock_level INT DEFAULT 5,
    image_url VARCHAR(500),
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Tabel wishlist (wishlist)
CREATE TABLE wishlist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Tabel pengaturan pengguna (user_settings)
CREATE TABLE user_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    notification_email BOOLEAN DEFAULT TRUE,
    notification_push BOOLEAN DEFAULT TRUE,
    currency VARCHAR(3) DEFAULT 'IDR',
    language VARCHAR(5) DEFAULT 'id-ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabel notifikasi (notifications)
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'warning', 'error', 'success') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabel toko/penjual (vendors)
CREATE TABLE vendors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_info TEXT,
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    rating DECIMAL(3, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel berbagi daftar belanja (shared_lists)
CREATE TABLE shared_lists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    owner_user_id INT NOT NULL,
    shared_with_user_id INT NOT NULL,
    list_type ENUM('shopping', 'inventory', 'wishlist') NOT NULL,
    permission_level ENUM('view', 'edit') DEFAULT 'view',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_with_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabel preferensi pengguna (user_preferences)
CREATE TABLE user_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    preference_key VARCHAR(100) NOT NULL,
    preference_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_preference (user_id, preference_key)
);

-- Tabel statistik pengguna (user_statistics)
CREATE TABLE user_statistics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_products_added INT DEFAULT 0,
    total_purchases INT DEFAULT 0,
    total_spent DECIMAL(12, 2) DEFAULT 0.00,
    last_active_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabel catatan (notes)
CREATE TABLE notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Menambahkan indeks untuk performa
CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_wishlist_user_id ON wishlist(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_vendors_location ON vendors(latitude, longitude);
CREATE INDEX idx_notes_user_id ON notes(user_id);

-- Menambahkan data awal untuk kategori
INSERT INTO categories (name, description) VALUES
('Bumbu', 'Bumbu dan rempah-rempah'),
('Sayuran', 'Sayur-sayuran segar'),
('Buah-buahan', 'Buah-buahan segar'),
('Daging', 'Daging segar'),
('Seafood', 'Ikan dan makanan laut'),
('Minyak', 'Minyak untuk memasak'),
('Biji-bijian', 'Beras, gandum, dan biji-bijian lainnya'),
('Makanan', 'Produk makanan olahan'),
('Minuman', 'Minuman berbagai jenis'),
('Rumah Tangga', 'Perlengkapan rumah tangga');

-- Menambahkan data contoh pengguna (password di-hash menggunakan bcrypt)
-- Password: password123
INSERT INTO users (name, email, password, role) VALUES
('Admin Kapan Beli', 'admin@kapanbeli.com', '$2b$10$EpRtVQ.CN5a6xH5o4LjFvO0v0v0v0v0v0v0v0v0v0v0v0v0v0v0v0', 'admin'),
('John Doe', 'john@example.com', '$2b$10$EpRtVQ.CN5a6xH5o4LjFvO0v0v0v0v0v0v0v0v0v0v0v0v0v0v0v0', 'user'),
('Jane Smith', 'jane@example.com', '$2b$10$EpRtVQ.CN5a6xH5o4LjFvO0v0v0v0v0v0v0v0v0v0v0v0v0v0v0v0', 'user');

-- Menambahkan data contoh toko
INSERT INTO vendors (name, contact_info, address, latitude, longitude, rating) VALUES
('Toko Bahan Segar', '021-1234-5678', 'Jl. Segar No. 123, Jakarta', -6.20000000, 106.81666600, 4.5),
('Warung Bumbu Prima', '021-8765-4321', 'Jl. Rempah No. 45, Jakarta', -6.17539400, 106.82706200, 4.7),
('Pasar Induk', '021-5555-5555', 'Jl. Pasar No. 67, Jakarta', -6.18054500, 106.82867300, 4.2);

-- Menambahkan data contoh produk
INSERT INTO products (name, description, category_id, price, stock_quantity, min_stock_level, user_id) VALUES
('Bawang Merah', 'Bawang merah segar untuk bumbu', 1, 25000, 2, 1, 2),
('Bawang Putih', 'Bawang putih segar untuk bumbu', 1, 30000, 5, 1, 2),
('Cabai Merah', 'Cabai merah besar untuk masakan', 2, 40000, 3, 1, 2),
('Tomat', 'Tomat segar untuk sayur', 2, 15000, 12, 2, 2),
('Beras', 'Beras premium 1kg', 7, 15000, 10, 3, 2);