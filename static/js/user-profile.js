/**
 * User Profile Management System
 * Handles profile editing, settings, and user management features
 */

class UserProfileManager {
    constructor() {
        this.currentUserData = null;
        this.isEditing = false;
    }

    /**
     * Initialize profile manager
     */
    initialize() {
        this.setupEventListeners();
        this.loadCurrentUserData();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for auth state changes
        if (window.firebaseAuth && window.firebaseUtils) {
            window.firebaseUtils.onAuthStateChanged(window.firebaseAuth, (user) => {
                if (user) {
                    this.loadCurrentUserData();
                }
            });
        }
    }

    /**
     * Load current user data
     */
    async loadCurrentUserData() {
        if (!window.forumState.isAuthenticated) return;

        try {
            const userRef = window.firebaseUtils.ref(window.firebaseDB, 
                `forum/users/${window.forumState.currentUser.uid}`);
            
            window.firebaseUtils.onValue(userRef, (snapshot) => {
                this.currentUserData = snapshot.val();
            });
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    /**
     * Show profile edit modal
     */
    showEditProfileModal() {
        if (!window.forumState.isAuthenticated) {
            alert('Please sign in to edit your profile');
            return;
        }

        const modal = this.createModal('edit-profile', 'Edit Profile', this.generateEditProfileForm());
        document.body.appendChild(modal);
        modal.classList.add('show');
    }

    /**
     * Generate edit profile form
     */
    generateEditProfileForm() {
        const userData = this.currentUserData || {};
        
        return `
            <form id="edit-profile-form" class="profile-edit-form">
                <div class="form-group">
                    <label for="display-name">Display Name *</label>
                    <input type="text" id="display-name" name="displayName" 
                           value="${escapeHtml(userData.name || '')}" 
                           required maxlength="50">
                    <small class="form-help">How your name appears in the forum</small>
                </div>
                
                <div class="form-group">
                    <label for="bio">Bio</label>
                    <textarea id="bio" name="bio" rows="4" maxlength="500" 
                              placeholder="Tell the community about yourself...">${escapeHtml(userData.bio || '')}</textarea>
                    <small class="form-help">Optional: Share something about yourself (max 500 characters)</small>
                </div>
                
                <div class="form-group">
                    <label for="favorite-category">Favorite Category</label>
                    <select id="favorite-category" name="favoriteCategory">
                        <option value="">Select a category</option>
                        <option value="general" ${userData.favoriteCategory === 'general' ? 'selected' : ''}>🎵 General Discussion</option>
                        <option value="lore" ${userData.favoriteCategory === 'lore' ? 'selected' : ''}>📜 Lore & Theories</option>
                        <option value="episodes" ${userData.favoriteCategory === 'episodes' ? 'selected' : ''}>🎬 Episode Discussions</option>
                        <option value="fanart" ${userData.favoriteCategory === 'fanart' ? 'selected' : ''}>🎨 Fan Creations</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="notification-settings">Notification Preferences</label>
                    <div class="checkbox-group">
                        <label class="checkbox-label">
                            <input type="checkbox" name="emailNotifications" 
                                   ${userData.emailNotifications !== false ? 'checked' : ''}>
                            <span>Email notifications for replies to my posts</span>
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" name="browserNotifications" 
                                   ${userData.browserNotifications !== false ? 'checked' : ''}>
                            <span>Browser notifications for forum activity</span>
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" name="weeklyDigest" 
                                   ${userData.weeklyDigest !== false ? 'checked' : ''}>
                            <span>Weekly forum activity digest</span>
                        </label>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="userProfileManager.closeModal()">
                        Cancel
                    </button>
                    <button type="submit" class="btn btn-primary">
                        💾 Save Changes
                    </button>
                </div>
            </form>
        `;
    }

    /**
     * Show user settings modal
     */
    showUserSettingsModal() {
        if (!window.forumState.isAuthenticated) {
            alert('Please sign in to access settings');
            return;
        }

        const modal = this.createModal('user-settings', 'User Settings', this.generateUserSettingsForm());
        document.body.appendChild(modal);
        modal.classList.add('show');
    }

    /**
     * Generate user settings form
     */
    generateUserSettingsForm() {
        const userData = this.currentUserData || {};
        
        return `
            <div class="settings-sections">
                <div class="settings-section">
                    <h4>🔐 Privacy Settings</h4>
                    <div class="checkbox-group">
                        <label class="checkbox-label">
                            <input type="checkbox" name="profilePublic" 
                                   ${userData.profilePublic !== false ? 'checked' : ''}>
                            <span>Make my profile visible to other users</span>
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" name="showOnlineStatus" 
                                   ${userData.showOnlineStatus !== false ? 'checked' : ''}>
                            <span>Show my online status</span>
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" name="showActivityFeed" 
                                   ${userData.showActivityFeed !== false ? 'checked' : ''}>
                            <span>Show my recent activity on profile</span>
                        </label>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h4>🎨 Appearance</h4>
                    <div class="form-group">
                        <label for="theme-preference">Theme Preference</label>
                        <select id="theme-preference" name="themePreference">
                            <option value="auto" ${userData.themePreference === 'auto' ? 'selected' : ''}>Auto (System)</option>
                            <option value="dark" ${userData.themePreference === 'dark' ? 'selected' : ''}>Dark Theme</option>
                            <option value="light" ${userData.themePreference === 'light' ? 'selected' : ''}>Light Theme</option>
                        </select>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h4>🔔 Notifications</h4>
                    <div class="checkbox-group">
                        <label class="checkbox-label">
                            <input type="checkbox" name="desktopNotifications" 
                                   ${userData.desktopNotifications !== false ? 'checked' : ''}>
                            <span>Desktop notifications</span>
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" name="soundNotifications" 
                                   ${userData.soundNotifications !== false ? 'checked' : ''}>
                            <span>Sound notifications</span>
                        </label>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h4>⚙️ Account</h4>
                    <div class="account-info">
                        <p><strong>Email:</strong> ${userData.email || 'Not provided'}</p>
                        <p><strong>Member since:</strong> ${new Date(userData.joinDate || Date.now()).toLocaleDateString()}</p>
                        <p><strong>User ID:</strong> ${userData.uid || 'Unknown'}</p>
                    </div>
                    <div class="account-actions">
                        <button type="button" class="btn btn-secondary" onclick="userProfileManager.exportUserData()">
                            📥 Export My Data
                        </button>
                        <button type="button" class="btn btn-danger" onclick="userProfileManager.deleteAccountConfirm()">
                            🗑️ Delete Account
                        </button>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="userProfileManager.closeModal()">
                        Cancel
                    </button>
                    <button type="button" class="btn btn-primary" onclick="userProfileManager.saveSettings()">
                        💾 Save Settings
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Create modal
     */
    createModal(id, title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = `modal-${id}`;
        modal.innerHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="userProfileManager.closeModal()">&times;</button>
                </div>
                <div class="modal-content">
                    ${content}
                </div>
            </div>
        `;

        // Setup form submission if it's an edit form
        if (id === 'edit-profile') {
            modal.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProfile();
            });
        }

        return modal;
    }

    /**
     * Save profile changes
     */
    async saveProfile() {
        if (!window.forumState.isAuthenticated) return;

        try {
            const form = document.getElementById('edit-profile-form');
            const formData = new FormData(form);
            
            const updates = {
                name: formData.get('displayName'),
                bio: formData.get('bio'),
                favoriteCategory: formData.get('favoriteCategory'),
                emailNotifications: formData.has('emailNotifications'),
                browserNotifications: formData.has('browserNotifications'),
                weeklyDigest: formData.has('weeklyDigest'),
                updatedAt: window.firebaseUtils.serverTimestamp()
            };

            const userRef = window.firebaseUtils.ref(window.firebaseDB, 
                `forum/users/${window.forumState.currentUser.uid}`);
            
            await window.firebaseUtils.update(userRef, updates);
            
            // Update current user state
            window.forumState.currentUser.name = updates.name;
            
            // Show success message
            this.showNotification('Profile updated successfully!', 'success');
            this.closeModal();
            
            // Refresh page if on profile page
            if (window.location.pathname.includes('/forum/user/')) {
                window.location.reload();
            }
            
        } catch (error) {
            console.error('Error saving profile:', error);
            this.showNotification('Failed to save profile. Please try again.', 'error');
        }
    }

    /**
     * Save settings
     */
    async saveSettings() {
        if (!window.forumState.isAuthenticated) return;

        try {
            const settings = {
                profilePublic: document.querySelector('[name="profilePublic"]').checked,
                showOnlineStatus: document.querySelector('[name="showOnlineStatus"]').checked,
                showActivityFeed: document.querySelector('[name="showActivityFeed"]').checked,
                themePreference: document.querySelector('[name="themePreference"]').value,
                desktopNotifications: document.querySelector('[name="desktopNotifications"]').checked,
                soundNotifications: document.querySelector('[name="soundNotifications"]').checked,
                updatedAt: window.firebaseUtils.serverTimestamp()
            };

            const userRef = window.firebaseUtils.ref(window.firebaseDB, 
                `forum/users/${window.forumState.currentUser.uid}`);
            
            await window.firebaseUtils.update(userRef, settings);
            
            this.showNotification('Settings saved successfully!', 'success');
            this.closeModal();
            
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showNotification('Failed to save settings. Please try again.', 'error');
        }
    }

    /**
     * Export user data
     */
    async exportUserData() {
        if (!window.forumState.isAuthenticated) return;

        try {
            // Collect all user data
            const userData = this.currentUserData;
            const exportData = {
                profile: userData,
                exportDate: new Date().toISOString(),
                exportedBy: window.forumState.currentUser.uid
            };

            // Create and download JSON file
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `wavelength-forum-data-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showNotification('Data exported successfully!', 'success');
            
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showNotification('Failed to export data. Please try again.', 'error');
        }
    }

    /**
     * Delete account confirmation
     */
    deleteAccountConfirm() {
        const confirmed = confirm(
            'Are you sure you want to delete your account? This action cannot be undone. All your posts and replies will be removed.'
        );

        if (confirmed) {
            const doubleConfirm = prompt(
                'To confirm account deletion, please type "DELETE" (in capital letters):'
            );

            if (doubleConfirm === 'DELETE') {
                this.deleteAccount();
            } else {
                alert('Account deletion cancelled.');
            }
        }
    }

    /**
     * Delete account
     */
    async deleteAccount() {
        if (!window.forumState.isAuthenticated) return;

        try {
            // Note: In a real app, this would be handled by backend functions
            // For now, just mark account as deleted
            const userRef = window.firebaseUtils.ref(window.firebaseDB, 
                `forum/users/${window.forumState.currentUser.uid}`);
            
            await window.firebaseUtils.update(userRef, {
                deleted: true,
                deletedAt: window.firebaseUtils.serverTimestamp(),
                name: '[Deleted User]',
                bio: null,
                avatar: '/icons/hero-icon.svg'
            });

            alert('Account deletion request submitted. You will be signed out.');
            
            // Sign out user
            await window.firebaseUtils.signOut(window.firebaseAuth);
            window.location.href = '/forum';
            
        } catch (error) {
            console.error('Error deleting account:', error);
            this.showNotification('Failed to delete account. Please try again.', 'error');
        }
    }

    /**
     * Close modal
     */
    closeModal() {
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        });
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        if (window.forumJS && window.forumJS.showNotification) {
            window.forumJS.showNotification(message, type);
        }
    }
}

// Utility function for HTML escaping
function escapeHtml(text) {
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

// Initialize user profile manager
window.userProfileManager = new UserProfileManager();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.userProfileManager.initialize();
});

// Global functions for profile management
window.editProfile = () => window.userProfileManager.showEditProfileModal();
window.viewSettings = () => window.userProfileManager.showUserSettingsModal();
window.editBio = () => window.userProfileManager.showEditProfileModal();