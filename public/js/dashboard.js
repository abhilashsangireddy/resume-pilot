import { initAuth } from './auth.js';
import { initFiles } from './files.js';
import { initTemplates } from './templates.js';
import { initResumeBuilder } from './resumeBuilder.js';
import { initGeneratedDocuments } from './generatedDocuments.js';
import { getAuthToken, showToast } from './utils.js';

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    initAuth();
    
    // Check if user is already logged in
    const token = getAuthToken();
    if (token) {
        showDashboard();
    }
});

function showDashboard() {
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    
    // Initialize all modules
    initFiles();
    initTemplates();
    initResumeBuilder();
    initGeneratedDocuments();
    
    // Set up navigation
    setupNavigation();
    
    // Show default section (My Files)
    showMyFiles();
    
    // Set user display name
    setUserDisplayName();
}

function setupNavigation() {
    document.getElementById('myFilesLink').addEventListener('click', (e) => {
        e.preventDefault();
        showMyFiles();
    });
    
    document.getElementById('templatesLink').addEventListener('click', (e) => {
        e.preventDefault();
        showTemplates();
    });
    
    document.getElementById('resumeBuilderLink').addEventListener('click', (e) => {
        e.preventDefault();
        showResumeBuilder();
    });
    
    // Navigation toggle
    const toggleBtn = document.querySelector('.toggle-nav');
    const nav = document.querySelector('.vertical-nav');
    
    if (toggleBtn && nav) {
        toggleBtn.addEventListener('click', () => {
            nav.classList.toggle('collapsed');
        });
    }
    
    // Logout functionality
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });
}

function showMyFiles() {
    hideAllSections();
    document.getElementById('files-section').style.display = 'block';
    setActiveNavLink('myFilesLink');
}

function showTemplates() {
    hideAllSections();
    document.getElementById('templates').style.display = 'block';
    setActiveNavLink('templatesLink');
}

function showResumeBuilder() {
    hideAllSections();
    document.getElementById('resumeBuilder').style.display = 'block';
    setActiveNavLink('resumeBuilderLink');
    initResumeBuilder();
}

function hideAllSections() {
    const sections = document.querySelectorAll('.content-section, .dashboard-section');
    sections.forEach(section => {
        section.style.display = 'none';
    });
}

function setActiveNavLink(activeId) {
    // Remove active class from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Add active class to clicked link
    document.getElementById(activeId).classList.add('active');
}

function setUserDisplayName() {
    // You can implement this to show actual user name from token or API
    const userDisplayElement = document.getElementById('userDisplayName');
    if (userDisplayElement) {
        userDisplayElement.textContent = 'User'; // Default for now
    }
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    location.reload();
}

// Export functions that might be needed by other modules
window.showDashboard = showDashboard; 