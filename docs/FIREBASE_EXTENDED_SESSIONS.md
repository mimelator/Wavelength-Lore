# Firebase Extended Session Configuration

## Overview
This document describes the implementation of 2-week session persistence for the Wavelength Community Forum using Firebase Authentication with custom session management.

## Implementation Details

### Session Duration
- **Default Duration**: 14 days (2 weeks)
- **Session Tracking**: Client-side localStorage with automatic renewal
- **Persistence Type**: `browserLocalPersistence` (survives browser restarts)

### Key Components

#### 1. Firebase Configuration (`/static/js/firebase-config.js`)
Centralized Firebase initialization with extended session management:
- Sets `browserLocalPersistence` for long-term auth state
- Implements custom session tracking with 2-week expiration
- Provides session utilities for monitoring and management

#### 2. Session Manager Features
- **Session Validation**: Checks if current session is within 2-week window
- **Activity Tracking**: Updates last activity timestamp on user interactions
- **Automatic Cleanup**: Removes expired sessions and signs out users
- **Status Display**: Utilities to show remaining session time

### Session Management Functions

#### Core Functions
```javascript
window.sessionManager = {
    SESSION_DURATION: 14 * 24 * 60 * 60 * 1000, // 2 weeks in milliseconds
    
    isSessionValid()       // Check if session is still valid
    updateActivity()       // Update last activity timestamp
    clearExpiredSession()  // Remove expired sessions
    getRemainingTime()     // Get remaining session time
    formatRemainingTime()  // Format time for display
}
```

#### Activity Tracking
- **User Interactions**: Tracked on click, keydown, scroll, mousemove
- **Throttling**: Updates limited to every 30 seconds to prevent spam
- **Background Updates**: Automatic refresh every 2 minutes
- **Database Sync**: Updates Firebase user activity tracking

### Updated Files

#### EJS Templates
All forum templates updated to use shared Firebase configuration:
- `views/forum/layout.ejs`
- `views/forum/home-page.ejs`
- `views/forum/post-page.ejs`
- `views/forum/category-page.ejs`
- `views/forum/recent.ejs`
- `views/forum/create-post-page.ejs`
- `views/forum/user-profile.ejs`

#### JavaScript Files
- `static/js/firebase-config.js` - New shared configuration file
- `static/js/forum.js` - Updated with session integration

### Usage Examples

#### Check Session Status
```javascript
// Check if session is valid
if (window.sessionManager.isSessionValid()) {
    console.log('Session active');
}

// Get remaining time
const remaining = window.sessionManager.formatRemainingTime();
console.log(`Session expires in: ${remaining}`);
```

#### Session Activity Updates
```javascript
// Manual activity update
window.sessionManager.updateActivity();

// Check session status (utility function)
window.showSessionStatus(); // Shows remaining time in console
```

### Security Features

#### Session Validation
- Sessions automatically expire after 14 days of inactivity
- Periodic validation every 5 minutes
- Immediate validation on auth state changes

#### Data Protection
- Session data stored only in localStorage (client-side)
- No sensitive data stored in session tracking
- Automatic cleanup on expiration

### Benefits

#### User Experience
- **Extended Sessions**: Users stay logged in for 2 weeks
- **Seamless Experience**: No frequent re-authentication required
- **Activity-Based**: Sessions extend with user interaction

#### Technical Advantages
- **Firebase Integration**: Leverages Firebase's built-in persistence
- **Lightweight**: Minimal additional code overhead
- **Maintainable**: Centralized configuration system

### Configuration

#### Environment Variables
Standard Firebase configuration through environment variables:
```
API_KEY=your_firebase_api_key
AUTH_DOMAIN=your_project.firebaseapp.com
DATABASE_URL=https://your_project.firebaseio.com
PROJECT_ID=your_project_id
STORAGE_BUCKET=your_project.appspot.com
MESSAGING_SENDER_ID=your_sender_id
APP_ID=your_app_id
```

#### Customization
To modify session duration, update `SESSION_DURATION` in `firebase-config.js`:
```javascript
SESSION_DURATION: 7 * 24 * 60 * 60 * 1000,  // 1 week
SESSION_DURATION: 30 * 24 * 60 * 60 * 1000, // 1 month
```

### Monitoring

#### Console Logging
- Firebase initialization success/failure
- Session expiration events
- Activity tracking updates

#### Session Status
Use `window.showSessionStatus()` in browser console to check current session status.

### Compatibility

#### Browser Support
- **Modern Browsers**: Full support with localStorage
- **Legacy Browsers**: Graceful fallback to Firebase defaults
- **Private/Incognito**: Limited to browser session duration

#### Firebase Version
- **Firebase SDK**: v10.7.0
- **Auth Persistence**: `browserLocalPersistence`
- **Database**: Real-time database integration

### Troubleshooting

#### Common Issues
1. **Session Not Persisting**: Check localStorage permissions
2. **Immediate Logout**: Verify `browserLocalPersistence` is supported
3. **Activity Not Tracking**: Ensure `firebase-config.js` is loaded

#### Debug Commands
```javascript
// Check session manager availability
console.log(window.sessionManager);

// View current session data
console.log(localStorage.getItem('wavelength_last_activity'));

// Force session check
window.sessionManager.clearExpiredSession();
```

### Future Enhancements

#### Potential Improvements
- Server-side session validation
- Cross-device session synchronization
- Session analytics and reporting
- Configurable session warnings before expiration

## Implementation Date
Implemented: December 2024
Documentation Version: 1.0