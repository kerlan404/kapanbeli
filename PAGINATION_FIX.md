# 🛠️ Pagination & Query Parameters Fix

## Masalah yang Diperbaiki

### ❌ Sebelum Fix

```javascript
// ❌ CRASH jika req.query undefined
const { page, limit } = req.query;

// ❌ Tidak ada default value
function getProducts(p) {
    const { page, limit } = p;  // Error jika p undefined!
}

// ❌ Langsung query ke database tanpa validasi
const [notes] = await db.execute(`
    SELECT * FROM notes WHERE type = '${type}'  // SQL Injection + Error jika kolom tidak ada
`);
```

**Error yang terjadi:**
```
TypeError: Cannot destructure property 'page' of 'req.query' as it is undefined.
ER_BAD_FIELD_ERROR: Unknown column 'type' in 'where clause'
```

### ✅ Setelah Fix

```javascript
// ✅ Selalu ada default value
const pagination = getPaginationParams(req.query);
const { page = 1, limit = 20 } = pagination;

// ✅ Safe query dengan parameterized statements
const [notes] = await db.execute(`
    SELECT * FROM notes WHERE type = ?
`, [sanitizeString(type)]);

// ✅ Check kolom sebelum query
const [columns] = await db.execute(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'notes' AND COLUMN_NAME = 'type'
`);
```

---

## File yang Diperbaiki

### 1. `helpers/paginationHelper.js` (NEW)

Reusable helper untuk semua pagination needs.

**Functions:**

```javascript
const {
    getPaginationParams,    // Safe pagination defaults
    calculateOffset,        // Calculate OFFSET from page & limit
    buildPagination,        // Build pagination metadata
    validateSortColumn,     // Validate sort column
    validateSortOrder,      // Validate ASC/DESC
    sanitizeString,         // Prevent SQL injection
    buildWhereClause        // Safe WHERE clause builder
} = require('./helpers/paginationHelper');
```

**Usage:**

```javascript
// Get safe pagination params
const pagination = getPaginationParams(req.query);
// Returns: { page: 1, limit: 20, sortBy: 'created_at', sortOrder: 'DESC', ... }

// Calculate offset
const offset = calculateOffset(pagination.page, pagination.limit);
// Returns: 0 (for page 1, limit 20)

// Build pagination metadata
const meta = buildPagination(100, 1, 20);
// Returns: { total: 100, page: 1, limit: 20, totalPages: 5, hasNext: true, hasPrev: false }
```

---

### 2. `routes/adminNotesRoutes.js` (FIXED)

**Before:**
```javascript
const { page = 1, limit = 20, search, type, userId } = req.query;
const offset = (page - 1) * limit;

if (type) {
    whereClause += ' AND n.type = ?';  // ❌ Error jika kolom tidak ada
    params.push(type);
}
```

**After:**
```javascript
const pagination = getPaginationParams(req.query);
const { page, limit, search } = pagination;
const offset = calculateOffset(page, limit);

const { type, userId } = req.query || {};

// Safe type filter - check column existence first
if (type) {
    try {
        const [columns] = await db.execute(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'notes' AND COLUMN_NAME = 'type'
        `);
        
        if (columns.length > 0) {
            whereClause += ' AND n.type = ?';
            params.push(sanitizeString(type));
        }
    } catch (error) {
        console.warn('Type column check failed:', error.message);
        // Continue without type filter
    }
}
```

---

### 3. `controllers/activityLogsController.js` (FIXED)

**Before:**
```javascript
const {
    range = '7days',
    search = '',
    page = 1,
    limit = 10,
    activityType = ''
} = req.query;

// Manual validation
const pageNum = Math.max(1, parseInt(page) || 1);
const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10));
```

**After:**
```javascript
const pagination = getPaginationParams(req.query);
const { page, limit } = pagination;

const {
    range = '7days',
    search = '',
    activityType = ''
} = req.query || {};

// No manual validation needed - already handled by helper
```

---

### 4. `server.js` (FIXED)

**Added alias route:**

```javascript
// Activity logs routes
app.use('/api/activity-logs', activityLogsRoutes);

// ✅ Alias for admin panel compatibility
app.use('/api/admin/activity-logs', activityLogsRoutes);
```

---

## 📋 Best Practices

### 1. Selalu Gunakan Helper

```javascript
// ✅ GOOD
const pagination = getPaginationParams(req.query);

// ❌ BAD
const page = req.query.page || 1;
const limit = req.query.limit || 20;
```

### 2. Selalu Sanitize Input

```javascript
// ✅ GOOD
const search = sanitizeString(req.query.search);
params.push(`%${search}%`);

// ❌ BAD
const search = req.query.search;
whereClause += ` AND name LIKE '%${search}%'`;  // SQL Injection!
```

### 3. Check Column Existence

```javascript
// ✅ GOOD
try {
    const [columns] = await db.execute(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'notes' AND COLUMN_NAME = 'type'
    `);
    
    if (columns.length > 0) {
        // Safe to query
    }
} catch (error) {
    console.warn('Column check failed, skipping filter');
}

// ❌ BAD
SELECT * FROM notes WHERE type = 'recipe'  // Error jika kolom tidak ada
```

### 4. Use Optional Chaining

```javascript
// ✅ GOOD
const { type, userId } = req.query || {};

// ❌ BAD
const { type, userId } = req.query;  // Error jika req.query undefined
```

### 5. Validate Sort Columns

```javascript
// ✅ GOOD
const validSortColumns = ['id', 'name', 'created_at'];
const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';

// ❌ BAD
const sortColumn = sortBy;  // SQL Injection risk!
```

---

## 🧪 Testing

### Test Empty Query Params

```bash
# Should not crash
curl http://localhost:3000/api/admin/notes
curl http://localhost:3000/api/admin/activity-logs
curl http://localhost:3000/api/admin/products
```

**Expected Response:**
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "total": 0,
    "page": 1,
    "limit": 20,
    "totalPages": 0,
    "hasNext": false,
    "hasPrev": false
  }
}
```

### Test With Query Params

```bash
# Should work with params
curl "http://localhost:3000/api/admin/notes?page=1&limit=10&search=test"
curl "http://localhost:3000/api/admin/activity-logs?range=today&page=2"
curl "http://localhost:3000/api/admin/products?category=food&sort=price"
```

### Test Invalid Params

```bash
# Should use defaults
curl "http://localhost:3000/api/admin/notes?page=-1&limit=999"
curl "http://localhost:3000/api/admin/products?sortBy=invalid_column"
```

**Expected:** Use default values (page: 1, limit: 20, sortBy: 'created_at')

---

## 📊 Pagination Helper API Reference

### `getPaginationParams(params = {})`

Get safe pagination parameters with defaults.

**Input:**
```javascript
{
    page: "2",
    limit: "50",
    sortBy: "name",
    sortOrder: "ASC",
    search: "test"
}
```

**Output:**
```javascript
{
    page: 2,
    limit: 50,
    offset: 50,
    sortBy: "name",
    sortOrder: "ASC",
    search: "test",
    filters: {}
}
```

---

### `calculateOffset(page, limit)`

Calculate OFFSET for SQL query.

**Input:**
```javascript
calculateOffset(3, 20)
```

**Output:**
```javascript
40  // (3-1) * 20 = 40
```

---

### `buildPagination(total, page, limit)`

Build pagination metadata.

**Input:**
```javascript
buildPagination(150, 3, 20)
```

**Output:**
```javascript
{
    total: 150,
    page: 3,
    limit: 20,
    totalPages: 8,
    hasNext: true,   // 3 < 8
    hasPrev: true,   // 3 > 1
    offset: 40
}
```

---

### `validateSortColumn(column, allowedColumns, defaultColumn)`

Validate sort column against whitelist.

**Input:**
```javascript
validateSortColumn('invalid_col', ['id', 'name', 'created_at'], 'created_at')
```

**Output:**
```javascript
'created_at'  // Fallback to default
```

---

### `validateSortOrder(order)`

Validate sort order (ASC/DESC).

**Input:**
```javascript
validateSortOrder('invalid')
```

**Output:**
```javascript
'DESC'  // Fallback to default
```

---

### `sanitizeString(value)`

Sanitize string to prevent SQL injection.

**Input:**
```javascript
sanitizeString("test'; DROP TABLE users; --")
```

**Output:**
```javascript
'test DROP TABLE users --'
```

---

### `buildWhereClause(filters, params)`

Build WHERE clause safely.

**Input:**
```javascript
buildWhereClause({
    status: 'active',
    name: 'john',
    age: 25
}, [])
```

**Output:**
```javascript
// WHERE clause:
WHERE status = ? AND name LIKE ? AND age = ?

// params:
['active', '%john%', 25]
```

---

## ⚠️ Common Mistakes

### 1. Direct Destructuring Without Defaults

```javascript
// ❌ BAD
const { page, limit } = req.query;

// ✅ GOOD
const { page = 1, limit = 20 } = req.query || {};
```

### 2. No SQL Injection Protection

```javascript
// ❌ BAD
const query = `SELECT * FROM users WHERE name = '${name}'`;

// ✅ GOOD
const query = `SELECT * FROM users WHERE name = ?`;
params.push(sanitizeString(name));
```

### 3. Assuming Columns Exist

```javascript
// ❌ BAD
SELECT * FROM notes WHERE type = 'recipe'

// ✅ GOOD
// Check column first
const [columns] = await db.execute(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'notes' AND COLUMN_NAME = 'type'
`);
```

### 4. Manual Pagination Logic

```javascript
// ❌ BAD (duplicated logic)
const page = Math.max(1, parseInt(req.query.page) || 1);
const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
const offset = (page - 1) * limit;

// ✅ GOOD (reuse helper)
const pagination = getPaginationParams(req.query);
const { page, limit } = pagination;
const offset = calculateOffset(page, limit);
```

---

## 🚀 Migration Guide

### Step 1: Install Helper

Already available at `helpers/paginationHelper.js`

### Step 2: Update Existing Routes

```javascript
// Old code
const { page = 1, limit = 20 } = req.query;

// New code
const pagination = getPaginationParams(req.query);
const { page, limit } = pagination;
```

### Step 3: Update Database Queries

```javascript
// Old code
const offset = (page - 1) * limit;

// New code
const offset = calculateOffset(page, limit);
```

### Step 4: Add Column Checks

```javascript
// Add before querying potentially missing columns
try {
    const [columns] = await db.execute(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'your_table' 
        AND COLUMN_NAME = 'your_column'
    `);
    
    if (columns.length === 0) {
        console.warn('Column does not exist, skipping filter');
        return; // or continue without filter
    }
} catch (error) {
    console.warn('Column check failed:', error.message);
}
```

---

## 📝 Checklist

- [x] Created `helpers/paginationHelper.js`
- [x] Fixed `routes/adminNotesRoutes.js`
- [x] Fixed `controllers/activityLogsController.js`
- [x] Added alias route in `server.js`
- [x] Added column existence checks
- [x] Added SQL injection protection
- [x] Added default values for all params
- [x] Tested with empty query params
- [x] Tested with invalid params
- [x] Documented best practices

---

**Status:** ✅ Production Ready

**Last Updated:** February 25, 2026
