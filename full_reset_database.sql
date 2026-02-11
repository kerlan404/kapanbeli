-- Reset database for KapanBeli application
DROP DATABASE IF EXISTS kapanbeli;
CREATE DATABASE kapanbeli CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE kapanbeli;

-- 1. Tabel Users (Identitas Pengguna)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    confirmation_token VARCHAR(255),
    is_confirmed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Kategori (Pengelompokan Bahan: Bumbu, Sayur, Protein)
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

-- 3. Tabel Bahan/Produk (Inti dari fitur "Bahan Saya") - DENGAN SEMUA KOLOM YANG DIPERLUKAN
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,            -- Pemilik bahan
    category_id INT,                 -- Kategori bahan
    name VARCHAR(255) NOT NULL,      -- Nama bahan (misal: Bawang Merah)
    stock_quantity DECIMAL(10, 2) DEFAULT 0, -- Jumlah stok saat ini
    unit VARCHAR(50) DEFAULT 'pcs',  -- Satuan (kg, gr, siung, ikat)
    min_stock_level DECIMAL(10, 2) DEFAULT 1.00, -- Batas minimal untuk "Saran Pembelian"
    expiry_date DATE,                -- Tanggal kadaluwarsa (sangat penting untuk bahan masak)
    image_url VARCHAR(500),
    description TEXT,                -- Deskripsi produk
    quantity DECIMAL(10, 2) DEFAULT 1.00, -- Jumlah satuan
    notes TEXT,                      -- Catatan tambahan
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- 4. Tabel Catatan (Fitur "Catatan Saya" / Checklist Belanja)
CREATE TABLE notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,      -- Misal: "Belanja Mingguan"
    content TEXT,                     -- Detail catatan tambahan
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Tabel Notifikasi (Peringatan Stok Habis atau Kadaluwarsa)
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'warning', 'error') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert sample categories
INSERT INTO categories (name, description) VALUES
('Bumbu Dapur', 'Berbagai jenis bumbu untuk memasak'),
('Sayuran', 'Berbagai jenis sayuran segar'),
('Buah-buahan', 'Berbagai jenis buah-buahan'),
('Protein', 'Sumber protein seperti daging, telur, tahu, tempe'),
('Bahan Kering', 'Bahan makanan kering seperti mie, beras'),
('Lainnya', 'Kategori umum untuk barang lainnya');

-- Insert sample user
INSERT INTO users (name, email, password, role) VALUES
('Admin', 'admin@example.com', '$2b$10$9Z9KpQ0dUzVwXyYzAbCdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz', 'admin'),
('User', 'user@example.com', '$2b$10$9Z9KpQ0dUzVwXyYzAbCdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz', 'user');