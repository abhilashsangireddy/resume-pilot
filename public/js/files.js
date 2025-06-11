import { showToast, formatFileSize, formatDate, getAuthToken } from './utils.js';

// DOM Elements
const uploadForm = document.getElementById('upload-form');
const fileInput = document.getElementById('file-input');
const fileTags = document.getElementById('tags-select');
const filterTags = document.getElementById('tag-filter');
const searchInput = document.getElementById('file-search');
const filesList = document.getElementById('files-list');

// State
let currentSort = { field: 'date', direction: 'desc' };
let filesCache = [];

// Initialize file management
export function initFiles() {
    setupEventListeners();
    loadFiles();
}

// Setup event listeners
function setupEventListeners() {
    // Handle file upload
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleFileUpload);
    }

    // Handle tag filtering
    if (filterTags) {
        filterTags.addEventListener('change', () => {
            loadFiles(filterTags.value);
        });
    }

    // Handle search
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            displayFiles();
        });
    }
}

// Handle file upload with progress
async function handleFileUpload(e) {
    e.preventDefault();
    const file = fileInput.files[0];
    
    if (!file) {
        showToast('Please select a file', 'error');
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        showToast('File size exceeds 10MB limit', 'error');
        return;
    }

    const selectedTag = fileTags ? fileTags.value : '';
    const formData = new FormData();
    formData.append('file', file);
    if (selectedTag) {
        formData.append('tags', selectedTag);
    }

    // Update UI to show progress
    const uploadButton = uploadForm.querySelector('button[type="submit"]');
    const originalText = uploadButton.innerHTML;
    uploadButton.disabled = true;
    uploadButton.innerHTML = `
        <div class="spinner-border spinner-border-sm" role="status">
            <span class="visually-hidden">Uploading...</span>
        </div>
        <span class="ms-2">Uploading...</span>
    `;

    try {
        const response = await fetch('/api/files/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Upload failed');
        }

        showToast('File uploaded successfully', 'success');
        uploadForm.reset();
        loadFiles(filterTags ? filterTags.value : '');
    } catch (error) {
        showToast(error.message || 'Failed to upload file', 'error');
    } finally {
        uploadButton.disabled = false;
        uploadButton.innerHTML = originalText;
    }
}

// Load and display files
async function loadFiles(tag = '') {
    try {
        const response = await fetch(`/api/files${tag ? `?tags=${tag}` : ''}`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
            },
        });

        if (!response.ok) throw new Error('Failed to load files');

        filesCache = await response.json();
        displayFiles();
    } catch (error) {
        showToast('Failed to load files', 'error');
    }
}

// Display files with current sorting and filtering
function displayFiles() {
    if (!filesList) return;
    
    let files = [...filesCache];

    // Apply search filter
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    if (searchTerm) {
        files = files.filter(file => 
            file.originalName.toLowerCase().includes(searchTerm)
        );
    }

    // Apply sorting
    files.sort((a, b) => {
        let compareValue;
        switch (currentSort.field) {
            case 'name':
                compareValue = a.originalName.localeCompare(b.originalName);
                break;
            case 'size':
                compareValue = a.size - b.size;
                break;
            case 'date':
                compareValue = new Date(b.createdAt) - new Date(a.createdAt);
                break;
            default:
                compareValue = 0;
        }
        return currentSort.direction === 'asc' ? compareValue : -compareValue;
    });

    // Update count badge
    const countBadge = document.getElementById('uploaded-count');
    if (countBadge) {
        countBadge.textContent = filesCache.length;
    }

    // Check if files array is empty
    if (files.length === 0) {
        filesList.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-folder-open fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">No files found</h5>
                <p class="text-muted">${filesCache.length === 0 ? 'Upload your first file to get started!' : 'No files match your search criteria.'}</p>
            </div>
        `;
        return;
    }

    // Update files list with table structure
    const tableHTML = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th class="sortable" data-sort="name">File Name <i class="fas fa-sort"></i></th>
                        <th class="sortable" data-sort="size">Size <i class="fas fa-sort"></i></th>
                        <th>Tags</th>
                        <th class="sortable" data-sort="date">Uploaded <i class="fas fa-sort"></i></th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${files.map(file => `
                        <tr>
                            <td>
                                <div class="d-flex align-items-center">
                                    <i class="fas fa-file-pdf text-danger me-2"></i>
                                    <span class="fw-medium">${escapeHtml(file.originalName)}</span>
                                </div>
                            </td>
                            <td class="text-muted">${formatFileSize(file.size)}</td>
                            <td>
                                ${file.tags && file.tags.length > 0 
                                    ? file.tags.map(tag => `<span class="badge bg-primary me-1">${escapeHtml(tag)}</span>`).join('')
                                    : '<span class="text-muted"><i class="fas fa-tag me-1"></i>No tag</span>'
                                }
                            </td>
                            <td class="text-muted">${formatDate(file.createdAt)}</td>
                            <td>
                                <div class="btn-group btn-group-sm" role="group">
                                    <button type="button" class="btn btn-outline-primary" 
                                            onclick="window.downloadFile('${file._id}', '${escapeHtml(file.originalName)}')"
                                            title="Download">
                                        <i class="fas fa-download"></i>
                                    </button>
                                    <button type="button" class="btn btn-outline-danger" 
                                            onclick="window.deleteFile('${file._id}')"
                                            title="Delete">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    filesList.innerHTML = tableHTML;

    // Re-setup sorting event listeners for new elements
    document.querySelectorAll('.sortable').forEach(th => {
        th.classList.remove('asc', 'desc');
        const sortField = th.dataset.sort;
        if (sortField === currentSort.field) {
            th.classList.add(currentSort.direction);
        }
        
        // Re-add click listener
        th.addEventListener('click', () => {
            const field = th.dataset.sort;
            if (field === currentSort.field) {
                currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort.field = field;
                currentSort.direction = 'asc';
            }
            displayFiles();
        });
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Download file
export async function downloadFile(fileId, filename) {
    try {
        const response = await fetch(`/api/files/${fileId}/download`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
            },
        });

        if (!response.ok) throw new Error('Download failed');

        // Create blob from response and trigger download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        showToast('Failed to download file', 'error');
    }
}

// Delete file
export async function deleteFile(fileId) {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
        const response = await fetch(`/api/files/${fileId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
            },
        });

        if (!response.ok) throw new Error('Delete failed');

        showToast('File deleted successfully');
        loadFiles(filterTags ? filterTags.value : '');
    } catch (error) {
        showToast('Failed to delete file', 'error');
    }
}

// Expose functions globally for onclick handlers
window.downloadFile = downloadFile;
window.deleteFile = deleteFile; 