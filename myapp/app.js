const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '../public')));

// Route to serve the homepage
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kapan Beli - Shopping List Manager</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #ffffff; /* White background */
            color: #333;
            line-height: 1.6;
        }

        /* Navbar styles */
        .navbar {
            background-color: #ffffff; /* White background */
            box-shadow: 0 2px 4px rgba(0,0,0,0.1); /* Thin shadow */
            padding: 1rem 0;
            position: sticky;
            top: 0;
            z-index: 100;
        }

        .nav-container {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 2rem;
        }

        .nav-title h1 {
            color: #FFA500; /* Muted Orange */
            font-size: 1.8rem;
        }

        .nav-buttons {
            display: flex;
            gap: 1rem;
        }

        .btn-shopping-list {
            background: transparent;
            border: 2px solid #FFA500; /* Orange border */
            color: #FFA500; /* Orange text */
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.3s ease;
        }

        .btn-shopping-list:hover {
            background-color: #FFA500;
            color: white;
        }

        /* Main content styles */
        .main-content {
            max-width: 1200px;
            margin: 2rem auto;
            padding: 0 2rem;
        }

        .container {
            background-color: #ffffff; /* White background */
            border-radius: 8px;
            padding: 1.5rem;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }

        .cards-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 1.5rem;
        }

        /* Card styling with soft blue */
        .card {
            background-color: rgba(173, 216, 230, 0.3); /* Soft blue background */
            border: 1px solid rgba(173, 216, 230, 0.5);
            border-radius: 8px;
            padding: 1rem;
            margin: 1rem 0;
            text-align: center;
        }

        .card h3 {
            color: #FF8C00; /* Orange color for headings */
            margin-bottom: 0.5rem;
        }

        .card p {
            color: #FF8C00; /* Orange color for text */
            font-size: 1.2rem;
            font-weight: bold;
        }

        .header-section {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
        }

        .header-section h2 {
            color: #333;
            font-size: 1.5rem;
        }

        .btn-add-product {
            background-color: #FFA500; /* Orange background */
            color: white;
            border: none;
            padding: 0.6rem 1.2rem;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .btn-add-product:hover {
            background-color: #e69500;
        }

        /* Product cards grid */
        .products-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1.5rem;
        }

        /* Product card styling */
        .product-card {
            background-color: rgba(173, 216, 230, 0.2); /* Soft blue background */
            border: 1px solid rgba(173, 216, 230, 0.3);
            border-radius: 8px;
            padding: 1.2rem;
            display: flex;
            flex-direction: column;
        }

        .product-card-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1rem;
        }

        .product-card-image {
            width: 80px;
            height: 80px;
            border-radius: 8px;
            object-fit: cover;
        }

        .product-info {
            flex: 1;
        }

        .product-name {
            color: #FF8C00; /* Orange color for product names */
            font-size: 1.2rem;
            font-weight: 600;
            margin-bottom: 0.25rem;
        }

        .product-category {
            color: #666;
            font-size: 0.9rem;
        }

        .product-details {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid rgba(0,0,0,0.1);
        }

        .price {
            font-weight: 600;
            color: #333;
        }

        .stock-status {
            font-size: 0.9rem;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
        }

        .stock-quantity {
            font-weight: 600;
            color: #333;
            margin-top: 0.25rem;
        }

        .critical-stock {
            color: #FF4500; /* Darker orange for critical stock */
            font-weight: 600;
            background-color: rgba(255, 69, 0, 0.1);
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
        }

        .product-actions {
            display: flex;
            justify-content: flex-end;
            gap: 0.5rem;
        }

        /* Action buttons */
        .btn-action {
            background: none;
            border: none;
            cursor: pointer;
            padding: 0.5rem;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.3s;
        }

        .btn-edit {
            color: #FFA500; /* Orange for edit */
        }

        .btn-delete {
            color: #888; /* Gray for delete */
        }

        .btn-action:hover {
            background-color: #f0f0f0;
        }

        .btn-edit:hover {
            background-color: rgba(255, 165, 0, 0.1);
        }

        .btn-delete:hover {
            background-color: rgba(136, 136, 136, 0.1);
        }

        /* Responsive design */
        @media (max-width: 768px) {
            .nav-container {
                flex-direction: column;
                gap: 1rem;
                padding: 0 1rem;
            }
            
            .header-section {
                flex-direction: column;
                align-items: flex-start;
                gap: 1rem;
            }
            
            .products-grid {
                grid-template-columns: 1fr;
            }
            
            .product-card-header {
                flex-direction: row;
            }
        }
    </style>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body>
    <nav class="navbar">
        <div class="nav-container">
            <div class="nav-title">
                <h1>Kapan Beli</h1>
            </div>
            <div class="nav-buttons">
                <button class="btn-shopping-list">Shopping List</button>
            </div>
        </div>
    </nav>

    <main class="main-content">
        <div class="container">
            <!-- Summary Cards -->
            <div class="cards-container">
                <div class="card">
                    <h3>Total Products</h3>
                    <p>24 Items</p>
                </div>
                <div class="card">
                    <h3>Critical Stock</h3>
                    <p>3 Items</p>
                </div>
                <div class="card">
                    <h3>Shopping List</h3>
                    <p>7 Items</p>
                </div>
            </div>
            
            <div class="header-section">
                <h2>Your Products</h2>
                <button class="btn-add-product"><i class="fas fa-plus"></i> Add Product</button>
            </div>
            
            <div class="products-grid">
                <div class="product-card">
                    <div class="product-card-header">
                        <img src="https://placehold.co/80x80/FFA500/FFFFFF?text=A" alt="Apple" class="product-card-image">
                        <div class="product-info">
                            <h3 class="product-name">Apple</h3>
                            <p class="product-category">Fruits</p>
                        </div>
                    </div>
                    <div class="product-details">
                        <div class="price">Rp 15,000</div>
                        <div class="stock-status">
                            <span class="critical-stock">Low Stock</span>
                            <span class="stock-quantity">Stok: 3</span>
                        </div>
                    </div>
                    <div class="product-actions">
                        <button class="btn-action btn-edit"><i class="fas fa-edit"></i></button>
                        <button class="btn-action btn-delete"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                
                <div class="product-card">
                    <div class="product-card-header">
                        <img src="https://placehold.co/80x80/FFA500/FFFFFF?text=M" alt="Milk" class="product-card-image">
                        <div class="product-info">
                            <h3 class="product-name">Milk</h3>
                            <p class="product-category">Dairy</p>
                        </div>
                    </div>
                    <div class="product-details">
                        <div class="price">Rp 25,000</div>
                        <div class="stock-status">
                            <span>In Stock</span>
                            <span class="stock-quantity">Stok: 15</span>
                        </div>
                    </div>
                    <div class="product-actions">
                        <button class="btn-action btn-edit"><i class="fas fa-edit"></i></button>
                        <button class="btn-action btn-delete"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                
                <div class="product-card">
                    <div class="product-card-header">
                        <img src="https://placehold.co/80x80/FFA500/FFFFFF?text=B" alt="Bread" class="product-card-image">
                        <div class="product-info">
                            <h3 class="product-name">Bread</h3>
                            <p class="product-category">Bakery</p>
                        </div>
                    </div>
                    <div class="product-details">
                        <div class="price">Rp 18,000</div>
                        <div class="stock-status">
                            <span class="critical-stock">Critical</span>
                            <span class="stock-quantity">Stok: 1</span>
                        </div>
                    </div>
                    <div class="product-actions">
                        <button class="btn-action btn-edit"><i class="fas fa-edit"></i></button>
                        <button class="btn-action btn-delete"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                
                <div class="product-card">
                    <div class="product-card-header">
                        <img src="https://placehold.co/80x80/FFA500/FFFFFF?text=E" alt="Eggs" class="product-card-image">
                        <div class="product-info">
                            <h3 class="product-name">Eggs</h3>
                            <p class="product-category">Dairy</p>
                        </div>
                    </div>
                    <div class="product-details">
                        <div class="price">Rp 22,000</div>
                        <div class="stock-status">
                            <span>In Stock</span>
                            <span class="stock-quantity">Stok: 24</span>
                        </div>
                    </div>
                    <div class="product-actions">
                        <button class="btn-action btn-edit"><i class="fas fa-edit"></i></button>
                        <button class="btn-action btn-delete"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <script>
        // Add interactivity to the CRUD buttons
        document.addEventListener('DOMContentLoaded', function() {
            // Add product button functionality
            const addProductBtn = document.querySelector('.btn-add-product');
            if(addProductBtn) {
                addProductBtn.addEventListener('click', function() {
                    alert('Add new product functionality would be implemented here');
                });
            }

            // Edit buttons functionality
            const editButtons = document.querySelectorAll('.btn-edit');
            editButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const productCard = this.closest('.product-card');
                    const productName = productCard.querySelector('.product-name').textContent;
                    alert('Edit functionality for ' + productName + ' would be implemented here');
                });
            });

            // Delete buttons functionality
            const deleteButtons = document.querySelectorAll('.btn-delete');
            deleteButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const productCard = this.closest('.product-card');
                    const productName = productCard.querySelector('.product-name').textContent;
                    const confirmDelete = confirm('Are you sure you want to delete ' + productName + '?');
                    if(confirmDelete) {
                        productCard.remove();
                        alert(productName + ' has been deleted');
                    }
                });
            });

            // Shopping list button functionality
            const shoppingListBtn = document.querySelector('.btn-shopping-list');
            if(shoppingListBtn) {
                shoppingListBtn.addEventListener('click', function() {
                    alert('Shopping list functionality would be implemented here');
                });
            }
        });
    </script>
</body>
</html>`);
});

app.listen(port, () => {
  console.log('Kapan Beli app listening on port ' + port);
});