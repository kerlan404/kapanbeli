# Admin Panel Consistency Fixes

## Tanggal: 2025-02-25

## Ringkasan Perbaikan

Dokumen ini menjelaskan semua perbaikan konsistensi yang telah dilakukan pada admin panel Kapan Beli.

---

## 1. SIDEBAR KONSISTEN

### Masalah Sebelumnya
- Sidebar berbeda di setiap halaman
- Menu "Saran Pembelian" muncul di halaman Users tapi tidak di Dashboard
- Urutan menu tidak konsisten
- Setiap halaman memiliki inline sidebar HTML sendiri

### Solusi
**File Baru:** `views/partials/admin-sidebar.ejs`

Sidebar sekarang menggunakan 1 file partial yang sama untuk semua halaman:

```ejs
<%- include('./partials/admin-sidebar', { 
    currentPage: 'dashboard', 
    user: user 
}) %>
```

### Menu Sidebar (Urutan Konsisten)

**Main Menu:**
1. Dashboard (`/admin`)
2. Manajemen Pengguna (`/admin/users`)
3. Semua Produk (`/admin/products`)

**Content:**
4. Catatan User (`/admin/notes`)
5. Log Aktivitas (`/admin/activity-logs`)

**Analytics & System:**
6. Analitik (`/admin/analytics`)
7. Pengaturan (`/admin/settings`)

### Active Menu Logic

```javascript
// Di sidebar.ejs
<a href="/admin" class="nav-item <%= typeof currentPage !== 'undefined' && currentPage === 'dashboard' ? 'active' : '' %>">
    <i class="fas fa-home"></i>
    <span>Dashboard</span>
</a>
```

### File yang Menggunakan Partial Ini
- `views/admin-dashboard.ejs`
- `views/admin-users.ejs`
- `views/admin-products.ejs`
- `views/admin-notes.ejs`
- `views/admin-activity-logs.ejs`
- `views/admin-analytics.ejs`

---

## 2. STATUS KONSISTEN

### Masalah Sebelumnya
- Dashboard: "Pengguna Aktif: 22"
- Users page: "Total: 22, Aktif: 19, Non-Aktif: 2"
- Angka tidak sinkron karena query berbeda

### Solusi

**File:** `services/adminService.js`

Semua query status sekarang menggunakan `COALESCE(account_status, status, 'active')` untuk konsistensi:

```javascript
// Query untuk "Pengguna Aktif" - SAMA di dashboard dan users page
const [activeUsersResult] = await db.execute(`
    SELECT COUNT(*) as count 
    FROM users 
    WHERE COALESCE(account_status, status, 'active') = 'active'
`);
stats.activeUsers = activeUsersResult[0].count;
```

### Status Values (Database Standard)

| Value | Display | Badge Color |
|-------|---------|-------------|
| `active` | Aktif | Hijau |
| `inactive` | Non-Aktif | Merah |
| `suspended` | Ditangguhkan | Kuning |
| `banned` | Ditangguhkan | Kuning |

### Query Konsisten

**Dashboard Stats:**
```javascript
stats.activeUsers = activeUsersResult[0].count;  // Dari COALESCE query
```

**Users Page Filter:**
```javascript
// Filter menggunakan query yang SAMA
whereClauses.push('COALESCE(u.account_status, u.status, \'active\') = ?');
```

---

## 3. STANDARDISASI BADGE STATUS

### File Baru: `views/partials/status-badge.ejs`

```ejs
<%
const statusValue = (typeof status !== 'undefined' && status) ? status.toLowerCase() : 'inactive';

let badgeClass = 'badge-secondary';
let badgeText = 'Tidak Diketahui';

switch(statusValue) {
    case 'active':
        badgeClass = 'badge-success';
        badgeText = 'Aktif';
        break;
    case 'inactive':
        badgeClass = 'badge-danger';
        badgeText = 'Non-Aktif';
        break;
    case 'suspended':
    case 'banned':
        badgeClass = 'badge-warning';
        badgeText = 'Ditangguhkan';
        break;
}
%>

<span class="badge <%= badgeClass %>"><%= badgeText %></span>
```

### Penggunaan di EJS

```ejs
<%- include('./partials/status-badge', { status: user.account_status }) %>
```

### Penggunaan di JavaScript (Client-side)

```javascript
function getStatusBadge(status) {
    // MUST match partials/status-badge.ejs
    const badges = {
        'active': '<span class="badge badge-success">Aktif</span>',
        'inactive': '<span class="badge badge-danger">Non-Aktif</span>',
        'suspended': '<span class="badge badge-warning">Ditangguhkan</span>',
        'banned': '<span class="badge badge-warning">Ditangguhkan</span>'
    };
    return badges[status] || badges['inactive'];
}
```

---

## 4. ROLE KONSISTEN

### File Baru: `views/partials/role-badge.ejs`

```ejs
<%
const roleValue = (typeof role !== 'undefined' && role) ? role.toLowerCase() : 'user';

let badgeClass = 'badge-secondary';
let badgeText = 'Pengguna';

switch(roleValue) {
    case 'admin':
        badgeClass = 'badge-primary';
        badgeText = 'Administrator';
        break;
    case 'user':
        badgeClass = 'badge-secondary';
        badgeText = 'Pengguna';
        break;
}
%>

<span class="badge <%= badgeClass %>"><%= badgeText %></span>
```

### Role Values (Database Standard)

| Value | Display | Badge Color |
|-------|---------|-------------|
| `admin` | Administrator | Biru |
| `user` | Pengguna | Abu-abu |

### Penggunaan di JavaScript

```javascript
function getRoleBadge(role) {
    // MUST match partials/role-badge.ejs
    const badges = {
        'admin': '<span class="badge badge-primary">Administrator</span>',
        'user': '<span class="badge badge-secondary">Pengguna</span>'
    };
    return badges[role] || badges['user'];
}
```

---

## 5. BAHASA KONSISTEN

### Aturan
- **Database:** lowercase semua (`active`, `inactive`, `admin`, `user`)
- **UI Display:** Bahasa Indonesia dengan kapitalisasi awal
- **Label:** Konsisten di semua halaman

### Contoh Konsistensi

| Database | UI Display | Badge |
|----------|------------|-------|
| `active` | Aktif | badge-success (hijau) |
| `inactive` | Non-Aktif | badge-danger (merah) |
| `admin` | Administrator | badge-primary (biru) |
| `user` | Pengguna | badge-secondary (abu-abu) |

### Yang Dihindari
- ❌ "Active" (Inggris)
- ❌ "ACTIVE" (uppercase)
- ❌ "aktif" (lowercase di UI)
- ❌ "Admin" (database value)

---

## 6. FILE YANG DIMODIFIKASI

### Partials Baru
1. `views/partials/admin-sidebar.ejs` - Unified sidebar
2. `views/partials/status-badge.ejs` - Status badge component
3. `views/partials/role-badge.ejs` - Role badge component

### File yang Diupdate
1. `services/adminService.js` - Konsisten query status
2. `views/admin-dashboard.ejs` - Gunakan sidebar partial
3. `views/admin-users.ejs` - Gunakan sidebar partial + badge functions

---

## 7. TESTING CHECKLIST

### Sidebar
- [ ] Dashboard menu aktif di halaman `/admin`
- [ ] Manajemen Pengguna aktif di `/admin/users`
- [ ] Semua menu muncul di semua halaman
- [ ] Urutan menu sama di semua halaman

### Status
- [ ] "Pengguna Aktif" di dashboard = jumlah user dengan status "active" di users page
- [ ] Badge hijau untuk "Aktif"
- [ ] Badge merah untuk "Non-Aktif"
- [ ] Badge kuning untuk "Ditangguhkan"

### Role
- [ ] Badge biru untuk "Administrator"
- [ ] Badge abu-abu untuk "Pengguna"
- [ ] Semua role lowercase di database

### Query
- [ ] Stats dashboard menggunakan query yang sama dengan users page filter
- [ ] COALESCE(account_status, status, 'active') digunakan di semua query

---

## 8. CARA MENGGUNAKAN PARTIAL

### Di Server-side (EJS)

```ejs
<!-- Status Badge -->
<%- include('./partials/status-badge', { status: user.account_status }) %>

<!-- Role Badge -->
<%- include('./partials/role-badge', { role: user.role }) %>

<!-- Sidebar -->
<%- include('./partials/admin-sidebar', { 
    currentPage: 'dashboard', 
    user: user 
}) %>
```

### Di Client-side (JavaScript)

```javascript
// Status badge HTML generator
function getStatusBadge(status) {
    const badges = {
        'active': '<span class="badge badge-success">Aktif</span>',
        'inactive': '<span class="badge badge-danger">Non-Aktif</span>',
        'suspended': '<span class="badge badge-warning">Ditangguhkan</span>',
        'banned': '<span class="badge badge-warning">Ditangguhkan</span>'
    };
    return badges[status] || badges['inactive'];
}

// Role badge HTML generator
function getRoleBadge(role) {
    const badges = {
        'admin': '<span class="badge badge-primary">Administrator</span>',
        'user': '<span class="badge badge-secondary">Pengguna</span>'
    };
    return badges[role] || badges['user'];
}
```

---

## 9. STRUKTUR DATABASE

### users table

```sql
id INT PRIMARY KEY
name VARCHAR(255)
email VARCHAR(255)
role ENUM('admin', 'user') DEFAULT 'user'
account_status ENUM('active', 'inactive', 'suspended') DEFAULT 'active'
status ENUM('active', 'inactive', 'banned') DEFAULT 'active'  -- legacy
is_banned BOOLEAN DEFAULT FALSE
...
```

### Query Pattern

```sql
-- Gunakan COALESCE untuk backward compatibility
SELECT * FROM users 
WHERE COALESCE(account_status, status, 'active') = 'active';
```

---

## 10. BEST PRACTICES

### Do's ✅
- Gunakan partial untuk sidebar di semua halaman
- Gunakan `status-badge.ejs` untuk display status
- Gunakan `role-badge.ejs` untuk display role
- Gunakan `COALESCE(account_status, status, 'active')` di query
- Lowercase semua value di database
- Bahasa Indonesia di UI

### Don'ts ❌
- Hardcode sidebar HTML di setiap halaman
- Hardcode badge HTML di setiap tempat
- Campur bahasa (Inggris + Indonesia)
- Gunakan uppercase di database
- Query status tanpa COALESCE
- Buat komponen badge baru (pakai yang sudah ada)

---

## End of Document
