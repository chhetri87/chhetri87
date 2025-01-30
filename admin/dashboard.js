const storageManager = new StorageManager();

// Check authentication
function checkAuth() {
    const isLoggedIn = localStorage.getItem('adminLoggedIn');
    if (!isLoggedIn) {
        window.location.href = 'login.html';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication first
    checkAuth();

    // Initialize file upload
    initializeFileUpload();
    
    // Update stats
    updateStats();
    
    // Load messages
    loadMessages();
    
    // Update stats every minute
    setInterval(updateStats, 60000);

    // Handle logout
    const logoutBtn = document.getElementById('logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('adminLoggedIn');
            window.location.href = 'login.html';
        });
    }

    // Tab Navigation
    const navItems = document.querySelectorAll('.dashboard-nav li[data-tab]');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.dashboard-nav li').forEach(nav => nav.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            item.classList.add('active');
            const tabId = item.dataset.tab;
            document.getElementById(`${tabId}-tab`).classList.add('active');
            
            if (tabId === 'messages') {
                updateUnreadCount();
            }
        });
    });
});

function initializeFileUpload() {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const filesGrid = document.getElementById('files-grid');

    if (uploadArea && fileInput) {
        // Handle drag and drop
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.add('highlight');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.remove('highlight');
            });
        });

        uploadArea.addEventListener('drop', handleDrop);
        fileInput.addEventListener('change', handleFileSelect);

        // Click to upload
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });
    }

    // Load existing files
    loadFiles();
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

function handleFileSelect(e) {
    const files = e.target.files;
    handleFiles(files);
}

function handleFiles(files) {
    Array.from(files).forEach(file => {
        // Create progress element
        const progressDiv = createProgressElement(file.name);
        document.getElementById('upload-progress').appendChild(progressDiv);

        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onprogress = function(e) {
            if (e.lengthComputable) {
                const percentLoaded = Math.round((e.loaded / e.total) * 100);
                updateProgress(progressDiv, percentLoaded);
            }
        };

        reader.onload = function() {
            // Save file
            const fileData = storageManager.saveFile(file, reader.result);
            
            // Update files grid
            loadFiles();
            
            // Remove progress element after a delay
            setTimeout(() => {
                progressDiv.remove();
            }, 1000);
        };

        reader.onerror = function() {
            console.error('Error reading file');
            progressDiv.remove();
        };
    });
}

function createProgressElement(fileName) {
    const div = document.createElement('div');
    div.className = 'progress-bar';
    div.innerHTML = `
        <div class="progress-info">
            <span>${fileName}</span>
            <span class="progress-percentage">0%</span>
        </div>
        <div class="progress">
            <div class="progress-fill"></div>
        </div>
    `;
    return div;
}

function updateProgress(progressDiv, percentage) {
    progressDiv.querySelector('.progress-percentage').textContent = percentage + '%';
    progressDiv.querySelector('.progress-fill').style.width = percentage + '%';
}

function loadFiles() {
    const filesGrid = document.getElementById('files-grid');
    if (!filesGrid) return;

    const files = storageManager.getAllFiles();
    filesGrid.innerHTML = files.map(file => `
        <div class="file-item" data-id="${file.id}">
            <i class='bx bx-file'></i>
            <div class="file-name">${file.name}</div>
            <div class="file-size">${formatFileSize(file.size)}</div>
            <div class="file-actions">
                <button class="btn-icon" onclick="downloadFile(${file.id})" title="Download">
                    <i class='bx bx-download'></i>
                </button>
                <button class="btn-icon" onclick="deleteFile(${file.id})" title="Delete">
                    <i class='bx bx-trash'></i>
                </button>
            </div>
        </div>
    `).join('');
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function downloadFile(id) {
    const file = storageManager.getFile(id);
    if (file) {
        const link = document.createElement('a');
        link.href = file.dataUrl;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        storageManager.logActivity(`Downloaded file: ${file.name}`);
        updateActivityList();
    }
}

function deleteFile(id) {
    if (confirm('Are you sure you want to delete this file?')) {
        storageManager.deleteFile(id);
        loadFiles();
        updateStats();
        storageManager.logActivity(`Deleted file: ${file.name}`);
        updateActivityList();
    }
}

function updateStats() {
    const stats = storageManager.getStats();
    
    // Update stats cards
    document.querySelector('[data-stat="visitors"] p').textContent = stats.visitors.toLocaleString();
    document.querySelector('[data-stat="likes"] p').textContent = stats.likes.toLocaleString();
    
    // Update messages count
    const messages = storageManager.getMessages();
    document.querySelector('[data-stat="messages"] p').textContent = messages.length.toLocaleString();
    
    // Update files count
    const files = storageManager.getAllFiles();
    document.querySelector('[data-stat="files"] p').textContent = files.length.toLocaleString();
}

function loadMessages() {
    const messagesList = document.getElementById('messages-list');
    if (!messagesList) return;

    const messages = storageManager.getMessages();
    messagesList.innerHTML = messages.map(message => `
        <div class="message-item ${message.read ? '' : 'unread'}" data-id="${message.id}">
            <div class="message-header">
                <div class="message-info">
                    <h3>${message.name}</h3>
                    <span>${message.email}</span>
                </div>
                <div class="message-time">
                    ${formatTimeAgo(new Date(message.timestamp))}
                </div>
            </div>
            <div class="message-subject">${message.subject}</div>
            <div class="message-content">${message.message}</div>
            <div class="message-actions">
                <button class="btn-icon" onclick="markMessageAsRead(${message.id})" title="Mark as ${message.read ? 'unread' : 'read'}">
                    <i class='bx ${message.read ? 'bx-envelope-open' : 'bx-envelope'}'></i>
                </button>
                <button class="btn-icon" onclick="deleteMessage(${message.id})" title="Delete">
                    <i class='bx bx-trash'></i>
                </button>
            </div>
        </div>
    `).join('');

    updateUnreadCount();
}

function updateUnreadCount() {
    const messages = storageManager.getMessages();
    const unreadCount = messages.filter(m => !m.read).length;
    
    // Update the messages tab badge
    const messagesTab = document.querySelector('li[data-tab="messages"]');
    const badge = messagesTab.querySelector('.badge') || document.createElement('span');
    badge.className = 'badge';
    
    if (unreadCount > 0) {
        badge.textContent = unreadCount;
        if (!messagesTab.querySelector('.badge')) {
            messagesTab.appendChild(badge);
        }
    } else {
        badge.remove();
    }
}

function markMessageAsRead(id) {
    storageManager.markMessageAsRead(id);
    loadMessages();
    updateStats();
}

function deleteMessage(id) {
    if (confirm('Are you sure you want to delete this message?')) {
        storageManager.deleteMessage(id);
        loadMessages();
        updateStats();
    }
}

function updateActivityList() {
    const activityList = document.getElementById('activity-list');
    if (activityList) {
        const activities = storageManager.getActivities();
        activityList.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-content">
                    <p>${activity.action}</p>
                    <span>${formatTimeAgo(new Date(activity.timestamp))}</span>
                </div>
            </div>
        `).join('');
    }
}

function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60,
        second: 1
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
        }
    }
    return 'just now';
}

// Content Management
const contentEditor = document.getElementById('content-editor');
if (contentEditor) {
    const sections = ['about', 'services', 'skills'];
    sections.forEach(section => {
        const content = storageManager.getContent(section);
        if (content) {
            document.getElementById(`${section}-content`).value = content;
        }
    });

    document.getElementById('save-content').addEventListener('click', () => {
        sections.forEach(section => {
            const content = document.getElementById(`${section}-content`).value;
            storageManager.saveContent(section, content);
            storageManager.logActivity(`Updated ${section} section content`);
        });
        updateActivityList();
        alert('Content saved successfully!');
    });
}
