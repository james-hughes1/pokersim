const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config(); // Load environment variables

const app = express();
const port = process.env.PORT || 3000;

// Set up EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

// Middleware to serve static files
app.use(express.static(path.join(__dirname, 'src/public')));

// Define routes
const homeController = require('./src/controllers/homeController');
app.get('/', homeController.renderHomePage);

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});