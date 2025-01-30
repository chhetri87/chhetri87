class StorageManager {
    constructor() {
        this.files = JSON.parse(localStorage.getItem('uploadedFiles')) || [];
        this.content = JSON.parse(localStorage.getItem('websiteContent')) || {};
        this.stats = JSON.parse(localStorage.getItem('websiteStats')) || {
            visitors: 0,
            likes: 0,
            lastVisit: null
        };
        this.messages = JSON.parse(localStorage.getItem('messages')) || [];
        this.activities = JSON.parse(localStorage.getItem('activities')) || [];
        
        // Initialize if first time
        if (!localStorage.getItem('websiteStats')) {
            this.stats.visitors = Math.floor(Math.random() * 1000) + 500; // Initial random visitors
            this.stats.likes = Math.floor(Math.random() * 500) + 200; // Initial random likes
            this._saveStats();
        }
    }

    // Stats Management
    incrementVisitors() {
        this.stats.visitors++;
        this.stats.lastVisit = new Date().toISOString();
        this._saveStats();
        this.logActivity('New visitor on the website');
    }

    incrementLikes() {
        this.stats.likes++;
        this._saveStats();
        this.logActivity('New like received');
    }

    getStats() {
        return this.stats;
    }

    _saveStats() {
        localStorage.setItem('websiteStats', JSON.stringify(this.stats));
    }

    // Message Management
    addMessage(message) {
        const newMessage = {
            id: Date.now(),
            ...message,
            timestamp: new Date().toISOString(),
            read: false
        };
        this.messages.unshift(newMessage);
        this._saveMessages();
        this.logActivity('New message received from ' + message.name);
        return newMessage;
    }

    getMessages() {
        return this.messages;
    }

    markMessageAsRead(id) {
        const message = this.messages.find(m => m.id === id);
        if (message) {
            message.read = true;
            this._saveMessages();
        }
    }

    deleteMessage(id) {
        this.messages = this.messages.filter(m => m.id !== id);
        this._saveMessages();
        this.logActivity('Message deleted');
    }

    _saveMessages() {
        localStorage.setItem('messages', JSON.stringify(this.messages));
    }

    // File Management
    saveFile(file, dataUrl) {
        const fileData = {
            id: Date.now(),
            name: file.name,
            type: file.type,
            size: file.size,
            dataUrl: dataUrl,
            uploadDate: new Date().toISOString()
        };
        this.files.push(fileData);
        this._saveFiles();
        this.logActivity('File uploaded: ' + file.name);
        return fileData;
    }

    getAllFiles() {
        return this.files;
    }

    getFile(id) {
        return this.files.find(file => file.id === id);
    }

    deleteFile(id) {
        const file = this.getFile(id);
        if (file) {
            this.files = this.files.filter(f => f.id !== id);
            this._saveFiles();
            this.logActivity('File deleted: ' + file.name);
        }
    }

    _saveFiles() {
        localStorage.setItem('uploadedFiles', JSON.stringify(this.files));
    }

    // Content Management
    saveContent(section, content) {
        this.content[section] = {
            content: content,
            lastModified: new Date().toISOString()
        };
        this._saveContent();
        this.logActivity('Content updated: ' + section);
    }

    getContent(section) {
        return this.content[section]?.content || '';
    }

    getAllContent() {
        return this.content;
    }

    _saveContent() {
        localStorage.setItem('websiteContent', JSON.stringify(this.content));
    }

    // Activity Logging
    logActivity(action) {
        const activity = {
            id: Date.now(),
            action,
            timestamp: new Date().toISOString()
        };
        this.activities.unshift(activity);
        
        // Keep only last 50 activities
        if (this.activities.length > 50) {
            this.activities.pop();
        }
        
        this._saveActivities();
    }

    getActivities() {
        return this.activities;
    }

    _saveActivities() {
        localStorage.setItem('activities', JSON.stringify(this.activities));
    }
}
