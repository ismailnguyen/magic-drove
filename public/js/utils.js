export function handleTagsInput(inputField, callback) {
    const tags = inputField.value
        .split(/[,\n]+/) // Split by comma or newline
        .map(tag => tag.trim())
        .filter(tag => tag); // Filter out empty tags

    if (callback) {
        callback(tags);
    }
}

// Function to generate tags using the Magic Wand
export async function generateTags(fileName, inputField, callback) {
    if (!fileName) return;

    // Save the original placeholder to restore later
    const originalPlaceholder = inputField.placeholder;

    // Update the placeholder to indicate loading
    inputField.placeholder = 'Loading tags...';

    // Extract base words from the file name (by splitting filename by underscores (_) and spaces)
    const baseName = fileName.split('.').slice(0, -1).join('.'); // Remove extension
    const parts = baseName.split(/[_\s]+/).map(part => {
        if (/^\d{8}$/.test(part)) {
            return part.slice(0, 4); // Extract year from YYYYMMDD
        }
        return part;
    });

    try {
        // Send the extracted parts as tags to match folders
        const response = await fetch('/match-folders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ fileName, tags: parts }),
        });
        const data = await response.json();

        if (data.success && data.folders.length > 0) {
            // Collect all folder paths
            const folderPaths = data.folders.map(folder => folder.toLowerCase());

            // Filter parts that match any folder path
            const matchingTags = parts.filter(part =>
                folderPaths.some(folderPath => folderPath.includes(part.toLowerCase()))
            );

            // Update the tags input
            const currentTags = inputField.value.split(',').map(tag => tag.trim()).filter(Boolean);
            const updatedTags = [...new Set([...currentTags, ...matchingTags])]; // Avoid duplicates
            inputField.value = updatedTags.join(', '); // Ensure proper comma-separated format

            // Call the callback after tags are updated
            if (callback) {
                callback(updatedTags);
            }
        } else {
            showToast('No matching folders found for the magic wand.', 'error');
        }
    } catch (error) {
        console.error('Error fetching matching folders:', error);
        showToast('An error occurred while using the magic wand.', 'error');
    }

    // Restore the original placeholder
    inputField.placeholder = originalPlaceholder;
}

export function copyFilePath(filePath, successCallback) {
    navigator.clipboard.writeText(filePath)
    .then(() => {
        successCallback(`File path "${filePath}" copied to clipboard.`);
    })
    .catch(err => {
        throw new Error('Failed to copy the file path to clipboard.');
    });
}

export async function editFilename(fileName, successCallback) {
    const newFileName = prompt(`Enter the new name for the file "${fileName}":`, fileName);

    if (newFileName && newFileName.trim() !== '' && newFileName !== fileName) {
        try {
            const response = await fetch('/rename-file', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ oldFileName: fileName, newFileName: newFileName.trim() }),
            });
            const data = await response.json();
            if (data.success) {
                successCallback(newFileName);
            } else {
                throw new Error(data.message || 'Failed to rename the file.');
            }
        }
        catch(err) {
            console.error('Error:', err);
            throw new Error('An error occurred while renaming the file.');
        }
    }
}

// Function to find folders based on tags
export async function findFolders(fileName, tags, inputField, matchingFoldersElement, fileNameCell, tagsCell) {
    // Add a loading placeholder
    matchingFoldersElement.innerHTML = '<div class="text-gray-500">Looking for best matching folders...</div>';
        
    // Move the file name, tags input, and magic wand button to the top
    fileNameCell.style.verticalAlign = 'top';
    tagsCell.style.verticalAlign = 'top';

    try {
        const response = await fetch(`/match-folders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ fileName, tags }),
        });

        const data = await response.json();

        matchingFoldersElement.innerHTML = ''; // Clear previous matches

        if (data.success && data.folders.length > 0) {
            data.folders.forEach(folder => {
                const li = document.createElement('li');

                // Highlight folders in the path based on full or partial matches with tags longer than 2 characters
                const highlightedPath = folder.split('/').map(part => {
                    const lowerPart = part.toLowerCase();

                    // Filter tags specifically for highlighting
                    const highlightTags = tags.filter(tag => tag.length > 2);

                    // Check if any highlight-eligible tag matches fully or partially
                    const isMatch = highlightTags.some(tag => {
                        const normalizedTag = tag.replace(/[-_\s]+/g, ''); // Normalize tags
                        const normalizedPart = lowerPart.replace(/[-_\s]+/g, ''); // Normalize folder names
                        return normalizedPart.includes(normalizedTag);
                    });

                    // Highlight the folder if it matches
                    if (isMatch) {
                        return `<span class="bg-yellow-200 font-bold">${part}</span>`;
                    }
                    return part;
                }).join('/');

                li.innerHTML = highlightedPath;

                // Add folder name
                const folderNameSpan = document.createElement('span');
                folderNameSpan.textContent = folder;

                // Add "Copy Path" link for the folder
                const copyFolderPathLink = document.createElement('a');
                copyFolderPathLink.href = '#';
                copyFolderPathLink.innerHTML = '<i class="fas fa-copy text-blue-500 hover:text-blue-700 ml-4"></i>';
                copyFolderPathLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    navigator.clipboard.writeText(folder)
                        .then(() => {
                            showToast(`Folder path "${folder}" copied to clipboard.`, 'success');
                        })
                        .catch(err => {
                            console.error('Error copying to clipboard:', err);
                            showToast('Failed to copy the folder path to clipboard.', 'error');
                        });
                });

                // Add "Move File" link
                const moveLink = document.createElement('a');
                moveLink.href = '#';
                moveLink.innerHTML = '<i class="fas fa-folder-open"></i>';
                moveLink.className = 'text-blue-500 hover:text-blue-700 ml-4';
                moveLink.addEventListener('click', async (e) => {
                    e.preventDefault();

                    const newFolderPath = prompt(`Confirm the folder path to move to:`, folder);
                    try {
                        const moveResponse = await fetch(`/move-file`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ fileName, destination: newFolderPath }),
                        });

                        const moveData = await moveResponse.json();

                        if (moveData.success) {
                            showToast(`File "${fileName}" moved to "${newFolderPath}" successfully.`, 'success');
                            setTimeout(() => {
                                window.location.reload(); // Refresh the page after success
                            }, 1000);
                        } else {
                            showToast(`Failed to move file "${fileName}" to "${newFolderPath}".`, 'error');
                        }
                    }
                    catch(err) {
                        console.error('Error:', err);
                        showToast('An error occurred while moving the file.', 'error');
                    }
                });

                li.appendChild(copyFolderPathLink);
                li.appendChild(moveLink);
                matchingFoldersElement.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'No matching folders found.';
            matchingFoldersElement.appendChild(li);
        }
    }
    catch(err) {
        console.error('Error:', err);
        matchingFoldersElement.innerHTML = '<div class="text-red-500">An error occurred. Please try again.</div>';
    }
}