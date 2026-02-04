const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Middleware untuk otentikasi token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Akses ditolak, token tidak ditemukan'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key', (err, decoded) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: 'Token tidak valid'
            });
        }
        
        req.user = decoded;
        next();
    });
};

const authController = {
    authenticateToken,

    // Fungsi untuk login
    async login(req, res) {
        try {
            const { email, password } = req.body;

            // Validasi input
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email dan password harus diisi'
                });
            }

            // Cari pengguna berdasarkan email
            const user = await User.findByEmail(email);
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Email atau password salah'
                });
            }

            // Bandingkan password
            const isMatch = await bcrypt.compare(password, user.password);
            
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Email atau password salah'
                });
            }

            // Buat token JWT
            const token = jwt.sign(
                { userId: user.id, email: user.email },
                process.env.JWT_SECRET || 'fallback_secret_key',
                { expiresIn: '24h' }
            );

            // Simpan token ke session (jika menggunakan session)
            req.session.userId = user.id;
            req.session.token = token;

            res.status(200).json({
                success: true,
                message: 'Login berhasil',
                token: token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat login'
            });
        }
    },

    // Fungsi untuk register
    async register(req, res) {
        try {
            const { name, email, password } = req.body;

            // Validasi input
            if (!name || !email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Nama, email, dan password harus diisi'
                });
            }

            // Periksa apakah email sudah digunakan
            const existingUser = await User.findByEmail(email);
            
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Email sudah digunakan'
                });
            }

            // Hash password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Simpan pengguna baru
            const newUser = await User.create({
                name,
                email,
                password: hashedPassword
            });

            // Buat token JWT
            const token = jwt.sign(
                { userId: newUser.id, email: newUser.email },
                process.env.JWT_SECRET || 'fallback_secret_key',
                { expiresIn: '24h' }
            );

            // Simpan token ke session
            req.session.userId = newUser.id;
            req.session.token = token;

            res.status(201).json({
                success: true,
                message: 'Registrasi berhasil',
                token: token,
                user: {
                    id: newUser.id,
                    name: newUser.name,
                    email: newUser.email
                }
            });

        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat registrasi'
            });
        }
    },

    // Fungsi untuk logout
    async logout(req, res) {
        try {
            // Hapus session
            req.session.destroy((err) => {
                if (err) {
                    console.error('Session destroy error:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Gagal logout'
                    });
                }
                
                // Hapus cookie jika ada
                res.clearCookie('connect.sid'); // Nama cookie default untuk express-session
                
                res.status(200).json({
                    success: true,
                    message: 'Logout berhasil'
                });
            });
        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat logout'
            });
        }
    },

    // Fungsi untuk mendapatkan profil pengguna
    async getProfile(req, res) {
        try {
            const user = await User.findById(req.user.userId);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Pengguna tidak ditemukan'
                });
            }

            res.status(200).json({
                success: true,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
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

    // Fungsi untuk memperbarui profil pengguna
    async updateProfile(req, res) {
        try {
            const { name, email } = req.body;
            const userId = req.user.userId;

            // Validasi input
            if (!name || !email) {
                return res.status(400).json({
                    success: false,
                    message: 'Nama dan email harus diisi'
                });
            }

            // Periksa apakah email baru sama dengan yang lama atau email sudah digunakan orang lain
            const existingUser = await User.findByEmail(email);
            if (existingUser && existingUser.id !== userId) {
                return res.status(400).json({
                    success: false,
                    message: 'Email sudah digunakan oleh pengguna lain'
                });
            }

            // Update profil pengguna
            const updatedUser = await User.update(userId, { name, email });

            res.status(200).json({
                success: true,
                message: 'Profil berhasil diperbarui',
                user: updatedUser
            });
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat memperbarui profil'
            });
        }
    }
};

module.exports = authController;