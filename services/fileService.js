const fs = require('fs');
const path = require('path');

/**
 * List files in the root folder only.
 * @param {string} folder - The folder path to scan.
 * @returns {Array} Array of file objects { fileName, folderPath }.
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
 * @param {string} folder - The folder path to scan.
 * @returns {Array} Array of file objects { fileName, folderPath }.
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

module.exports = {
    listFilesInRootFolder,
    listFilesRecursive,
};