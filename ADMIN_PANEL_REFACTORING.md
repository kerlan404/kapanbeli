# Admin Panel Refactoring Documentation

## 📋 Overview

Dokumen ini menjelaskan refactoring lengkap admin panel untuk memastikan **konsistensi 100%** pada:
- Sidebar (global, konsisten di semua halaman)
- Statistik (sumber data tunggal)
- Layout (komponen reusable)
- Database schema (standarisasi field)

---

## 🎯 Masalah yang Diperbaiki

### Sebelum Refactoring:
1. ❌ **Sidebar berbeda** di setiap halaman (duplikasi kode)
2. ❌ **Statistik tidak konsisten** antara Dashboard dan Users
3. ❌ **Setiap halaman menghitung statistik sendiri** (tidak ada sumber tunggal)
4. ❌ **Field database tidak standar** (status: 'aktif'/'nonaktif' vs 'active'/'inactive')
5. ❌ **Tidak ada layout global** (setiap halaman punya struktur sendiri)

### Setelah Refactoring:
1. ✅ **Sidebar global** menggunakan partial EJS
2. ✅ **Statistik konsisten** dari 1 endpoint API
3. ✅ **Single source of truth**: `/api/admin/stats`
4. ✅ **Database distandarisasi**: `account_status ENUM('active','inactive','suspended')`
5. ✅ **Layout global** dengan partials reusable

---

## 📁 Struktur Folder Baru

```
kapanbeli/
├── controllers/
│   └── adminController.js          # Updated: menggunakan adminService
├── services/
│   ├── adminService.js             # NEW: Service terpusat untuk admin
│   └── userService.js
├── views/
│   ├── partials/
│   │   ├── admin-head.ejs          # NEW: Head global admin
│   │   ├── admin-sidebar.ejs       # NEW: Sidebar global
│   │   ├── admin-topbar.ejs        # NEW: Topbar global
│   │   ├── admin-layout-start.ejs  # NEW: Layout wrapper start
│   │   ├── admin-layout-end.ejs    # NEW: Layout wrapper end
│   │   └── stat-card.ejs           # NEW: Komponen card statistik
│   ├── admin-dashboard-new.ejs     # NEW: Dashboard dengan layout baru
│   └── admin-users-new.ejs         # NEW: Users dengan layout baru
├── routes/
│   └── admin.js                    # Updated: endpoint baru
├── server.js                       # Updated: route admin
├── standardize_admin_db.sql        # NEW: Migration database
└── run_admin_migration.js          # NEW: Script migration
```

---

## 🔧 Komponen Reusable

### 1. Sidebar (`views/partials/admin-sidebar.ejs`)

**Fitur:**
- Highlight otomatis sesuai halaman aktif
- Struktur menu konsisten
- User profile di footer
- Logout button

**Penggunaan:**
```ejs
<%- include('./partials/admin-sidebar', { 
    currentPage: 'dashboard',  // 'dashboard', 'users', 'analytics', dll
    user: user 
}) %>
```

### 2. StatCard (`views/partials/stat-card.ejs`)

**Fitur:**
- Styling konsisten
- Support trend indicator (up/down)
- Auto-format angka (toLocaleString)
- 4 varian warna (blue, green, orange, red)

**Penggunaan:**
```ejs
<%- include('./partials/stat-card', { 
    title: 'Total Pengguna', 
    value: 150, 
    icon: 'fa-users', 
    color: 'blue',
    subtitle: '12 baru hari ini',
    trend: 'up'
}) %>
```

### 3. Topbar (`views/partials/admin-topbar.ejs`)

**Fitur:**
- Page title
- Breadcrumb navigation
- Dark mode toggle
- Action buttons support

**Penggunaan:**
```ejs
<%- include('./partials/admin-topbar', { 
    title: 'Dashboard',
    breadcrumbs: [
        { label: 'Home', url: '/' },
        { label: 'Admin', url: '/admin' }
    ]
}) %>
```

### 4. Layout Wrapper

**Files:**
- `admin-layout-start.ejs` - Buka layout + sidebar + topbar
- `admin-layout-end.ejs` - Tutup layout + common scripts

**Penggunaan:**
```ejs
<body>
    <%- include('./partials/admin-layout-start', { 
        currentPage: 'dashboard', 
        pageTitle: 'Dashboard Overview',
        user: user,
        breadcrumbs: [...]
    }) %>

    <!-- Your page content here -->

    <%- include('./partials/admin-layout-end') %>
</body>
```

---

## 📊 Unified Statistics API

### Endpoint: `GET /api/admin/stats`

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalUsers": 150,
    "activeUsers": 120,
    "inactiveUsers": 25,
    "suspendedUsers": 5,
    "totalAdmin": 3,
    "totalRegularUsers": 147,
    "totalProducts": 500,
    "totalNotes": 89,
    "usersOnlineToday": 45,
    "newUsersToday": 8,
    "loginsToday": 156
  }
}
```

**Validasi:**
```
totalUsers = activeUsers + inactiveUsers + suspendedUsers
150 = 120 + 25 + 5 ✅
```

### Endpoint: `GET /api/admin/stats/active-users`

**Query Parameters:**
- `limit` (optional, default: 5)

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "account_status": "active",
      "total_logins": 150,
      "last_login": "2024-02-25T10:30:00.000Z"
    }
  ]
}
```

### Endpoint: `GET /api/admin/users`

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20)
- `search` (optional)
- `status` (optional: 'active', 'inactive', 'suspended')
- `role` (optional: 'admin', 'user')

**Response:**
```json
{
  "success": true,
  "users": [...],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## 🗄️ Database Standardization

### Migration SQL

**File:** `standardize_admin_db.sql`

**Standarisasi:**
```sql
-- Status
account_status ENUM('active', 'inactive', 'suspended') DEFAULT 'active'

-- Role
role ENUM('admin', 'user') DEFAULT 'user'
```

**Mapping Old Values:**
| Old Value    | New Value   |
|--------------|-------------|
| 'aktif'      | 'active'    |
| 'nonaktif'   | 'inactive'  |
| 'banned'     | 'suspended' |

### Run Migration

```bash
node run_admin_migration.js
```

**Output:**
```
🔧 Starting Admin Panel Database Standardization...

✅ Connected to database

📄 Reading migration file: standardize_admin_db.sql

📊 Found 15 SQL statements to execute

   Executing statement 1/15...
   Executing statement 6/15...
   ...

✅ Migration completed successfully!

📊 Summary:
   - Successful statements: 13
   - Skipped statements: 2

🔍 Running verification...

User Status Distribution:
   - active: 120 users
   - inactive: 25 users
   - suspended: 5 users

📈 Total users: 150

✨ All done! Your database is now standardized.
```

---

## 🧩 Admin Service

**File:** `services/adminService.js`

### Methods

#### `getStats()`
Mengambil statistik lengkap untuk dashboard.

```javascript
const stats = await adminService.getStats();
```

#### `getUsersWithStats(options)`
Mengambil users dengan pagination dan filters.

```javascript
const result = await adminService.getUsersWithStats({
    page: 1,
    limit: 20,
    search: 'john',
    status: 'active',
    role: 'user'
});
```

#### `getUserStatusBreakdown()`
Breakdown users per status.

```javascript
const breakdown = await adminService.getUserStatusBreakdown();
// { active: 120, inactive: 25, suspended: 5 }
```

#### `getUserRoleBreakdown()`
Breakdown users per role.

```javascript
const breakdown = await adminService.getUserRoleBreakdown();
// { admin: 3, user: 147 }
```

#### `getRecentRegistrations(limit)`
Users yang baru register.

```javascript
const users = await adminService.getRecentRegistrations(5);
```

#### `getMostActiveUsers(limit)`
Users dengan total login tertinggi.

```javascript
const users = await adminService.getMostActiveUsers(5);
```

---

## 🎨 Styling Konsisten

### CSS Variables (Global)

```css
:root {
    --primary-blue: #2E86DE;
    --primary-dark: #205A9E;
    --primary-orange: #FF9F43;
    --accent-green: #1DD1A1;
    --accent-red: #FF6B6B;
    --bg-sidebar: #1a1d23;
    --bg-body: #F4F6F9;
    --bg-card: #FFFFFF;
    --text-main: #2C3E50;
    --text-muted: #8395A7;
    --text-light: #ecf0f1;
    --border-color: #e9ecef;
    --shadow-sm: 0 2px 4px rgba(0,0,0,0.05);
    --shadow-md: 0 4px 6px rgba(0,0,0,0.08);
    --sidebar-width: 260px;
    --header-height: 60px;
}

body.dark-mode-active {
    --bg-body: #121418;
    --bg-card: #1e2128;
    --text-main: #ecf0f1;
    --text-muted: #bdc3c7;
}
```

### Dark Mode

**Toggle otomatis** dengan localStorage:
```javascript
// Cek preferensi tersimpan
const isDarkMode = localStorage.getItem('darkMode') === 'true';

// Toggle
body.classList.toggle('dark-mode-active');
localStorage.setItem('darkMode', body.classList.contains('dark-mode-active'));
```

---

## 🚀 Cara Menggunakan

### 1. Setup Database

```bash
# Run migration
node run_admin_migration.js
```

### 2. Start Server

```bash
npm run dev
```

### 3. Akses Admin Panel

- Dashboard: http://localhost:3000/admin
- Users: http://localhost:3000/admin/users
- Analytics: http://localhost:3000/admin/analytics

### 4. Membuat Halaman Admin Baru

**Contoh:** `/admin/settings`

**Step 1:** Tambahkan route di `server.js`:
```javascript
app.get('/admin/settings', isAuthenticated, (req, res) => {
    if (req.session.user && req.session.user.role === 'admin') {
        res.render('admin-settings-new', { 
            currentPage: 'settings',
            user: req.session.user
        });
    } else {
        res.status(403).send('Access denied.');
    }
});
```

**Step 2:** Buat view `views/admin-settings-new.ejs`:
```ejs
<!DOCTYPE html>
<html lang="id">
<head>
    <title>Pengaturan</title>
    <%- include('./partials/admin-head') %>
</head>
<body>
    <%- include('./partials/admin-layout-start', { 
        currentPage: 'settings', 
        pageTitle: 'Pengaturan',
        user: user,
        breadcrumbs: [
            { label: 'Home', url: '/' },
            { label: 'Admin', url: '/admin' },
            { label: 'Pengaturan', url: '/admin/settings' }
        ]
    }) %>

    <!-- Your content here -->
    <div class="panel-card">
        <h2>Settings Content</h2>
    </div>

    <%- include('./partials/admin-layout-end') %>
</body>
</html>
```

**Step 3:** Update sidebar (`views/partials/admin-sidebar.ejs`):
```ejs
<a href="/admin/settings" class="nav-item <%= currentPage === 'settings' ? 'active' : '' %>">
    <i class="fas fa-cog"></i>
    <span>Pengaturan</span>
</a>
```

---

## ✅ Checklist Konsistensi

### Sidebar
- [x] 1 file partial (`admin-sidebar.ejs`)
- [x] Active state otomatis dengan `currentPage`
- [x] Struktur menu sama di semua halaman
- [x] User profile di footer
- [x] Logout button

### Statistik
- [x] 1 endpoint API (`/api/admin/stats`)
- [x] Dashboard menggunakan endpoint ini
- [x] Users page menggunakan endpoint ini
- [x] Validasi: `totalUsers = activeUsers + inactiveUsers + suspendedUsers`

### Layout
- [x] Head global (`admin-head.ejs`)
- [x] Layout wrapper (start/end)
- [x] Topbar dengan breadcrumb
- [x] Dark mode toggle global

### Components
- [x] StatCard reusable
- [x] Badge variants (success, danger, warning, primary, secondary)
- [x] Button variants (primary, outline, danger, success)
- [x] Table styling konsisten
- [x] Alert/Notification component

### Database
- [x] `account_status` ENUM('active','inactive','suspended')
- [x] `role` ENUM('admin','user')
- [x] Indexes untuk performa
- [x] View `v_user_stats` untuk quick stats

---

## 🐛 Troubleshooting

### Statistik Tidak Muncul
1. Cek endpoint: `GET /api/admin/stats`
2. Pastikan database sudah di-migrate
3. Cek console browser untuk error

### Sidebar Tidak Highlight
1. Pastikan `currentPage` di-pass ke layout
2. Cek nilai `currentPage` sesuai dengan href
3. Verify class `active` ada di nav-item

### Dark Mode Tidak Tersimpan
1. Cek localStorage: `localStorage.getItem('darkMode')`
2. Pastikan script dark mode load setelah DOM
3. Clear cache browser

### Database Migration Error
```bash
# Cek koneksi database
mysql -u root -p -e "USE kapanbeli; SELECT COUNT(*) FROM users;"

# Run migration manual
mysql -u root -p kapanbeli < standardize_admin_db.sql
```

---

## 📝 Best Practices

### 1. Selalu Gunakan Admin Service
```javascript
// ✅ GOOD
const stats = await adminService.getStats();

// ❌ BAD
const stats = await db.execute('SELECT COUNT(*) FROM users');
```

### 2. Selalu Gunakan Partial untuk UI
```ejs
<!-- ✅ GOOD -->
<%- include('./partials/stat-card', { ... }) %>

<!-- ❌ BAD -->
<div class="stat-card">...</div>
```

### 3. Selalu Gunakan Endpoint Unified Stats
```javascript
// ✅ GOOD
const response = await fetch('/api/admin/stats');

// ❌ BAD
const response = await fetch('/api/dashboard/stats');
```

### 4. Selalu Gunakan account_status
```sql
-- ✅ GOOD
SELECT * FROM users WHERE account_status = 'active';

-- ❌ BAD
SELECT * FROM users WHERE status = 'aktif';
```

---

## 📊 Performance Tips

### 1. Caching Stats
Untuk production, tambahkan caching:
```javascript
// Contoh dengan node-cache
const NodeCache = require('node-cache');
const statsCache = new NodeCache({ stdTTL: 60 }); // 1 minute

async function getStats() {
    const cached = statsCache.get('admin_stats');
    if (cached) return cached;
    
    const stats = await adminService.getStats();
    statsCache.set('admin_stats', stats);
    return stats;
}
```

### 2. Pagination
Selalu gunakan pagination untuk users table:
```javascript
const users = await adminService.getUsersWithStats({
    page: 1,
    limit: 20  // Jangan load semua users sekaligus
});
```

### 3. Database Indexes
Migration sudah include indexes:
```sql
CREATE INDEX idx_users_account_status ON users(account_status);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status_role ON users(account_status, role);
```

---

## 🔄 Next Steps (Optional Improvements)

1. **Add Export Feature** - Export users to CSV/Excel
2. **Add Bulk Actions** - Select multiple users for batch operations
3. **Add User Activity Timeline** - Visual timeline per user
4. **Add Real-time Updates** - WebSocket untuk live stats
5. **Add Advanced Filters** - Date range, custom filters
6. **Add Audit Logs** - Track admin actions

---

## 👨‍💻 Author

Refactoring dilakukan untuk memastikan konsistensi 100% pada admin panel Kapan Beli.

**Last Updated:** February 25, 2026
