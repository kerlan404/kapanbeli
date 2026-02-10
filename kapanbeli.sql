-- 1. Tabel Users (Identitas Pengguna)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Kategori (Pengelompokan Bahan: Bumbu, Sayur, Protein)
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

-- 3. Tabel Bahan/Produk (Inti dari fitur "Bahan Saya")
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