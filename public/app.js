// DOM Elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showRegisterLink = document.getElementById('showRegister');
const showLoginLink = document.getElementById('showLogin');
const authContainer = document.getElementById('auth-container');
const dashboard = document.getElementById('dashboard');
const myFilesLink = document.getElementById('myFilesLink');
const templatesLink = document.getElementById('templatesLink');
const resumeBuilderLink = document.getElementById('resumeBuilderLink');
const logoutBtn = document.getElementById('logoutBtn');
const myFiles = document.getElementById('myFiles');
const templates = document.getElementById('templates');
const resumeBuilder = document.getElementById('resumeBuilder');
const verticalNav = document.querySelector('.vertical-nav');
const mainContent = document.querySelector('.main-content');
const toggleNavBtn = document.querySelector('.toggle-nav');
const userDisplayName = document.getElementById('userDisplayName');

// File Management
const uploadForm = document.getElementById('uploadForm');
const fileInput = document.getElementById('fileInput');
const fileTags = document.getElementById('fileTags');
const filterTags = document.getElementById('filterTags');
const searchInput = document.getElementById('searchInput');
const filesList = document.getElementById('filesList');

// Sorting state
let currentSort = { field: 'date', direction: 'desc' };

// Files cache
let filesCache = [];

// Templates handling
const templateGrid = document.getElementById('templateGrid');
const templateModal = new bootstrap.Modal(document.getElementById('templateModal'));
let templatesCache = [];

// Toast notification function
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div>${message}</div>
        <button onclick="this.parentElement.remove()" class="btn-close btn-close-white"></button>
    `;
    document.querySelector('.toast-container').appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
}

// Toggle navigation
toggleNavBtn.addEventListener('click', () => {
    verticalNav.classList.toggle('collapsed');
    mainContent.classList.toggle('nav-collapsed');
    toggleNavBtn.querySelector('i').classList.toggle('fa-chevron-right');
    toggleNavBtn.querySelector('i').classList.toggle('fa-chevron-left');
});

// Check if user is already logged in
function checkAuth() {
    const token = localStorage.getItem('token');
    if (token) {
        const user = JSON.parse(localStorage.getItem('user'));
        showDashboard(user);
    }
}

// Show/Hide Forms
showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
});

showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
});

// Handle Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const identifier = document.getElementById('loginIdentifier').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ identifier, password }),
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));
            showDashboard(data.user);
            showToast('Login successful!');
        } else {
            showToast(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        showToast('An error occurred during login', 'error');
    }
});

// Handle Register
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            showToast(data.message);
            // Switch to login form
            document.getElementById('register-form').style.display = 'none';
            document.getElementById('login-form').style.display = 'block';
            // Clear register form
            registerForm.reset();
        } else {
            showToast(data.message || 'Registration failed', 'error');
        }
    } catch (error) {
        showToast('An error occurred during registration', 'error');
    }
});

// Dashboard Navigation
myFilesLink.addEventListener('click', (e) => {
    e.preventDefault();
    myFiles.style.display = 'block';
    templates.style.display = 'none';
    resumeBuilder.style.display = 'none';
    updateActiveLink(myFilesLink);
});

templatesLink.addEventListener('click', (e) => {
    e.preventDefault();
    myFiles.style.display = 'none';
    templates.style.display = 'block';
    resumeBuilder.style.display = 'none';
    updateActiveLink(templatesLink);
    loadTemplates(); // Load templates when section is shown
});

resumeBuilderLink.addEventListener('click', (e) => {
    e.preventDefault();
    myFiles.style.display = 'none';
    templates.style.display = 'none';
    resumeBuilder.style.display = 'block';
    updateActiveLink(resumeBuilderLink);
});

function updateActiveLink(activeLink) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    activeLink.classList.add('active');
}

// Logout
logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    showAuth();
    showToast('Logged out successfully');
});

// Utility Functions
function showDashboard(user) {
    authContainer.style.display = 'none';
    dashboard.style.display = 'block';
    // Update username display
    userDisplayName.textContent = user.username;
    // Load initial dashboard section
    myFiles.style.display = 'block';
    resumeBuilder.style.display = 'none';
    updateActiveLink(myFilesLink);
    loadFiles(); // Load files when dashboard is shown
}

function showAuth() {
    dashboard.style.display = 'none';
    authContainer.style.display = 'block';
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('register-form').style.display = 'none';
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Format date
function formatDate(dateString) {
    return new Date(dateString).toLocaleString();
}

// Load and display files
async function loadFiles(tag = '') {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/files${tag ? `?tags=${tag}` : ''}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
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
    let files = [...filesCache];

    // Apply search filter
    const searchTerm = searchInput.value.toLowerCase();
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

    // Update table
    filesList.innerHTML = files.map(file => `
        <tr>
            <td>${file.originalName}</td>
            <td class="file-size">${formatFileSize(file.size)}</td>
            <td>
                ${file.tags.length > 0 
                    ? `<span class="badge bg-secondary tag-badge">${file.tags[0]}</span>`
                    : '<span class="text-muted">No tag</span>'
                }
            </td>
            <td class="file-date">${formatDate(file.createdAt)}</td>
            <td>
                <div class="file-actions">
                    <button class="btn btn-sm btn-outline-primary btn-icon" 
                            onclick="downloadFile('${file._id}', '${file.originalName}')"
                            title="Download">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger btn-icon" 
                            onclick="deleteFile('${file._id}')"
                            title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    // Update sort indicators
    document.querySelectorAll('.sortable').forEach(th => {
        th.classList.remove('asc', 'desc');
        const sortField = th.dataset.sort;
        if (sortField === currentSort.field) {
            th.classList.add(currentSort.direction);
        }
    });
}

// Handle sorting
document.querySelectorAll('.sortable').forEach(th => {
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

// Handle search
searchInput.addEventListener('input', () => {
    displayFiles();
});

// Handle file upload with progress
uploadForm.addEventListener('submit', async (e) => {
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

    const selectedTag = fileTags.value;
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
        const token = localStorage.getItem('token');
        const response = await fetch('/api/files/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Upload failed');
        }

        showToast('File uploaded successfully');
        uploadForm.reset();
        loadFiles(filterTags.value);
    } catch (error) {
        showToast(error.message || 'Failed to upload file', 'error');
    } finally {
        uploadButton.disabled = false;
        uploadButton.innerHTML = originalText;
    }
});

// Handle tag filtering
filterTags.addEventListener('change', () => {
    loadFiles(filterTags.value);
});

// Delete file
async function deleteFile(fileId) {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/files/${fileId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) throw new Error('Delete failed');

        showToast('File deleted successfully');
        loadFiles(filterTags.value);
    } catch (error) {
        showToast('Failed to delete file', 'error');
    }
}

// Load and display templates
async function loadTemplates() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/templates', {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) throw new Error('Failed to load templates');

        templatesCache = await response.json();
        displayTemplates();
    } catch (error) {
        showToast('Failed to load templates', 'error');
    }
}

function displayTemplates() {
    templateGrid.innerHTML = templatesCache.map(template => `
        <div class="col-md-4 mb-4">
            <div class="template-card card h-100" data-template-id="${template._id}">
                <img src="/api/templates/${template._id}/thumbnail"
                     class="card-img-top template-thumbnail"
                     alt="${template.name}"
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5UaHVtYm5haWw8L3RleHQ+PC9zdmc+'">
                <div class="card-body">
                    <h5 class="card-title">${template.name}</h5>
                    <p class="card-text">${template.short_description}</p>
                </div>
            </div>
        </div>
    `).join('');

    // Add click handlers to template cards
    document.querySelectorAll('.template-card').forEach(card => {
        card.addEventListener('click', () => showTemplateDetails(card.dataset.templateId));
    });
}

function showTemplateDetails(templateId) {
    const template = templatesCache.find(t => t._id === templateId);
    if (!template) return;

    const modal = document.getElementById('templateModal');
    modal.querySelector('.modal-title').textContent = template.name;
    modal.querySelector('.template-full-image').src = `/api/templates/${template._id}/thumbnail`;
    modal.querySelector('.template-description').textContent = template.description;
    modal.querySelector('.template-author').innerHTML = `<strong>Created by:</strong> ${template.author}`;
    modal.querySelector('.template-tags').innerHTML = template.tags
        .map(tag => `<span class="badge bg-primary me-1">${tag}</span>`)
        .join('');

    // Update preview button to open PDF
    const previewBtn = modal.querySelector('.btn-outline-primary') || createPreviewButton(modal);
    previewBtn.onclick = () => {
        window.open(`/api/templates/${template._id}/preview`, '_blank');
    };

    // Handle use template button
    const useTemplateBtn = modal.querySelector('.use-template-btn');
    useTemplateBtn.onclick = () => {
        // TODO: Implement template usage logic
        showToast('Template selection coming soon!');
        templateModal.hide();
    };

    templateModal.show();
}

function createPreviewButton(modal) {
    const buttonContainer = modal.querySelector('.modal-footer');
    const previewBtn = document.createElement('button');
    previewBtn.className = 'btn btn-outline-primary me-2';
    previewBtn.textContent = 'Preview PDF';
    buttonContainer.insertBefore(previewBtn, buttonContainer.firstChild);
    return previewBtn;
}

// Add download function with auth headers
async function downloadFile(fileId, filename) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/files/${fileId}/download`, {
            headers: {
                'Authorization': `Bearer ${token}`,
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

// Check auth status on page load
checkAuth(); 