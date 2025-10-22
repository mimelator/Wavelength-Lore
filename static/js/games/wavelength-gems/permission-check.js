/**
 * Wavelength Gems - Permission Checks
 * Handles user permission validation for restricted features
 */

const PermissionManager = {
    /**
     * User groups that can access developer features
     * - developer: Direct developer group
     * - admin: Admins have all developer permissions
     * - super_admin: Super admins have all permissions
     */
    developerGroups: ['developer', 'admin', 'super_admin'],
    
    /**
     * Local development flag, populated by the server
     */
    isLocalDev: false,
    
    /**
     * Initialize permission manager with user data
     * @param {Object} userData - User data including groups
     * @param {boolean} isLocalDev - Whether in local development environment
     */
    init: function(userData, isLocalDev) {
        // Store user groups for permission checks
        this.userData = userData || { groups: [] };
        this.isLocalDev = isLocalDev || false;
        
        console.log('Permission manager initialized');
    },
    
    /**
     * Check if user has developer permissions
     * @returns {boolean} - Whether user has developer permissions
     */
    isDeveloper: function() {
        // Always allow in local development
        if (this.isLocalDev) {
            console.log('Local development mode: Developer permissions granted');
            return true;
        }
        
        // Check user groups
        if (this.userData && this.userData.groups) {
            for (const group of this.developerGroups) {
                if (this.userData.groups.includes(group)) {
                    console.log(`Developer permissions granted via '${group}' group`);
                    return true;
                }
            }
        }
        
        return false;
    }
};

// Make globally available
window.PermissionManager = PermissionManager;

// Fetch user groups from API and initialize
fetch('/api/user/current-user-groups')
    .then(response => response.json())
    .then(data => {
        if (data && data.success) {
            const isLocalDev = window.location.hostname === 'localhost' || 
                               window.location.hostname === '127.0.0.1';
                               
            PermissionManager.init({
                groups: data.groups || []
            }, isLocalDev);
        } else {
            // Initialize with empty data
            PermissionManager.init();
        }
    })
    .catch(error => {
        console.error('Failed to fetch user groups:', error);
        PermissionManager.init();
    });