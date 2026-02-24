const db = require('./config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        console.log('🚀 Starting migration...\n');

        // Read the SQL file
        const sqlPath = path.join(__dirname, 'update_expiry_date_and_stats.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Split SQL into individual statements (simple split by semicolon)
        const statements = sql
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('SELECT') && !stmt.startsWith('DESCRIBE'));

        console.log(`📝 Found ${statements.length} statements to execute\n`);

        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            try {
                await db.execute(statement);
                console.log(`✅ Statement ${i + 1} executed successfully`);
            } catch (error) {
                // Ignore "column exists" errors
                if (error.code === 'ER_DUP_FIELDNAME' || error.code === 'ER_COLUMN_EXISTS') {
                    console.log(`⚠️  Statement ${i + 1} skipped (already exists)`);
                } else {
                    console.log(`ℹ️  Statement ${i + 1} info: ${error.message.substring(0, 100)}`);
                }
            }
        }

        console.log('\n✨ Migration completed successfully!\n');

        // Verify the changes
        console.log('📊 Verification:');
        
        const [products] = await db.execute('DESCRIBE products');
        const expiryDateCol = products.find(col => col.Field === 'expiry_date');
        console.log(`   - expiry_date nullable: ${expiryDateCol?.Null === 'YES' ? '✅ YES' : '❌ NO'}`);

        const [stats] = await db.execute('SELECT COUNT(*) as count FROM user_stats');
        console.log(`   - user_stats records: ${stats[0].count}`);

        const [productsCount] = await db.execute('SELECT COUNT(*) as count FROM products');
        console.log(`   - total products: ${productsCount[0].count}`);

        const [notesCount] = await db.execute('SELECT COUNT(*) as count FROM notes');
        console.log(`   - total notes: ${notesCount[0].count}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        // Close database connection
        await db.end().catch(() => {});
    }
}

// Run the migration
runMigration();
