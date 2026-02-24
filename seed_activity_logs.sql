-- Seed Data untuk Activity Logs
-- Data dummy untuk testing fitur Log Aktivitas User

SET time_zone = '+07:00';

-- Insert beberapa activity logs dummy
-- Ganti user_id dengan ID user yang ada di database Anda

-- LOGIN activities
INSERT INTO activity_logs (user_id, activity_type, description, ip_address, created_at) VALUES
(1, 'LOGIN', 'User login berhasil', '192.168.1.100', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(1, 'LOGIN', 'User login berhasil', '192.168.1.100', DATE_SUB(NOW(), INTERVAL 5 HOUR)),
(2, 'LOGIN', 'User login berhasil', '192.168.1.101', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(1, 'LOGIN', 'User login berhasil', '192.168.1.100', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(3, 'LOGIN', 'User login berhasil', '192.168.1.102', DATE_SUB(NOW(), INTERVAL 2 DAY));

-- CREATE activities
INSERT INTO activity_logs (user_id, activity_type, description, ip_address, created_at) VALUES
(1, 'CREATE', 'Menciptakan produk baru: "Susu UHT 1L"', '192.168.1.100', DATE_SUB(NOW(), INTERVAL 3 HOUR)),
(1, 'CREATE', 'Menciptakan produk baru: "Roti Tawar"', '192.168.1.100', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(2, 'CREATE', 'Menciptakan produk baru: "Telur Ayam 1kg"', '192.168.1.101', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(3, 'CREATE', 'Menciptakan catatan: "Belanja bulanan"', '192.168.1.102', DATE_SUB(NOW(), INTERVAL 4 DAY));

-- UPDATE activities
INSERT INTO activity_logs (user_id, activity_type, description, ip_address, created_at) VALUES
(1, 'UPDATE', 'Mengupdate produk "Susu UHT 1L" - Stok: 5 → 10', '192.168.1.100', DATE_SUB(NOW(), INTERVAL 4 HOUR)),
(2, 'UPDATE', 'Mengupdate profil user', '192.168.1.101', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(1, 'UPDATE', 'Mengupdate produk "Roti Tawar" - Stok: 3 → 8', '192.168.1.100', DATE_SUB(NOW(), INTERVAL 5 DAY));

-- DELETE activities
INSERT INTO activity_logs (user_id, activity_type, description, ip_address, created_at) VALUES
(1, 'DELETE', 'Menghapus produk "Kopi Bubuk 200g"', '192.168.1.100', DATE_SUB(NOW(), INTERVAL 6 HOUR)),
(2, 'DELETE', 'Menghapus catatan "Resep masakan"', '192.168.1.101', DATE_SUB(NOW(), INTERVAL 3 DAY));

-- VIEW activities
INSERT INTO activity_logs (user_id, activity_type, description, ip_address, created_at) VALUES
(1, 'VIEW', 'Melihat dashboard', '192.168.1.100', DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
(2, 'VIEW', 'Melihat halaman produk', '192.168.1.101', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(3, 'VIEW', 'Melihat pengaturan profil', '192.168.1.102', DATE_SUB(NOW(), INTERVAL 3 HOUR));

-- LOGOUT activities
INSERT INTO activity_logs (user_id, activity_type, description, ip_address, created_at) VALUES
(1, 'LOGOUT', 'User logout', '192.168.1.100', DATE_SUB(NOW(), INTERVAL 7 HOUR)),
(2, 'LOGOUT', 'User logout', '192.168.1.101', DATE_SUB(NOW(), INTERVAL 1 DAY));

-- EXPORT activities
INSERT INTO activity_logs (user_id, activity_type, description, ip_address, created_at) VALUES
(1, 'EXPORT', 'Mengekspor data produk ke CSV', '192.168.1.100', DATE_SUB(NOW(), INTERVAL 8 HOUR));

-- BAN/UNBAN activities (oleh admin)
INSERT INTO activity_logs (user_id, activity_type, description, ip_address, created_at) VALUES
(1, 'BAN', 'Admin membanned user ID: 5', '192.168.1.1', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(1, 'UNBAN', 'Admin meng-unban user ID: 5', '192.168.1.1', DATE_SUB(NOW(), INTERVAL 12 HOUR));

-- Tampilkan data yang sudah di-insert
SELECT 
    al.id,
    al.user_id,
    u.name as user_name,
    al.activity_type,
    al.description,
    al.ip_address,
    al.created_at
FROM activity_logs al
LEFT JOIN users u ON al.user_id = u.id
ORDER BY al.created_at DESC
LIMIT 20;
