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

    // Listen for auth state changes
    window.firebaseUtils.onAuthStateChanged(window.firebaseAuth, (user) => {
        if (user) {
            handleUserSignIn(user);
        } else {
            handleUserSignOut();
        }
        updateAuthUI();
    });
}

/**
 * Handle user sign in
 */
function handleUserSignIn(user) {
    window.forumState.currentUser = {
        uid: user.uid,
        name: user.displayName || 'Anonymous',
        email: user.email,
        avatar: user.photoURL || '/icons/hero-icon.svg',
        signInTime: Date.now()
    };
    window.forumState.isAuthenticated = true;
    
    console.log('User signed in:', user.displayName);
    
    // Update user data in database
    updateUserProfile(window.forumState.currentUser);
    
    // Start activity tracking
    setupActivityTracking();
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
    if (!authContainer) return;

    if (window.forumState.isAuthenticated && window.forumState.currentUser) {
        authContainer.innerHTML = `
            <div class="user-info">
                <img src="${window.forumState.currentUser.avatar}" alt="${window.forumState.currentUser.name}" class="user-avatar">
                <span class="user-name">${window.forumState.currentUser.name}</span>
                <button class="auth-btn" onclick="signOutUser()">Sign Out</button>
            </div>
        `;
    } else {
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
    try {
        const provider = new window.firebaseUtils.GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');
        
        const result = await window.firebaseUtils.signInWithPopup(window.firebaseAuth, provider);
        console.log('Google sign-in successful:', result.user);
    } catch (error) {
        console.error('Sign-in error:', error);
        showNotification('Sign-in failed. Please try again.', 'error');
    }
}

/**
 * Sign out user
 */
async function signOutUser() {
    try {
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
        
        // Check if user already exists to preserve join date and counts
        window.firebaseUtils.onValue(userRef, (snapshot) => {
            const existingData = snapshot.val();
            if (existingData) {
                userData.joinDate = existingData.joinDate;
                userData.postCount = existingData.postCount || 0;
                userData.replyCount = existingData.replyCount || 0;
                userData.role = existingData.role || 'member';
            }
            
            window.firebaseUtils.set(userRef, userData);
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