/**
 * Group Management UI
 * Client-side interface for managing user groups and permissions
 */

class GroupManager {
  constructor() {
    this.apiBase = '/api/groups';
    this.currentUser = null;
    this.userPermissions = null;
    this.groupHierarchy = null;
    this.allUsers = [];
  }

  async initialize() {
    try {
      console.log('🔧 Initializing Group Manager...');
      
      // Load current user permissions
      await this.loadCurrentUser();
      
      // Load group hierarchy
      await this.loadGroupHierarchy();
      
      // Setup UI
      this.setupEventListeners();
      this.renderGroupManager();
      
      console.log('✅ Group Manager initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Group Manager:', error);
      this.showError('Failed to initialize group management system');
    }
  }

  async loadCurrentUser() {
    try {
      const response = await fetch(`${this.apiBase}/my-permissions`, {
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load user permissions: ${response.status}`);
      }
      
      const result = await response.json();
      this.currentUser = result.data.user;
      this.userPermissions = result.data;
      
      console.log('✅ Current user permissions loaded:', this.userPermissions);
    } catch (error) {
      console.error('Error loading current user:', error);
      throw error;
    }
  }

  async loadGroupHierarchy() {
    try {
      const response = await fetch(`${this.apiBase}/hierarchy`, {
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load group hierarchy: ${response.status}`);
      }
      
      const result = await response.json();
      this.groupHierarchy = result.data;
      
      console.log('✅ Group hierarchy loaded:', this.groupHierarchy);
    } catch (error) {
      console.error('Error loading group hierarchy:', error);
      throw error;
    }
  }

  async loadUsersByGroup(groupName) {
    try {
      const response = await fetch(`${this.apiBase}/users/${groupName}`, {
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load users for group ${groupName}: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data.users;
    } catch (error) {
      console.error(`Error loading users for group ${groupName}:`, error);
      return [];
    }
  }

  async getUserGroups(uid) {
    try {
      const response = await fetch(`${this.apiBase}/user/${uid}`, {
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load user groups: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error loading user groups:', error);
      return null;
    }
  }

  async addUserToGroup(uid, groupName) {
    try {
      const response = await fetch(`${this.apiBase}/user/${uid}/add`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ group: groupName })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to add user to group');
      }
      
      return result;
    } catch (error) {
      console.error('Error adding user to group:', error);
      throw error;
    }
  }

  async removeUserFromGroup(uid, groupName) {
    try {
      const response = await fetch(`${this.apiBase}/user/${uid}/remove`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ group: groupName })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to remove user from group');
      }
      
      return result;
    } catch (error) {
      console.error('Error removing user from group:', error);
      throw error;
    }
  }

  async setUserGroups(uid, groups) {
    try {
      const response = await fetch(`${this.apiBase}/user/${uid}/set`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ groups })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to set user groups');
      }
      
      return result;
    } catch (error) {
      console.error('Error setting user groups:', error);
      throw error;
    }
  }

  getAuthHeaders() {
    const headers = {};
    
    // Add admin key if available
    const adminKey = new URLSearchParams(window.location.search).get('adminKey');
    if (adminKey) {
      headers['X-Admin-Key'] = adminKey;
    }
    
    // Add Firebase auth token if available
    if (window.firebaseAuth && window.firebaseAuth.currentUser) {
      return window.firebaseAuth.currentUser.getIdToken().then(token => {
        return {
          ...headers,
          'Authorization': `Bearer ${token}`
        };
      });
    }
    
    return headers;
  }

  setupEventListeners() {
    // Group selection
    document.addEventListener('change', (e) => {
      if (e.target.matches('.group-selector')) {
        this.onGroupSelected(e.target.value);
      }
    });

    // User search
    document.addEventListener('input', (e) => {
      if (e.target.matches('.user-search')) {
        this.onUserSearch(e.target.value);
      }
    });

    // Group management buttons
    document.addEventListener('click', (e) => {
      if (e.target.matches('.add-to-group-btn')) {
        this.onAddToGroup(e.target);
      } else if (e.target.matches('.remove-from-group-btn')) {
        this.onRemoveFromGroup(e.target);
      } else if (e.target.matches('.edit-user-groups-btn')) {
        this.onEditUserGroups(e.target);
      } else if (e.target.matches('.save-user-groups-btn')) {
        this.onSaveUserGroups(e.target);
      } else if (e.target.matches('.cancel-edit-btn')) {
        this.onCancelEdit(e.target);
      }
    });
  }

  renderGroupManager() {
    const container = document.getElementById('group-management-container');
    if (!container) return;

    container.innerHTML = `
      <div class="group-manager">
        <div class="group-header">
          <h2>🔐 Group Management</h2>
          <div class="current-user-info">
            <strong>Current User:</strong> ${this.currentUser?.email || 'Unknown'}
            <br>
            <strong>Groups:</strong> ${this.userPermissions?.groups?.join(', ') || 'None'}
          </div>
        </div>

        <div class="group-tabs">
          <button class="tab-btn active" data-tab="hierarchy">Group Hierarchy</button>
          <button class="tab-btn" data-tab="users">User Management</button>
          <button class="tab-btn" data-tab="permissions">Permissions</button>
        </div>

        <div class="tab-content">
          <div class="tab-pane active" id="hierarchy-tab">
            ${this.renderGroupHierarchy()}
          </div>
          
          <div class="tab-pane" id="users-tab">
            ${this.renderUserManagement()}
          </div>
          
          <div class="tab-pane" id="permissions-tab">
            ${this.renderPermissionsTab()}
          </div>
        </div>
      </div>
    `;

    this.setupTabNavigation();
  }

  renderGroupHierarchy() {
    if (!this.groupHierarchy) return '<div class="loading">Loading...</div>';

    const groups = Object.entries(this.groupHierarchy)
      .sort(([,a], [,b]) => b.level - a.level);

    return `
      <div class="hierarchy-container">
        <h3>Group Hierarchy & Permissions</h3>
        <div class="groups-list">
          ${groups.map(([groupName, groupInfo]) => `
            <div class="group-card" data-level="${groupInfo.level}">
              <div class="group-header">
                <h4>${groupName}</h4>
                <span class="group-level">Level ${groupInfo.level}</span>
              </div>
              <div class="group-description">${groupInfo.description}</div>
              <div class="group-permissions">
                <strong>Permissions:</strong>
                ${groupInfo.permissions.map(perm => `<span class="permission-badge">${perm}</span>`).join('')}
              </div>
              ${groupInfo.inherits?.length > 0 ? `
                <div class="group-inherits">
                  <strong>Inherits from:</strong> ${groupInfo.inherits.join(', ')}
                </div>
              ` : ''}
              <div class="group-actions">
                <button class="btn btn-sm view-users-btn" data-group="${groupName}">
                  View Users
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderUserManagement() {
    return `
      <div class="user-management-container">
        <h3>User Management</h3>
        
        <div class="user-search-container">
          <input type="text" class="user-search" placeholder="Search users by email or name...">
          <button class="btn load-all-users-btn">Load All Users</button>
        </div>

        <div class="group-filter">
          <label>Filter by group:</label>
          <select class="group-selector">
            <option value="">All users</option>
            ${Object.keys(this.groupHierarchy || {}).map(group => 
              `<option value="${group}">${group}</option>`
            ).join('')}
          </select>
        </div>

        <div class="users-list" id="users-list">
          <div class="no-users">Select a group or search for users to begin</div>
        </div>
      </div>
    `;
  }

  renderPermissionsTab() {
    if (!this.userPermissions) return '<div class="loading">Loading...</div>';

    return `
      <div class="permissions-container">
        <h3>Your Permissions</h3>
        
        <div class="current-permissions">
          <div class="permission-section">
            <h4>Groups</h4>
            <div class="groups-display">
              ${this.userPermissions.groups.map(group => `
                <span class="group-badge">${group}</span>
              `).join('')}
            </div>
          </div>

          <div class="permission-section">
            <h4>Actions You Can Perform</h4>
            <div class="actions-display">
              ${Object.entries(this.userPermissions.actions || {})
                .filter(([action, canDo]) => canDo)
                .map(([action]) => `
                  <span class="action-badge">${action.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                `).join('')}
            </div>
          </div>

          <div class="permission-section">
            <h4>All Permissions</h4>
            <div class="permissions-display">
              ${this.userPermissions.permissions.map(perm => `
                <span class="permission-badge">${perm}</span>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  setupTabNavigation() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        // Remove active class from all tabs and panes
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        
        // Add active class to clicked tab
        btn.classList.add('active');
        
        // Show corresponding pane
        const tabName = btn.dataset.tab;
        document.getElementById(`${tabName}-tab`).classList.add('active');
      });
    });
  }

  async onGroupSelected(groupName) {
    if (!groupName) {
      document.getElementById('users-list').innerHTML = '<div class="no-users">Select a group to view users</div>';
      return;
    }

    try {
      document.getElementById('users-list').innerHTML = '<div class="loading">Loading users...</div>';
      
      const users = await this.loadUsersByGroup(groupName);
      this.renderUsersList(users, groupName);
    } catch (error) {
      console.error('Error loading users for group:', error);
      this.showError('Failed to load users for group');
    }
  }

  renderUsersList(users, groupName) {
    const container = document.getElementById('users-list');
    
    if (users.length === 0) {
      container.innerHTML = `<div class="no-users">No users found in group "${groupName}"</div>`;
      return;
    }

    container.innerHTML = `
      <div class="users-header">
        <h4>Users in "${groupName}" (${users.length})</h4>
      </div>
      <div class="users-grid">
        ${users.map(user => `
          <div class="user-card" data-uid="${user.uid}">
            <div class="user-info">
              <div class="user-name">${user.displayName || user.email}</div>
              <div class="user-email">${user.email}</div>
              <div class="user-groups">
                ${(user.groups || []).map(group => `<span class="group-badge">${group}</span>`).join('')}
              </div>
            </div>
            <div class="user-actions">
              <button class="btn btn-sm edit-user-groups-btn" data-uid="${user.uid}">
                Edit Groups
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  async onEditUserGroups(button) {
    const uid = button.dataset.uid;
    const userCard = button.closest('.user-card');
    
    try {
      const userData = await this.getUserGroups(uid);
      if (!userData) {
        this.showError('Failed to load user data');
        return;
      }

      // Replace user card with edit form
      userCard.innerHTML = `
        <div class="user-edit-form">
          <div class="user-info">
            <div class="user-name">${userData.user?.displayName || userData.user?.email}</div>
            <div class="user-email">${userData.user?.email}</div>
          </div>
          
          <div class="groups-editor">
            <label>Groups:</label>
            <div class="groups-checkboxes">
              ${Object.keys(this.groupHierarchy).map(groupName => `
                <label class="group-checkbox">
                  <input type="checkbox" value="${groupName}" 
                         ${userData.groups.includes(groupName) ? 'checked' : ''}>
                  <span>${groupName}</span>
                  <small>${this.groupHierarchy[groupName].description}</small>
                </label>
              `).join('')}
            </div>
          </div>
          
          <div class="edit-actions">
            <button class="btn btn-primary save-user-groups-btn" data-uid="${uid}">
              Save Groups
            </button>
            <button class="btn btn-secondary cancel-edit-btn" data-uid="${uid}">
              Cancel
            </button>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Error loading user for edit:', error);
      this.showError('Failed to load user data for editing');
    }
  }

  async onSaveUserGroups(button) {
    const uid = button.dataset.uid;
    const form = button.closest('.user-edit-form');
    
    try {
      // Get selected groups
      const checkboxes = form.querySelectorAll('.groups-checkboxes input[type="checkbox"]:checked');
      const selectedGroups = Array.from(checkboxes).map(cb => cb.value);
      
      if (selectedGroups.length === 0) {
        this.showError('User must have at least one group');
        return;
      }

      // Save groups
      await this.setUserGroups(uid, selectedGroups);
      
      this.showSuccess('User groups updated successfully');
      
      // Refresh the current view
      const groupSelector = document.querySelector('.group-selector');
      if (groupSelector && groupSelector.value) {
        this.onGroupSelected(groupSelector.value);
      }
      
    } catch (error) {
      console.error('Error saving user groups:', error);
      this.showError(error.message || 'Failed to save user groups');
    }
  }

  onCancelEdit(button) {
    const groupSelector = document.querySelector('.group-selector');
    if (groupSelector && groupSelector.value) {
      this.onGroupSelected(groupSelector.value);
    }
  }

  showError(message) {
    // Create or update error display
    let errorDiv = document.querySelector('.group-manager-error');
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.className = 'group-manager-error alert alert-danger';
      document.querySelector('.group-manager').prepend(errorDiv);
    }
    
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      errorDiv.style.display = 'none';
    }, 5000);
  }

  showSuccess(message) {
    // Create or update success display
    let successDiv = document.querySelector('.group-manager-success');
    if (!successDiv) {
      successDiv = document.createElement('div');
      successDiv.className = 'group-manager-success alert alert-success';
      document.querySelector('.group-manager').prepend(successDiv);
    }
    
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      successDiv.style.display = 'none';
    }, 3000);
  }
}

// Export for use in other modules
window.GroupManager = GroupManager;

// Auto-initialize if container exists
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('group-management-container')) {
    window.groupManager = new GroupManager();
    window.groupManager.initialize();
  }
});