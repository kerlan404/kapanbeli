# 📊 Dokumentasi Sistem Analitik Pertumbuhan
## Kapan Beli Admin Panel

---

## 📋 Daftar Isi

1. [Gambaran Umum](#gambaran-umum)
2. [Fitur](#fitur)
3. [Struktur Database](#struktur-database)
4. [API Endpoints](#api-endpoints)
5. [Contoh Response](#contoh-response)
6. [Query SQL](#query-sql)
7. [Cara Menggunakan](#cara-menggunakan)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Gambaran Umum

Sistem Analitik Pertumbuhan adalah fitur dashboard admin untuk memantau:
- **Pengguna Baru** (New Users)
- **Login Harian** (Daily Logins)
- **Daily Active Users** (DAU)
- **Persentase Pertumbuhan** (Growth Percentage)

**Timezone:** Asia/Jakarta (WIB / UTC+07:00)

---

## ✨ Fitur

### 1. Filter Periode
- **Hari Ini** - Data real-time hari ini (per jam)
- **7 Hari Terakhir** - Data 7 hari terakhir (per hari)
- **Bulan Ini** - Data 30 hari terakhir (per hari)

### 2. Metrics yang Ditampilkan

| Metric | Deskripsi |
|--------|-----------|
| Total Pengguna | Jumlah semua user terdaftar |
| Pengguna Baru | User baru di periode terpilih |
| Total Login | Jumlah login di periode terpilih |
| Daily Active Users | User unik yang login |

### 3. Growth Percentage
Menghitung persentase pertumbuhan dibanding periode sebelumnya:
- **Hari Ini** vs Kemarin
- **7 Hari** vs 7 hari sebelumnya
- **Bulan Ini** vs 30 hari sebelumnya

### 4. Visualisasi Chart
- **Combined Chart** - Line (users) + Bar (logins)
- **Users Chart** - Line chart pertumbuhan user
- **Logins Chart** - Bar chart aktivitas login

---

## 🗄️ Struktur Database

### Tabel: `users`
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Tabel: `login_logs`
```sql
CREATE TABLE login_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    login_at DATETIME NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    session_id VARCHAR(255),
    logout_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 🔌 API Endpoints

### Base URL
```
Node.js: http://localhost:3000/api/admin/analytics
PHP:     http://localhost/kapanbeli/api/analytics.php
```

### 1. Get Full Analytics
```http
GET /api/admin/analytics?range={range}
```

**Parameters:**
| Parameter | Type | Required | Options | Default |
|-----------|------|----------|---------|---------|
| range | string | No | `today`, `7days`, `month` | `7days` |

**Example:**
```bash
GET /api/admin/analytics?range=today
GET /api/admin/analytics?range=7days
GET /api/admin/analytics?range=month
```

### 2. Get Summary (Quick Stats)
```http
GET /api/admin/analytics/summary
```

---

## 📤 Contoh Response

### Full Analytics Response
```json
{
  "success": true,
  "range": "7days",
  "period": "7 Hari Terakhir",
  "timestamp": "2024-02-24T10:30:00+07:00",
  "timezone": "Asia/Jakarta",
  "summary": {
    "totalUsers": 150,
    "totalLogins": 500,
    "dailyActiveUsers": 45,
    "newUsers": 25,
    "growth": {
      "users": {
        "current": 25,
        "previous": 20,
        "percentage": 25.00,
        "trend": "up"
      },
      "logins": {
        "current": 500,
        "previous": 450,
        "percentage": 11.11,
        "trend": "up"
      }
    }
  },
  "chart": {
    "labels": ["18 Feb", "19 Feb", "20 Feb", "21 Feb", "22 Feb", "23 Feb", "24 Feb"],
    "users": [3, 5, 2, 8, 4, 6, 7],
    "logins": [65, 72, 58, 80, 75, 85, 90]
  }
}
```

### Summary Response
```json
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "newUsersToday": 5,
    "loginsToday": 85,
    "dailyActiveUsers": 42,
    "onlineUsers": 15
  },
  "timestamp": "2024-02-24T10:30:00+07:00"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Invalid range. Use: today, 7days, or month"
}
```

---

## 📝 Query SQL

### 1. Pengguna Baru Hari Ini
```sql
SELECT COUNT(*) AS new_users_today 
FROM users 
WHERE DATE(created_at) = CURDATE();
```

### 2. Pengguna Baru (Grouped by Date)
```sql
-- 7 Hari Terakhir
SELECT 
    DATE_FORMAT(created_at, '%Y-%m-%d') AS date,
    COUNT(*) AS new_users
FROM users
WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
ORDER BY date ASC;

-- Bulan Ini (30 Hari)
SELECT 
    DATE_FORMAT(created_at, '%Y-%m-%d') AS date,
    COUNT(*) AS new_users
FROM users
WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
ORDER BY date ASC;

-- Hari Ini (per Jam)
SELECT 
    DATE_FORMAT(created_at, '%H:00') AS hour,
    COUNT(*) AS new_users
FROM users
WHERE DATE(created_at) = CURDATE()
GROUP BY DATE_FORMAT(created_at, '%H:00')
ORDER BY hour ASC;
```

### 3. Login Harian
```sql
-- Total Login Hari Ini
SELECT COUNT(*) AS logins_today 
FROM login_logs 
WHERE DATE(login_at) = CURDATE();

-- Login per Tanggal (7 Hari)
SELECT 
    DATE_FORMAT(login_at, '%Y-%m-%d') AS date,
    COUNT(*) AS total_logins,
    COUNT(DISTINCT user_id) AS daily_active_users
FROM login_logs
WHERE DATE(login_at) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
GROUP BY DATE_FORMAT(login_at, '%Y-%m-%d')
ORDER BY date ASC;

-- Login per Jam (Hari Ini)
SELECT 
    DATE_FORMAT(login_at, '%H:00') AS hour,
    COUNT(*) AS total_logins
FROM login_logs
WHERE DATE(login_at) = CURDATE()
GROUP BY DATE_FORMAT(login_at, '%H:00')
ORDER BY hour ASC;
```

### 4. Total Users & Logins
```sql
-- Total Semua Users
SELECT COUNT(*) AS total_users FROM users;

-- Total Login (Range)
SELECT COUNT(*) AS total_logins 
FROM login_logs 
WHERE DATE(login_at) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY);
```

### 5. Daily Active Users (DAU)
```sql
SELECT COUNT(DISTINCT user_id) AS dau 
FROM login_logs 
WHERE DATE(login_at) = CURDATE();
```

### 6. Growth Percentage
```sql
-- Growth Users (7 Hari vs 7 Hari Sebelumnya)
SELECT 
    ((curr.new_users - prev.new_users) / NULLIF(prev.new_users, 0)) * 100 AS growth_percentage
FROM 
    (SELECT COUNT(*) AS new_users FROM users 
     WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)) curr,
    (SELECT COUNT(*) AS new_users FROM users 
     WHERE DATE(created_at) BETWEEN DATE_SUB(CURDATE(), INTERVAL 13 DAY) 
     AND DATE_SUB(CURDATE(), INTERVAL 7 DAY)) prev;
```

---

## 🚀 Cara Menggunakan

### 1. Setup Database

Jalankan migration:
```bash
# Via MySQL CLI
mysql -u root -p kapanbeli < analytics_migration.sql

# Via phpMyAdmin
# Import file: analytics_migration.sql
```

### 2. Seed Data Testing (Optional)
```bash
# Via MySQL CLI
mysql -u root -p kapanbeli < seed_analytics_data.sql
```

### 3. Akses Dashboard Admin

**Node.js:**
```
http://localhost:3000/admin/analytics
```

**PHP:**
```
http://localhost/kapanbeli/views/admin-analytics.ejs
```

### 4. Test API

**Node.js:**
```bash
curl http://localhost:3000/api/admin/analytics?range=today
curl http://localhost:3000/api/admin/analytics?range=7days
curl http://localhost:3000/api/admin/analytics?range=month
curl http://localhost:3000/api/admin/analytics/summary
```

**PHP:**
```bash
curl http://localhost/kapanbeli/api/analytics.php?range=today
curl http://localhost/kapanbeli/api/analytics.php?range=7days
curl http://localhost/kapanbeli/api/analytics.php?range=month
curl http://localhost/kapanbeli/api/analytics.php?action=summary
```

### 5. Integrasi dengan Chart.js

```html
<canvas id="analyticsChart"></canvas>
<script>
async function loadAnalytics() {
    const response = await fetch('/api/admin/analytics?range=7days');
    const data = await response.json();
    
    if (data.success) {
        new Chart(document.getElementById('analyticsChart'), {
            type: 'line',
            data: {
                labels: data.chart.labels,
                datasets: [{
                    label: 'Pengguna Baru',
                    data: data.chart.users,
                    borderColor: '#2E86DE',
                    fill: true
                }]
            }
        });
    }
}
</script>
```

---

## 🔧 Troubleshooting

### 1. Data Tidak Muncul
**Solusi:**
- Pastikan tabel `users` dan `login_logs` ada
- Cek timezone MySQL: `SELECT @@time_zone;`
- Set timezone: `SET time_zone = '+07:00';`

### 2. Error Database Connection
**Solusi:**
```javascript
// Node.js: Cek .env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=kapanbeli
```

```php
// PHP: Cek konfigurasi
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', 'your_password');
define('DB_NAME', 'kapanbeli');
```

### 3. Growth Percentage 0%
**Penyebab:** Tidak ada data di periode sebelumnya
**Solusi:** Seed data testing dengan `seed_analytics_data.sql`

### 4. Chart Kosong
**Solusi:**
- Cek response API di browser console (F12)
- Pastikan data `labels`, `users`, `logins` tidak empty
- Reload halaman dengan Ctrl+F5

---

## 📁 Struktur File

```
kapanbeli/
├── api/
│   └── analytics.php              # PHP API endpoint
├── controllers/
│   └── adminAnalyticsController.js # Node.js controller
├── routes/
│   └── adminAnalytics.js          # Node.js routes
├── views/
│   └── admin-analytics.ejs        # Dashboard UI
├── analytics_migration.sql        # Database migration
├── seed_analytics_data.sql        # Sample data
└── ANALYTICS_DOCUMENTATION.md     # Dokumentasi ini
```

---

## 🎨 Customization

### Mengubah Timezone
```javascript
// Node.js: controllers/adminAnalyticsController.js
static get CONFIG() {
    return {
        TIMEZONE: '+07:00', // Ubah sesuai kebutuhan
        // '+08:00' untuk WITA
        // '+09:00' untuk WIT
    };
}
```

```php
// PHP: api/analytics.php
define('TIMEZONE_OFFSET', '+07:00'); // Ubah sesuai kebutuhan
```

### Mengubah Range Filter
Tambahkan di controller:
```javascript
'ranges': {
    'today': { days: 1, previousDays: 1, label: 'Hari Ini' },
    '7days': { days: 7, previousDays: 7, label: '7 Hari Terakhir' },
    'month': { days: 30, previousDays: 30, label: 'Bulan Ini' },
    '3months': { days: 90, previousDays: 90, label: '3 Bulan' } // Custom
}
```

---

## 📞 Support

Untuk pertanyaan atau issue:
1. Cek dokumentasi ini terlebih dahulu
2. Periksa console browser untuk error
3. Cek log server untuk database errors

---

**Version:** 1.0.0  
**Last Updated:** 24 Februari 2024  
**Author:** Kapan Beli Development Team
