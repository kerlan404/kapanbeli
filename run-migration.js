const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
    let connection;
    try {
        // Create connection without database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
            multipleStatements: true // Allow multiple statements
        });

        console.log('Connected to MySQL server');

        // Check if database exists
        const dbName = process.env.DB_NAME || 'kapanbeli';
        const [databases] = await connection.execute(`SHOW DATABASES LIKE '${dbName}'`);
        
        if (databases.length === 0) {
            console.error(`Database '${dbName}' not found. Please create it first.`);
            process.exit(1);
        }

        // Use the database
        await connection.query(`USE \`${dbName}\``);

        // Check if columns already exist
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = '${dbName}'
            AND TABLE_NAME = 'products' 
            AND COLUMN_NAME IN ('is_deactivated_by_admin', 'deactivated_at', 'deactivated_reason', 'deactivated_by')
        `);

        if (columns.length >= 4) {
            console.log('✓ Migration already applied. All deactivation columns exist.');
            process.exit(0);
        }

        console.log('Applying migration: Add product deactivation columns...');

        // Add columns one by one with error handling
        const migrationQueries = [
            {
                query: 'ALTER TABLE products ADD COLUMN is_deactivated_by_admin BOOLEAN DEFAULT FALSE',
                name: 'is_deactivated_by_admin'
            },
            {
                query: 'ALTER TABLE products ADD COLUMN deactivated_at TIMESTAMP NULL',
                name: 'deactivated_at'
            },
            {
                query: 'ALTER TABLE products ADD COLUMN deactivated_reason TEXT',
                name: 'deactivated_reason'
            },
            {
                query: 'ALTER TABLE products ADD COLUMN deactivated_by INT NULL',
                name: 'deactivated_by'
            }
        ];

        for (const migration of migrationQueries) {
            try {
                await connection.execute(migration.query);
                console.log(`✓ Added column: ${migration.name}`);
            } catch (error) {
                if (error.code === 'ER_DUP_FIELDNAME') {
                    console.log(`✓ Column ${migration.name} already exists, skipping...`);
                } else {
                    throw error;
                }
            }
        }

        // Add foreign key constraint
        try {
            await connection.execute(`
                ALTER TABLE products 
                ADD CONSTRAINT fk_deactivated_by 
                FOREIGN KEY (deactivated_by) REFERENCES users(id) ON DELETE SET NULL
            `);
            console.log('✓ Added foreign key constraint: fk_deactivated_by');
        } catch (error) {
            if (error.code === 'ER_DUP_KEY' || error.code === 'ER_CANT_CREATE_TABLE') {
                console.log('✓ Foreign key constraint already exists, skipping...');
            } else {
                console.warn('Warning: Could not add foreign key constraint:', error.message);
            }
        }

        // Add index
        try {
            await connection.execute(`
                CREATE INDEX idx_products_deactivated ON products(is_deactivated_by_admin)
            `);
            console.log('✓ Created index: idx_products_deactivated');
        } catch (error) {
            if (error.code === 'ER_DUP_KEY') {
                console.log('✓ Index already exists, skipping...');
            } else {
                console.warn('Warning: Could not create index:', error.message);
            }
        }

        console.log('\n✅ Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed.');
        }
    }
}

runMigration();
