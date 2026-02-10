const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

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

// Fungsi untuk membuat transporter email (gunakan konfigurasi SMTP Anda)
const createTransporter = () => {
    // Contoh konfigurasi untuk Gmail
    // Pastikan untuk mengaktifkan "Less Secure App Access" atau "App Passwords" di akun Gmail Anda
    // Atau gunakan layanan email lain seperti SendGrid, Mailgun, dll.
    return nodemailer.createTransporter({
        service: 'gmail', // Gunakan layanan email Anda
        auth: {
            user: process.env.EMAIL_USER, // Alamat email pengirim
            pass: process.env.EMAIL_PASS  // Password atau App Password
        }
    });

    // Contoh alternatif untuk SMTP server kustom:
    /*
    return nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
    */
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

            // Periksa apakah akun sudah dikonfirmasi
            if (!user.is_confirmed) {
                return res.status(401).json({
                    success: false,
                    message: 'Akun Anda belum dikonfirmasi. Silakan cek email Anda.'
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

            // Simpan token ke session (jika menggunakan session)
            req.session.userId = user.id;
            req.session.user = {
                id: user.id,
                name: user.name,
                email: user.email
            };

            // Redirect ke halaman utama setelah login berhasil
            res.json({ success: true, message: 'Login berhasil', redirect: '/' });

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
            const { name, email, password, confirmPassword } = req.body;

            // Validasi input
            if (!name || !email || !password || !confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Nama, email, password, dan konfirmasi password harus diisi'
                });
            }

            if (password !== confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Password dan konfirmasi password tidak cocok'
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

            // Simpan pengguna baru (status is_confirmed = false secara default)
            const newUser = await User.create({
                name,
                email,
                password: hashedPassword
            });

            // Kirim email konfirmasi
            try {
                const transporter = createTransporter();
                const confirmationUrl = `${req.protocol}://${req.get('host')}/auth/confirm/${newUser.confirmation_token}`;

                const mailOptions = {
                    from: process.env.EMAIL_USER || 'noreply@kapanbeli.com',
                    to: newUser.email,
                    subject: 'Konfirmasi Akun KapanBeli',
                    html: `
                        <h2>Selamat Datang di KapanBeli, ${newUser.name}!</h2>
                        <p>Terima kasih telah mendaftar. Untuk mengaktifkan akun Anda, silakan klik tombol di bawah ini:</p>
                        <a href="${confirmationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #ffb347; color: black; text-decoration: none; border-radius: 5px;">Konfirmasi Akun</a>
                        <p>Atau salin dan tempel tautan berikut ke browser Anda:</p>
                        <p>${confirmationUrl}</p>
                        <p>Tautan ini akan kadaluarsa setelah 24 jam.</p>
                        <br>
                        <p>Hormat kami,</p>
                        <p>Tim KapanBeli</p>
                    `
                };

                await transporter.sendMail(mailOptions);
                console.log(`Confirmation email sent to ${newUser.email}`);
            } catch (emailError) {
                console.error('Failed to send confirmation email:', emailError);
                // Jika gagal kirim email, hapus user yang baru dibuat?
                // Tergantung kebijakan, untuk saat ini kita tetap lanjutkan
                // karena token konfirmasi sudah disimpan di database
            }

            // Berhasil register, kembalikan pesan sukses
            res.json({
                success: true,
                message: 'Akun berhasil dibuat. Silakan cek email Anda untuk konfirmasi.',
                redirect: '/auth' // Redirect ke halaman login setelah registrasi
            });

        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat registrasi'
            });
        }
    },

    // Fungsi untuk konfirmasi akun
    async confirmAccount(req, res) {
        try {
            const { token } = req.params;

            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: 'Token konfirmasi tidak valid.'
                });
            }

            // Cari pengguna berdasarkan token konfirmasi
            const user = await User.findByConfirmationToken(token);

            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: 'Token konfirmasi tidak valid atau sudah digunakan.'
                });
            }

            // Konfirmasi akun pengguna
            await User.confirmUser(token);

            // Redirect ke halaman login dengan pesan sukses
            res.redirect(`/auth?confirmed=true`);

        } catch (error) {
            console.error('Account confirmation error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat konfirmasi akun.'
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

                // Redirect ke halaman login setelah logout berhasil
                res.json({ success: true, message: 'Logout berhasil', redirect: '/auth' });
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
                    is_confirmed: user.is_confirmed,
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