const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve static files from the 'views' directory (where index.html is located)
app.use(express.static(path.join(__dirname, 'views')));

// Route to serve the login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Route to serve the homepage (index.html from views directory)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Route to serve the products page
app.get('/products', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'products.html'));
});

// Route to serve the suggestions page
app.get('/suggestions', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'suggestions.html'));
});

// Route to serve the stores page
app.get('/stores', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'stores.html'));
});

// Additional route to handle any other routes that should serve index.html
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.listen(port, () => {
  console.log('Kapan Beli app listening on port ' + port);
});