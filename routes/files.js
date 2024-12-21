const express = require('express');
const { listFilesInRootFolder, listFilesRecursive, listFoldersRecursive, matchFoldersByTags } = require('../services/fileService');
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

// Route: Match folders based on tags
router.post('/match-folders', (req, res) => {
    const { fileName, tags } = req.body;

    if (!tags || tags.length === 0) {
        return res.status(400).json({ success: false, message: 'Tags are required.' });
    }

    try {
        const bestMatches = matchFoldersByTags(rootFolder, tags);

        if (bestMatches.length === 0) {
            return res.json({ success: false, folders: [] });
        }

        res.json({ success: true, folders: bestMatches });
    } catch (err) {
        console.error('Error finding matching folders:', err);
        res.status(500).json({ success: false, message: 'An error occurred while matching folders.' });
    }
});

module.exports = router;