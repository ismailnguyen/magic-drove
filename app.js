require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const fileRoutes = require('./routes/files');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', './views');

// Use express-ejs-layouts
app.use(expressLayouts);
app.set('layout', 'layout');

// Use the file routes
app.use(fileRoutes);

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Visit http://localhost:${PORT}/root to view files in the root folder.`);
    console.log(`Visit http://localhost:${PORT}/all to view all files (including subfolders).`);
    console.log(`Visit http://localhost:${PORT}/folders to view all folders.`);
    console.log(`Visit http://localhost:${PORT}/download to download a CSV of all files.`);
});