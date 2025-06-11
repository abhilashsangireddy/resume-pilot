import { getAuthToken, showToast } from './utils.js';

let generatedDocuments = [];
let filteredDocuments = [];

export function initGeneratedDocuments() {
    // Initialize event listeners
    setupEventListeners();
    
    // Load documents when the generated tab is shown
    document.getElementById('generated-tab').addEventListener('shown.bs.tab', function () {
        loadGeneratedDocuments();
    });
}

function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('generated-search');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
}

async function loadGeneratedDocuments() {
    const listContainer = document.getElementById('generated-documents-list');
    
    try {
        showLoadingState(listContainer);
        
        const token = getAuthToken();
        const response = await fetch('/api/generated-documents', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        generatedDocuments = await response.json();
        filteredDocuments = [...generatedDocuments];
        renderDocumentsList();
        
    } catch (error) {
        console.error('Error loading generated documents:', error);
        showError(listContainer, 'Failed to load generated documents. Please try again.');
        showToast('Error loading generated documents', 'error');
    }
}

function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        filteredDocuments = [...generatedDocuments];
    } else {
        filteredDocuments = generatedDocuments.filter(doc => 
            doc.name.toLowerCase().includes(searchTerm)
        );
    }
    
    renderDocumentsList();
}

function renderDocumentsList() {
    const listContainer = document.getElementById('generated-documents-list');
    
    // Update count badge
    const countBadge = document.getElementById('generated-count');
    if (countBadge) {
        countBadge.textContent = generatedDocuments.length;
    }
    
    if (filteredDocuments.length === 0) {
        listContainer.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-magic fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">No generated documents found</h5>
                <p class="text-muted">${generatedDocuments.length === 0 ? 'Generate your first resume using the Resume Builder!' : 'No documents match your search criteria.'}</p>
            </div>
        `;
        return;
    }

    const tableHTML = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Version</th>
                        <th>Updated</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredDocuments.map(doc => createDocumentRow(doc)).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    listContainer.innerHTML = tableHTML;
}

function createDocumentRow(document) {
    const updatedDate = new Date(document.updatedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return `
        <tr>
            <td>
                <div class="d-flex align-items-center">
                    <i class="fas fa-file-pdf text-danger me-2"></i>
                    <span class="fw-medium">${escapeHtml(document.name)}</span>
                </div>
            </td>
            <td>
                <span class="badge bg-primary">v${document.version}</span>
            </td>
            <td class="text-muted">
                ${updatedDate}
            </td>
            <td>
                <div class="btn-group btn-group-sm" role="group">
                    <button type="button" class="btn btn-outline-primary" 
                            onclick="previewDocument('${document._id}', '${escapeHtml(document.name)}')"
                            title="Preview PDF">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button type="button" class="btn btn-outline-danger" 
                            onclick="deleteDocument('${document._id}', '${escapeHtml(document.name)}')"
                            title="Delete Document">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
}

window.previewDocument = async function(documentId, documentName) {
    try {
        const token = getAuthToken();
        const previewUrl = `/api/generated-documents/${documentId}/preview`;
        
        // Create modal for PDF preview
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'pdfPreviewModal';
        modal.setAttribute('tabindex', '-1');
        modal.innerHTML = `
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-file-pdf text-danger me-2"></i>
                            ${escapeHtml(documentName)}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-0">
                        <div class="text-center py-4">
                            <div class="spinner-border" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                            <p class="mt-2">Loading PDF preview...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        const bsModal = new bootstrap.Modal(modal);
        
        // Show modal
        bsModal.show();
        
        // Load PDF with authentication
        const response = await fetch(previewUrl, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to load PDF: ${response.status}`);
        }
        
        const blob = await response.blob();
        const pdfUrl = URL.createObjectURL(blob);
        
        // Update modal content with PDF
        const modalBody = modal.querySelector('.modal-body');
        modalBody.innerHTML = `
            <embed src="${pdfUrl}" type="application/pdf" width="100%" height="600px" />
        `;
        
        // Clean up blob URL when modal is closed
        modal.addEventListener('hidden.bs.modal', function() {
            URL.revokeObjectURL(pdfUrl);
            document.body.removeChild(modal);
        });
        
    } catch (error) {
        console.error('Error previewing document:', error);
        showToast('Failed to preview document. Please try again.', 'error');
    }
};

window.deleteDocument = async function(documentId, documentName) {
    // Show confirmation dialog
    const confirmed = confirm(`Are you sure you want to delete "${documentName}"? This action cannot be undone and will also delete all associated files.`);
    
    if (!confirmed) {
        return;
    }
    
    try {
        const token = getAuthToken();
        const response = await fetch(`/api/generated-documents/${documentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        showToast(result.message || 'Document deleted successfully', 'success');
        
        // Reload the documents list
        await loadGeneratedDocuments();
        
    } catch (error) {
        console.error('Error deleting document:', error);
        showToast('Failed to delete document. Please try again.', 'error');
    }
};

function showLoadingState(container) {
    container.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Loading generated documents...</p>
        </div>
    `;
}

function showError(container, message) {
    container.innerHTML = `
        <div class="text-center py-4">
            <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
            <h5 class="text-muted">Error</h5>
            <p class="text-muted">${message}</p>
            <button class="btn btn-primary" onclick="loadGeneratedDocuments()">
                <i class="fas fa-redo me-2"></i>Try Again
            </button>
        </div>
    `;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
} 