const express = require('express');
const {
    listFilesInRootFolder,
    listFilesRecursive,
    listFoldersRecursive,
    matchFoldersByTags,
    moveFile,
    renameFile
} = require('../services/fileService');
const { stringify } = require('csv-stringify/sync');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const rootFolder = process.env.ROOT_FOLDER_TO_SCAN;

// Route: Files in root folder
router.get('/root', (req, res) => {
    const rootFiles = listFilesInRootFolder(rootFolder);
    res.render('root', { title: 'Files in Root Folder', rootFolder, files: rootFiles, path });
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

// Route: Rename a file
router.post('/rename-file', (req, res) => {
    const { oldFileName, newFileName } = req.body;

    if (!oldFileName || !newFileName) {
        return res.status(400).json({ success: false, message: 'Old and new file names are required.' });
    }

    try {
        renameFile(rootFolder, oldFileName, newFileName);
        res.json({ success: true, message: `File renamed to "${newFileName}" successfully.` });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: err.message });
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

// Route: Move a file to the specified folder
router.post('/move-file', (req, res) => {
    const { fileName, destination } = req.body;

    if (!fileName || !destination) {
        return res.status(400).json({ success: false, message: 'File name and destination folder are required.' });
    }

    try {
        moveFile(rootFolder, fileName, destination);
        res.json({ success: true, message: `File "${fileName}" moved to "${destination}" successfully.` });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;