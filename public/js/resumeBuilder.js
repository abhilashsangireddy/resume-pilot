import { showToast, getAuthToken } from './utils.js';

// DOM Elements
const resumeBuilderForm = document.getElementById('resumeBuilderForm');
const templateSelect = document.getElementById('templateSelect');
const documentSelect = document.getElementById('documentSelect');
const llmInstructions = document.getElementById('llmInstructions');
const generateResumeBtn = document.getElementById('generateResumeBtn');

// Preview Elements
const previewDefault = document.getElementById('previewDefault');
const previewDocument = document.getElementById('previewDocument');
const previewProcessing = document.getElementById('previewProcessing');
const previewGenerated = document.getElementById('previewGenerated');
const documentEmbed = document.getElementById('documentEmbed');
const generatedEmbed = document.getElementById('generatedEmbed');
const processingProgress = document.getElementById('processingProgress');
const processingStatus = document.getElementById('processingStatus');
const previewControls = document.querySelector('.preview-controls');
const downloadGeneratedBtn = document.getElementById('downloadGeneratedBtn');
const saveToFilesBtn = document.getElementById('saveToFilesBtn');

// State
let templatesCache = [];
let filesCache = [];
let generatedResumeData = null;

// Initialize resume builder
export function initResumeBuilder() {
    setupEventListeners();
    loadTemplates();
    loadUserFiles();
}

// Setup event listeners
function setupEventListeners() {
    // Document selection change
    if (documentSelect) {
        documentSelect.addEventListener('change', handleDocumentChange);
    }

    // Form submission
    if (resumeBuilderForm) {
        resumeBuilderForm.addEventListener('submit', handleFormSubmit);
    }

    // Download generated resume
    if (downloadGeneratedBtn) {
        downloadGeneratedBtn.addEventListener('click', downloadGeneratedResume);
    }

    // Save to files
    if (saveToFilesBtn) {
        saveToFilesBtn.addEventListener('click', saveGeneratedToFiles);
    }
}

// Load available templates
async function loadTemplates() {
    try {
        const response = await fetch('/api/templates', {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
            },
        });

        if (!response.ok) throw new Error('Failed to load templates');

        templatesCache = await response.json();
        populateTemplateSelect();
    } catch (error) {
        showToast('Failed to load templates', 'error');
    }
}

// Populate template select dropdown
function populateTemplateSelect() {
    if (!templateSelect) return;
    
    templateSelect.innerHTML = '<option value="">Select a template...</option>';
    templatesCache.forEach(template => {
        const option = document.createElement('option');
        option.value = template._id;
        option.textContent = template.name;
        templateSelect.appendChild(option);
    });
}

// Load user files
async function loadUserFiles() {
    try {
        const response = await fetch('/api/files', {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
            },
        });

        if (!response.ok) throw new Error('Failed to load files');

        filesCache = await response.json();
        populateDocumentSelect();
    } catch (error) {
        showToast('Failed to load your files', 'error');
    }
}

// Populate document select dropdown
function populateDocumentSelect() {
    if (!documentSelect) return;
    
    documentSelect.innerHTML = '<option value="">Select a document...</option>';
    filesCache.forEach(file => {
        const option = document.createElement('option');
        option.value = file._id;
        option.textContent = file.originalName;
        documentSelect.appendChild(option);
    });
}

// Handle document selection change
async function handleDocumentChange() {
    const selectedFileId = documentSelect.value;
    
    if (!selectedFileId) {
        showPreviewState('default');
        return;
    }

    try {
        // Show document preview with proper authorization
        const response = await fetch(`/api/files/${selectedFileId}/download`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to load document preview');
        }

        // Create blob from response and set as embed source
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        if (documentEmbed) {
            // Clean up previous blob URL if it exists
            if (documentEmbed.src && documentEmbed.src.startsWith('blob:')) {
                URL.revokeObjectURL(documentEmbed.src);
            }
            documentEmbed.src = blobUrl;
        }
        
        showPreviewState('document');
    } catch (error) {
        showToast('Failed to load document preview', 'error');
        showPreviewState('default');
    }
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const templateId = templateSelect.value;
    const documentId = documentSelect.value;
    const instructions = llmInstructions.value.trim();

    if (!templateId || !documentId || !instructions) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    // Start processing
    showPreviewState('processing');
    updateProcessingProgress(10, 'Preparing your request...');

    try {
        // Disable form during processing
        setFormDisabled(true);

        const response = await fetch('/api/resume/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`,
            },
            body: JSON.stringify({
                templateId,
                documentId,
                instructions,
            }),
        });

        updateProcessingProgress(50, 'AI is analyzing your document...');

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to generate resume');
        }

        updateProcessingProgress(80, 'Finalizing your resume...');

        generatedResumeData = await response.json();
        
        updateProcessingProgress(100, 'Complete!');
        
        // Show generated resume preview
        setTimeout(() => {
            if (generatedEmbed && generatedResumeData.downloadUrl) {
                generatedEmbed.src = generatedResumeData.downloadUrl;
            }
            showPreviewState('generated');
            previewControls.style.display = 'flex';
            showToast('Resume generated successfully!');
        }, 1000);

    } catch (error) {
        showToast(error.message || 'Failed to generate resume', 'error');
        showPreviewState('document');
    } finally {
        setFormDisabled(false);
    }
}

// Show different preview states
function showPreviewState(state) {
    // Hide all states
    [previewDefault, previewDocument, previewProcessing, previewGenerated].forEach(el => {
        if (el) el.classList.remove('active');
    });

    // Show selected state
    switch (state) {
        case 'default':
            if (previewDefault) previewDefault.classList.add('active');
            if (previewControls) previewControls.style.display = 'none';
            break;
        case 'document':
            if (previewDocument) previewDocument.classList.add('active');
            if (previewControls) previewControls.style.display = 'none';
            break;
        case 'processing':
            if (previewProcessing) previewProcessing.classList.add('active');
            if (previewControls) previewControls.style.display = 'none';
            break;
        case 'generated':
            if (previewGenerated) previewGenerated.classList.add('active');
            break;
    }
}

// Update processing progress
function updateProcessingProgress(percentage, status) {
    if (processingProgress) {
        processingProgress.style.width = `${percentage}%`;
    }
    if (processingStatus) {
        processingStatus.textContent = status;
    }
}

// Enable/disable form
function setFormDisabled(disabled) {
    [templateSelect, documentSelect, llmInstructions, generateResumeBtn].forEach(el => {
        if (el) el.disabled = disabled;
    });

    if (generateResumeBtn) {
        if (disabled) {
            generateResumeBtn.innerHTML = `
                <div class="spinner-border spinner-border-sm me-2" role="status">
                    <span class="visually-hidden">Processing...</span>
                </div>
                Generating...
            `;
        } else {
            generateResumeBtn.innerHTML = `
                <i class="fas fa-magic me-2"></i>
                Generate Resume
            `;
        }
    }
}

// Download generated resume
function downloadGeneratedResume() {
    if (generatedResumeData && generatedResumeData.downloadUrl) {
        const a = document.createElement('a');
        a.href = generatedResumeData.downloadUrl;
        a.download = generatedResumeData.filename || 'generated-resume.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast('Resume downloaded successfully!');
    }
}

// Save generated resume to user files
async function saveGeneratedToFiles() {
    if (!generatedResumeData) return;

    try {
        const response = await fetch('/api/resume/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`,
            },
            body: JSON.stringify({
                resumeId: generatedResumeData.id,
                filename: generatedResumeData.filename || 'generated-resume.pdf',
            }),
        });

        if (!response.ok) throw new Error('Failed to save resume');

        showToast('Resume saved to your files!');
    } catch (error) {
        showToast('Failed to save resume to files', 'error');
    }
} 