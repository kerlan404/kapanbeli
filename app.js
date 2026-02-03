const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve static files from the 'views' directory (where index.html is located)
app.use(express.static(path.join(__dirname, 'views')));

// Route to serve the homepage (index.html from views directory)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Additional route to handle any other routes that should serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.listen(port, () => {
  console.log('Kapan Beli app listening on port ' + port);
});