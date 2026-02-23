// seed_data.js - Script untuk membuat 5 user default dengan produk sample
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./config/database');

async function seedData() {
    try {
        console.log('🌱 Memulai seeding data...');

        // Hash password untuk semua user
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash('user123', saltRounds);

        // Data 5 user default
        const users = [
            { name: 'Ahmad Hidayat', email: 'ahmad@example.com', role: 'user' },
            { name: 'Siti Nurhaliza', email: 'siti@example.com', role: 'user' },
            { name: 'Budi Santoso', email: 'budi@example.com', role: 'user' },
            { name: 'Dewi Lestari', email: 'dewi@example.com', role: 'user' },
            { name: 'Eko Prasetyo', email: 'eko@example.com', role: 'user' }
        ];

        // Produk sample untuk setiap user
        const userProducts = {
            1: [
                { name: 'Beras Premium', stock: 5, unit: 'kg', min_stock: 2, category: 'Sembako' },
                { name: 'Minyak Goreng', stock: 2, unit: 'liter', min_stock: 1, category: 'Sembako' },
                { name: 'Telur Ayam', stock: 10, unit: 'butir', min_stock: 5, category: 'Protein' },
                { name: 'Gula Pasir', stock: 3, unit: 'kg', min_stock: 1, category: 'Sembako' }
            ],
            2: [
                { name: 'Bayam', stock: 2, unit: 'ikat', min_stock: 1, category: 'Sayur' },
                { name: 'Wortel', stock: 3, unit: 'kg', min_stock: 1, category: 'Sayur' },
                { name: 'Daging Sapi', stock: 1, unit: 'kg', min_stock: 0.5, category: 'Protein' },
                { name: 'Susu UHT', stock: 6, unit: 'karton', min_stock: 2, category: 'Minuman' },
                { name: 'Roti Tawar', stock: 2, unit: 'bungkus', min_stock: 1, category: 'Makanan' }
            ],
            3: [
                { name: 'Kopi Bubuk', stock: 1, unit: 'kg', min_stock: 0.5, category: 'Minuman' },
                { name: 'Teh Celup', stock: 2, unit: 'box', min_stock: 1, category: 'Minuman' },
                { name: 'Mie Instan', stock: 20, unit: 'bungkus', min_stock: 10, category: 'Makanan' },
                { name: 'Kecap Manis', stock: 1, unit: 'botol', min_stock: 1, category: 'Bumbu' }
            ],
            4: [
                { name: 'Sabun Mandi', stock: 5, unit: 'batang', min_stock: 2, category: 'Kebersihan' },
                { name: 'Shampoo', stock: 2, unit: 'botol', min_stock: 1, category: 'Kebersihan' },
                { name: 'Pasta Gigi', stock: 3, unit: 'tube', min_stock: 1, category: 'Kebersihan' },
                { name: 'Deterjen', stock: 2, unit: 'kg', min_stock: 1, category: 'Kebersihan' },
                { name: 'Pewangi Pakaian', stock: 1, unit: 'botol', min_stock: 1, category: 'Kebersihan' }
            ],
            5: [
                { name: 'Bawang Merah', stock: 0.5, unit: 'kg', min_stock: 0.2, category: 'Bumbu' },
                { name: 'Bawang Putih', stock: 0.3, unit: 'kg', min_stock: 0.2, category: 'Bumbu' },
                { name: 'Cabai Rawit', stock: 0.2, unit: 'kg', min_stock: 0.1, category: 'Bumbu' },
                { name: 'Tomat', stock: 1, unit: 'kg', min_stock: 0.5, category: 'Sayur' },
                { name: 'Jeruk Nipis', stock: 0.5, unit: 'kg', min_stock: 0.2, category: 'Bumbu' }
            ]
        };

        // 1. Insert users
        console.log('\n📝 Membuat 5 user default...');
        const userIds = [];

        for (const user of users) {
            // Cek apakah user sudah ada
            const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [user.email]);
            
            if (existing.length > 0) {
                console.log(`   ⚠️  User ${user.email} sudah ada, ID: ${existing[0].id}`);
                userIds.push(existing[0].id);
            } else {
                const [result] = await db.execute(
                    `INSERT INTO users (name, email, password, role, is_confirmed, is_banned, status, login_count, created_at) 
                     VALUES (?, ?, ?, ?, TRUE, FALSE, 'active', 0, NOW())`,
                    [user.name, user.email, hashedPassword, user.role]
                );
                console.log(`   ✅ User dibuat: ${user.email}, ID: ${result.insertId}`);
                userIds.push(result.insertId);
            }
        }

        // 2. Insert categories if not exists
        console.log('\n📦 Membuat kategori...');
        const categories = ['Sembako', 'Sayur', 'Protein', 'Minuman', 'Makanan', 'Bumbu', 'Kebersihan'];
        const categoryIds = {};

        for (const category of categories) {
            const [existing] = await db.execute('SELECT id FROM categories WHERE name = ?', [category]);
            
            if (existing.length > 0) {
                categoryIds[category] = existing[0].id;
            } else {
                const [result] = await db.execute(
                    'INSERT INTO categories (name, description) VALUES (?, ?)',
                    [category, `Kategori ${category}`]
                );
                categoryIds[category] = result.insertId;
                console.log(`   ✅ Kategori dibuat: ${category}, ID: ${result.insertId}`);
            }
        }

        // 3. Insert products for each user
        console.log('\n🛒 Membuat produk sample untuk setiap user...');
        let totalProducts = 0;

        for (let i = 0; i < userIds.length; i++) {
            const userId = userIds[i];
            const products = userProducts[userIds[i]] || userProducts[i + 1];

            if (!products) continue;

            console.log(`\n   📦 Produk untuk User ID ${userId}:`);

            for (const product of products) {
                const [existing] = await db.execute(
                    'SELECT id FROM products WHERE user_id = ? AND name = ?',
                    [userId, product.name]
                );

                if (existing.length === 0) {
                    await db.execute(
                        `INSERT INTO products (user_id, name, category_id, stock_quantity, unit, min_stock_level, created_at)
                         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
                        [
                            userId,
                            product.name,
                            categoryIds[product.category] || null,
                            product.stock,
                            product.unit,
                            product.min_stock
                        ]
                    );
                    console.log(`      ✅ ${product.name} (${product.stock} ${product.unit})`);
                    totalProducts++;
                } else {
                    console.log(`      ⚠️  ${product.name} sudah ada`);
                }
            }
        }

        // 4. Create user stats
        console.log('\n📊 Membuat statistik user...');
        for (const userId of userIds) {
            const [productCount] = await db.execute(
                'SELECT COUNT(*) as count FROM products WHERE user_id = ?',
                [userId]
            );

            const [noteCount] = await db.execute(
                'SELECT COUNT(*) as count FROM notes WHERE user_id = ?',
                [userId]
            );

            const [existingStats] = await db.execute(
                'SELECT id FROM user_stats WHERE user_id = ?',
                [userId]
            );

            if (existingStats.length === 0) {
                await db.execute(
                    `INSERT INTO user_stats (user_id, total_products, total_notes, total_logins, last_activity, created_at)
                     VALUES (?, ?, ?, ?, NOW(), NOW())`,
                    [userId, productCount[0].count, noteCount[0].count, 0]
                );
            }
        }

        console.log('\n✅ Seeding selesai!');
        console.log(`   📊 Total User: ${userIds.length}`);
        console.log(`   📦 Total Produk: ${totalProducts}`);
        console.log(`   📂 Total Kategori: ${Object.keys(categoryIds).length}`);
        console.log('\n📝 Info Login:');
        console.log('   Email: ahmad@example.com, siti@example.com, budi@example.com, dewi@example.com, eko@example.com');
        console.log('   Password: user123');

    } catch (error) {
        console.error('❌ Error seeding data:', error);
        throw error;
    } finally {
        // Close connection
        const connection = await db.getConnection();
        connection.release();
        process.exit(0);
    }
}

// Run seed
seedData();
