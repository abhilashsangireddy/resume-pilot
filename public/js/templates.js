import { showToast, getAuthToken } from './utils.js';

// DOM Elements
const templateGrid = document.getElementById('templateGrid');
const templateModal = new bootstrap.Modal(document.getElementById('templateModal'));

// State
let templatesCache = [];

// Initialize templates
export function initTemplates() {
    loadTemplates();
}

// Load and display templates
async function loadTemplates() {
    try {
        const response = await fetch('/api/templates', {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
            },
        });

        if (!response.ok) throw new Error('Failed to load templates');

        templatesCache = await response.json();
        displayTemplates();
    } catch (error) {
        showToast('Failed to load templates', 'error');
    }
}

// Display templates
function displayTemplates() {
    if (!templateGrid) return;
    
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

// Show template details in modal
function showTemplateDetails(templateId) {
    const template = templatesCache.find(t => t._id === templateId);
    if (!template) return;

    const modal = document.getElementById('templateModal');
    if (!modal) return;
    
    modal.querySelector('.modal-title').textContent = template.name;
    modal.querySelector('.template-full-image').src = `/api/templates/${template._id}/thumbnail`;
    modal.querySelector('.template-description').textContent = template.description;
    modal.querySelector('.template-author').innerHTML = `<strong>Created by:</strong> ${template.author}`;
    modal.querySelector('.template-tags').innerHTML = template.tags
        .map(tag => `<span class="badge bg-primary me-1">${tag}</span>`)
        .join('');

    // Use the existing hardcoded preview button
    const previewBtn = modal.querySelector('.preview-pdf-btn');
    if (previewBtn) {
        previewBtn.onclick = () => {
            window.open(`/api/templates/${template._id}/preview`, '_blank');
        };
    }

    // Handle use template button
    const useTemplateBtn = modal.querySelector('.use-template-btn');
    if (useTemplateBtn) {
        useTemplateBtn.onclick = () => {
            // TODO: Implement template usage logic
            showToast('Template selection coming soon!');
            templateModal.hide();
        };
    }

    templateModal.show();
} 