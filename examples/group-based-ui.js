/**
 * Frontend Group-Based UI Example
 * Show/hide features based on user groups
 */

class GroupBasedUI {
  constructor() {
    this.userGroups = [];
    this.userPermissions = [];
  }

  async loadUserPermissions() {
    try {
      const response = await fetch('/api/groups/my-permissions');
      const result = await response.json();
      
      if (result.success) {
        this.userGroups = result.data.groups;
        this.userPermissions = result.data.permissions;
        this.userActions = result.data.actions;
        
        this.updateUIBasedOnGroups();
      }
    } catch (error) {
      console.error('Failed to load user permissions:', error);
    }
  }

  hasGroup(groupName) {
    return this.userGroups.includes(groupName);
  }

  hasPermission(permission) {
    return this.userPermissions.includes(permission);
  }

  canPerform(action) {
    return this.userActions && this.userActions[action];
  }

  updateUIBasedOnGroups() {
    // Show/hide admin panel
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel) {
      adminPanel.style.display = this.canPerform('canAccessAdmin') ? 'block' : 'none';
    }

    // Show/hide moderation tools
    const moderationTools = document.querySelectorAll('.moderation-tool');
    moderationTools.forEach(tool => {
      tool.style.display = this.canPerform('canModerateContent') ? 'block' : 'none';
    });

    // Show/hide content editing
    const editButtons = document.querySelectorAll('.edit-content-btn');
    editButtons.forEach(btn => {
      btn.style.display = this.canPerform('canEditLore') ? 'inline-block' : 'none';
    });

    // Add group badges to user profile
    this.addGroupBadges();
  }

  addGroupBadges() {
    const badgeContainer = document.getElementById('user-group-badges');
    if (badgeContainer) {
      badgeContainer.innerHTML = this.userGroups.map(group => 
        `<span class="group-badge group-${group}">${group}</span>`
      ).join('');
    }
  }

  // Wrapper for fetch that includes auth headers
  async authenticatedFetch(url, options = {}) {
    // Add authentication headers if available
    const headers = { ...options.headers };
    
    if (window.firebaseAuth && window.firebaseAuth.currentUser) {
      const token = await window.firebaseAuth.currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    }

    return fetch(url, { ...options, headers });
  }
}

// Example usage in your main application
document.addEventListener('DOMContentLoaded', async () => {
  window.groupUI = new GroupBasedUI();
  await window.groupUI.loadUserPermissions();
  
  // Example: Hide features for guests
  if (window.groupUI.hasGroup('guest')) {
    document.querySelectorAll('.members-only').forEach(el => {
      el.style.display = 'none';
    });
  }
  
  // Example: Show special features for trusted users
  if (window.groupUI.hasGroup('trusted_user')) {
    document.querySelectorAll('.trusted-features').forEach(el => {
      el.style.display = 'block';
    });
  }
});

// CSS for group badges
const groupStyles = `
<style>
.group-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: bold;
  margin: 2px;
}

.group-super_admin { background: #ff4757; color: white; }
.group-admin { background: #ff6b6b; color: white; }
.group-moderator { background: #ffa502; color: white; }
.group-content_manager { background: #3742fa; color: white; }
.group-trusted_user { background: #2ed573; color: white; }
.group-verified_user { background: #70a1ff; color: white; }
.group-user { background: #7bed9f; color: black; }
.group-guest { background: #ddd; color: #666; }
</style>
`;

document.head.insertAdjacentHTML('beforeend', groupStyles);