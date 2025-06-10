// Toast notification function
export function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div>${message}</div>
        <button onclick="this.parentElement.remove()" class="btn-close btn-close-white"></button>
    `;
    document.querySelector('.toast-container').appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
}

// Format file size
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Format date
export function formatDate(dateString) {
    return new Date(dateString).toLocaleString();
}

// Update active navigation link
export function updateActiveLink(activeLink) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    activeLink.classList.add('active');
}

// Get auth token
export function getAuthToken() {
    return localStorage.getItem('token');
}

// Get current user
export function getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
} 