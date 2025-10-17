// Global variables
let currentPage = 1;
let currentType = '';
let currentSource = '';
let currentSearch = '';
let socket = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Initialize socket connection
    initializeSocket();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load initial data
    loadDashboardData();
    loadCronStatus();
    
    // Set up auto-refresh
    setInterval(() => {
        if (document.querySelector('#dashboard').classList.contains('active')) {
            loadDashboardData();
        }
        loadCronStatus();
    }, 30000); // Refresh every 30 seconds
}

function initializeSocket() {
    socket = io();
    
    socket.on('connect', () => {
        console.log('Connected to server');
        showNotification('Connected to server', 'success');
    });
    
    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        showNotification('Disconnected from server', 'warning');
    });
    
    socket.on('dataUpdated', (data) => {
        console.log('Data updated:', data);
        showNotification(`New ${data.type} data available`, 'success');
        
        // Refresh current view if it's the data section
        if (document.querySelector('#data').classList.contains('active')) {
            loadData();
        }
    });
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            showSection(section);
        });
    });
    
    // Mobile menu toggle
    document.querySelector('.nav-toggle').addEventListener('click', () => {
        document.querySelector('.nav-menu').classList.toggle('active');
    });
    
    // Search functionality
    document.getElementById('search-input').addEventListener('input', (e) => {
        currentSearch = e.target.value;
        if (currentSearch.length > 2 || currentSearch.length === 0) {
            loadData();
        }
    });
    
    // Type filter
    document.getElementById('type-filter').addEventListener('change', (e) => {
        currentType = e.target.value;
        loadData();
    });
    
    // Source filter
    document.getElementById('source-filter').addEventListener('change', (e) => {
        currentSource = e.target.value;
        loadData();
    });
    
    // Log type filter
    document.getElementById('log-type-filter').addEventListener('change', (e) => {
        loadLogs(e.target.value);
    });
}

function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionName).classList.add('active');
    
    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
    
    // Close mobile menu
    document.querySelector('.nav-menu').classList.remove('active');
    
    // Load section-specific data
    switch(sectionName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'data':
            loadData();
            break;
        case 'logs':
            loadLogs();
            break;
    }
}

// Dashboard functions
async function loadDashboardData() {
    try {
        showLoading('recent-news');
        showLoading('recent-crypto');
        showLoading('recent-weather');
        
        // Load recent data for each type
        const [newsData, cryptoData, weatherData, stats] = await Promise.all([
            fetch('/api/data/type/news?limit=5').then(res => res.json()),
            fetch('/api/data/type/crypto?limit=5').then(res => res.json()),
            fetch('/api/data/type/weather?limit=5').then(res => res.json()),
            fetch('/api/data/stats/overview').then(res => res.json())
        ]);
        
        // Update stats
        if (stats.success) {
            updateStats(stats.stats);
        }
        
        // Update recent data
        updateRecentData('recent-news', newsData.data || []);
        updateRecentData('recent-crypto', cryptoData.data || []);
        updateRecentData('recent-weather', weatherData.data || []);
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Failed to load dashboard data', 'error');
    }
}

function updateStats(stats) {
    const counts = {
        news: 0,
        crypto: 0,
        weather: 0
    };
    
    stats.forEach(stat => {
        counts[stat.dataType] = stat.count;
    });
    
    document.getElementById('news-count').textContent = counts.news || 0;
    document.getElementById('crypto-count').textContent = counts.crypto || 0;
    document.getElementById('weather-count').textContent = counts.weather || 0;
    
    // Update last update time
    const now = new Date();
    document.getElementById('last-update').textContent = now.toLocaleTimeString();
}

function updateRecentData(containerId, data) {
    const container = document.getElementById(containerId);
    
    if (!data || data.length === 0) {
        container.innerHTML = '<div class="loading">No data available</div>';
        return;
    }
    
    const html = data.map(item => `
        <div class="data-list-item">
            <div class="data-list-icon" style="background: ${getTypeColor(item.dataType)}">
                <i class="fas ${getTypeIcon(item.dataType)}"></i>
            </div>
            <div class="data-list-content">
                <div class="data-list-title">${item.title}</div>
                <div class="data-list-meta">
                    <span>${item.source}</span>
                    <span>${formatDate(item.publishedAt)}</span>
                </div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

// Data functions
async function loadData(page = 1) {
    try {
        showLoading('data-list');
        
        const params = new URLSearchParams({
            page: page,
            limit: 12
        });
        
        if (currentType) params.append('type', currentType);
        if (currentSource) params.append('source', currentSource);
        if (currentSearch) params.append('q', currentSearch);
        
        const response = await fetch(`/api/data?${params}`);
        const result = await response.json();
        
        if (result.success) {
            displayData(result.data);
            updatePagination(result.pagination);
            currentPage = page;
        } else {
            throw new Error(result.message);
        }
        
    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('data-list').innerHTML = '<div class="loading">Failed to load data</div>';
        showNotification('Failed to load data', 'error');
    }
}

function displayData(data) {
    const container = document.getElementById('data-list');
    
    if (!data || data.length === 0) {
        container.innerHTML = '<div class="loading">No data found</div>';
        return;
    }
    
    const html = data.map(item => `
        <div class="data-item" onclick="openDataItem('${item._id}')">
            <div class="data-item-header">
                <span class="data-type ${item.dataType}">${item.dataType}</span>
                <span class="data-priority">Priority: ${item.priority}</span>
            </div>
            <div class="data-title">${item.title}</div>
            <div class="data-description">${item.description || 'No description available'}</div>
            <div class="data-meta">
                <span class="data-source">${item.source}</span>
                <span class="data-date">${formatDate(item.publishedAt)}</span>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

function updatePagination(pagination) {
    const container = document.getElementById('pagination');
    
    if (pagination.pages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = '';
    
    // Previous button
    html += `<button ${pagination.page === 1 ? 'disabled' : ''} onclick="loadData(${pagination.page - 1})">
        <i class="fas fa-chevron-left"></i>
    </button>`;
    
    // Page numbers
    const startPage = Math.max(1, pagination.page - 2);
    const endPage = Math.min(pagination.pages, pagination.page + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="${i === pagination.page ? 'active' : ''}" onclick="loadData(${i})">${i}</button>`;
    }
    
    // Next button
    html += `<button ${pagination.page === pagination.pages ? 'disabled' : ''} onclick="loadData(${pagination.page + 1})">
        <i class="fas fa-chevron-right"></i>
    </button>`;
    
    container.innerHTML = html;
}

// Scraper functions
async function triggerScraping(type) {
    try {
        showLoadingOverlay();
        
        const response = await fetch(`/api/scraper/${type}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(result.message, 'success');
            
            // Refresh dashboard if it's active
            if (document.querySelector('#dashboard').classList.contains('active')) {
                loadDashboardData();
            }
        } else {
            throw new Error(result.message);
        }
        
    } catch (error) {
        console.error('Error triggering scraping:', error);
        showNotification('Failed to trigger scraping', 'error');
    } finally {
        hideLoadingOverlay();
    }
}

async function loadCronStatus() {
    try {
        const response = await fetch('/api/scraper/cron/status');
        const result = await response.json();
        
        if (result.success) {
            displayCronStatus(result.jobs);
        }
        
    } catch (error) {
        console.error('Error loading cron status:', error);
    }
}

function displayCronStatus(jobs) {
    const container = document.getElementById('cron-status');
    
    const html = Object.entries(jobs).map(([name, status]) => `
        <div class="cron-job">
            <div class="cron-job-name">${name.replace('-', ' ').toUpperCase()}</div>
            <div class="cron-job-status ${status.running ? 'running' : 'stopped'}">
                ${status.running ? 'Running' : 'Stopped'}
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

async function cleanupData() {
    try {
        showLoadingOverlay();
        
        const response = await fetch('/api/scraper/cleanup', {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Cleanup completed successfully', 'success');
        } else {
            throw new Error(result.message);
        }
        
    } catch (error) {
        console.error('Error cleaning up data:', error);
        showNotification('Cleanup failed', 'error');
    } finally {
        hideLoadingOverlay();
    }
}

async function restartCronJobs() {
    try {
        showLoadingOverlay();
        
        const response = await fetch('/api/scraper/cron/restart', {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Cron jobs restarted successfully', 'success');
            loadCronStatus();
        } else {
            throw new Error(result.message);
        }
        
    } catch (error) {
        console.error('Error restarting cron jobs:', error);
        showNotification('Failed to restart cron jobs', 'error');
    } finally {
        hideLoadingOverlay();
    }
}

// Logs functions
async function loadLogs(type = '') {
    try {
        showLoading('logs-list');
        
        const params = new URLSearchParams();
        if (type) params.append('type', type);
        
        const response = await fetch(`/api/data/logs/recent?${params}`);
        const result = await response.json();
        
        if (result.success) {
            displayLogs(result.logs);
        } else {
            throw new Error(result.message);
        }
        
    } catch (error) {
        console.error('Error loading logs:', error);
        document.getElementById('logs-list').innerHTML = '<div class="loading">Failed to load logs</div>';
        showNotification('Failed to load logs', 'error');
    }
}

function displayLogs(logs) {
    const container = document.getElementById('logs-list');
    
    if (!logs || logs.length === 0) {
        container.innerHTML = '<div class="loading">No logs available</div>';
        return;
    }
    
    const html = logs.map(log => `
        <div class="log-item">
            <div class="log-info">
                <div class="log-type">${log.dataType.toUpperCase()} - ${log.source}</div>
                <div class="log-details">
                    <span>Items: ${log.itemsScraped}</span>
                    <span>Saved: ${log.itemsSaved}</span>
                    <span>Duration: ${formatDuration(log.duration)}</span>
                    <span>${formatDate(log.completedAt)}</span>
                </div>
            </div>
            <div class="log-status ${log.status}">${log.status}</div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

// Utility functions
function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
    }
}

function showLoadingOverlay() {
    document.getElementById('loading-overlay').classList.add('show');
}

function hideLoadingOverlay() {
    document.getElementById('loading-overlay').classList.remove('show');
}

function showNotification(message, type = 'info') {
    const container = document.getElementById('notifications');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; cursor: pointer; font-size: 1.2rem; color: #64748b;">&times;</button>
        </div>
    `;
    
    container.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

function getTypeColor(type) {
    const colors = {
        news: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
        crypto: 'linear-gradient(135deg, #f59e0b, #d97706)',
        weather: 'linear-gradient(135deg, #10b981, #059669)',
        stocks: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
        sports: 'linear-gradient(135deg, #ef4444, #dc2626)'
    };
    return colors[type] || 'linear-gradient(135deg, #6b7280, #4b5563)';
}

function getTypeIcon(type) {
    const icons = {
        news: 'fa-newspaper',
        crypto: 'fa-coins',
        weather: 'fa-cloud-sun',
        stocks: 'fa-chart-line',
        sports: 'fa-football-ball'
    };
    return icons[type] || 'fa-file';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) { // Less than 1 minute
        return 'Just now';
    } else if (diff < 3600000) { // Less than 1 hour
        const minutes = Math.floor(diff / 60000);
        return `${minutes}m ago`;
    } else if (diff < 86400000) { // Less than 1 day
        const hours = Math.floor(diff / 3600000);
        return `${hours}h ago`;
    } else {
        return date.toLocaleDateString();
    }
}

function formatDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        return `${seconds}s`;
    }
}

function openDataItem(id) {
    // This could open a modal or navigate to a detail page
    showNotification(`Opening data item ${id}`, 'info');
}

// Load recent data for dashboard
async function loadRecentData(type) {
    try {
        const response = await fetch(`/api/data/type/${type}?limit=5`);
        const result = await response.json();
        
        if (result.success) {
            updateRecentData(`recent-${type}`, result.data);
        }
        
    } catch (error) {
        console.error(`Error loading recent ${type}:`, error);
        showNotification(`Failed to load recent ${type}`, 'error');
    }
}
