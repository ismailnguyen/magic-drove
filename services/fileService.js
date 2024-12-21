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

/**
 * Match folders based on the provided tags and sort by match count.
 * @param {string} rootFolder - The root folder to scan.
 * @param {Array} tags - Array of tags to match.
 * @returns {Array} Array of matching folder paths sorted by relevance.
 */
const matchFoldersByTags = (rootFolder, tags) => {
    if (!tags || tags.length === 0) {
        throw new Error('Tags are required for folder matching.');
    }

    const allFolders = listFoldersRecursive(rootFolder);

    // Find folders with the most matches for tags
    const folderMatches = allFolders.map(folder => {
        const matchCount = tags.filter(tag => folder.folderPath.toLowerCase().includes(tag.toLowerCase())).length;
        return { folderPath: folder.folderPath, matchCount };
    });

    // Filter out folders with no matches
    const matchedFolders = folderMatches.filter(folder => folder.matchCount > 0);

    // Sort folders by match count in descending order
    matchedFolders.sort((a, b) => b.matchCount - a.matchCount);

    // Return only the folder paths, ordered by match count
    return matchedFolders.map(folder => folder.folderPath);
};

module.exports = {
    listFilesInRootFolder,
    listFilesRecursive,
    listFoldersRecursive,
    matchFoldersByTags
};