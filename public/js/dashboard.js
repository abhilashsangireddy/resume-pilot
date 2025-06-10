import { updateActiveLink } from './utils.js';
import { initFiles } from './files.js';
import { initTemplates } from './templates.js';

// DOM Elements
const myFilesLink = document.getElementById('myFilesLink');
const templatesLink = document.getElementById('templatesLink');
const resumeBuilderLink = document.getElementById('resumeBuilderLink');
const myFiles = document.getElementById('myFiles');
const templates = document.getElementById('templates');
const resumeBuilder = document.getElementById('resumeBuilder');
const verticalNav = document.querySelector('.vertical-nav');
const mainContent = document.querySelector('.main-content');
const toggleNavBtn = document.querySelector('.toggle-nav');

// Initialize dashboard
export function initDashboard() {
    setupEventListeners();
    setupInitialView();
}

// Setup event listeners
function setupEventListeners() {
    // Toggle navigation
    if (toggleNavBtn) {
        toggleNavBtn.addEventListener('click', () => {
            verticalNav.classList.toggle('collapsed');
            mainContent.classList.toggle('nav-collapsed');
            toggleNavBtn.querySelector('i').classList.toggle('fa-chevron-right');
            toggleNavBtn.querySelector('i').classList.toggle('fa-chevron-left');
        });
    }

    // Navigation links
    if (myFilesLink) {
        myFilesLink.addEventListener('click', (e) => {
            e.preventDefault();
            showMyFiles();
        });
    }

    if (templatesLink) {
        templatesLink.addEventListener('click', (e) => {
            e.preventDefault();
            showTemplates();
        });
    }

    if (resumeBuilderLink) {
        resumeBuilderLink.addEventListener('click', (e) => {
            e.preventDefault();
            showResumeBuilder();
        });
    }
}

// Setup initial dashboard view
function setupInitialView() {
    // Load initial dashboard section - My Files
    if (myFiles) {
        myFiles.style.display = 'block';
        if (templates) templates.style.display = 'none';
        if (resumeBuilder) resumeBuilder.style.display = 'none';
        if (myFilesLink) updateActiveLink(myFilesLink);
        initFiles(); // Load files when dashboard is shown
    }
}

// Show My Files section
function showMyFiles() {
    if (myFiles) myFiles.style.display = 'block';
    if (templates) templates.style.display = 'none';
    if (resumeBuilder) resumeBuilder.style.display = 'none';
    if (myFilesLink) updateActiveLink(myFilesLink);
    initFiles();
}

// Show Templates section
function showTemplates() {
    if (myFiles) myFiles.style.display = 'none';
    if (templates) templates.style.display = 'block';
    if (resumeBuilder) resumeBuilder.style.display = 'none';
    if (templatesLink) updateActiveLink(templatesLink);
    initTemplates(); // Load templates when section is shown
}

// Show Resume Builder section
function showResumeBuilder() {
    if (myFiles) myFiles.style.display = 'none';
    if (templates) templates.style.display = 'none';
    if (resumeBuilder) resumeBuilder.style.display = 'block';
    if (resumeBuilderLink) updateActiveLink(resumeBuilderLink);
    // TODO: Initialize resume builder when implemented
} 