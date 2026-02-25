# 🚀 Quick Start - Admin Panel Refactoring

## Langkah Cepat (5 Menit)

### 1. Run Database Migration

```bash
node run_admin_migration.js
```

**Expected output:**
```
✅ Connected to database
✅ Migration completed successfully!
User Status Distribution:
   - active: 120 users
   - inactive: 25 users
   - suspended: 5 users
```

### 2. Start Server

```bash
npm run dev
```

### 3. Login sebagai Admin

1. Buka http://localhost:3000/auth
2. Login dengan akun admin
3. Redirect ke http://localhost:3000/admin

### 4. Verify Konsistensi

**Dashboard:**
- http://localhost:3000/admin
- Sidebar highlight di "Dashboard"
- Stat cards menampilkan data dari `/api/admin/stats`

**Users Page:**
- http://localhost:3000/admin/users
- Sidebar highlight di "Manajemen Pengguna"
- Stat cards menampilkan data yang SAMA dengan dashboard
- Filter & pagination berfungsi

---

## 📁 File yang Dibuat

### New Files (Created):
```
services/adminService.js              ✅ Centralized admin logic
views/partials/admin-head.ejs         ✅ Global admin head
views/partials/admin-sidebar.ejs      ✅ Global sidebar
views/partials/admin-topbar.ejs       ✅ Global topbar
views/partials/admin-layout-start.ejs ✅ Layout wrapper start
views/partials/admin-layout-end.ejs   ✅ Layout wrapper end
views/partials/stat-card.ejs          ✅ Reusable stat card
views/admin-dashboard-new.ejs         ✅ New dashboard
views/admin-users-new.ejs             ✅ New users page
standardize_admin_db.sql              ✅ DB migration
run_admin_migration.js                ✅ Migration runner
ADMIN_PANEL_REFACTORING.md            ✅ Full documentation
```

### Updated Files:
```
controllers/adminController.js        ✅ Use adminService
routes/admin.js                       ✅ Add new endpoints
server.js                             ✅ Use new views
```

---

## 🧪 Testing Checklist

### Dashboard
- [ ] Sidebar highlight "Dashboard"
- [ ] Stat cards show correct numbers
- [ ] "Recent Registrasi" table loads
- [ ] "Pengguna Paling Aktif" table loads
- [ ] Dark mode toggle works

### Users Page
- [ ] Sidebar highlight "Manajemen Pengguna"
- [ ] Stats match dashboard numbers
- [ ] Search filter works
- [ ] Status filter works
- [ ] Role filter works
- [ ] Pagination works
- [ ] Toggle user status works

### API Endpoints
```bash
# Test stats endpoint
curl http://localhost:3000/api/admin/stats

# Test users endpoint
curl http://localhost:3000/api/admin/users?page=1&limit=10

# Test active users endpoint
curl http://localhost:3000/api/admin/stats/active-users?limit=5
```

---

## ⚠️ Common Issues

### Issue: "Table 'users' doesn't exist"
**Solution:** Pastikan database sudah dibuat:
```sql
CREATE DATABASE kapanbeli;
```

### Issue: "ER_DUP_FIELDNAME"
**Solution:** Normal, field sudah ada. Migration akan skip.

### Issue: Stats show 0
**Solution:** 
1. Cek database ada data: `SELECT COUNT(*) FROM users;`
2. Restart server: `Ctrl+C` → `npm run dev`

### Issue: Sidebar tidak muncul
**Solution:** 
1. Clear browser cache (Ctrl+Shift+R)
2. Cek console untuk error
3. Verify partials path benar

---

## 📊 Verify Data Consistency

### 1. Check Stats via API
```bash
curl http://localhost:3000/api/admin/stats | jq
```

**Expected:**
```json
{
  "success": true,
  "stats": {
    "totalUsers": 150,
    "activeUsers": 120,
    "inactiveUsers": 25,
    "suspendedUsers": 5
  }
}
```

**Verify:** `120 + 25 + 5 = 150` ✅

### 2. Check Dashboard vs Users Page
1. Open Dashboard → Note the stats numbers
2. Open Users page → Stats should be IDENTICAL
3. Refresh both → Numbers stay consistent

---

## 🎨 UI Components Demo

### StatCard
```ejs
<%- include('./partials/stat-card', { 
    title: 'Total Users', 
    value: 150, 
    icon: 'fa-users', 
    color: 'blue'
}) %>
```

### Badge
```html
<span class="badge badge-success">Active</span>
<span class="badge badge-danger">Suspended</span>
<span class="badge badge-warning">Inactive</span>
<span class="badge badge-primary">Admin</span>
<span class="badge badge-secondary">User</span>
```

### Button
```html
<button class="btn btn-primary">Primary</button>
<button class="btn btn-outline">Outline</button>
<button class="btn btn-danger">Danger</button>
<button class="btn btn-success">Success</button>
```

---

## 📝 Next Actions

### For New Admin Page:
1. Create view file with new layout
2. Add route in `server.js`
3. Update sidebar menu
4. Test!

### For Database Changes:
1. Edit `standardize_admin_db.sql`
2. Run `node run_admin_migration.js`
3. Verify with SELECT queries

### For New API Endpoint:
1. Add method in `adminService.js`
2. Add controller in `adminController.js`
3. Add route in `routes/admin.js`
4. Test with curl/Postman

---

## 📞 Support

If you encounter issues:

1. **Check logs:** `console.error` di server
2. **Check browser:** F12 Console
3. **Check DB:** MySQL workbench/phpMyAdmin
4. **Re-run migration:** `node run_admin_migration.js`

---

**Happy Coding! 🎉**
