/**
 * Forum Admin Management System
 * Handles user management, post moderation, and admin controls
 */

class AdminManager {
    constructor() {
        this.users = [];
        this.posts = [];
        this.reports = [];
        this.isAdmin = false;
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
        this.loadUsers();
        this.loadPosts();
        this.loadReports();
    }

    /**
     * Check if current user has admin access
     */
    async checkAdminAccess() {
        if (!window.forumState.isAuthenticated) {
            this.isAdmin = false;
            return;
        }

        try {
            const userRef = window.firebaseUtils.ref(window.firebaseDB, 
                `forum/users/${window.forumState.currentUser.uid}`);
            
            const snapshot = await window.firebaseUtils.get(userRef);
            const userData = snapshot.val();
            
            this.isAdmin = userData && (userData.role === 'admin' || userData.role === 'moderator');
        } catch (error) {
            console.error('Error checking admin access:', error);
            this.isAdmin = false;
        }
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
     * Load all users
     */
    async loadUsers() {
        try {
            const usersRef = window.firebaseUtils.ref(window.firebaseDB, 'forum/users');
            
            window.firebaseUtils.onValue(usersRef, (snapshot) => {
                const usersData = snapshot.val() || {};
                this.users = Object.keys(usersData).map(uid => ({
                    uid,
                    ...usersData[uid]
                }));
                
                this.renderUsers();
            });
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }

    /**
     * Load all posts
     */
    async loadPosts() {
        try {
            const postsRef = window.firebaseUtils.ref(window.firebaseDB, 'forum/posts');
            
            window.firebaseUtils.onValue(postsRef, (snapshot) => {
                const postsData = snapshot.val() || {};
                this.posts = Object.keys(postsData).map(id => ({
                    id,
                    ...postsData[id]
                }));
                
                this.renderPosts();
            });
        } catch (error) {
            console.error('Error loading posts:', error);
        }
    }

    /**
     * Load reports
     */
    async loadReports() {
        try {
            const reportsRef = window.firebaseUtils.ref(window.firebaseDB, 'forum/reports');
            
            window.firebaseUtils.onValue(reportsRef, (snapshot) => {
                const reportsData = snapshot.val() || {};
                this.reports = Object.keys(reportsData).map(id => ({
                    id,
                    ...reportsData[id]
                }));
                
                this.renderReports();
            });
        } catch (error) {
            console.error('Error loading reports:', error);
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
                        <img src="${user.avatar || '/icons/hero-icon.svg'}" alt="${user.name}" class="user-avatar-small">
                        <div>
                            <div class="user-name">${this.escapeHtml(user.name || 'Unknown')}</div>
                            <div class="user-email">${this.escapeHtml(user.email || 'No email')}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="role-badge role-${user.role || 'member'}">
                        ${this.getRoleIcon(user.role)} ${user.role || 'member'}
                    </span>
                </td>
                <td>${user.postCount || 0}</td>
                <td>${new Date(user.joinDate || Date.now()).toLocaleDateString()}</td>
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
                <td>${this.escapeHtml(post.authorName || 'Unknown')}</td>
                <td>
                    <span class="category-badge">${post.category || 'general'}</span>
                </td>
                <td>${post.replyCount || 0}</td>
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
        document.getElementById('pending-reports').textContent = pendingReports.length;
        document.getElementById('resolved-reports').textContent = resolvedReports.length;

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
        const searchTerm = document.getElementById('user-search').value.toLowerCase();
        const roleFilter = document.getElementById('role-filter').value;

        let filtered = this.users;

        if (searchTerm) {
            filtered = filtered.filter(user => 
                (user.name || '').toLowerCase().includes(searchTerm) ||
                (user.email || '').toLowerCase().includes(searchTerm)
            );
        }

        if (roleFilter) {
            filtered = filtered.filter(user => (user.role || 'member') === roleFilter);
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
        const searchTerm = document.getElementById('post-search').value.toLowerCase();
        const categoryFilter = document.getElementById('category-filter').value;

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
     * Edit user
     */
    async editUser(userId) {
        const user = this.users.find(u => u.uid === userId);
        if (!user) return;

        const newRole = prompt(`Change role for ${user.name}:\n\nCurrent: ${user.role || 'member'}\n\nOptions: admin, moderator, member, banned`);
        
        if (newRole && ['admin', 'moderator', 'member', 'banned'].includes(newRole)) {
            try {
                const userRef = window.firebaseUtils.ref(window.firebaseDB, `forum/users/${userId}`);
                await window.firebaseUtils.update(userRef, {
                    role: newRole,
                    updatedAt: window.firebaseUtils.serverTimestamp()
                });

                this.showNotification(`User role updated to ${newRole}`, 'success');
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

        const confirmed = confirm(`Are you sure you want to ${action} user "${user.name}"?`);
        if (confirmed) {
            this.executeUserAction(userId, action);
        }
    }

    /**
     * Execute user action
     */
    async executeUserAction(userId, action) {
        try {
            const userRef = window.firebaseUtils.ref(window.firebaseDB, `forum/users/${userId}`);
            
            switch (action) {
                case 'ban':
                    await window.firebaseUtils.update(userRef, {
                        role: 'banned',
                        bannedAt: window.firebaseUtils.serverTimestamp(),
                        updatedAt: window.firebaseUtils.serverTimestamp()
                    });
                    this.showNotification('User banned successfully', 'success');
                    break;
                    
                case 'unban':
                    await window.firebaseUtils.update(userRef, {
                        role: 'member',
                        bannedAt: null,
                        updatedAt: window.firebaseUtils.serverTimestamp()
                    });
                    this.showNotification('User unbanned successfully', 'success');
                    break;
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
     * Edit post
     */
    async editPost(postId) {
        const post = this.posts.find(p => p.id === postId);
        if (!post) return;

        const newTitle = prompt('Edit post title:', post.title);
        if (newTitle && newTitle !== post.title) {
            try {
                const postRef = window.firebaseUtils.ref(window.firebaseDB, `forum/posts/${postId}`);
                await window.firebaseUtils.update(postRef, {
                    title: newTitle,
                    updatedAt: window.firebaseUtils.serverTimestamp()
                });

                this.showNotification('Post updated successfully', 'success');
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
     * Execute post action
     */
    async executePostAction(postId, action) {
        try {
            const postRef = window.firebaseUtils.ref(window.firebaseDB, `forum/posts/${postId}`);
            
            switch (action) {
                case 'delete':
                    await window.firebaseUtils.remove(postRef);
                    this.showNotification('Post deleted successfully', 'success');
                    break;
                    
                case 'lock':
                    await window.firebaseUtils.update(postRef, {
                        locked: true,
                        updatedAt: window.firebaseUtils.serverTimestamp()
                    });
                    this.showNotification('Post locked successfully', 'success');
                    break;
            }
        } catch (error) {
            console.error(`Error executing ${action} on post:`, error);
            this.showNotification(`Failed to ${action} post`, 'error');
        }
    }

    /**
     * Resolve report
     */
    async resolveReport(reportId) {
        try {
            const reportRef = window.firebaseUtils.ref(window.firebaseDB, `forum/reports/${reportId}`);
            await window.firebaseUtils.update(reportRef, {
                status: 'resolved',
                resolvedAt: window.firebaseUtils.serverTimestamp(),
                resolvedBy: window.forumState.currentUser.uid
            });

            this.showNotification('Report resolved successfully', 'success');
        } catch (error) {
            console.error('Error resolving report:', error);
            this.showNotification('Failed to resolve report', 'error');
        }
    }

    /**
     * Dismiss report
     */
    async dismissReport(reportId) {
        try {
            const reportRef = window.firebaseUtils.ref(window.firebaseDB, `forum/reports/${reportId}`);
            await window.firebaseUtils.remove(reportRef);

            this.showNotification('Report dismissed successfully', 'success');
        } catch (error) {
            console.error('Error dismissing report:', error);
            this.showNotification('Failed to dismiss report', 'error');
        }
    }

    /**
     * Save settings
     */
    async saveSettings() {
        try {
            const settings = {
                autoModeration: document.getElementById('auto-moderation').checked,
                requireApproval: document.getElementById('require-approval').checked,
                maxPostLength: parseInt(document.getElementById('max-post-length').value),
                postsPerPage: parseInt(document.getElementById('posts-per-page').value),
                allowRegistration: document.getElementById('allow-registration').checked,
                emailVerification: document.getElementById('email-verification').checked,
                updatedAt: window.firebaseUtils.serverTimestamp()
            };

            const settingsRef = window.firebaseUtils.ref(window.firebaseDB, 'forum/settings');
            await window.firebaseUtils.update(settingsRef, settings);

            this.showNotification('Settings saved successfully', 'success');
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showNotification('Failed to save settings', 'error');
        }
    }

    /**
     * Get role icon
     */
    getRoleIcon(role) {
        const icons = {
            admin: '👑',
            moderator: '🛡️',
            member: '👤',
            banned: '🚫'
        };
        return icons[role] || icons.member;
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
        if (window.forumJS && window.forumJS.showNotification) {
            window.forumJS.showNotification(message, type);
        } else {
            alert(message);
        }
    }
}

// Initialize admin manager
window.adminManager = new AdminManager();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.adminManager.initialize();
});