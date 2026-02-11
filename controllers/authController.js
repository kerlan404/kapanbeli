const path = require('path');
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
    // Check if nodemailer is properly loaded
    if (!nodemailer || typeof nodemailer.createTransporter !== 'function') {
        console.error('Nodemailer is not properly loaded');
        return null;
    }
    
    // Contoh konfigurasi untuk Gmail
    // Pastikan untuk mengaktifkan "Less Secure App Access" atau "App Passwords" di akun Gmail Anda
    // Atau gunakan layanan email lain seperti SendGrid, Mailgun, dll.
    try {
        return nodemailer.createTransporter({
            service: 'gmail', // Gunakan layanan email Anda
            auth: {
                user: process.env.EMAIL_USER, // Alamat email pengirim
                pass: process.env.EMAIL_PASS  // Password atau App Password
            }
        });
    } catch (error) {
        console.error('Error creating transporter:', error);
        return null;
    }

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

            // Cek apakah ini login admin default
            const defaultAdminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@kapanbeli.com';
            const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
            
            if (email === defaultAdminEmail && password === defaultAdminPassword) {
                // Login sebagai admin default
                req.session.userId = 'default_admin';
                req.session.user = {
                    id: 'default_admin',
                    name: 'Administrator',
                    email: defaultAdminEmail,
                    role: 'admin'
                };

                return res.json({ 
                    success: true, 
                    message: 'Login admin berhasil! Selamat datang kembali.', 
                    redirect: '/admin',
                    user: {
                        name: 'Administrator',
                        email: defaultAdminEmail,
                        role: 'admin'
                    }
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
            
            // Debug: Log user role
            console.log('User role retrieved:', user.role, 'for email:', email);

            // Tidak perlu memeriksa konfirmasi email karena semua akun langsung dikonfirmasi saat registrasi

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
                email: user.email,
                role: user.role || 'user'
            };
            
            // Debug: Log session role
            console.log('Session role set to:', user.role || 'user');

            // Redirect ke halaman yang sesuai berdasarkan role
            const redirectUrl = user.role === 'admin' ? '/admin' : '/';
            
            res.json({
                success: true,
                message: 'Login berhasil! Selamat datang kembali.',
                redirect: redirectUrl,
                user: {
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                code: error.code
            });
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat login: ' + error.message
            });
        }
    },

    // Fungsi untuk register
    async register(req, res) {
        try {
            const { name, email, password, confirmPassword } = req.body;

            console.log('Registration attempt for email:', email);
            
            // Validasi input
            if (!name || !email || !password || !confirmPassword) {
                console.log('Validation failed: Missing required fields');
                return res.status(400).json({
                    success: false,
                    message: 'Nama, email, password, dan konfirmasi password harus diisi'
                });
            }

            if (password !== confirmPassword) {
                console.log('Validation failed: Passwords do not match for email:', email);
                return res.status(400).json({
                    success: false,
                    message: 'Password dan konfirmasi password tidak cocok'
                });
            }

            // Validasi panjang password minimum (opsional, bisa disesuaikan)
            if (password.length < 1) {
                console.log('Validation failed: Password too short for email:', email);
                return res.status(400).json({
                    success: false,
                    message: 'Password harus diisi'
                });
            }

            // Periksa apakah email sudah digunakan
            console.log('Checking if email already exists:', email);
            const existingUser = await User.findByEmail(email);

            if (existingUser) {
                console.log('Registration failed: Email already exists:', email);
                return res.status(400).json({
                    success: false,
                    message: 'Email sudah digunakan'
                });
            }

            // Hash password
            console.log('Hashing password for user:', email);
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Check if this is the first user, if so, make them an admin
            const totalUsers = await User.getTotalUsers();
            const isAdmin = totalUsers === 0; // First user becomes admin
            
            // Simpan pengguna baru
            console.log('Creating new user in database:', email);
            const newUser = await User.create({
                name,
                email,
                password: hashedPassword,
                role: isAdmin ? 'admin' : 'user'
            });
            
            console.log('User created successfully in database:', newUser.email);

            // Kirim email konfirmasi (optional - don't break registration if email fails)
            try {
                const transporter = createTransporter();
                
                // Only try to send email if transporter is available
                if (transporter) {
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
                } else {
                    console.warn('Email transporter not available, skipping confirmation email');
                }
            } catch (emailError) {
                console.error('Failed to send confirmation email:', emailError);
                // Jika gagal kirim email, tetap lanjutkan karena user sudah dibuat
            }

            // Berhasil register, kembalikan pesan sukses
            // Setelah registrasi, langsung login otomatis (tanpa perlu konfirmasi email)
            req.session.userId = newUser.id;
            req.session.user = {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role || 'user'
            };

            // Verifikasi bahwa session telah diset
            if (!req.session.user) {
                console.error('Session failed to set after registration');
                return res.status(500).json({
                    success: false,
                    message: 'Terjadi kesalahan saat membuat sesi pengguna'
                });
            }

            console.log(`User registered and logged in successfully: ${newUser.email}`);

            res.json({
                success: true,
                message: 'Registrasi berhasil! Akun Anda telah dibuat. Selamat datang di Kapan Beli.',
                redirect: '/', // Langsung arahkan ke beranda setelah registrasi
                user: {
                    name: newUser.name,
                    email: newUser.email
                }
            });

        } catch (error) {
            console.error('Registration error:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                code: error.code
            });
            
            // Penanganan error spesifik untuk masalah database
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({
                    success: false,
                    message: 'Email sudah digunakan'
                });
            } else if (error.code === 'ER_NO_SUCH_TABLE') {
                return res.status(500).json({
                    success: false,
                    message: 'Struktur database belum diinisialisasi. Hubungi administrator.'
                });
            } else if (error.code === 'ECONNREFUSED') {
                return res.status(500).json({
                    success: false,
                    message: 'Tidak dapat terhubung ke database. Pastikan database aktif.'
                });
            }
            
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat registrasi: ' + error.message
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

            // Inisialisasi session pengguna (login otomatis setelah konfirmasi)
            req.session.userId = user.id;
            req.session.user = {
                id: user.id,
                name: user.name,
                email: user.email
            };

            // Redirect ke halaman beranda setelah konfirmasi dan login otomatis
            res.redirect('/');

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
                res.json({ 
                    success: true, 
                    message: 'Logout berhasil! Sampai jumpa kembali.', 
                    redirect: '/auth' 
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

// Fungsi untuk menampilkan halaman lupa password
authController.showForgotPassword = async (req, res) => {
    try {
        res.sendFile(path.join(__dirname, '../views/forgot-password.html'));
    } catch (error) {
        console.error('Show forgot password page error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat menampilkan halaman'
        });
    }
};

// Fungsi untuk mengirim permintaan reset password
authController.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // Validasi email
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email harus diisi'
            });
        }

        // Cari pengguna berdasarkan email
        const user = await User.getByEmail(email);
        if (!user) {
            // Untuk alasan keamanan, kita tetap mengembalikan pesan sukses meskipun email tidak ditemukan
            return res.status(200).json({
                success: true,
                message: 'Jika email terdaftar, tautan reset password telah dikirim ke email Anda'
            });
        }

        // Generate token untuk reset password
        const resetToken = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET || 'fallback_secret_key',
            { expiresIn: '1h' } // Token berlaku 1 jam
        );

        // Simpan token ke database (opsional, tergantung implementasi)
        await User.updatePasswordResetToken(user.id, resetToken);

        // Kirim email dengan tautan reset password
        const transporter = createTransporter();
        if (transporter) {
            const resetUrl = `${req.protocol}://${req.get('host')}/auth/reset-password/${resetToken}`;
            
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Reset Password - Kapan Beli',
                html: `
                    <h2>Permintaan Reset Password</h2>
                    <p>Anda menerima email ini karena ada permintaan reset password untuk akun Anda.</p>
                    <p>Klik tautan di bawah ini untuk mereset password Anda:</p>
                    <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #FF9F43; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0;">Reset Password</a>
                    <p>Tautan ini akan kedaluwarsa dalam 1 jam.</p>
                    <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
                `
            };

            await transporter.sendMail(mailOptions);
        }

        res.status(200).json({
            success: true,
            message: 'Tautan reset password telah dikirim ke email Anda'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat mengirim permintaan reset password'
        });
    }
};

// Fungsi untuk menampilkan halaman reset password
authController.showResetPassword = async (req, res) => {
    try {
        const { token } = req.params;

        // Verifikasi token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: 'Token tidak valid atau telah kedaluwarsa'
            });
        }

        // Cek apakah token valid di database (opsional, tergantung implementasi)
        const user = await User.getById(decoded.userId);
        if (!user || user.password_reset_token !== token) {
            return res.status(400).json({
                success: false,
                message: 'Token tidak valid atau telah digunakan'
            });
        }

        // Kirim halaman reset password
        res.sendFile(path.join(__dirname, '../views/reset-password.html'));
    } catch (error) {
        console.error('Show reset password page error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat menampilkan halaman'
        });
    }
};

// Fungsi untuk mengatur password baru
authController.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;

        // Validasi password baru
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password baru harus memiliki setidaknya 6 karakter'
            });
        }

        // Verifikasi token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: 'Token tidak valid atau telah kedaluwarsa'
            });
        }

        // Hash password baru
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password pengguna
        await User.updatePassword(decoded.userId, hashedPassword);
        
        // Hapus token reset password
        await User.updatePasswordResetToken(decoded.userId, null);

        res.status(200).json({
            success: true,
            message: 'Password berhasil direset. Silakan login dengan password baru Anda.'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat mereset password'
        });
    }
};

module.exports = authController;