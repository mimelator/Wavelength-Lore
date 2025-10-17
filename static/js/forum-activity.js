/**
 * Real-time Activity Manager for Wavelength Forum
 * Handles live updates, notifications, and activity tracking
 */

class ForumActivityManager {
    constructor() {
        this.activityListeners = new Map();
        this.notificationQueue = [];
        this.isInitialized = false;
        this.userPresence = new Map();
    }

    /**
     * Initialize the activity manager
     */
    initialize() {
        if (this.isInitialized) return;
        
        this.setupPresenceSystem();
        this.setupActivityFeed();
        this.setupLiveStatistics();
        this.setupRealtimeNotifications();
        
        this.isInitialized = true;
        console.log('🚀 Forum Activity Manager initialized');
    }

    /**
     * Setup user presence system
     */
    setupPresenceSystem() {
        if (!window.firebaseDB || !window.firebaseUtils) return;

        // Track online users
        const presenceRef = window.firebaseUtils.ref(window.firebaseDB, 'forum/presence');
        
        // Listen for presence changes
        window.firebaseUtils.onValue(presenceRef, (snapshot) => {
            const presence = snapshot.val() || {};
            this.updatePresenceDisplay(presence);
        });

        // Update own presence when authenticated
        if (window.forumState.isAuthenticated) {
            this.updateUserPresence(true);
            
            // Set up presence cleanup on disconnect
            const userPresenceRef = window.firebaseUtils.ref(window.firebaseDB, 
                `forum/presence/${window.forumState.currentUser.uid}`);
            
            // Remove presence on disconnect
            window.addEventListener('beforeunload', () => {
                window.firebaseUtils.set(userPresenceRef, null);
            });
        }
    }

    /**
     * Update user presence
     */
    updateUserPresence(isOnline) {
        if (!window.forumState.isAuthenticated) return;

        const userPresenceRef = window.firebaseUtils.ref(window.firebaseDB, 
            `forum/presence/${window.forumState.currentUser.uid}`);
        
        if (isOnline) {
            const presenceData = {
                name: window.forumState.currentUser.name,
                avatar: window.forumState.currentUser.avatar,
                lastSeen: window.firebaseUtils.serverTimestamp(),
                status: 'online'
            };
            window.firebaseUtils.set(userPresenceRef, presenceData);
        } else {
            window.firebaseUtils.set(userPresenceRef, null);
        }
    }

    /**
     * Update presence display
     */
    updatePresenceDisplay(presence) {
        const onlineCount = Object.keys(presence).length;
        const onlineElement = document.getElementById('online-users');
        
        if (onlineElement) {
            onlineElement.textContent = onlineCount;
            
            // Add live indicator
            if (!onlineElement.classList.contains('live')) {
                onlineElement.classList.add('live');
                onlineElement.parentElement.classList.add('live');
            }
        }

        // Update user avatars in online display
        this.updateOnlineUsersList(presence);
    }

    /**
     * Update online users list
     */
    updateOnlineUsersList(presence) {
        let onlineUsersContainer = document.getElementById('online-users-list');
        
        if (!onlineUsersContainer) {
            // Create online users container if it doesn't exist
            const statsBar = document.querySelector('.forum-stats-bar');
            if (statsBar) {
                onlineUsersContainer = document.createElement('div');
                onlineUsersContainer.id = 'online-users-list';
                onlineUsersContainer.className = 'online-users-display';
                onlineUsersContainer.innerHTML = '<h4>👥 Online Now</h4><div class="online-avatars"></div>';
                statsBar.appendChild(onlineUsersContainer);
            }
        }

        const avatarsContainer = onlineUsersContainer?.querySelector('.online-avatars');
        if (avatarsContainer && presence) {
            const onlineUsers = Object.values(presence);
            avatarsContainer.innerHTML = onlineUsers.slice(0, 10).map(user => `
                <div class="online-user-avatar" title="${user.name}">
                    <img src="${user.avatar}" alt="${user.name}">
                    <div class="online-indicator"></div>
                </div>
            `).join('');
            
            if (onlineUsers.length > 10) {
                avatarsContainer.innerHTML += `<div class="more-users">+${onlineUsers.length - 10}</div>`;
            }
        }
    }

    /**
     * Setup activity feed
     */
    setupActivityFeed() {
        // Listen for new posts
        const postsRef = window.firebaseUtils.ref(window.firebaseDB, 'forum/posts');
        window.firebaseUtils.onValue(postsRef, (snapshot) => {
            this.handleNewPosts(snapshot.val());
        });

        // Listen for new replies
        const repliesRef = window.firebaseUtils.ref(window.firebaseDB, 'forum/replies');
        window.firebaseUtils.onValue(repliesRef, (snapshot) => {
            this.handleNewReplies(snapshot.val());
        });
    }

    /**
     * Handle new posts
     */
    handleNewPosts(posts) {
        if (!posts || !window.forumState.isAuthenticated) return;

        const currentUserId = window.forumState.currentUser?.uid;
        const userJoinTime = window.forumState.currentUser?.signInTime || Date.now();
        
        const newPosts = Object.values(posts).filter(post => 
            post.createdAt > userJoinTime && 
            post.authorId !== currentUserId &&
            (Date.now() - post.createdAt) < 300000 // Last 5 minutes
        );

        newPosts.forEach(post => {
            this.showActivityNotification('post', post);
        });
    }

    /**
     * Handle new replies
     */
    handleNewReplies(replies) {
        if (!replies || !window.forumState.isAuthenticated) return;

        const currentUserId = window.forumState.currentUser?.uid;
        const userJoinTime = window.forumState.currentUser?.signInTime || Date.now();
        
        const newReplies = Object.values(replies).filter(reply => 
            reply.createdAt > userJoinTime && 
            reply.authorId !== currentUserId &&
            (Date.now() - reply.createdAt) < 300000 // Last 5 minutes
        );

        newReplies.forEach(reply => {
            this.showActivityNotification('reply', reply);
        });
    }

    /**
     * Show activity notification
     */
    showActivityNotification(type, data) {
        const message = type === 'post' 
            ? `📝 ${data.authorName} posted "${data.title}"`
            : `💬 ${data.authorName} replied to a post`;
        
        this.createNotification(message, 'activity', () => {
            if (type === 'post') {
                window.location.href = `/forum/post/${data.id}`;
            }
        });
    }

    /**
     * Create notification
     */
    createNotification(message, type = 'info', onClick = null) {
        const notification = document.createElement('div');
        notification.className = `forum-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                ${message}
                <button class="notification-close">&times;</button>
            </div>
        `;

        // Add click handler
        if (onClick) {
            notification.style.cursor = 'pointer';
            notification.addEventListener('click', (e) => {
                if (!e.target.classList.contains('notification-close')) {
                    onClick();
                }
            });
        }

        // Add close handler
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });

        // Add to page
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Auto-remove after 8 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }
        }, 8000);
    }

    /**
     * Setup live statistics
     */
    setupLiveStatistics() {
        // Update statistics every 30 seconds
        setInterval(() => {
            this.updateLiveStatistics();
        }, 30000);
    }

    /**
     * Update live statistics
     */
    updateLiveStatistics() {
        // Add shimmer effect to show live updates
        const statItems = document.querySelectorAll('.stat-item');
        statItems.forEach(item => {
            item.classList.add('live');
            setTimeout(() => item.classList.remove('live'), 3000);
        });
    }

    /**
     * Setup realtime notifications
     */
    setupRealtimeNotifications() {
        // This method sets up additional notification listeners
        // Can be extended for specific notification types
        console.log('📡 Real-time notifications active');
    }

    /**
     * Cleanup when user signs out
     */
    cleanup() {
        this.updateUserPresence(false);
        this.activityListeners.clear();
        this.userPresence.clear();
    }
}

// Initialize the activity manager
window.forumActivityManager = new ForumActivityManager();

// Initialize when Firebase is ready and user signs in
document.addEventListener('DOMContentLoaded', () => {
    const checkInitialization = () => {
        if (window.firebaseDB && window.firebaseUtils) {
            window.forumActivityManager.initialize();
        } else {
            setTimeout(checkInitialization, 1000);
        }
    };
    checkInitialization();
});

// Cleanup on sign out
window.addEventListener('beforeunload', () => {
    if (window.forumActivityManager) {
        window.forumActivityManager.cleanup();
    }
});