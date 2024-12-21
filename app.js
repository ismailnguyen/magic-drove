require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const { stringify } = require('csv-stringify/sync');

const app = express();
const PORT = process.env.PORT || 3000;

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Use express-ejs-layouts
app.use(expressLayouts);
app.set('layout', 'layout'); // Default layout

// Get the root folder path from the .env file
const rootFolder = process.env.ROOT_FOLDER_TO_SCAN;

if (!rootFolder) {
    console.error("ROOT_FOLDER_TO_SCAN is not defined in the .env file.");
    process.exit(1);
}

// Function to list files in the root folder
const listFilesInRootFolder = (folder) => {
    const files = [];
    try {
        const items = fs.readdirSync(folder);

        items.forEach((item) => {
            const fullPath = path.join(folder, item);
            if (fs.lstatSync(fullPath).isFile()) {
                files.push({ fileName: item, folderPath: folder });
            }
        });
    } catch (err) {
        console.error(`Error reading folder "${folder}": ${err.message}`);
    }
    return files;
};

// Function to list all files recursively
const listFilesRecursive = (folder) => {
    let files = [];
    try {
        const items = fs.readdirSync(folder);

        items.forEach((item) => {
            const fullPath = path.join(folder, item);
            const stats = fs.lstatSync(fullPath);

            if (stats.isFile()) {
                files.push({ fileName: item, folderPath: folder });
            } else if (stats.isDirectory()) {
                files = files.concat(listFilesRecursive(fullPath));
            }
        });
    } catch (err) {
        console.error(`Error reading folder "${folder}": ${err.message}`);
    }
    return files;
};

// Route: Files in root folder
app.get('/root', (req, res) => {
    const rootFiles = listFilesInRootFolder(rootFolder);
    res.render('root', { title: 'Files in Root Folder', rootFolder, files: rootFiles });
});

// Route: All files including subfolders
app.get('/all', (req, res) => {
    const allFiles = listFilesRecursive(rootFolder);
    res.render('all', { title: 'All Files (Including Subfolders)', rootFolder, files: allFiles });
});

// Route: Download CSV for all files
app.get('/download', (req, res) => {
    const allFiles = listFilesRecursive(rootFolder);
    const outputCsvPath = path.join(__dirname, 'files_list.csv');
    try {
        const csvData = stringify(allFiles, {
            header: true,
            columns: { fileName: 'File Name', folderPath: 'Folder Path' }
        });

        fs.writeFileSync(outputCsvPath, csvData);
        res.download(outputCsvPath, 'files_list.csv');
    } catch (err) {
        res.status(500).send(`Error generating CSV: ${err.message}`);
    }
});

// Start the web server
app.listen(PORT, () => {
    console.log(`Web server running at http://localhost:${PORT}`);
    console.log(`Visit http://localhost:${PORT}/root to view files in the root folder.`);
    console.log(`Visit http://localhost:${PORT}/all to view all files (including subfolders).`);
    console.log(`Visit http://localhost:${PORT}/download to download a CSV of all files.`);
});