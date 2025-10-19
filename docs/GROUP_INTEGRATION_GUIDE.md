# Group-Based Access Control Integration Guide

## Overview
This guide explains how to integrate the new group-based access control system into your existing Wavelength application routes and functionality.

## System Components

### 1. Core Components Created
- `middleware/groupAuth.js` - Main group authentication system
- `routes/groupApi.js` - Group management API endpoints
- `static/js/group-management.js` - Client-side group management interface
- `static/css/group-management.css` - Styling for group management UI
- `views/admin/group-management.ejs` - Admin panel for group management

### 2. Routes Added
- `GET /admin/groups` - Group management admin panel (requires admin auth)
- `GET /api/groups/hierarchy` - View group hierarchy and permissions
- `GET /api/groups/users/:group` - List users in a specific group
- `GET /api/groups/my-permissions` - Get current user's permissions
- `POST /api/groups/user/:uid/add` - Add user to group
- `POST /api/groups/user/:uid/remove` - Remove user from group
- `POST /api/groups/user/:uid/set` - Set user's groups

## Group Hierarchy

The system defines 8 hierarchical groups with inheritance:

| Group | Level | Description | Inherits From |
|-------|-------|-------------|---------------|
| super_admin | 100 | System administrators with full access | all groups |
| admin | 90 | Site administrators | moderator, content_creator, vip, member, guest |
| moderator | 80 | Content moderators | content_creator, vip, member, guest |
| developer | 70 | System developers | content_creator, vip, member, guest |
| content_creator | 50 | Content creators and editors | vip, member, guest |
| vip | 30 | VIP members with enhanced access | member, guest |
| member | 10 | Regular registered users | guest |
| guest | 0 | Basic access level | none |

## Integration Instructions

### 1. Protecting Existing Routes with Groups

Replace existing admin middleware with group-based middleware:

#### Before (using adminAuth):
```javascript
app.get('/some-protected-route', adminAuth, (req, res) => {
  // Route handler
});
```

#### After (using group-based auth):
```javascript
const { requireGroup, requirePermission, requireAction } = require('./middleware/groupAuth');

// Require specific group
app.get('/admin-only-route', requireGroup('admin'), (req, res) => {
  // Route handler
});

// Require specific permission
app.get('/content-management', requirePermission('manageContent'), (req, res) => {
  // Route handler
});

// Require specific action capability
app.get('/user-management', requireAction('manageUsers'), (req, res) => {
  // Route handler
});
```

### 2. Multiple Requirements

You can chain multiple requirements:

```javascript
// Require admin group AND specific permission
app.post('/critical-action', 
  requireGroup('admin'), 
  requirePermission('systemAccess'), 
  (req, res) => {
    // Route handler
  }
);

// Require minimum level (moderator or higher)
app.get('/moderation-panel', requireGroup('moderator'), (req, res) => {
  // This will allow: moderator, admin, super_admin
});
```

### 3. Updating Existing Admin Routes

Here are examples of how to update existing admin routes:

#### Admin API Routes (`routes/adminApi.js`):
```javascript
// Add at the top
const { requireGroup, requirePermission } = require('../middleware/groupAuth');

// Replace adminAuth with group-based auth
router.get('/users', requireGroup('admin'), async (req, res) => {
  // Existing user management code
});

router.post('/users/:uid/role', 
  requireGroup('admin'), 
  requireAction('manageUsers'), 
  async (req, res) => {
    // Existing role management code
  }
);
```

#### Forum Routes:
```javascript
// For moderator actions
app.post('/forum/moderate', requireGroup('moderator'), (req, res) => {
  // Moderation logic
});

// For content creation
app.post('/forum/create', requireGroup('member'), (req, res) => {
  // Content creation logic
});
```

### 4. Template Integration

Update EJS templates to show group-based permissions:

#### In templates:
```html
<% if (locals.userGroups && locals.userGroups.includes('admin')) { %>
  <a href="/admin/groups">Group Management</a>
<% } %>

<% if (locals.userPermissions && locals.userPermissions.includes('manageContent')) { %>
  <button class="edit-content-btn">Edit Content</button>
<% } %>
```

#### Making user groups available in templates:
```javascript
// In your middleware or routes
app.use(async (req, res, next) => {
  if (req.user && req.user.uid) {
    const GroupAuth = require('./middleware/groupAuth').GroupAuthentication;
    const groupAuth = new GroupAuth();
    
    try {
      const userData = await groupAuth.getUserGroups(req.user.uid);
      res.locals.userGroups = userData.groups;
      res.locals.userPermissions = userData.permissions;
      res.locals.userActions = userData.actions;
    } catch (error) {
      console.error('Error loading user groups:', error);
    }
  }
  next();
});
```

### 5. Client-Side Integration

Add group management to your admin panel:

#### In your admin HTML:
```html
<!-- Add group management CSS -->
<link rel="stylesheet" href="/static/css/group-management.css">

<!-- Add container for group management -->
<div id="group-management-container"></div>

<!-- Add group management JavaScript -->
<script src="/static/js/group-management.js"></script>
```

### 6. Backward Compatibility

The system is designed to work alongside existing role-based systems:

```javascript
// You can migrate gradually
app.get('/legacy-route', adminAuth, (req, res) => {
  // Old admin auth still works
});

app.get('/new-route', requireGroup('admin'), (req, res) => {
  // New group-based auth
});
```

### 7. Migration Strategy

1. **Phase 1**: Install new system alongside existing auth
2. **Phase 2**: Update critical admin routes to use group auth
3. **Phase 3**: Migrate user management to group system
4. **Phase 4**: Update all routes to use group-based permissions
5. **Phase 5**: Remove old admin auth system

### 8. Testing Your Integration

1. Access the group management panel: `http://localhost:3001/admin/groups?adminKey=YOUR_ADMIN_KEY`
2. Test API endpoints: `curl -H "X-Admin-Key: YOUR_KEY" http://localhost:3001/api/groups/hierarchy`
3. Verify route protection by accessing protected routes without proper groups

## Example Integration

Here's a complete example of updating an existing admin route:

### Before:
```javascript
// routes/adminApi.js
const { adminAuth } = require('../middleware/adminAuth');

router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### After:
```javascript
// routes/adminApi.js
const { requireGroup, requireAction } = require('../middleware/groupAuth');

router.get('/users', 
  requireGroup('admin'), 
  requireAction('viewUsers'), 
  async (req, res) => {
    try {
      const users = await getAllUsers();
      res.json({ success: true, users });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);
```

## Security Notes

1. **Privilege Escalation Protection**: Users can only manage groups at or below their privilege level
2. **Action-Based Controls**: Fine-grained permissions for specific actions
3. **Inheritance**: Higher-level groups automatically inherit lower-level permissions
4. **Caching**: User group data is cached for performance but can be refreshed
5. **Logging**: All group changes are logged for audit purposes

## Troubleshooting

### Common Issues:

1. **"Group not found" errors**: Ensure group names match exactly (case-sensitive)
2. **Permission denied**: Check user's group level vs. required level
3. **Cache issues**: Clear user group cache if permissions seem stale
4. **Firebase errors**: Verify Firebase Admin SDK is properly configured

### Debug Mode:

Set `DEBUG_GROUP_AUTH=true` in environment to enable verbose logging.

## Performance Considerations

1. **Caching**: User groups are cached for 5 minutes by default
2. **Database Queries**: Group checks are optimized to minimize Firebase reads
3. **Middleware Order**: Place group auth middleware after session/auth middleware
4. **Background Updates**: Group changes take effect immediately but cache may need refresh

This integration guide should help you successfully implement the group-based access control system in your Wavelength application while maintaining backward compatibility and security.