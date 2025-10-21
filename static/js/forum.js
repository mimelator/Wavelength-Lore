/**
 * Wavelength Community Forum JavaScript
 * Handles authentication, real-time updates, and forum interactions
 */

// Global forum state
window.forumState = {
    currentUser: null,
    isAuthenticated: false,
    currentCategory: null,
    currentPost: null
};

// Initialize forum when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeForumAuth();
    setupGlobalEventListeners();
    setupRealtimeNotifications();
});

/**
 * Setup real-time notifications for forum activity
 */
function setupRealtimeNotifications() {
    if (!window.firebaseDB || !window.firebaseUtils) return;
    
    // Listen for new posts
    const postsRef = window.firebaseUtils.ref(window.firebaseDB, 'forum/posts');
    window.firebaseUtils.onValue(postsRef, (snapshot) => {
        const posts = snapshot.val();
        if (posts && window.forumState.isAuthenticated) {
            // Check for posts newer than user's last activity
            const userLastSeen = window.forumState.currentUser?.signInTime || Date.now();
            const newPosts = Object.values(posts).filter(post => 
                post.createdAt > userLastSeen && 
                post.authorId !== window.forumState.currentUser?.uid
            );
            
            // Show notification for new posts (limit to avoid spam)
            if (newPosts.length > 0 && newPosts.length <= 3) {
                newPosts.forEach(post => {
                    showNotification(`📝 New post: "${post.title}" by ${post.authorName}`, 'info');
                });
            } else if (newPosts.length > 3) {
                showNotification(`📝 ${newPosts.length} new posts in the forum!`, 'info');
            }
        }
    });
}

/**
 * Setup real-time activity tracking
 */
function setupActivityTracking() {
    // Update user activity every 2 minutes
    setInterval(() => {
        if (window.forumState.isAuthenticated && window.forumState.currentUser) {
            const userRef = window.firebaseUtils.ref(window.firebaseDB, 
                `forum/users/${window.forumState.currentUser.uid}/lastSeen`);
            window.firebaseUtils.set(userRef, Date.now());
            
            // Update session activity for 2-week persistence
            if (window.sessionManager) {
                window.sessionManager.updateActivity();
            }
        }
    }, 2 * 60 * 1000);
    
    // Update activity on user interaction
    ['click', 'keydown', 'scroll', 'mousemove'].forEach(event => {
        let lastActivity = 0;
        document.addEventListener(event, () => {
            const now = Date.now();
            if (now - lastActivity > 30000) { // Throttle to every 30 seconds
                lastActivity = now;
                if (window.forumState.isAuthenticated && window.forumState.currentUser) {
                    const userRef = window.firebaseUtils.ref(window.firebaseDB, 
                        `forum/users/${window.forumState.currentUser.uid}/lastSeen`);
                    window.firebaseUtils.set(userRef, now);
                    
                    // Update session activity for 2-week persistence
                    if (window.sessionManager) {
                        window.sessionManager.updateActivity();
                    }
                }
            }
        });
    });
}

/**
 * Initialize Firebase Authentication for Forum
 */
function initializeForumAuth() {
    if (!window.firebaseAuth || !window.firebaseUtils) {
        console.error('Firebase not initialized');
        return;
    }

    // Enhanced error handling for CORS issues
    const handleAuthError = (error) => {
        console.error('Firebase Auth Error:', error);
        
        if (error.code === 'auth/operation-not-allowed') {
            showNotification('Authentication not enabled. Please contact admin.', 'error');
        } else if (error.code === 'auth/unauthorized-domain') {
            showNotification('This domain is not authorized for authentication.', 'error');
        } else if (error.message && error.message.includes('CORS')) {
            showNotification('Authentication temporarily unavailable. Please try again.', 'error');
        } else {
            showNotification('Sign-in failed. Please try again.', 'error');
        }
    };

    // Handle redirect result from Google OAuth (for when popup is blocked)
    window.firebaseUtils.getRedirectResult(window.firebaseAuth)
        .then((result) => {
            console.log('Checking redirect result...');
            if (result && result.user) {
                console.log('Sign-in via redirect successful:', result.user);
                // Initialize session tracking after successful sign-in
                if (window.sessionManager) {
                    window.sessionManager.updateActivity();
                }
                showNotification('Welcome to Wavelength Forum!', 'success');
            } else {
                console.log('No redirect result found (user likely did not come from redirect)');
            }
        })
        .catch((error) => {
            console.error('Redirect result error:', error);
            if (error.code !== 'auth/no-redirect-result') {
                handleAuthError(error);
            }
        });

    // Check for expired sessions before setting up auth listener
    if (window.sessionManager && window.sessionManager.clearExpiredSession()) {
        console.log('Expired session cleared');
    }

    // Listen for auth state changes
    window.firebaseUtils.onAuthStateChanged(window.firebaseAuth, (user) => {
        console.log('🔄 Auth state changed:', user ? `User: ${user.email}` : 'No user');
        
        if (user) {
            // When user signs in, update session BEFORE checking validity
            if (window.sessionManager) {
                console.log('📝 Updating session activity for new sign-in...');
                window.sessionManager.updateActivity();
            }
            
            // Now handle the user sign-in
            handleUserSignIn(user);
        } else {
            // Only clear session if this wasn't caused by our own session cleanup
            if (window.forumState.isAuthenticated) {
                console.log('🔄 User signed out externally');
                if (window.sessionManager) {
                    localStorage.removeItem('wavelength_last_activity');
                }
            }
            handleUserSignOut();
        }
        updateAuthUI();
    });
}

/**
 * Handle user sign in
 */
function handleUserSignIn(user) {
    // Process avatar URL to ensure it's accessible
    let avatarUrl = user.photoURL;
    
    console.log('🔍 Processing user sign-in:', {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        rawPhotoURL: user.photoURL
    });
    
    // Clean up and validate avatar URL
    if (avatarUrl) {
        // Ensure the avatar URL is properly formatted
        try {
            new URL(avatarUrl); // Test if it's a valid URL
            console.log('✅ Valid avatar URL:', avatarUrl);
        } catch (error) {
            console.log('❌ Invalid avatar URL, using fallback:', avatarUrl);
            avatarUrl = '/icons/hero-icon.svg';
        }
    } else {
        console.log('⚠️ No avatar URL provided, using fallback');
        avatarUrl = '/icons/hero-icon.svg';
    }
    
    window.forumState.currentUser = {
        uid: user.uid,
        name: user.displayName || 'Anonymous',
        email: user.email,
        avatar: avatarUrl,
        signInTime: Date.now()
    };
    window.forumState.isAuthenticated = true;
    
    console.log('✅ User signed in successfully:', {
        name: user.displayName,
        avatar: avatarUrl
    });
    
    // Update session activity for 2-week persistence
    if (window.sessionManager) {
        window.sessionManager.updateActivity();
    }
    
    // Update user profile in database
    updateUserProfile(window.forumState.currentUser);
    
    // Start activity tracking
    setupActivityTracking();
    
    // Force UI update after a brief delay to ensure DOM is ready
    setTimeout(() => {
        console.log('🔄 Forcing auth UI update...');
        updateAuthUI();
    }, 100);
}

/**
 * Handle user sign out
 */
function handleUserSignOut() {
    window.forumState.currentUser = null;
    window.forumState.isAuthenticated = false;
    console.log('User signed out');
}

/**
 * Update authentication UI
 */
function updateAuthUI() {
    const authContainer = document.getElementById('forum-auth-container');
    console.log('🔄 updateAuthUI called, container found:', !!authContainer);
    console.log('🔄 Auth state:', window.forumState.isAuthenticated);
    console.log('🔄 Current user:', window.forumState.currentUser);
    
    if (!authContainer) {
        console.log('❌ No auth container found!');
        return;
    }

    if (window.forumState.isAuthenticated && window.forumState.currentUser) {
        // Ensure avatar URL is properly formatted and accessible
        let avatarUrl = window.forumState.currentUser.avatar;
        
        // Debug logging for avatar
        console.log('🖼️ Avatar URL in updateAuthUI:', avatarUrl);
        
        // Ensure we have a fallback avatar
        if (!avatarUrl || avatarUrl === 'null' || avatarUrl === 'undefined') {
            avatarUrl = '/icons/hero-icon.svg';
            console.log('🖼️ Using fallback avatar:', avatarUrl);
        }
        
        const userHTML = `
            <div class="user-info">
                <img src="${avatarUrl}" 
                     alt="${window.forumState.currentUser.name}" 
                     class="user-avatar"
                     crossorigin="anonymous"
                     referrerpolicy="no-referrer-when-downgrade"
                     onerror="this.src='/icons/hero-icon.svg'; console.log('🖼️ Avatar failed to load, using fallback:', this.src);"
                     onload="console.log('🖼️ Avatar loaded successfully:', this.src);">
                <span class="user-name">${window.forumState.currentUser.name}</span>
                <button class="auth-btn" onclick="signOutUser()">Sign Out</button>
            </div>
        `;
        
        console.log('🔄 Setting auth container HTML to:', userHTML);
        authContainer.innerHTML = userHTML;
        
    } else {
        console.log('🔄 User not authenticated, showing sign-in button');
        authContainer.innerHTML = `
            <button class="auth-btn" onclick="signInWithGoogle()">
                🔐 Sign In with Google
            </button>
        `;
    }
}

/**
 * Sign in with Google
 */
async function signInWithGoogle() {
    console.log('🔐 signInWithGoogle() called');
    
    try {
        if (!window.firebaseAuth || !window.firebaseUtils) {
            const error = 'Firebase not initialized';
            console.error('❌', error);
            showNotification('Authentication system not ready. Please refresh the page.', 'error');
            return;
        }

        const provider = new window.firebaseUtils.GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');
        
        // Check if we're in a development environment
        const isLocalhost = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1';
        
        console.log('🌍 Starting Google sign-in process...');
        console.log('🏠 Environment:', isLocalhost ? 'localhost' : 'production');
        console.log('🔗 Current URL:', window.location.href);
        console.log('� Hostname:', window.location.hostname);
        console.log('�🔧 Provider configured with scopes:', ['profile', 'email']);
        
        // Use popup authentication for all environments (more reliable and gives better error feedback)
        console.log('🪟 Using popup authentication...');
        showNotification('Opening Google sign-in...', 'info');
        
        try {
            console.log('🚀 Calling signInWithPopup...');
            const authResult = await window.firebaseUtils.signInWithPopup(window.firebaseAuth, provider);
            console.log('✅ Popup sign-in successful:', authResult.user);
            
            if (authResult && authResult.user) {
                console.log('🎉 Authentication successful!');
                // Initialize session tracking after successful sign-in
                if (window.sessionManager) {
                    window.sessionManager.updateActivity();
                }
                showNotification('Welcome to Wavelength Forum!', 'success');
            }
            return;
            
        } catch (popupError) {
            console.error('❌ Popup sign-in failed:', popupError);
            console.error('Error code:', popupError.code);
            console.error('Error message:', popupError.message);
            console.error('Full error:', popupError);
            
            if (popupError.code === 'auth/popup-blocked') {
                showNotification('Popup was blocked by your browser. Please allow popups for this site and try again.', 'error');
            } else if (popupError.code === 'auth/popup-closed-by-user') {
                showNotification('Sign-in was cancelled.', 'warning');
            } else if (popupError.code === 'auth/unauthorized-domain') {
                showNotification(`Domain not authorized: ${window.location.hostname}. Please contact admin to add this domain to Firebase.`, 'error');
            } else {
                throw popupError;
            }
            return;
        }
        
    } catch (error) {
        console.error('💥 Sign-in error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Full error object:', error);
        
        // Provide specific error messages for common issues
        if (error.code === 'auth/operation-not-allowed') {
            showNotification('Google sign-in is not enabled. Please contact support.', 'error');
        } else if (error.code === 'auth/unauthorized-domain') {
            showNotification('This domain is not authorized. Please contact support.', 'error');
        } else if (error.code === 'auth/configuration-not-found') {
            showNotification('Authentication not configured. Please contact support.', 'error');
        } else if (error.message && error.message.includes('CORS')) {
            showNotification('Authentication temporarily unavailable due to browser security. Please try refreshing the page.', 'error');
        } else {
            showNotification(`Sign-in failed: ${error.message || 'Unknown error'}. Please try again or contact support.`, 'error');
        }
    }
}

/**
 * Sign out user
 */
async function signOutUser() {
    try {
        // Clear session data before signing out
        if (window.sessionManager) {
            localStorage.removeItem('wavelength_last_activity');
        }
        
        await window.firebaseUtils.signOut(window.firebaseAuth);
        showNotification('Successfully signed out', 'success');
    } catch (error) {
        console.error('Sign-out error:', error);
        showNotification('Sign-out failed. Please try again.', 'error');
    }
}

/**
 * Update user profile in database
 */
async function updateUserProfile(user) {
    try {
        const userRef = window.firebaseUtils.ref(window.firebaseDB, `forum/users/${user.uid}`);
        const userData = {
            uid: user.uid,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            lastSeen: Date.now(),
            joinDate: Date.now(), // Will be overwritten if user already exists
            postCount: 0,
            replyCount: 0,
            role: 'member'
        };
        
        // Check if user already exists to preserve join date, counts, and groups
        window.firebaseUtils.onValue(userRef, (snapshot) => {
            const existingData = snapshot.val();
            if (existingData) {
                userData.joinDate = existingData.joinDate;
                userData.postCount = existingData.postCount || 0;
                userData.replyCount = existingData.replyCount || 0;
                userData.role = existingData.role || 'member';
                // Preserve groups field - CRITICAL for admin access
                // ALWAYS preserve groups if they exist, default to empty array if not
                userData.groups = existingData.groups || [];
            } else {
                // New user - initialize with empty groups array
                userData.groups = [];
            }

            // Use update() instead of set() to preserve any fields we're not explicitly setting
            window.firebaseUtils.update(userRef, userData);
        }, { onlyOnce: true });
        
    } catch (error) {
        console.error('Error updating user profile:', error);
    }
}

/**
 * Create a new forum post
 */
async function createForumPost(categoryId, title, content, tags = []) {
    if (!window.forumState.isAuthenticated) {
        showNotification('Please sign in to create a post', 'error');
        return false;
    }

    try {
        const postRef = window.firebaseUtils.ref(window.firebaseDB, 'forum/posts');
        const newPostRef = window.firebaseUtils.push(postRef);
        
        const postData = {
            id: newPostRef.key,
            forumId: categoryId,
            title: title.trim(),
            content: content.trim(),
            authorId: window.forumState.currentUser.uid,
            authorName: window.forumState.currentUser.name,
            authorAvatar: window.forumState.currentUser.avatar,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            replyCount: 0,
            likes: 0,
            likedBy: {},
            isPinned: false,
            isLocked: false,
            tags: tags,
            lastReplyAt: Date.now(),
            lastReplyBy: window.forumState.currentUser.name
        };

        await window.firebaseUtils.set(newPostRef, postData);
        
        // Update category post count
        const categoryRef = window.firebaseUtils.ref(window.firebaseDB, `forum/categories/${categoryId}`);
        window.firebaseUtils.onValue(categoryRef, (snapshot) => {
            const categoryData = snapshot.val();
            if (categoryData) {
                const updates = {
                    postCount: (categoryData.postCount || 0) + 1,
                    lastActivity: Date.now()
                };
                window.firebaseUtils.set(window.firebaseUtils.ref(window.firebaseDB, `forum/categories/${categoryId}`), 
                    { ...categoryData, ...updates });
            }
        }, { onlyOnce: true });
        
        // Update user post count
        const userRef = window.firebaseUtils.ref(window.firebaseDB, `forum/users/${window.forumState.currentUser.uid}`);
        window.firebaseUtils.onValue(userRef, (snapshot) => {
            const userData = snapshot.val();
            if (userData) {
                userData.postCount = (userData.postCount || 0) + 1;
                window.firebaseUtils.set(userRef, userData);
            }
        }, { onlyOnce: true });

        showNotification('Post created successfully!', 'success');
        return newPostRef.key;
        
    } catch (error) {
        console.error('Error creating post:', error);
        showNotification('Failed to create post. Please try again.', 'error');
        return false;
    }
}

/**
 * Like/unlike a post
 */
async function togglePostLike(postId) {
    if (!window.forumState.isAuthenticated) {
        showNotification('Please sign in to like posts', 'error');
        return;
    }

    try {
        const postRef = window.firebaseUtils.ref(window.firebaseDB, `forum/posts/${postId}`);
        
        window.firebaseUtils.onValue(postRef, (snapshot) => {
            const postData = snapshot.val();
            if (postData) {
                const likedBy = postData.likedBy || {};
                const userId = window.forumState.currentUser.uid;
                
                if (likedBy[userId]) {
                    // Unlike the post
                    delete likedBy[userId];
                    postData.likes = Math.max(0, (postData.likes || 0) - 1);
                } else {
                    // Like the post
                    likedBy[userId] = {
                        name: window.forumState.currentUser.name,
                        timestamp: Date.now()
                    };
                    postData.likes = (postData.likes || 0) + 1;
                }
                
                postData.likedBy = likedBy;
                window.firebaseUtils.set(postRef, postData);
            }
        }, { onlyOnce: true });
        
    } catch (error) {
        console.error('Error toggling like:', error);
        showNotification('Failed to update like. Please try again.', 'error');
    }
}

/**
 * Setup global event listeners
 */
function setupGlobalEventListeners() {
    // Handle keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + K for search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            showSearchModal();
        }
        
        // Escape to close modals
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
    
    // Handle click outside modals
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal-overlay')) {
            closeAllModals();
        }
    });
}

/**
 * Show notification to user
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // Add to page
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 1rem;
            right: 1rem;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        `;
        document.body.appendChild(container);
    }
    
    container.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

/**
 * Show search modal
 */
function showSearchModal() {
    // Implementation for search modal
    showNotification('Search functionality coming soon!', 'info');
}

/**
 * Close all modals
 */
function closeAllModals() {
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => modal.remove());
}

/**
 * Utility function to safely escape HTML
 */
function escapeHtml(text) {
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
 * Format timestamp for display
 */
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
}

/**
 * Parse forum content and apply linking (similar to main site)
 */
function parseForumContent(content) {
    if (!content) return '';
    
    // This will integrate with your existing linking system
    // For now, just escape HTML and preserve line breaks
    return escapeHtml(content).replace(/\n/g, '<br>');
}

// Add notification styles
const notificationStyles = `
    .notification {
        background: rgba(74, 71, 163, 0.95);
        color: white;
        padding: 1rem;
        border-radius: 0.5rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        max-width: 400px;
        animation: slideIn 0.3s ease-out;
    }
    
    .notification-success {
        background: rgba(46, 125, 50, 0.95);
    }
    
    .notification-error {
        background: rgba(211, 47, 47, 0.95);
    }
    
    .notification-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        line-height: 1;
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;

// Inject notification styles
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

// Export functions for global use
window.forumJS = {
    signInWithGoogle,
    signOutUser,
    createForumPost,
    togglePostLike,
    showNotification,
    parseForumContent,
    formatTimestamp
};