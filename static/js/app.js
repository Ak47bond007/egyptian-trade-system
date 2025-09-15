// Egyptian Trade System - Main JavaScript

// Initialize Socket.IO
const socket = io();

// Global variables
let postmanOpen = false;
let isOnline = true;
let syncInProgress = false;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupRealTimeFeatures();
    setupSmartPostman();
    setupSyncHandling();
    setupOfflineHandling();
});

function initializeApp() {
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Initialize animations
    animateElements();
    
    // Setup file upload drag and drop
    setupFileUpload();
    
    // Setup auto-save
    setupAutoSave();
    
    // Setup keyboard shortcuts
    setupKeyboardShortcuts();
}

function setupRealTimeFeatures() {
    // Join user room for real-time updates
    socket.emit('join', {
        user_id: window.currentUserId || 'anonymous',
        room: 'all_users'
    });
    
    // Listen for correspondence updates
    socket.on('correspondence_added', function(data) {
        showNotification(`تم إضافة مراسلة جديدة: ${data.subject}`, 'success');
        updateCorrespondenceList(data, 'added');
    });
    
    socket.on('correspondence_updated', function(data) {
        showNotification(`تم تحديث المراسلة: ${data.subject}`, 'info');
        updateCorrespondenceList(data, 'updated');
    });
    
    socket.on('correspondence_deleted', function(data) {
        showNotification('تم حذف مراسلة', 'warning');
        removeCorrespondenceFromList(data.id);
    });
    
    // Listen for sync conflicts
    socket.on('sync_conflict', function(data) {
        handleSyncConflict(data);
    });
    
    // Listen for user activity
    socket.on('user_activity', function(data) {
        updateUserActivity(data);
    });
}

function setupSmartPostman() {
    // Initialize smart postman chat
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
}

function togglePostman() {
    const postmanChat = document.getElementById('postman-chat');
    if (postmanChat) {
        if (postmanOpen) {
            postmanChat.classList.add('d-none');
            postmanOpen = false;
        } else {
            postmanChat.classList.remove('d-none');
            postmanOpen = true;
            // Focus on input
            document.getElementById('chat-input')?.focus();
        }
    }
}

function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message to chat
    addMessageToChat(message, 'user');
    input.value = '';
    
    // Show typing indicator
    showTypingIndicator();
    
    // Simulate smart postman response (in real app, this would call an API)
    setTimeout(() => {
        hideTypingIndicator();
        const response = generateSmartResponse(message);
        addMessageToChat(response, 'bot');
    }, 1000 + Math.random() * 2000);
}

function generateSmartResponse(message) {
    const responses = {
        'مرحبا': 'مرحباً بك! كيف يمكنني مساعدتك اليوم؟',
        'البحث': 'يمكنني مساعدتك في البحث عن المراسلات. ما هو موضوع البحث؟',
        'المراسلات': 'هل تريد إضافة مراسلة جديدة أم البحث في المراسلات الموجودة؟',
        'مساعدة': 'يمكنني مساعدتك في:\n• البحث عن المراسلات\n• إضافة مراسلة جديدة\n• الإبحار في النظام\n• تصدير البيانات',
        'تصدير': 'هل تريد تصدير البيانات إلى Excel أم JSON؟',
        'احصائيات': 'يمكنني عرض الإحصائيات الحالية للنظام.',
        'default': 'عذراً، لم أفهم طلبك. يمكنك السؤال عن المراسلات، البحث، التصدير، أو المساعدة.'
    };
    
    const lowercaseMessage = message.toLowerCase();
    
    for (const [key, response] of Object.entries(responses)) {
        if (lowercaseMessage.includes(key)) {
            return response;
        }
    }
    
    return responses.default;
}

function addMessageToChat(message, type) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    
    const icon = type === 'bot' ? '<i class="bi bi-robot"></i>' : '<i class="bi bi-person"></i>';
    
    messageDiv.innerHTML = `
        ${icon}
        <div class="message-content">
            ${message}
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTypingIndicator() {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typing-indicator';
    typingDiv.className = 'message bot-message';
    typingDiv.innerHTML = `
        <i class="bi bi-robot"></i>
        <div class="message-content">
            <div class="typing-dots">
                <span>.</span>
                <span>.</span>
                <span>.</span>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

function setupSyncHandling() {
    // Handle sync events
    socket.on('sync_start', function() {
        showSyncOverlay();
        syncInProgress = true;
    });
    
    socket.on('sync_complete', function() {
        hideSyncOverlay();
        syncInProgress = false;
        showNotification('تم مزامنة البيانات بنجاح', 'success');
    });
    
    socket.on('sync_error', function(data) {
        hideSyncOverlay();
        syncInProgress = false;
        showNotification(`خطأ في المزامنة: ${data.message}`, 'error');
    });
}

function showSyncOverlay() {
    const overlay = document.getElementById('sync-overlay');
    if (overlay) {
        overlay.classList.remove('d-none');
    }
}

function hideSyncOverlay() {
    const overlay = document.getElementById('sync-overlay');
    if (overlay) {
        overlay.classList.add('d-none');
    }
}

function setupOfflineHandling() {
    // Monitor online/offline status
    window.addEventListener('online', function() {
        isOnline = true;
        showNotification('تم إعادة الاتصال بالإنترنت', 'success');
    });
    
    window.addEventListener('offline', function() {
        isOnline = false;
        showNotification('فقدان الاتصال بالإنترنت - سيتم العمل في وضع عدم الاتصال', 'warning');
    });
}

function setupFileUpload() {
    const fileInputs = document.querySelectorAll('input[type="file"]');
    
    fileInputs.forEach(input => {
        const container = input.closest('.card-body');
        if (container) {
            // Add drag and drop functionality
            container.addEventListener('dragover', function(e) {
                e.preventDefault();
                container.classList.add('dragover');
            });
            
            container.addEventListener('dragleave', function(e) {
                e.preventDefault();
                container.classList.remove('dragover');
            });
            
            container.addEventListener('drop', function(e) {
                e.preventDefault();
                container.classList.remove('dragover');
                
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    input.files = files;
                    input.dispatchEvent(new Event('change'));
                }
            });
        }
    });
}

function setupAutoSave() {
    const forms = document.querySelectorAll('form[data-autosave]');
    
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            input.addEventListener('input', debounce(function() {
                autoSaveForm(form);
            }, 2000));
        });
    });
}

function autoSaveForm(form) {
    if (isOnline) {
        // In a real implementation, this would save to server
        console.log('Auto-saving form data...');
    } else {
        // Save locally
        saveToLocal(form.id || 'form', getFormData(form));
    }
}

function getFormData(form) {
    const formData = new FormData(form);
    const data = {};
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    return data;
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl+S or Cmd+S for save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            const form = document.querySelector('form');
            if (form) {
                form.dispatchEvent(new Event('submit'));
            }
        }
        
        // Ctrl+N or Cmd+N for new
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            const newBtn = document.querySelector('[href*="add"]');
            if (newBtn) {
                window.location.href = newBtn.href;
            }
        }
        
        // Ctrl+/ or Cmd+/ for search
        if ((e.ctrlKey || e.metaKey) && e.key === '/') {
            e.preventDefault();
            const searchInput = document.querySelector('input[name="search"]');
            if (searchInput) {
                searchInput.focus();
            }
        }
        
        // Escape to close modals or postman
        if (e.key === 'Escape') {
            if (postmanOpen) {
                togglePostman();
            }
        }
    });
}

function animateElements() {
    const elements = document.querySelectorAll('.card, .alert, .btn');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    });
    
    elements.forEach(el => {
        observer.observe(el);
    });
}

function updateCorrespondenceList(data, action) {
    const tableBody = document.querySelector('table tbody');
    if (!tableBody) return;
    
    if (action === 'added') {
        // Add new row to top of table
        const newRow = createCorrespondenceRow(data);
        tableBody.insertBefore(newRow, tableBody.firstChild);
    } else if (action === 'updated') {
        // Update existing row
        const existingRow = document.getElementById(`correspondence-${data.id}`);
        if (existingRow) {
            const updatedRow = createCorrespondenceRow(data);
            existingRow.replaceWith(updatedRow);
        }
    }
}

function createCorrespondenceRow(data) {
    const row = document.createElement('tr');
    row.id = `correspondence-${data.id}`;
    row.className = 'slide-in-right';
    
    row.innerHTML = `
        <td><input type="checkbox" class="correspondence-checkbox" value="${data.id}"></td>
        <td><a href="/correspondences/${data.id}" class="text-decoration-none">${data.reference_number}</a></td>
        <td><div class="text-truncate" style="max-width: 200px;" title="${data.subject}">${data.subject}</div></td>
        <td><span class="badge ${data.type === 'incoming' ? 'bg-success' : 'bg-primary'}">${data.type === 'incoming' ? 'وارد' : 'صادر'}</span></td>
        <td><span class="badge bg-warning">في الانتظار</span></td>
        <td><span class="badge bg-info">عادية</span></td>
        <td>${data.department || ''}</td>
        <td>${new Date().toLocaleDateString('ar-EG')}</td>
        <td>-</td>
        <td>
            <div class="btn-group btn-group-sm">
                <a href="/correspondences/${data.id}" class="btn btn-outline-primary"><i class="bi bi-eye"></i></a>
                <a href="/correspondences/${data.id}/edit" class="btn btn-outline-warning"><i class="bi bi-pencil"></i></a>
                <button class="btn btn-outline-danger" onclick="deleteCorrespondence(${data.id})"><i class="bi bi-trash"></i></button>
            </div>
        </td>
    `;
    
    return row;
}

function removeCorrespondenceFromList(id) {
    const row = document.getElementById(`correspondence-${id}`);
    if (row) {
        row.style.transition = 'all 0.3s ease';
        row.style.opacity = '0';
        row.style.transform = 'translateX(100%)';
        
        setTimeout(() => {
            row.remove();
        }, 300);
    }
}

function showNotification(message, type = 'info') {
    const alertClass = {
        'success': 'alert-success',
        'error': 'alert-danger',
        'warning': 'alert-warning',
        'info': 'alert-info'
    }[type] || 'alert-info';
    
    const alertIcon = {
        'success': 'check-circle',
        'error': 'exclamation-triangle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    }[type] || 'info-circle';
    
    const alertHtml = `
        <div class="alert ${alertClass} alert-dismissible fade show position-fixed shadow" 
             style="top: 20px; right: 20px; z-index: 1055; max-width: 400px;">
            <i class="bi bi-${alertIcon}"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', alertHtml);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        const alerts = document.querySelectorAll('.alert.position-fixed');
        if (alerts.length > 0) {
            const oldestAlert = alerts[0];
            const bsAlert = bootstrap.Alert.getOrCreateInstance(oldestAlert);
            bsAlert.close();
        }
    }, 5000);
}

// Utility functions
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

function saveToLocal(key, data) {
    try {
        localStorage.setItem(`ets_${key}`, JSON.stringify(data));
    } catch (e) {
        console.warn('Failed to save to localStorage:', e);
    }
}

function getFromLocal(key) {
    try {
        const data = localStorage.getItem(`ets_${key}`);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.warn('Failed to get from localStorage:', e);
        return null;
    }
}

// Export for use in other scripts
window.ETS = {
    showNotification,
    togglePostman,
    sendMessage,
    saveToLocal,
    getFromLocal
};