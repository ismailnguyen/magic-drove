import {
    generateTags,
    findFolders,
    editFilename,
    copyFilePath,
    handleTagsInput
} from './utils.js';

document.querySelectorAll('.tags-input').forEach(inputField => {
    inputField.addEventListener('input', (event) => {
        handleTagsInput(inputField, null);
    });
});

document.querySelectorAll('.tags-input').forEach(input => {
    const measureSpan = document.createElement('span'); // Hidden span to measure text width
    measureSpan.style.position = 'absolute';
    measureSpan.style.visibility = 'hidden';
    measureSpan.style.whiteSpace = 'pre';
    document.body.appendChild(measureSpan);

    const adjustWidth = () => {
        measureSpan.textContent = input.value || input.placeholder; // Use placeholder if empty
        input.style.width = `${measureSpan.offsetWidth + 20}px`; // Add padding
    };

    // Adjust width on input and focus events
    input.addEventListener('input', adjustWidth);
    input.addEventListener('focus', adjustWidth);

    // Initialize width
    adjustWidth();
});

document.querySelectorAll('.tags-input').forEach(input => {
    const autocompleteContainer = document.createElement('ul');
    autocompleteContainer.className = 'autocomplete-dropdown absolute bg-white border border-gray-300 rounded shadow-lg w-full max-h-40 overflow-y-auto hidden';
    input.parentElement.appendChild(autocompleteContainer);

    input.addEventListener('input', (event) => {
        const fileName = input.getAttribute('data-file');
        const searchText = input.value.trim().toLowerCase();

        // Clear the dropdown if the input is empty
        if (!searchText) {
            autocompleteContainer.innerHTML = '';
            autocompleteContainer.classList.add('hidden');
            return;
        }

        // Extract base words from the file name (by splitting filename by underscores (_) and spaces)
        const baseName = fileName.split('.').slice(0, -1).join('.'); // Remove extension
        const parts = baseName.split(/[_\s]+/).map(part => {
            if (/^\d{8}$/.test(part)) {
                return part.slice(0, 4); // Extract year from YYYYMMDD
            }
            return part;
        });

        // Filter matching parts based on the input
        const matches = parts.filter(part => part.toLowerCase().includes(searchText));

        // Update the dropdown with matching results
        autocompleteContainer.innerHTML = matches
            .map(match => `<li class="p-2 hover:bg-blue-100 cursor-pointer">${match}</li>`)
            .join('');
        autocompleteContainer.classList.remove('hidden');

        // Add click listener for each match
        autocompleteContainer.querySelectorAll('li').forEach(item => {
            item.addEventListener('click', () => {
                const currentTags = input.value.split(',').map(tag => tag.trim());
                const selectedTag = item.textContent;

                // Replace the last incomplete word with the selected tag
                const lastWordIndex = currentTags.findIndex(tag => tag.toLowerCase().includes(searchText));
                if (lastWordIndex !== -1) {
                    currentTags[lastWordIndex] = selectedTag;
                } else {
                    currentTags.push(selectedTag);
                }

                // Update the input and clear the dropdown
                input.value = currentTags.filter(Boolean).join(', ');
                autocompleteContainer.innerHTML = '';
                autocompleteContainer.classList.add('hidden');
            });
        });
    });

    // Hide the dropdown if the user clicks outside
    document.addEventListener('click', (event) => {
        if (!input.contains(event.target) && !autocompleteContainer.contains(event.target)) {
            autocompleteContainer.classList.add('hidden');
        }
    });
});

// Auto-fill tags input with words from the file name
document.querySelectorAll('.magic-wand-btn').forEach(button => {
    button.addEventListener('click', async (event) => {
        event.preventDefault();

        const fileName = event.target.closest('button').getAttribute('data-file');
        const inputField = document.querySelector(`.tags-input[data-file="${fileName}"]`);

        await generateTags(fileName, inputField, null);
    });
});

// Copy file path to clipboard
document.querySelectorAll('.copy-file-path').forEach(link => {
    link.addEventListener('click', (event) => {
        event.preventDefault();
        const filePath = event.target.closest('a').getAttribute('data-file-path');
        try {
            copyFilePath(filePath, (message) => {
                showToast(message, 'success');
            });
        } catch (error) {
            showToast(error, 'error');
        }
    });
});

// Scroll to a specific file row on page load if a hash is present
if (window.location.hash) {
    const hash = window.location.hash.substring(1);
    const element = document.getElementById(hash);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
}



// Handle editing the file name
document.querySelectorAll('.edit-filename').forEach(link => {
    link.addEventListener('click', async (event) => {
        event.preventDefault();
        const fileName = event.target.closest('a').getAttribute('data-file');

        try {
            await editFilename(fileName, (newFileName) => {
                // Refresh page and scroll to the updated file
                window.location.hash = `file-${newFileName.replace(/\W/g, '_')}`;
                window.location.reload();
            });
        } catch (error) {
            showToast(error, 'error');
        }
    });
});

document.querySelectorAll('.find-folders-btn').forEach(button => {
    button.addEventListener('click', async (event) => {
        const fileName = event.target.getAttribute('data-file');
        const inputField = document.querySelector(`.tags-input[data-file="${fileName}"]`);
        const matchingFoldersElement = document.querySelector(`.matching-folders[data-file="${fileName}"]`);
        const fileNameCell = document.querySelector(`td[data-file="${fileName}"]`);
        const tagsCell = inputField.closest('td'); // Tags cell container

        // If the tags input is empty, generate tags first
        if (!inputField.value.trim()) {
            showToast('Automatically generating tags...', 'info');
            await generateTags(fileName, inputField, async (foundTags) => {
                await findFolders(fileName, foundTags, inputField, matchingFoldersElement, fileNameCell, tagsCell);
            });
        } else {
            const tags = inputField.value
                    .split(',')
                    .map(tag => tag.trim().toLowerCase()) // Normalize tags to lowercase
                    .filter(tag => tag); // Keep all tags for general operations

            await findFolders(fileName, tags, inputField, matchingFoldersElement, fileNameCell, tagsCell);
        }
    });
});