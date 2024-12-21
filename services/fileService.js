const fs = require('fs');
const path = require('path');

/**
 * List files in the root folder only.
 */
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

/**
 * Recursively list all files in the folder and its subfolders.
 */
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

/**
 * Recursively list all folders and subfolders.
 */
const listFoldersRecursive = (folder) => {
    const folders = [];
    try {
        const items = fs.readdirSync(folder);

        items.forEach((item) => {
            const fullPath = path.join(folder, item);
            if (fs.lstatSync(fullPath).isDirectory()) {
                folders.push({ folderName: item, folderPath: fullPath });
                folders.push(...listFoldersRecursive(fullPath));
            }
        });
    } catch (err) {
        console.error(`Error reading folder "${folder}": ${err.message}`);
    }
    return folders;
};

module.exports = {
    listFilesInRootFolder,
    listFilesRecursive,
    listFoldersRecursive,
};