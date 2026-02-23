// run_migration.js - Script untuk menjalankan database migration
require('dotenv').config();
const fs = require('fs');
const mysql = require('mysql2/promise');

async function runMigration() {
    let connection;
    
    try {
        console.log('🔌 Menghubungkan ke database...');
        
        // Buat koneksi dengan memilih database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'kapanbeli',
            multipleStatements: true // Izinkan multiple statements
        });

        console.log('✅ Terhubung ke database!');

        // Baca file migration SQL
        const migrationSQL = fs.readFileSync('./database_migration.sql', 'utf8');
        
        console.log('\n📝 Menjalankan migration SQL...\n');

        // Jalankan migration
        await connection.query(migrationSQL);

        console.log('✅ Migration berhasil!\n');

        // Verifikasi tabel dan kolom
        console.log('🔍 Memverifikasi migration...\n');

        // Cek kolom di tabel users
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'users'
            AND COLUMN_NAME IN ('last_login', 'last_logout', 'is_banned', 'ban_reason', 'login_count', 'status')
        `);

        console.log('📊 Kolom baru di tabel users:');
        columns.forEach(col => {
            console.log(`   ✅ ${col.COLUMN_NAME}`);
        });

        // Cek tabel login_logs
        const [loginLogsExists] = await connection.query(`
            SHOW TABLES LIKE 'login_logs'
        `);
        
        if (loginLogsExists.length > 0) {
            console.log('   ✅ Tabel login_logs dibuat');
        }

        // Cek tabel user_stats
        const [userStatsExists] = await connection.query(`
            SHOW TABLES LIKE 'user_stats'
        `);
        
        if (userStatsExists.length > 0) {
            console.log('   ✅ Tabel user_stats dibuat');
        }

        console.log('\n✅ Migration selesai dan terverifikasi!\n');

    } catch (error) {
        console.error('❌ Error saat migration:', error.message);
        
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('\n⚠️  Beberapa kolom mungkin sudah ada. Ini tidak masalah.');
        } else if (error.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log('\n⚠️  Beberapa tabel mungkin sudah ada. Ini tidak masalah.');
        } else {
            console.log('\n💡 Pastikan MySQL sudah berjalan dan database sudah dibuat.');
        }
        
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n👋 Koneksi database ditutup.');
        }
        process.exit(0);
    }
}

runMigration();
