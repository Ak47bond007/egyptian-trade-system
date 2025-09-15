/**
 * Egyptian Correspondence Management System - JavaScript
 * نظام إدارة المكاتبات المصري
 */

// Global variables
let attachmentDropzone = null;
let currentModal = null;

// Document ready initialization
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Main initialization function
function initializeApp() {
    initializeTooltips();
    initializeModals();
    initializeFileUpload();
    initializeFormValidation();
    initializeSearchAndFilters();
    initializeKeyboardShortcuts();
    showNotifications();
}

// Initialize Bootstrap tooltips
function initializeTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Initialize modals
function initializeModals() {
    const modalElements = document.querySelectorAll('.modal');
    modalElements.forEach(modalEl => {
        modalEl.addEventListener('shown.bs.modal', function() {
            const firstInput = modalEl.querySelector('input, textarea, select');
            if (firstInput) firstInput.focus();
        });
    });
}

// Initialize file upload functionality
function initializeFileUpload() {
    // Check if Dropzone is available and there's a dropzone element
    if (typeof Dropzone !== 'undefined' && document.getElementById('attachment-dropzone')) {
        initializeDropzone();
    }
    
    // Traditional file input handling
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
        input.addEventListener('change', handleFileSelection);
    });
}

// Initialize Dropzone for file upload
function initializeDropzone() {
    Dropzone.autoDiscover = false;
    
    const dropzoneElement = document.getElementById('attachment-dropzone');
    if (!dropzoneElement) return;
    
    attachmentDropzone = new Dropzone('#attachment-dropzone', {
        url: '#', // Will be handled by form submission
        autoProcessQueue: false,
        uploadMultiple: true,
        parallelUploads: 10,
        maxFilesize: 50, // 50MB
        acceptedFiles: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.bmp,.tiff,.zip,.rar,.7z,.mp4,.avi,.mov,.txt',
        addRemoveLinks: true,
        dictDefaultMessage: 'اسحب الملفات هنا أو انقر للتحديد',
        dictFallbackMessage: 'متصفحك لا يدعم خاصية سحب وإفلات الملفات',
        dictRemoveFile: 'حذف الملف',
        dictCancelUpload: 'إلغاء التحميل',
        dictMaxFilesExceeded: 'لا يمكن رفع أكثر من هذا العدد من الملفات',
        dictFileTooBig: 'حجم الملف كبير جداً ({{filesize}}MB). الحد الأقصى: {{maxFilesize}}MB',
        dictInvalidFileType: 'نوع الملف غير مدعوم',
        
        init: function() {
            const myDropzone = this;
            
            // Handle form submission
            const form = document.getElementById('correspondence-form');
            if (form) {
                form.addEventListener('submit', function(e) {
                    if (myDropzone.getQueuedFiles().length > 0) {
                        // Add queued files to traditional file input
                        const fileInput = document.getElementById('attachments');
                        if (fileInput) {
                            const dataTransfer = new DataTransfer();
                            
                            // Add existing files
                            for (let i = 0; i < fileInput.files.length; i++) {
                                dataTransfer.items.add(fileInput.files[i]);
                            }
                            
                            // Add dropzone files
                            myDropzone.getQueuedFiles().forEach(function(file) {
                                dataTransfer.items.add(file);
                            });
                            
                            fileInput.files = dataTransfer.files;
                        }
                    }
                });
            }
            
            // Preview functionality
            this.on('addedfile', function(file) {
                showFilePreview(file);
            });
        }
    });
}

// Handle traditional file input selection
function handleFileSelection(event) {
    const files = Array.from(event.target.files);
    const previewContainer = document.getElementById('file-preview');
    
    if (previewContainer) {
        files.forEach(file => {
            const fileElement = createFilePreviewElement(file);
            previewContainer.appendChild(fileElement);
        });
    }
}

// Create file preview element
function createFilePreviewElement(file) {
    const div = document.createElement('div');
    div.className = 'file-preview-item border rounded p-2 mb-2';
    
    const fileIcon = getFileIcon(file.name);
    const fileSize = formatFileSize(file.size);
    
    div.innerHTML = `
        <div class="d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center">
                <i class="${fileIcon} fa-2x me-2"></i>
                <div>
                    <div class="fw-bold">${file.name}</div>
                    <small class="text-muted">${fileSize}</small>
                </div>
            </div>
            <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeFilePreview(this)">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    return div;
}

// Get file icon based on extension
function getFileIcon(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    const iconMap = {
        'pdf': 'fas fa-file-pdf text-danger',
        'doc': 'fas fa-file-word text-primary',
        'docx': 'fas fa-file-word text-primary',
        'xls': 'fas fa-file-excel text-success',
        'xlsx': 'fas fa-file-excel text-success',
        'ppt': 'fas fa-file-powerpoint text-warning',
        'pptx': 'fas fa-file-powerpoint text-warning',
        'jpg': 'fas fa-file-image text-info',
        'jpeg': 'fas fa-file-image text-info',
        'png': 'fas fa-file-image text-info',
        'gif': 'fas fa-file-image text-info',
        'zip': 'fas fa-file-archive text-secondary',
        'rar': 'fas fa-file-archive text-secondary',
        '7z': 'fas fa-file-archive text-secondary',
        'txt': 'fas fa-file-alt text-secondary'
    };
    
    return iconMap[extension] || 'fas fa-file text-muted';
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Remove file preview
function removeFilePreview(button) {
    button.closest('.file-preview-item').remove();
}

// Show file preview
function showFilePreview(file) {
    console.log('File added:', file.name, formatFileSize(file.size));
}

// Form validation
function initializeFormValidation() {
    const forms = document.querySelectorAll('form[novalidate]');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
                showValidationErrors(form);
            }
            
            form.classList.add('was-validated');
        });
    });
}

// Show validation errors
function showValidationErrors(form) {
    const firstInvalidField = form.querySelector(':invalid');
    if (firstInvalidField) {
        firstInvalidField.focus();
        
        // Show Arabic error message
        const fieldName = firstInvalidField.labels[0]?.textContent || 'هذا الحقل';
        showNotification(`يرجى ملء ${fieldName} بشكل صحيح`, 'error');
    }
}

// Search and filters
function initializeSearchAndFilters() {
    const searchInput = document.getElementById('search');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                this.form.submit();
            }
        });
    }
    
    // Auto-submit filters
    const filterSelects = document.querySelectorAll('.auto-filter');
    filterSelects.forEach(select => {
        select.addEventListener('change', function() {
            this.form.submit();
        });
    });
}

// Keyboard shortcuts
function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl+N or Alt+N for new correspondence
        if ((e.ctrlKey || e.altKey) && e.key === 'n') {
            e.preventDefault();
            const newBtn = document.querySelector('[href*="new"]');
            if (newBtn) newBtn.click();
        }
        
        // Ctrl+P for print
        if (e.ctrlKey && e.key === 'p') {
            const printBtn = document.querySelector('[href*="print"]');
            if (printBtn) {
                e.preventDefault();
                printBtn.click();
            }
        }
        
        // Escape to close modals
        if (e.key === 'Escape' && currentModal) {
            currentModal.hide();
        }
    });
}

// Show notifications
function showNotification(message, type = 'info', duration = 5000) {
    const alertClass = {
        'success': 'alert-success',
        'error': 'alert-danger',
        'warning': 'alert-warning',
        'info': 'alert-info'
    }[type] || 'alert-info';
    
    const iconClass = {
        'success': 'fas fa-check-circle',
        'error': 'fas fa-exclamation-triangle',
        'warning': 'fas fa-exclamation-circle',
        'info': 'fas fa-info-circle'
    }[type] || 'fas fa-info-circle';
    
    const alertHTML = `
        <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
            <i class="${iconClass}"></i> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    // Find or create notification container
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'position-fixed top-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
    }
    
    container.insertAdjacentHTML('beforeend', alertHTML);
    
    // Auto-remove after duration
    if (duration > 0) {
        setTimeout(() => {
            const alerts = container.querySelectorAll('.alert');
            if (alerts.length > 0) {
                alerts[0].remove();
            }
        }, duration);
    }
}

// Show existing notifications from flash messages
function showNotifications() {
    const flashMessages = document.querySelectorAll('.alert[data-message]');
    flashMessages.forEach(alert => {
        const message = alert.dataset.message;
        const type = alert.classList.contains('alert-success') ? 'success' :
                    alert.classList.contains('alert-danger') ? 'error' :
                    alert.classList.contains('alert-warning') ? 'warning' : 'info';
        
        setTimeout(() => showNotification(message, type), 100);
    });
}

// Utility functions
function confirmAction(message, callback) {
    if (confirm(message)) {
        callback();
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('تم النسخ بنجاح', 'success', 2000);
    }).catch(() => {
        showNotification('فشل في النسخ', 'error', 2000);
    });
}

function formatDate(date, locale = 'ar-EG') {
    return new Date(date).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });
}

function formatDateTime(date, locale = 'ar-EG') {
    return new Date(date).toLocaleString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Delete attachment function
function deleteAttachment(attachmentId) {
    confirmAction('هل أنت متأكد من حذف هذا المرفق؟', function() {
        fetch(`/attachment/${attachmentId}/delete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => {
            if (response.ok) {
                showNotification('تم حذف المرفق بنجاح', 'success');
                setTimeout(() => location.reload(), 1000);
            } else {
                throw new Error('فشل في حذف المرفق');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('حدث خطأ أثناء حذف المرفق', 'error');
        });
    });
}

// Table/Card view toggle
function showTableView() {
    document.getElementById('table-view').style.display = 'block';
    document.getElementById('card-view').style.display = 'none';
    
    // Update button states
    document.querySelectorAll('.btn-group .btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    localStorage.setItem('correspondence-view', 'table');
}

function showCardView() {
    document.getElementById('table-view').style.display = 'none';
    document.getElementById('card-view').style.display = 'block';
    
    // Update button states
    document.querySelectorAll('.btn-group .btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    localStorage.setItem('correspondence-view', 'card');
}

// Load saved view preference
document.addEventListener('DOMContentLoaded', function() {
    const savedView = localStorage.getItem('correspondence-view');
    if (savedView === 'card' && document.getElementById('card-view')) {
        showCardView();
    }
});

// Print functionality
function printCorrespondence(correspondenceId) {
    const printWindow = window.open(`/correspondence/${correspondenceId}/print?autoprint=true`, '_blank');
    if (!printWindow) {
        showNotification('تم حظر النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة', 'warning');
    }
}

// Quick print current page
function quickPrint() {
    window.print();
}

// Auto-save functionality for forms
function initializeAutoSave() {
    const form = document.getElementById('correspondence-form');
    if (!form) return;
    
    const inputs = form.querySelectorAll('input, textarea, select');
    const saveKey = `autosave-${window.location.pathname}`;
    
    // Load saved data
    try {
        const savedData = localStorage.getItem(saveKey);
        if (savedData) {
            const data = JSON.parse(savedData);
            Object.keys(data).forEach(key => {
                const input = form.querySelector(`[name="${key}"]`);
                if (input && input.type !== 'file') {
                    input.value = data[key];
                }
            });
        }
    } catch (e) {
        console.warn('Failed to load autosave data:', e);
    }
    
    // Save on input
    inputs.forEach(input => {
        if (input.type !== 'file') {
            input.addEventListener('input', debounce(() => {
                const formData = new FormData(form);
                const data = {};
                formData.forEach((value, key) => {
                    if (key !== 'attachments') {
                        data[key] = value;
                    }
                });
                localStorage.setItem(saveKey, JSON.stringify(data));
            }, 1000));
        }
    });
    
    // Clear on successful submit
    form.addEventListener('submit', () => {
        localStorage.removeItem(saveKey);
    });
}

// Debounce utility
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize auto-save if form exists
document.addEventListener('DOMContentLoaded', initializeAutoSave);

// Export for global access
window.correspondenceSystem = {
    showNotification,
    deleteAttachment,
    showTableView,
    showCardView,
    printCorrespondence,
    quickPrint,
    confirmAction,
    copyToClipboard,
    formatDate,
    formatDateTime
};