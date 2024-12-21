const express = require('express');
const { listFilesInRootFolder, listFilesRecursive, listFoldersRecursive } = require('../services/fileService');
const { stringify } = require('csv-stringify/sync');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const rootFolder = process.env.ROOT_FOLDER_TO_SCAN;

// Route: Files in root folder
router.get('/root', (req, res) => {
    const rootFiles = listFilesInRootFolder(rootFolder);
    res.render('root', { title: 'Files in Root Folder', rootFolder, files: rootFiles });
});

// Route: All files including subfolders
router.get('/all', (req, res) => {
    const allFiles = listFilesRecursive(rootFolder);
    res.render('all', { title: 'All Files (Including Subfolders)', rootFolder, files: allFiles });
});

// Route: All folders and subfolders
router.get('/folders', (req, res) => {
    const folders = listFoldersRecursive(rootFolder);
    res.render('folders', { title: 'Folders and Subfolders', rootFolder, folders });
});

// Route: Download CSV for all files
router.get('/download', (req, res) => {
    const allFiles = listFilesRecursive(rootFolder);
    const outputCsvPath = path.join(__dirname, '../files_list.csv');
    try {
        const csvData = stringify(allFiles, {
            header: true,
            columns: { fileName: 'File Name', folderPath: 'Folder Path' },
        });

        fs.writeFileSync(outputCsvPath, csvData);
        res.download(outputCsvPath, 'files_list.csv');
    } catch (err) {
        res.status(500).send(`Error generating CSV: ${err.message}`);
    }
});

module.exports = router;