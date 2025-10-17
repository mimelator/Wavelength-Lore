/**
 * Forum Admin Management System
 * Handles user management, post moderation, and admin controls
 * Uses authenticated API endpoints instead of direct Firebase access
 */

class AdminManager {
    constructor() {
        this.users = [];
        this.posts = [];
        this.reports = [];
        this.isAdmin = false;
        this.apiBaseUrl = '/api/admin';
    }

    /**
     * Initialize admin manager
     */
    async initialize() {
        await this.checkAdminAccess();
        if (!this.isAdmin) {
            this.redirectToForum();
            return;
        }

        this.setupEventListeners();
        await this.loadUsers();
        await this.loadPosts();
        await this.loadReports();
    }

    /**
     * Check if current user has admin access
     * Now checks for admin key in URL params
     */
    async checkAdminAccess() {
        // Check if admin key is provided in URL
        const urlParams = new URLSearchParams(window.location.search);
        const adminKey = urlParams.get('adminKey');
        
        if (adminKey) {
            // Verify admin key with backend
            try {
                const response = await this.makeAuthenticatedRequest('/stats');
                this.isAdmin = response.success;
            } catch (error) {
                console.error('Admin key verification failed:', error);
                this.isAdmin = false;
            }
        } else {
            this.isAdmin = false;
        }
    }

    /**
     * Make authenticated request to admin API
     */
    async makeAuthenticatedRequest(endpoint, options = {}) {
        // Include admin key from URL if present
        const urlParams = new URLSearchParams(window.location.search);
        const adminKey = urlParams.get('adminKey');
        
        const url = new URL(this.apiBaseUrl + endpoint, window.location.origin);
        if (adminKey) {
            url.searchParams.append('adminKey', adminKey);
        }

        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            ...options
        };

        const response = await fetch(url.toString(), defaultOptions);
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * Redirect to forum if not admin
     */
    redirectToForum() {
        alert('Access denied. Admin privileges required.');
        window.location.href = '/forum';
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // User search
        const userSearch = document.getElementById('user-search');
        if (userSearch) {
            userSearch.addEventListener('input', () => this.filterUsers());
        }

        // Role filter
        const roleFilter = document.getElementById('role-filter');
        if (roleFilter) {
            roleFilter.addEventListener('change', () => this.filterUsers());
        }

        // Post search
        const postSearch = document.getElementById('post-search');
        if (postSearch) {
            postSearch.addEventListener('input', () => this.filterPosts());
        }

        // Category filter
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => this.filterPosts());
        }
    }

    /**
     * Load all users from API
     */
    async loadUsers() {
        try {
            console.log('Loading users from API...');
            const response = await this.makeAuthenticatedRequest('/users');
            
            if (response.success) {
                this.users = response.data || [];
                console.log(`Loaded ${this.users.length} users`);
                this.renderUsers();
            } else {
                console.error('Failed to load users:', response.error);
                this.showNotification('Failed to load users', 'error');
            }
        } catch (error) {
            console.error('Error loading users:', error);
            this.showNotification('Error loading users', 'error');
        }
    }

    /**
     * Load all posts from API
     */
    async loadPosts() {
        try {
            console.log('Loading posts from API...');
            const response = await this.makeAuthenticatedRequest('/posts');
            
            if (response.success) {
                this.posts = response.data || [];
                console.log(`Loaded ${this.posts.length} posts`);
                this.renderPosts();
            } else {
                console.error('Failed to load posts:', response.error);
                this.showNotification('Failed to load posts', 'error');
            }
        } catch (error) {
            console.error('Error loading posts:', error);
            this.showNotification('Error loading posts', 'error');
        }
    }

    /**
     * Load reports from API
     */
    async loadReports() {
        try {
            console.log('Loading reports from API...');
            const response = await this.makeAuthenticatedRequest('/reports');
            
            if (response.success) {
                this.reports = response.data || [];
                console.log(`Loaded ${this.reports.length} reports`);
                this.renderReports();
            } else {
                console.error('Failed to load reports:', response.error);
                this.showNotification('Failed to load reports', 'error');
            }
        } catch (error) {
            console.error('Error loading reports:', error);
            this.showNotification('Error loading reports', 'error');
        }
    }

    /**
     * Render users table
     */
    renderUsers() {
        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;

        if (this.users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="no-data">No users found</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.users.map(user => `
            <tr>
                <td>
                    <div class="user-info">
                        <img src="${user.avatar || '/icons/hero-icon.svg'}" alt="${user.displayName || user.name || 'User'}" class="user-avatar-small">
                        <div>
                            <div class="user-name">${this.escapeHtml(user.displayName || user.name || 'Unknown')}</div>
                            <div class="user-email">${this.escapeHtml(user.email || 'No email')}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="role-badge role-${user.role || 'user'}">
                        ${this.getRoleIcon(user.role)} ${user.role || 'user'}
                    </span>
                </td>
                <td>${user.postCount || 0}</td>
                <td>${new Date(user.createdAt || user.joinedAt || Date.now()).toLocaleDateString()}</td>
                <td>${user.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'Never'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-small btn-primary" onclick="adminManager.editUser('${user.uid}')">
                            ✏️ Edit
                        </button>
                        <button class="btn-small btn-danger" onclick="adminManager.confirmUserAction('${user.uid}', 'ban')">
                            🚫 Ban
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Render posts table
     */
    renderPosts() {
        const tbody = document.getElementById('posts-table-body');
        if (!tbody) return;

        if (this.posts.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="no-data">No posts found</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.posts.map(post => `
            <tr>
                <td>
                    <a href="/forum/post/${post.id}" class="post-link">
                        ${this.escapeHtml(post.title)}
                    </a>
                </td>
                <td>${this.escapeHtml(post.authorName || post.author || 'Unknown')}</td>
                <td>
                    <span class="category-badge">${post.category || 'general'}</span>
                </td>
                <td>${post.replyCount || post.likeCount || 0}</td>
                <td>${new Date(post.createdAt || Date.now()).toLocaleDateString()}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-small btn-primary" onclick="adminManager.viewPost('${post.id}')">
                            👁️ View
                        </button>
                        <button class="btn-small btn-warning" onclick="adminManager.editPost('${post.id}')">
                            ✏️ Edit
                        </button>
                        <button class="btn-small btn-danger" onclick="adminManager.confirmPostAction('${post.id}', 'delete')">
                            🗑️ Delete
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Render reports
     */
    renderReports() {
        const container = document.getElementById('reports-container');
        if (!container) return;

        const pendingReports = this.reports.filter(r => r.status === 'pending');
        const resolvedReports = this.reports.filter(r => r.status === 'resolved');

        // Update stats
        const pendingElement = document.getElementById('pending-reports');
        const resolvedElement = document.getElementById('resolved-reports');
        if (pendingElement) pendingElement.textContent = pendingReports.length;
        if (resolvedElement) resolvedElement.textContent = resolvedReports.length;

        if (this.reports.length === 0) {
            container.innerHTML = `
                <div class="no-data-placeholder">
                    <div class="no-data-icon">📋</div>
                    <h3>No Reports</h3>
                    <p>No content has been reported yet.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.reports.map(report => `
            <div class="report-card ${report.status}">
                <div class="report-header">
                    <div class="report-type">
                        <span class="report-icon">${this.getReportIcon(report.type)}</span>
                        <span class="report-label">${report.type || 'General'}</span>
                    </div>
                    <div class="report-status ${report.status}">
                        ${report.status || 'pending'}
                    </div>
                </div>
                
                <div class="report-content">
                    <p><strong>Reason:</strong> ${this.escapeHtml(report.reason)}</p>
                    <p><strong>Reported by:</strong> ${this.escapeHtml(report.reporterName || 'Anonymous')}</p>
                    <p><strong>Content:</strong> ${this.escapeHtml(report.content || 'N/A')}</p>
                </div>
                
                <div class="report-actions">
                    <button class="btn-small btn-primary" onclick="adminManager.viewReportedContent('${report.id}')">
                        👁️ View Content
                    </button>
                    <button class="btn-small btn-success" onclick="adminManager.resolveReport('${report.id}')">
                        ✅ Resolve
                    </button>
                    <button class="btn-small btn-danger" onclick="adminManager.dismissReport('${report.id}')">
                        ❌ Dismiss
                    </button>
                </div>
            </div>
        `).join('');
    }

    /**
     * Filter users
     */
    filterUsers() {
        const searchInput = document.getElementById('user-search');
        const roleFilterSelect = document.getElementById('role-filter');
        
        if (!searchInput || !roleFilterSelect) return;
        
        const searchTerm = searchInput.value.toLowerCase();
        const roleFilter = roleFilterSelect.value;

        let filtered = this.users;

        if (searchTerm) {
            filtered = filtered.filter(user => 
                (user.displayName || user.name || '').toLowerCase().includes(searchTerm) ||
                (user.email || '').toLowerCase().includes(searchTerm)
            );
        }

        if (roleFilter) {
            filtered = filtered.filter(user => (user.role || 'user') === roleFilter);
        }

        // Temporarily store filtered users and re-render
        const originalUsers = this.users;
        this.users = filtered;
        this.renderUsers();
        this.users = originalUsers;
    }

    /**
     * Filter posts
     */
    filterPosts() {
        const searchInput = document.getElementById('post-search');
        const categoryFilterSelect = document.getElementById('category-filter');
        
        if (!searchInput || !categoryFilterSelect) return;
        
        const searchTerm = searchInput.value.toLowerCase();
        const categoryFilter = categoryFilterSelect.value;

        let filtered = this.posts;

        if (searchTerm) {
            filtered = filtered.filter(post => 
                (post.title || '').toLowerCase().includes(searchTerm) ||
                (post.content || '').toLowerCase().includes(searchTerm)
            );
        }

        if (categoryFilter) {
            filtered = filtered.filter(post => (post.category || 'general') === categoryFilter);
        }

        // Temporarily store filtered posts and re-render
        const originalPosts = this.posts;
        this.posts = filtered;
        this.renderPosts();
        this.posts = originalPosts;
    }

    /**
     * Edit user via API
     */
    async editUser(userId) {
        const user = this.users.find(u => u.uid === userId);
        if (!user) return;

        const newRole = prompt(`Change role for ${user.displayName || user.name}:\n\nCurrent: ${user.role || 'user'}\n\nOptions: admin, moderator, user, banned`);
        
        if (newRole && ['admin', 'moderator', 'user', 'banned'].includes(newRole)) {
            try {
                const response = await this.makeAuthenticatedRequest(`/users/${userId}/update`, {
                    method: 'POST',
                    body: JSON.stringify({
                        role: newRole
                    })
                });

                if (response.success) {
                    this.showNotification(`User role updated to ${newRole}`, 'success');
                    await this.loadUsers(); // Reload data
                } else {
                    this.showNotification('Failed to update user role', 'error');
                }
            } catch (error) {
                console.error('Error updating user role:', error);
                this.showNotification('Failed to update user role', 'error');
            }
        }
    }

    /**
     * Confirm user action
     */
    confirmUserAction(userId, action) {
        const user = this.users.find(u => u.uid === userId);
        if (!user) return;

        const confirmed = confirm(`Are you sure you want to ${action} user "${user.displayName || user.name}"?`);
        if (confirmed) {
            this.executeUserAction(userId, action);
        }
    }

    /**
     * Execute user action via API
     */
    async executeUserAction(userId, action) {
        try {
            let updateData = {};
            
            switch (action) {
                case 'ban':
                    updateData = { role: 'banned' };
                    break;
                    
                case 'unban':
                    updateData = { role: 'user' };
                    break;
                    
                default:
                    return;
            }

            const response = await this.makeAuthenticatedRequest(`/users/${userId}/update`, {
                method: 'POST',
                body: JSON.stringify(updateData)
            });

            if (response.success) {
                this.showNotification(`User ${action} successful`, 'success');
                await this.loadUsers(); // Reload data
            } else {
                this.showNotification(`Failed to ${action} user`, 'error');
            }
        } catch (error) {
            console.error(`Error executing ${action} on user:`, error);
            this.showNotification(`Failed to ${action} user`, 'error');
        }
    }

    /**
     * View post
     */
    viewPost(postId) {
        window.open(`/forum/post/${postId}`, '_blank');
    }

    /**
     * Edit post via API
     */
    async editPost(postId) {
        const post = this.posts.find(p => p.id === postId);
        if (!post) return;

        const newTitle = prompt('Edit post title:', post.title);
        if (newTitle && newTitle !== post.title) {
            try {
                const response = await this.makeAuthenticatedRequest(`/posts/${postId}/update`, {
                    method: 'POST',
                    body: JSON.stringify({
                        title: newTitle
                    })
                });

                if (response.success) {
                    this.showNotification('Post updated successfully', 'success');
                    await this.loadPosts(); // Reload data
                } else {
                    this.showNotification('Failed to update post', 'error');
                }
            } catch (error) {
                console.error('Error updating post:', error);
                this.showNotification('Failed to update post', 'error');
            }
        }
    }

    /**
     * Confirm post action
     */
    confirmPostAction(postId, action) {
        const post = this.posts.find(p => p.id === postId);
        if (!post) return;

        const confirmed = confirm(`Are you sure you want to ${action} post "${post.title}"?`);
        if (confirmed) {
            this.executePostAction(postId, action);
        }
    }

    /**
     * Execute post action via API
     */
    async executePostAction(postId, action) {
        try {
            let response;
            
            switch (action) {
                case 'delete':
                    response = await this.makeAuthenticatedRequest(`/posts/${postId}`, {
                        method: 'DELETE'
                    });
                    break;
                    
                case 'lock':
                    response = await this.makeAuthenticatedRequest(`/posts/${postId}/update`, {
                        method: 'POST',
                        body: JSON.stringify({
                            locked: true
                        })
                    });
                    break;
                    
                default:
                    return;
            }

            if (response.success) {
                this.showNotification(`Post ${action} successful`, 'success');
                await this.loadPosts(); // Reload data
            } else {
                this.showNotification(`Failed to ${action} post`, 'error');
            }
        } catch (error) {
            console.error(`Error executing ${action} on post:`, error);
            this.showNotification(`Failed to ${action} post`, 'error');
        }
    }

    /**
     * View reported content
     */
    viewReportedContent(reportId) {
        const report = this.reports.find(r => r.id === reportId);
        if (!report) return;

        if (report.postId) {
            this.viewPost(report.postId);
        } else {
            alert('Content reference not found');
        }
    }

    /**
     * Resolve report (placeholder - would need API endpoint)
     */
    async resolveReport(reportId) {
        this.showNotification('Report resolution not yet implemented via API', 'info');
    }

    /**
     * Dismiss report (placeholder - would need API endpoint)
     */
    async dismissReport(reportId) {
        this.showNotification('Report dismissal not yet implemented via API', 'info');
    }

    /**
     * Save settings (placeholder - would need API endpoint)
     */
    async saveSettings() {
        this.showNotification('Settings save not yet implemented via API', 'info');
    }

    /**
     * Get role icon
     */
    getRoleIcon(role) {
        const icons = {
            admin: '👑',
            moderator: '🛡️',
            user: '👤',
            member: '👤',
            banned: '🚫'
        };
        return icons[role] || icons.user;
    }

    /**
     * Get report icon
     */
    getReportIcon(type) {
        const icons = {
            spam: '📧',
            harassment: '⚠️',
            inappropriate: '🔞',
            offtopic: '💬',
            other: '❓'
        };
        return icons[type] || icons.other;
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Create a simple notification system if forum notification doesn't exist
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // Try to use existing forum notification system
        if (window.forumJS && window.forumJS.showNotification) {
            window.forumJS.showNotification(message, type);
        } else {
            // Fallback to browser alert for important messages
            if (type === 'error') {
                alert(`Error: ${message}`);
            } else if (type === 'success') {
                alert(`Success: ${message}`);
            } else {
                alert(message);
            }
        }
    }
}

// Initialize admin manager
window.adminManager = new AdminManager();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.adminManager.initialize();
});