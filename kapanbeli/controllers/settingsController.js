const User = require('../models/User');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for profile photos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../public/uploads/profiles');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + req.session.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Hanya file gambar (JPEG, PNG, GIF, WebP) yang diperbolehkan'));
        }
    }
});

const settingsController = {
    // Upload profile photo
    async uploadProfilePhoto(req, res) {
        try {
            if (!req.session.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
            }

            const processUpload = async (file) => {
                try {
                    if (!file) {
                        return res.status(400).json({
                            success: false,
                            message: 'Tidak ada file yang diupload'
                        });
                    }

                    const userId = req.session.user.id;
                    
                    // Support both server-level upload and controller-level upload paths
                    const isFromProfilesDir = file.destination && file.destination.includes('profiles');
                    const photoUrl = isFromProfilesDir ? '/uploads/profiles/' + file.filename : '/uploads/' + file.filename;

                    // Delete old profile photo if exists
                    const user = await User.findById(userId);
                    if (!user) {
                        return res.status(404).json({
                            success: false,
                            message: 'Pengguna tidak ditemukan'
                        });
                    }

                    if (user.profile_photo && (user.profile_photo.startsWith('/uploads/'))) {
                        const oldPhotoPath = path.join(__dirname, '../public', user.profile_photo);
                        if (fs.existsSync(oldPhotoPath)) {
                            try {
                                fs.unlinkSync(oldPhotoPath);
                            } catch (err) {
                                console.error('Failed to delete old photo:', err);
                            }
                        }
                    }

                    // Update user profile photo
                    await User.update(userId, { 
                        name: user.name, 
                        email: user.email, 
                        profile_photo: photoUrl 
                    });

                    // Update session
                    req.session.user.profile_photo = photoUrl;
                    req.session.save();

                    res.json({
                        success: true,
                        message: 'Foto profil berhasil diperbarui',
                        photo_url: photoUrl
                    });
                } catch (innerError) {
                    console.error('Inner upload profile photo error:', innerError);
                    if (!res.headersSent) {
                        res.status(500).json({
                            success: false,
                            message: 'Terjadi kesalahan saat memproses foto profil'
                        });
                    }
                }
            };

            if (req.file) {
                await processUpload(req.file);
            } else {
                upload.single('profile_photo')(req, res, async (err) => {
                    if (err) {
                        return res.status(400).json({
                            success: false,
                            message: err.message
                        });
                    }
                    await processUpload(req.file);
                });
            }
        } catch (error) {
            console.error('Upload profile photo error:', error);
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    message: 'Terjadi kesalahan saat upload foto profil'
                });
            }
        }
    },

    // Get user profile
    async getProfile(req, res) {
        try {
            if (!req.session.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
            }

            console.log('=== GET PROFILE ===');
            console.log('Session user:', req.session.user);
            console.log('User ID:', req.session.user.id);

            const user = await User.findById(req.session.user.id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            console.log('User found:', user);

            // Get stats from database
            const db = require('../config/database');
            
            // Get total products
            const [productsResult] = await db.execute(
                'SELECT COUNT(*) as total FROM products WHERE user_id = ?',
                [user.id]
            );
            
            // Get total suggestions
            const [suggestionsResult] = await db.execute(
                'SELECT COUNT(*) as total FROM products WHERE user_id = ? AND (stock_quantity <= 0 OR stock_quantity <= min_stock_level)',
                [user.id]
            );
            
            // Get total notes
            const [notesResult] = await db.execute(
                'SELECT COUNT(*) as total FROM notes WHERE user_id = ?',
                [user.id]
            );
            
            // Get total logins
            const [loginsResult] = await db.execute(
                'SELECT COUNT(*) as total FROM login_logs WHERE user_id = ?',
                [user.id]
            );

            res.json({
                success: true,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role || 'user',
                    account_status: user.account_status || 'active',
                    profile_photo: user.profile_photo || null,
                    created_at: user.created_at,
                    last_login: user.last_login,
                    total_products: productsResult[0].total || 0,
                    total_suggestions: suggestionsResult[0].total || 0,
                    total_notes: notesResult[0].total || 0,
                    total_logins: loginsResult[0].total || 0,
                    language: user.language || 'id'
                }
            });
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat mengambil profil'
            });
        }
    },

    // Update profile (name and email)
    async updateProfile(req, res) {
        try {
            if (!req.session.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Silakan login terlebih dahulu'
                });
            }

            const userId = req.session.user.id;
            const { name, email, theme, language } = req.body;

            // Validasi input
            if (!name || !email) {
                return res.status(400).json({
                    success: false,
                    message: 'Nama dan email harus diisi'
                });
            }

            // Handle virtual admin (default_admin)
            if (userId === 'default_admin') {
                console.log('Updating virtual admin profile (session only)');
                req.session.user.name = name;
                req.session.user.email = email;
                
                return req.session.save((err) => {
                    if (err) console.error('Session save error for default_admin:', err);
                    return res.json({
                        success: true,
                        message: 'Profil admin default diperbarui (hanya untuk sesi ini)',
                        user: req.session.user
                    });
                });
            }

            // Periksa apakah email sudah digunakan oleh orang lain
            const existingUser = await User.findByEmail(email);
            if (existingUser && existingUser.id != userId) { // Use != for loose comparison in case of string vs int
                return res.status(400).json({
                    success: false,
                    message: 'Email sudah digunakan oleh pengguna lain'
                });
            }

            // Update user profile in database
            console.log(`Updating DB profile for user ID: ${userId}`);
            await User.update(userId, { name, email });

            // Update theme if provided
            if (theme && User.updateTheme) {
                try {
                    await User.updateTheme(userId, theme);
                    req.session.user.theme = theme;
                } catch (themeError) {
                    console.error('Theme update error:', themeError);
                }
            }

            // Update session data
            req.session.user.name = name;
            req.session.user.email = email;

            req.session.save((err) => {
                if (err) {
                    console.error('Session save error:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Gagal menyimpan sesi setelah update profil'
                    });
                }
                
                console.log('Profile updated successfully for user ID:', userId);
                res.json({
                    success: true,
                    message: 'Profil berhasil diperbarui',
                    user: {
                        id: userId,
                        name: name,
                        email: email
                    }
                });
            });

        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat memperbarui profil: ' + error.message
            });
        }
    },

    // Update password
    async updatePassword(req, res) {
        try {
            if (!req.session.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Silakan login terlebih dahulu'
                });
            }

            const { newPassword, confirmPassword } = req.body;
            let userId = req.session.user.id;
            const userEmail = req.session.user.email;
            const userName = req.session.user.name;

            // Validate input
            if (!newPassword || !confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Password baru dan konfirmasi harus diisi'
                });
            }

            if (newPassword !== confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Password baru dan konfirmasi password tidak cocok'
                });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'Password baru harus minimal 6 karakter'
                });
            }

            // Hash new password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

            // Handle virtual admin (default_admin) - Materialize to DB
            if (userId === 'default_admin') {
                console.log('Materializing virtual admin to database...');
                
                // Cek apakah email sudah ada
                const existingUser = await User.findByEmail(userEmail);
                
                if (!existingUser) {
                    // Buat user baru di database sebagai ADMIN
                    const newUser = await User.create({
                        name: userName,
                        email: userEmail,
                        password: hashedPassword,
                        role: 'admin' // PAKSA JADI ADMIN
                    });
                    
                    userId = newUser.id;
                    req.session.userId = userId;
                    req.session.user = {
                        id: userId,
                        name: userName,
                        email: userEmail,
                        role: 'admin' // UPDATE SESI
                    };
                    console.log('Virtual admin successfully materialized as REAL ADMIN with ID:', userId);
                } else {
                    // Jika email sudah ada, pastikan dia jadi ADMIN dan update password
                    userId = existingUser.id;
                    await User.updatePassword(userId, hashedPassword);
                    
                    // Pastikan role di DB juga admin (jika sebelumnya bukan)
                    const db = require('../config/database');
                    await db.execute('UPDATE users SET role = "admin" WHERE id = ?', [userId]);
                    
                    req.session.userId = userId;
                    req.session.user = {
                        id: userId,
                        name: existingUser.name,
                        email: existingUser.email,
                        role: 'admin' // PAKSA SESI JADI ADMIN
                    };
                }
            } else {
                // Update password untuk user biasa
                console.log(`Updating password in DB for user ID: ${userId}`);
                await User.updatePassword(userId, hashedPassword);
            }

            req.session.save((err) => {
                if (err) console.error('Session save error after password change:', err);
                res.json({
                    success: true,
                    message: 'Password berhasil diperbarui dan hak akses Admin Anda telah dikonfirmasi!'
                });
            });
        } catch (error) {
            console.error('Update password error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat mengubah password: ' + error.message
            });
        }
    },

    // Delete account
    async deleteAccount(req, res) {
        try {
            if (!req.session.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
            }

            const { password } = req.body;
            const userId = req.session.user.id;

            // Validate password
            if (!password) {
                return res.status(400).json({
                    success: false,
                    message: 'Password harus diisi'
                });
            }

            // Get user from database to verify password
            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Verify password
            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                return res.status(400).json({
                    success: false,
                    message: 'Password salah'
                });
            }

            // Delete user's products first
            await User.deleteUserProducts(userId);

            // Delete user's notes
            await User.deleteUserNotes(userId);

            // Delete user account
            await User.delete(userId);

            // Destroy session
            req.session.destroy((err) => {
                if (err) {
                    console.error('Session destroy error:', err);
                }
            });

            res.json({
                success: true,
                message: 'Akun berhasil dihapus',
                redirect: '/'
            });
        } catch (error) {
            console.error('Delete account error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat menghapus akun'
            });
        }
    },

    // Get current user's data (products, suggestions, notes)
    async getUserData(req, res) {
        try {
            console.log('[getUserData] Request from user:', req.session.user);

            if (!req.session.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
            }

            const userId = req.session.user.id;

            // Get user info with stats
            const user = await User.findByIdWithDetails(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Get user's products, suggestions (product-based), and notes
            const db = require('../config/database');

            const [products] = await db.execute(
                'SELECT * FROM products WHERE user_id = ? ORDER BY created_at DESC',
                [userId]
            );

            // Get product-based suggestions (low stock + expired)
            const [suggestions] = await db.execute(
                `SELECT 
                    id,
                    name,
                    stock_quantity,
                    min_stock_level,
                    expiry_date,
                    CASE 
                        WHEN stock_quantity <= 0 THEN 'out_of_stock'
                        WHEN stock_quantity <= min_stock_level THEN 'low_stock'
                        WHEN expiry_date < CURDATE() THEN 'expired'
                        ELSE 'normal'
                    END as suggestion_type,
                    created_at
                FROM products
                WHERE user_id = ?
                AND (
                    stock_quantity <= min_stock_level 
                    OR expiry_date < CURDATE()
                )
                ORDER BY 
                    CASE 
                        WHEN expiry_date < CURDATE() THEN 1
                        WHEN stock_quantity <= 0 THEN 2
                        ELSE 3
                    END,
                    created_at DESC`,
                [userId]
            );

            const [notes] = await db.execute(
                'SELECT * FROM notes WHERE user_id = ? ORDER BY created_at DESC',
                [userId]
            );

            const responseData = {
                success: true,
                data: {
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        profile_photo: user.profile_photo || null,
                        role: user.role,
                        account_status: user.account_status,
                        created_at: user.created_at,
                        last_login: user.last_login,
                        total_logins: user.total_logins || user.login_count || 0,
                        language: user.language || 'id'
                    },
                    products,
                    suggestions,
                    notes
                }
            };

            console.log('[getUserData] Response:', responseData);
            res.json(responseData);
        } catch (error) {
            console.error('[getUserData] Error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat mengambil data user'
            });
        }
    },

    // Update theme only
    async updateTheme(req, res) {
        try {
            if (!req.session.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
            }

            const { theme } = req.body;
            const userId = req.session.user.id;

            if (!theme || (theme !== 'light' && theme !== 'dark')) {
                return res.status(400).json({
                    success: false,
                    message: 'Theme tidak valid'
                });
            }

            if (User.updateTheme) {
                await User.updateTheme(userId, theme);
                req.session.user.theme = theme;
                req.session.save();

                res.json({
                    success: true,
                    message: 'Theme berhasil diperbarui',
                    theme: theme
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Fitur update theme belum tersedia di model'
                });
            }
        } catch (error) {
            console.error('Update theme error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat memperbarui theme'
            });
        }
    }
};

module.exports = settingsController;
