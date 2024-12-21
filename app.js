require('dotenv').config(); // Load environment variables
const fs = require('fs');
const path = require('path');
const express = require('express');
const { stringify } = require('csv-stringify/sync'); // CSV generation library

const app = express();
const PORT = process.env.PORT || 3000;

// Get the root folder path from the .env file
const rootFolder = process.env.ROOT_FOLDER_TO_SCAN;

if (!rootFolder) {
    console.error("ROOT_FOLDER_TO_SCAN is not defined in the .env file.");
    process.exit(1);
}

// Function to list only files in the root folder (no subfolders)
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

// Function to recursively list all files and their paths
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
                files = files.concat(listFilesRecursive(fullPath)); // Recurse into subfolder
            }
        });
    } catch (err) {
        console.error(`Error reading folder "${folder}": ${err.message}`);
    }

    return files;
};

// Generate an HTML table from the file list
const generateHtmlTable = (files) => {
    return `
        <table>
            <thead>
                <tr>
                    <th>File Name</th>
                    <th>Folder Path</th>
                </tr>
            </thead>
            <tbody>
                ${files
                    .map(
                        (file) => `
                    <tr>
                        <td>${file.fileName}</td>
                        <td>${file.folderPath}</td>
                    </tr>`
                    )
                    .join('')}
            </tbody>
        </table>
    `;
};

// Web UI: List files in the root folder
app.get('/root', (req, res) => {
    const rootFiles = listFilesInRootFolder(rootFolder);
    res.send(`
        <html>
            <head>
                <title>Files in Root Folder</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f4f4f4; }
                </style>
            </head>
            <body>
                <h1>Files in Root Folder</h1>
                <p>Folder: <strong>${rootFolder}</strong></p>
                ${generateHtmlTable(rootFiles)}
            </body>
        </html>
    `);
});

// Web UI: List all files including subfolders
app.get('/all', (req, res) => {
    const allFiles = listFilesRecursive(rootFolder);
    res.send(`
        <html>
            <head>
                <title>All Files</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f4f4f4; }
                </style>
            </head>
            <body>
                <h1>All Files (Including Subfolders)</h1>
                <p>Folder: <strong>${rootFolder}</strong></p>
                ${generateHtmlTable(allFiles)}
            </body>
        </html>
    `);
});

// Download CSV for all files
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