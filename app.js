require('dotenv').config(); // Load environment variables
const fs = require('fs');
const path = require('path');
const { stringify } = require('csv-stringify/sync'); // CSV generation library

// Get the root folder path from the .env file
const rootFolder = process.env.ROOT_FOLDER_TO_SCAN;

if (!rootFolder) {
    console.error("ROOT_FOLDER_TO_SCAN is not defined in the .env file.");
    process.exit(1);
}

// Function to list only files in the root folder (no subfolders)
const listFilesInRootFolder = (folder) => {
    try {
        const items = fs.readdirSync(folder);

        console.log(`Files in root folder: ${folder}`);
        items.forEach((item) => {
            const fullPath = path.join(folder, item);
            if (fs.lstatSync(fullPath).isFile()) {
                console.log(`- ${item}`);
            }
        });
    } catch (err) {
        console.error(`Error reading folder "${folder}": ${err.message}`);
    }
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
                console.log(`[DIR] ${fullPath}`);
                files = files.concat(listFilesRecursive(fullPath)); // Recurse into subfolder
            }
        });
    } catch (err) {
        console.error(`Error reading folder "${folder}": ${err.message}`);
    }

    return files;
};

// Function to generate a CSV file from the file list
const generateCsvFromFiles = (files, outputFilePath) => {
    try {
        const csvData = stringify(files, {
            header: true,
            columns: { fileName: 'File Name', folderPath: 'Folder Path' }
        });

        fs.writeFileSync(outputFilePath, csvData);
        console.log(`CSV file generated at: ${outputFilePath}`);
    } catch (err) {
        console.error(`Error generating CSV: ${err.message}`);
    }
};

// Run the script
console.log("\n--- Listing files in the root folder only ---");
listFilesInRootFolder(rootFolder);

console.log("\n--- Listing all files, including subfolders ---");
const allFiles = listFilesRecursive(rootFolder);
console.log(`Found ${allFiles.length} files.`);

console.log("\n--- Generating CSV file ---");
const outputCsvPath = path.join(__dirname, 'files_list.csv');
generateCsvFromFiles(allFiles, outputCsvPath);