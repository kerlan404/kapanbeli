### Project Overview
- **Stack**: Node.js (CommonJS), Express 5, EJS view engine, MySQL (mysql2/promise), sessions (`express-session`), uploads (`multer`), auth helpers (`bcryptjs`, `jsonwebtoken`), email (`nodemailer`), HTTP client (`axios`).
- **Arsitektur**: Monolith MVC-ish. Routing di `server.js` + `routes/`, controller di `controllers/`, data access di `models/` (query SQL langsung), beberapa service di `services/`. SSR memakai EJS di `views/`, static assets di `public/`.
- **Database**: MySQL dengan SQL migrations/manual scripts (`*.sql`); akses data via mysql2/promise (no ORM).

### Conventions yang Harus Diikuti
- Entry point utama: `server.js` (lihat `package.json` script `start`/`dev`).
- Routing: file di `routes/` memetakan route API ke controller; beberapa route SSR langsung di `server.js`.
- Controller: `controllers/*Controller.js` memakai `try/catch` dan mengembalikan JSON `{ success, message?, ... }`.
- Model: `models/*.js` berisi fungsi async yang melakukan query SQL langsung.
- Auth: session-based (`req.session.user`) dengan guard sederhana; JWT dipakai untuk reset password token.
- File upload: `multer` menyimpan file ke `public/uploads/` dan URL disimpan sebagai `/uploads/<filename>`.
- Response format: mayoritas endpoint JSON memakai `{ success: boolean, message?: string, data? }` atau `product(s)`/`activities` spesifik.
- Error handling global ada di `middleware/errorHandler.js` (404 + global error JSON).
- View: halaman SSR di `views/*.ejs` dengan `currentPage` untuk active nav.

### Reusable Components
- `config/database.js`: pool MySQL.
- `middleware/errorHandler.js`: helper error JSON + not found.
- `models/User.js`, `models/Product.js`, `models/Notes.js`, `models/Category.js`: akses data reusable.
- `services/`: `userService.js`, `userProfileService.js`, `adminProductService.js`, `activityLogsService.js`.
- `controllers/*`: pola validasi dasar + return JSON.

### Hal yang Perlu Diperhatikan
- Ada dua entry server: `server.js` (aktif) vs `app.js` (legacy). README mengacu ke `app.js`.
- Skema DB tersebar di banyak file `*.sql`. Ada perbedaan penamaan kolom: `login_logs` memakai `login_time` di model, sedangkan `analytics_migration.sql` memakai `login_at`.
- Banyak query menangani kolom yang mungkin belum ada (fallback untuk `ER_BAD_FIELD_ERROR`), jadi schema bisa tidak konsisten.
- Mapping kategori hardcoded di `controllers/productsController.js` (nama kategori ke ID).
- Session secret fallback hardcoded jika `SESSION_SECRET` tidak diset.
- Logging masih `console.log`/`console.error` di banyak tempat.

### Siap untuk Fitur Baru
Konteks sudah dipahami. Silakan berikan detail fitur yang akan dikembangkan.