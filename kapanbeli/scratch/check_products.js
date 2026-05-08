const db = require('../config/database');

async function checkProducts() {
    try {
        const [rows] = await db.execute('SELECT name, stock_quantity, min_stock_level, user_id FROM products');
        console.log('--- Product List ---');
        rows.forEach(row => {
            console.log(`Name: ${row.name}, Stock: ${row.stock_quantity}, Min: ${row.min_stock_level}, UserID: ${row.user_id}`);
        });
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkProducts();
