const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateDatabaseStructure() {
    try {
        // Connect to MySQL without specifying database
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '' // Password is empty based on .env file
        });

        console.log('Connected to MySQL server.');

        // Check if database exists, if not create it
        const [databases] = await connection.execute("SHOW DATABASES LIKE 'kapanbeli'");
        if (databases.length === 0) {
            console.log('Database kapanbeli does not exist. Creating...');
            await connection.execute('CREATE DATABASE kapanbeli CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;');
            console.log('Database created.');
        }

        // Use the database
        await connection.execute('USE kapanbeli;');

        // Check if products table exists
        const [tables] = await connection.execute("SHOW TABLES LIKE 'products'");
        if (tables.length === 0) {
            console.log('Table products does not exist. Creating all tables...');
            
            // Create all tables as defined in the original schema
            // Users table
            await connection.execute(`
                CREATE TABLE users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    role ENUM('admin', 'user') DEFAULT 'user',
                    confirmation_token VARCHAR(255),
                    is_confirmed BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log('Created users table.');

            // Categories table
            await connection.execute(`
                CREATE TABLE categories (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    description TEXT
                );
            `);
            console.log('Created categories table.');

            // Products table (with all required columns)
            await connection.execute(`
                CREATE TABLE products (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    category_id INT,
                    name VARCHAR(255) NOT NULL,
                    stock_quantity DECIMAL(10, 2) DEFAULT 0,
                    unit VARCHAR(50) DEFAULT 'pcs',
                    min_stock_level DECIMAL(10, 2) DEFAULT 1.00,
                    expiry_date DATE,
                    image_url VARCHAR(500),
                    description TEXT,
                    quantity DECIMAL(10, 2) DEFAULT 1.00,
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
                );
            `);
            console.log('Created products table with all required columns.');

            // Notes table
            await connection.execute(`
                CREATE TABLE notes (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    content TEXT,
                    is_completed BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );
            `);
            console.log('Created notes table.');

            // Notifications table
            await connection.execute(`
                CREATE TABLE notifications (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    message TEXT NOT NULL,
                    type ENUM('info', 'warning', 'error') DEFAULT 'info',
                    is_read BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );
            `);
            console.log('Created notifications table.');

            // Insert sample categories
            await connection.execute(`
                INSERT INTO categories (name, description) VALUES
                ('Bumbu Dapur', 'Berbagai jenis bumbu untuk memasak'),
                ('Sayuran', 'Berbagai jenis sayuran segar'),
                ('Buah-buahan', 'Berbagai jenis buah-buahan'),
                ('Protein', 'Sumber protein seperti daging, telur, tahu, tempe'),
                ('Bahan Kering', 'Bahan makanan kering seperti mie, beras'),
                ('Lainnya', 'Kategori umum untuk barang lainnya');
            `);
            console.log('Inserted sample categories.');
        } else {
            console.log('Table products exists. Checking for missing columns...');
            
            // Check for missing columns and add them
            const [columns] = await connection.execute('DESCRIBE products;');
            const columnNames = columns.map(col => col.Field);
            
            // Add missing columns if they don't exist
            if (!columnNames.includes('description')) {
                await connection.execute('ALTER TABLE products ADD COLUMN description TEXT;');
                console.log('Added description column.');
            }
            
            if (!columnNames.includes('quantity')) {
                await connection.execute('ALTER TABLE products ADD COLUMN quantity DECIMAL(10, 2) DEFAULT 1.00;');
                console.log('Added quantity column.');
            }
            
            if (!columnNames.includes('notes')) {
                await connection.execute('ALTER TABLE products ADD COLUMN notes TEXT;');
                console.log('Added notes column.');
            }
            
            // Remove price column if it exists (since we removed it from the app)
            if (columnNames.includes('price')) {
                await connection.execute('ALTER TABLE products DROP COLUMN price;');
                console.log('Removed price column.');
            }
            
            console.log('Ensured all required columns exist in products table.');
        }

        // Verify the structure
        const [finalColumns] = await connection.execute('DESCRIBE products;');
        console.log('\nFinal products table structure:');
        console.table(finalColumns);

        await connection.end();
        console.log('\nDatabase structure update completed successfully!');
    } catch (error) {
        console.error('Error updating database structure:', error);
    }
}

updateDatabaseStructure();