# Setup Guide - Login Tracking & Admin Features

## Fitur Baru yang Ditambahkan

### 1. **5 User Terdaftar Otomatis**
   - 5 akun user sudah terdaftar dengan data lengkap
   - Setiap user memiliki produk sample di catatan mereka
   - Email: ahmad@example.com, siti@example.com, budi@example.com, dewi@example.com, eko@example.com
   - Password: `user123`

### 2. **Tracking Login/Logout**
   - Tanggal, waktu, dan tahun login tercatat otomatis
   - IP address dan user agent disimpan
   - Logout time tercatat saat user log out
   - Total login count dihitung otomatis

### 3. **Admin Dashboard dengan Grafik Otomatis**
   - Statistik total user, produk, dan notes
   - Grafik produk per user (otomatis dari data)
   - Grafik produk per kategori
   - Aktivitas login (7 hari terakhir)
   - User online hari ini

### 4. **Info User Log Out**
   - Log aktivitas login/logout tersedia
   - Admin dapat melihat riwayat login semua user
   - Waktu logout tercatat di database

### 5. **Admin Dapat Ban User**
   - Ban user dengan alasan tertentu
   - Unban user kapan saja
   - User yang di-ban tidak bisa login
   - Daftar banned users terpisah

---

## Cara Setup

### Langkah 1: Jalankan Database Migration

Buka MySQL dan jalankan:

```sql
-- File: database_migration.sql
```

Atau copy-paste SQL berikut ke MySQL Workbench/phpMyAdmin:

```sql
-- 1. Add login tracking columns to users table
ALTER TABLE users 
ADD COLUMN last_login DATETIME NULL,
ADD COLUMN last_logout DATETIME NULL,
ADD COLUMN last_ip VARCHAR(45) NULL,
ADD COLUMN is_banned BOOLEAN DEFAULT FALSE,
ADD COLUMN ban_reason VARCHAR(255) NULL,
ADD COLUMN banned_at DATETIME NULL,
ADD COLUMN banned_by INT NULL,
ADD COLUMN login_count INT DEFAULT 0,
ADD COLUMN status ENUM('active', 'inactive', 'banned') DEFAULT 'active';

-- 2. Create login_logs table
CREATE TABLE IF NOT EXISTS login_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    login_time DATETIME NOT NULL,
    logout_time DATETIME NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    session_id VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Create user_stats table
CREATE TABLE IF NOT EXISTS user_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_products INT DEFAULT 0,
    total_notes INT DEFAULT 0,
    total_logins INT DEFAULT 0,
    last_activity DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Add indexes
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_login_logs_user_id ON login_logs(user_id);
CREATE INDEX idx_login_logs_login_time ON login_logs(login_time);
```

### Langkah 2: Jalankan Seed Data

Jalankan command berikut di terminal:

```bash
node seed_data.js
```

Ini akan membuat:
- 5 user default dengan produk sample
- Kategori produk
- Statistik user

### Langkah 3: Restart Server

```bash
npm start
```

---

## Cara Menggunakan

### Login sebagai Admin Default
- Email: `admin@kapanbeli.com`
- Password: `admin123`

### Login sebagai User Sample
- Email: `ahmad@example.com`, `siti@example.com`, `budi@example.com`, `dewi@example.com`, `eko@example.com`
- Password: `user123`

---

## API Endpoints Baru

### Admin Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/admin/stats` | Statistik dashboard |
| GET | `/api/admin/users` | Daftar semua user |
| GET | `/api/admin/activity` | Log aktivitas login |
| GET | `/api/admin/products` | Semua produk dari semua user |
| GET | `/api/admin/user/:id` | Detail user lengkap |
| GET | `/api/admin/user/:id/products` | Produk dari user tertentu |
| POST | `/api/admin/user/:userId/ban` | Ban user (body: `{ reason: "alasan" }`) |
| POST | `/api/admin/user/:userId/unban` | Unban user |
| GET | `/api/admin/users/banned` | Daftar user yang di-ban |
| GET | `/api/admin/stats/products-by-user` | Statistik produk per user |
| GET | `/api/admin/stats/login-activity` | Aktivitas login untuk grafik |

---

## Struktur Database Baru

### Tabel `users` (Kolom Baru)
- `last_login` - Waktu login terakhir
- `last_logout` - Waktu logout terakhir
- `last_ip` - IP address terakhir
- `is_banned` - Status ban (TRUE/FALSE)
- `ban_reason` - Alasan ban
- `banned_at` - Waktu ban
- `banned_by` - ID admin yang ban
- `login_count` - Total login
- `status` - Status user (active/inactive/banned)

### Tabel `login_logs`
- `id` - Primary key
- `user_id` - ID user
- `login_time` - Waktu login
- `logout_time` - Waktu logout
- `ip_address` - IP address
- `user_agent` - Browser info
- `session_id` - Session ID
- `created_at` - Timestamp

### Tabel `user_stats`
- `id` - Primary key
- `user_id` - ID user
- `total_products` - Total produk
- `total_notes` - Total catatan
- `total_logins` - Total login
- `last_activity` - Aktivitas terakhir
- `created_at` - Timestamp
- `updated_at` - Timestamp update

---

## Fitur Admin Dashboard

### 1. Dashboard Utama
- Total Users (aktif, banned)
- Total Produk
- Total Notes
- User online hari ini

### 2. Halaman Users
- Daftar semua user dengan status
- Info login terakhir
- Total produk dan notes
- Aksi: Ban/Unban, Lihat detail

### 3. Halaman Analytics
- Grafik produk per user
- Grafik produk per kategori
- Grafik aktivitas login (7 hari)

### 4. Halaman Activity Logs
- Riwayat login/logout semua user
- IP address dan waktu
- Durasi sesi

---

## Contoh Penggunaan Ban/Unban

### Ban User via API:
```javascript
POST /api/admin/user/2/ban
Content-Type: application/json
{
    "reason": "Melanggar ketentuan penggunaan"
}
```

### Unban User via API:
```javascript
POST /api/admin/user/2/unban
```

---

## Troubleshooting

### Error: "Table doesn't exist"
Jalankan migration SQL terlebih dahulu.

### Error: "Column doesn't exist"
Pastikan semua ALTER TABLE sudah dijalankan.

### Seed data tidak muncul
1. Cek koneksi database di `.env`
2. Pastikan database sudah dibuat
3. Jalankan ulang `node seed_data.js`

### Login tracking tidak bekerja
1. Pastikan tabel `login_logs` sudah dibuat
2. Cek console log untuk error
3. Restart server setelah migration

---

## Catatan Penting

1. **Keamanan**: User yang di-ban tidak bisa login sama sekali
2. **Otomatis**: Statistik dan grafik update otomatis saat user menambah produk
3. **Tracking**: Semua login/logout tercatat dengan IP dan waktu
4. **Admin Protection**: Admin tidak bisa di-ban oleh user lain

---

## File yang Dimodifikasi

1. `models/User.js` - Fungsi tracking login/logout, ban/unban
2. `controllers/authController.js` - Track login saat auth
3. `controllers/adminController.js` - Ban/unban, statistik lengkap
4. `routes/admin.js` - Endpoint baru untuk ban/unban
5. `database_migration.sql` - Migration schema
6. `seed_data.js` - Seed 5 user default

---

## Developer Notes

- Semua fungsi tracking bersifat otomatis
- Grafik di frontend akan mengikuti data dari API `/api/admin/stats`
- Session management tetap menggunakan express-session
- Password user sample: `user123` (hash bcrypt)
