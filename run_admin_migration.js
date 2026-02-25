/**
 * Script to run the admin panel database standardization migration
 * Usage: node run_admin_migration.js
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
    let connection;
    
    try {
        console.log('🔧 Starting Admin Panel Database Standardization...\n');
        
        // Create database connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'kapanbeli',
            port: process.env.DB_PORT || 3306,
            multipleStatements: true // Allow multiple SQL statements
        });
        
        console.log('✅ Connected to database\n');
        
        // Read migration SQL file
        const migrationPath = path.join(__dirname, 'standardize_admin_db.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        console.log('📄 Reading migration file: standardize_admin_db.sql\n');
        
        // Split SQL into individual statements (simple split by semicolon)
        const statements = migrationSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        console.log(`📊 Found ${statements.length} SQL statements to execute\n`);
        
        // Execute each statement
        let successCount = 0;
        let skipCount = 0;
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            
            // Skip pure comment blocks
            if (statement.startsWith('--')) {
                skipCount++;
                continue;
            }
            
            try {
                await connection.execute(statement);
                successCount++;
                
                // Log progress for every 5th statement or on significant operations
                if (i % 5 === 0 || statement.includes('ALTER TABLE') || statement.includes('CREATE')) {
                    console.log(`   Executing statement ${i + 1}/${statements.length}...`);
                }
            } catch (error) {
                // Some errors are expected (e.g., column already exists)
                if (error.code === 'ER_DUP_FIELDNAME' || 
                    error.code === 'ER_DUP_KEY' || 
                    error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
                    console.log(`   ⚠️  Skipped (already exists): ${statement.substring(0, 50)}...`);
                    skipCount++;
                } else {
                    console.error(`   ❌ Error in statement ${i + 1}:`, error.message);
                    throw error;
                }
            }
        }
        
        console.log('\n✅ Migration completed successfully!\n');
        console.log('📊 Summary:');
        console.log(`   - Successful statements: ${successCount}`);
        console.log(`   - Skipped statements: ${skipCount}`);
        
        // Run verification query
        console.log('\n🔍 Running verification...\n');
        const [verification] = await connection.execute(`
            SELECT 
                account_status,
                COUNT(*) as count
            FROM users 
            GROUP BY account_status
            ORDER BY count DESC
        `);
        
        console.log('User Status Distribution:');
        verification.forEach(row => {
            console.log(`   - ${row.account_status}: ${row.count} users`);
        });
        
        // Show total
        const [total] = await connection.execute('SELECT COUNT(*) as total FROM users');
        console.log(`\n📈 Total users: ${total[0].total}`);
        
        // Verify the view was created
        try {
            const [viewCheck] = await connection.execute('SELECT * FROM v_user_stats');
            console.log('\n✅ Statistics view (v_user_stats) created successfully:');
            console.log(viewCheck[0]);
        } catch (error) {
            console.log('\n⚠️  Statistics view could not be verified');
        }
        
        console.log('\n✨ All done! Your database is now standardized.\n');
        
    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n👋 Database connection closed.\n');
        }
    }
}

// Run the migration
runMigration();
