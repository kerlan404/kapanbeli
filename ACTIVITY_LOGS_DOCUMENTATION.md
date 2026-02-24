# 📝 Log Aktivitas User - Dokumentasi

## Overview
Fitur **Log Aktivitas User** untuk mencatat dan menampilkan semua aktivitas yang dilakukan oleh user di sistem Kapan Beli.

---

## 📁 File yang Dibuat

### Backend
```
├── activity_logs_migration.sql          # Database migration
├── services/
│   └── activityLogsService.js           # Service dengan reusable function
├── controllers/
│   └── activityLogsController.js        # Controller untuk API endpoints
└── routes/
    └── activityLogs.js                  # Route definitions
```

### Frontend
```
└── views/
    └── admin-dashboard.ejs              # Updated dengan section Log Aktivitas
```

---

## 🗄️ Database Schema

```sql
CREATE TABLE activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_activity_type (activity_type),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Menjalankan Migration
```bash
mysql -u username -p database_name < activity_logs_migration.sql
```

---

## 🔧 Cara Menggunakan

### 1. Log Aktivitas (Reusable Function)

```javascript
const activityLogs = require('./services/activityLogsService');

// Cara 1: Menggunakan function log()
await activityLogs.log(userId, 'LOGIN', 'User login berhasil', ipAddress);

// Cara 2: Menggunakan konstanta ActivityType
const { ActivityType, log } = require('./services/activityLogsService');

await log(userId, ActivityType.LOGIN, 'User login berhasil', ipAddress);
await log(userId, ActivityType.CREATE, 'Menambahkan produk baru', ipAddress);
await log(userId, ActivityType.DELETE, 'Menghapus produk', ipAddress);
await log(userId, ActivityType.UPDATE, 'Mengupdate profil', ipAddress);
await log(userId, ActivityType.BAN, 'User di-ban oleh admin', ipAddress);
await log(userId, ActivityType.UNBAN, 'User di-unban', ipAddress);
```

### 2. Integrasi di Controller/Route

```javascript
const { log, ActivityType } = require('../services/activityLogsService');

// Contoh di login controller
exports.login = async (req, res) => {
    try {
        // ... login logic ...
        
        // Log aktivitas
        await log(user.id, ActivityType.LOGIN, 'User login', req.ip);
        
        res.json({ success: true });
    } catch (error) {
        // ...
    }
};

// Contoh di products controller
exports.createProduct = async (req, res) => {
    try {
        // ... create product logic ...
        
        // Log aktivitas
        await log(req.session.user.id, ActivityType.CREATE, 
                  `Menciptakan produk: ${product.name}`, req.ip);
        
        res.json({ success: true });
    } catch (error) {
        // ...
    }
};
```

---

## 🌐 API Endpoints

### GET /api/activity-logs

Mengambil log aktivitas dengan pagination dan filter.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `range` | string | `7days` | Periode: `today`, `7days`, `month` |
| `search` | string | - | Cari berdasarkan nama/email user |
| `page` | number | `1` | Nomor halaman |
| `limit` | number | `10` | Item per halaman (max 100) |
| `activityType` | string | - | Filter tipe: `LOGIN`, `CREATE`, `UPDATE`, `DELETE`, dll |

**Contoh Request:**
```bash
GET /api/activity-logs?range=7days&page=1&limit=10
GET /api/activity-logs?range=today&search=john
GET /api/activity-logs?range=month&activityType=LOGIN
```

**Response:**
```json
{
  "success": true,
  "message": "Activity logs retrieved successfully",
  "data": [
    {
      "id": 1,
      "user_id": 5,
      "activity_type": "LOGIN",
      "description": "User login berhasil",
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0...",
      "created_at": "2024-01-15T10:30:00.000Z",
      "user_name": "John Doe",
      "user_email": "john@example.com"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 10,
    "totalPages": 15
  },
  "filters": {
    "range": "7days",
    "search": "",
    "activityType": ""
  }
}
```

---

### GET /api/activity-logs/statistics

Mengambil statistik aktivitas berdasarkan periode.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `range` | string | `7days` | Periode: `today`, `7days`, `month` |

**Response:**
```json
{
  "success": true,
  "stats": {
    "LOGIN": 45,
    "CREATE": 23,
    "UPDATE": 12,
    "DELETE": 5
  },
  "total": 85
}
```

---

### POST /api/activity-logs

Create activity log baru (internal use).

**Request Body:**
```json
{
  "userId": 5,
  "activityType": "LOGIN",
  "description": "User login berhasil",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Activity logged successfully",
  "data": {
    "id": 123,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## 🎨 Frontend Features

### Filter & Search
- **Dropdown Periode**: Hari Ini, 7 Hari Terakhir, Bulan Ini
- **Dropdown Tipe Aktivitas**: Semua tipe aktivitas
- **Search Input**: Cari berdasarkan nama/email user (dengan debounce 500ms)
- **Refresh Button**: Reload data manual

### Pagination
- Smart pagination dengan max 5 tombol terlihat
- First/Last page buttons
- Previous/Next buttons
- Showing X - Y dari Z data

### Activity Type Badges (Warna)
| Tipe | Warna | Class |
|------|-------|-------|
| LOGIN | Hijau | `activity-badge-login` |
| LOGOUT | Abu-abu | `activity-badge-logout` |
| CREATE | Kuning/Orange | `activity-badge-create` |
| UPDATE | Biru | `activity-badge-update` |
| DELETE | Merah | `activity-badge-delete` |
| VIEW | Biru Muda | `activity-badge-view` |
| EXPORT | Ungu | `activity-badge-export` |
| BAN | Merah (border) | `activity-badge-ban` |
| UNBAN | Hijau (border) | `activity-badge-unban` |

### Statistics Summary
- Total Aktivitas
- Login Count
- Create Count
- Update Count
- Delete Count

---

## 🔒 Security

1. **Authentication Required**: Semua endpoint memerlukan session user
2. **Admin Only**: Hanya admin yang dapat mengakses log
3. **Prepared Statements**: Semua query menggunakan prepared statements untuk mencegah SQL injection
4. **Input Validation**: Validasi untuk semua input parameters
5. **Rate Limiting**: Debounce pada search input (500ms)

---

## 📊 Timezone

Semua waktu menggunakan **Asia/Jakarta (WIB)** - UTC+7

```javascript
await db.execute("SET time_zone = '+07:00'");
```

---

## 🧪 Testing

### Test API dengan curl
```bash
# Get logs
curl -X GET "http://localhost:3000/api/activity-logs?range=7days&page=1&limit=10" \
  -H "Cookie: session=YOUR_SESSION_ID"

# Get statistics
curl -X GET "http://localhost:3000/api/activity-logs/statistics?range=today" \
  -H "Cookie: session=YOUR_SESSION_ID"

# Create log
curl -X POST "http://localhost:3000/api/activity-logs" \
  -H "Content-Type: application/json" \
  -H "Cookie: session=YOUR_SESSION_ID" \
  -d '{
    "userId": 1,
    "activityType": "LOGIN",
    "description": "Test login"
  }'
```

### Test Function di Code
```javascript
// Di file controller manapun
const { log, ActivityType } = require('../services/activityLogsService');

// Test log
const result = await log(1, ActivityType.LOGIN, 'Test login', '127.0.0.1');
console.log(result); // { success: true, id: 123, timestamp: ... }
```

---

## 🚀 Best Practices

1. **Selalu Log Critical Actions**:
   - Login/Logout
   - Create/Update/Delete data
   - Ban/Unban user
   - Export/Import data

2. **Deskripsi yang Jelas**:
   ```javascript
   // ❌ Buruk
   await log(userId, 'UPDATE', 'Update data');
   
   // ✅ Baik
   await log(userId, ActivityType.UPDATE, 
             `Mengupdate produk "${productName}" - Stok: ${oldStock} → ${newStock}`);
   ```

3. **Include IP Address**:
   ```javascript
   await log(userId, activityType, description, req.ip);
   ```

4. **Async/Await**:
   ```javascript
   // Gunakan async/await untuk memastikan log selesai sebelum response
   await log(userId, activityType, description);
   ```

---

## 🐛 Troubleshooting

### Error: "Table 'activity_logs' doesn't exist"
```bash
# Jalankan migration
mysql -u username -p database_name < activity_logs_migration.sql
```

### Error: "Authentication required"
- Pastikan user sudah login
- Check session middleware
- Cookie harus dikirim dengan request

### Error: "Access denied. Admin only."
- User harus memiliki role `admin`
- Check `req.session.user.role === 'admin'`

### Data tidak muncul di tabel
- Check console browser untuk error
- Verify API response di Network tab
- Pastikan timezone database benar (Asia/Jakarta)

---

## 📝 Contoh Integrasi Lengkap

### Di Auth Controller (Login)
```javascript
const { log, ActivityType } = require('../services/activityLogsService');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // ... validasi user ...
        
        // Log aktivitas
        await log(user.id, ActivityType.LOGIN, 
                  `User login: ${user.email}`, req.ip);
        
        res.json({ success: true, redirect: '/dashboard' });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
```

### Di Products Controller (Create)
```javascript
const { log, ActivityType } = require('../services/activityLogsService');

exports.createProduct = async (req, res) => {
    try {
        const { name, stock_quantity, min_stock_level, unit } = req.body;
        const userId = req.session.user.id;
        
        const [result] = await db.execute(
            'INSERT INTO products (user_id, name, stock_quantity, min_stock_level, unit) VALUES (?, ?, ?, ?, ?)',
            [userId, name, stock_quantity, min_stock_level, unit]
        );
        
        // Log aktivitas
        await log(userId, ActivityType.CREATE, 
                  `Menciptakan produk baru: "${name}" (Stok: ${stock_quantity} ${unit})`, 
                  req.ip);
        
        res.json({ 
            success: true, 
            message: 'Produk berhasil ditambahkan',
            productId: result.insertId 
        });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
```

### Di Admin Controller (Ban User)
```javascript
const { log, ActivityType } = require('../services/activityLogsService');

exports.banUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const adminId = req.session.user.id;
        
        await db.execute('UPDATE users SET is_active = 0 WHERE id = ?', [userId]);
        
        // Log aktivitas untuk user yang di-ban
        await log(userId, ActivityType.BAN, 
                  `User di-ban oleh admin`, req.ip);
        
        // Log aktivitas untuk admin yang melakukan ban
        await log(adminId, ActivityType.BAN, 
                  `Admin membanned user ID: ${userId}`, req.ip);
        
        res.json({ success: true, message: 'User berhasil di-ban' });
    } catch (error) {
        console.error('Ban user error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
```

---

## 📄 License

Copyright © 2024 Kapan Beli
