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

            upload.single('profile_photo')(req, res, async (err) => {
                if (err) {
                    return res.status(400).json({
                        success: false,
                        message: err.message
                    });
                }

                if (!req.file) {
                    return res.status(400).json({
                        success: false,
                        message: 'Tidak ada file yang diupload'
                    });
                }

                const userId = req.session.user.id;
                const photoUrl = '/uploads/profiles/' + req.file.filename;

                // Delete old profile photo if exists
                const user = await User.findById(userId);
                if (user.profile_photo && user.profile_photo.startsWith('/uploads/profiles/')) {
                    const oldPhotoPath = path.join(__dirname, '../public', user.profile_photo);
                    if (fs.existsSync(oldPhotoPath)) {
                        fs.unlinkSync(oldPhotoPath);
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

                res.json({
                    success: true,
                    message: 'Foto profil berhasil diupload',
                    photo_url: photoUrl
                });
            });
        } catch (error) {
            console.error('Upload profile photo error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat upload foto profil'
            });
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

            res.json({
                success: true,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    profile_photo: user.profile_photo || null,
                    created_at: user.created_at
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
                    message: 'Unauthorized'
                });
            }

            const { name, email } = req.body;
            const userId = req.session.user.id;

            // Validate input
            if (!name || !email) {
                return res.status(400).json({
                    success: false,
                    message: 'Nama dan email harus diisi'
                });
            }

            // Check if email is already used by another user
            const existingUser = await User.findByEmail(email);
            if (existingUser && existingUser.id !== userId) {
                return res.status(400).json({
                    success: false,
                    message: 'Email sudah digunakan oleh pengguna lain'
                });
            }

            // Update user profile
            await User.update(userId, { name, email });

            // Update session
            req.session.user.name = name;
            req.session.user.email = email;

            res.json({
                success: true,
                message: 'Profil berhasil diperbarui',
                user: {
                    id: userId,
                    name: name,
                    email: email
                }
            });
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat memperbarui profil'
            });
        }
    },

    // Update password
    async updatePassword(req, res) {
        try {
            if (!req.session.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
            }

            const { currentPassword, newPassword, confirmPassword } = req.body;
            const userId = req.session.user.id;

            // Validate input
            if (!currentPassword || !newPassword || !confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Semua field password harus diisi'
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

            // Get user from database
            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Verify current password
            const isMatch = await bcrypt.compare(currentPassword, user.password);

            if (!isMatch) {
                return res.status(400).json({
                    success: false,
                    message: 'Password saat ini salah'
                });
            }

            // Hash new password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

            // Update password
            await User.updatePassword(userId, hashedPassword);

            res.json({
                success: true,
                message: 'Password berhasil diubah'
            });
        } catch (error) {
            console.error('Update password error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat mengubah password'
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

            // Verify password
            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

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
    }
};

module.exports = settingsController;
