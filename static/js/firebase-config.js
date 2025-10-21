/**
 * Wavelength Community Forum - Firebase Configuration and Session Management
 * Provides Firebase initialization and 2-week session persistence
 */

// Firebase configuration function - called by each page with environment variables
window.initializeWavelengthFirebase = function(firebaseConfig) {
    return import('https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js')
        .then(({ initializeApp }) => {
            return Promise.all([
                import('https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js'),
                import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js')
            ]).then(([authModule, dbModule]) => {
                const { 
                    getAuth, 
                    signInWithPopup, 
                    signInWithRedirect,
                    getRedirectResult,
                    GoogleAuthProvider, 
                    signOut, 
                    onAuthStateChanged, 
                    setPersistence, 
                    browserLocalPersistence 
                } = authModule;
                
                const {
                    getDatabase,
                    ref,
                    push,
                    set,
                    update,
                    onValue,
                    get,
                    query,
                    orderByChild
                } = dbModule;

                // Initialize Firebase
                const app = initializeApp(firebaseConfig);
                const auth = getAuth(app);
                const database = getDatabase(app);

                // Configure Firebase Auth persistence for 2-week sessions
                return setPersistence(auth, browserLocalPersistence).then(() => {
                    console.log('Firebase Auth persistence set to LOCAL for extended sessions');
                    
                    // Custom session manager for 2-week duration
                    window.sessionManager = {
                        // 2 weeks in milliseconds
                        SESSION_DURATION: 14 * 24 * 60 * 60 * 1000,
                        
                        // Check if session is valid
                        isSessionValid: function() {
                            const lastActivity = localStorage.getItem('wavelength_last_activity');
                            if (!lastActivity) return false;
                            
                            const now = Date.now();
                            const timeSinceActivity = now - parseInt(lastActivity);
                            return timeSinceActivity < this.SESSION_DURATION;
                        },
                        
                        // Update session activity
                        updateActivity: function() {
                            localStorage.setItem('wavelength_last_activity', Date.now().toString());
                        },
                        
                        // Clear expired session
                        clearExpiredSession: function() {
                            if (!this.isSessionValid()) {
                                localStorage.removeItem('wavelength_last_activity');
                                auth.signOut();
                                return true;
                            }
                            return false;
                        },
                        
                        // Get remaining session time (for display purposes)
                        getRemainingTime: function() {
                            const lastActivity = localStorage.getItem('wavelength_last_activity');
                            if (!lastActivity) return 0;
                            
                            const now = Date.now();
                            const timeSinceActivity = now - parseInt(lastActivity);
                            return Math.max(0, this.SESSION_DURATION - timeSinceActivity);
                        },
                        
                        // Format remaining time for display
                        formatRemainingTime: function() {
                            const remaining = this.getRemainingTime();
                            const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
                            const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
                            
                            if (days > 0) {
                                return `${days} day${days !== 1 ? 's' : ''}, ${hours} hour${hours !== 1 ? 's' : ''}`;
                            } else if (hours > 0) {
                                return `${hours} hour${hours !== 1 ? 's' : ''}`;
                            } else {
                                const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
                                return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
                            }
                        }
                    };
                    
                    // Check session validity on load
                    window.sessionManager.clearExpiredSession();
                    
                    // Make Firebase available globally for forum components
                    window.firebaseAuth = auth;
                    window.firebaseDB = database;
                    window.firebaseUtils = {
                        signInWithPopup,
                        signInWithRedirect,
                        getRedirectResult,
                        GoogleAuthProvider,
                        signOut,
                        onAuthStateChanged,
                        setPersistence,
                        browserLocalPersistence,
                        ref,
                        push,
                        set,
                        update,
                        onValue,
                        get,
                        query,
                        orderByChild
                    };
                    
                    // Store Firebase ID token in cookie for server-side authentication
                    const storeToken = async (user) => {
                        console.log('🔐 storeToken called with user:', user ? user.uid : 'null');
                        if (user) {
                            try {
                                const idToken = await user.getIdToken();
                                console.log('📝 Got ID token, length:', idToken.length);
                                // Store token in cookie (expires in 1 hour, refreshed automatically)
                                document.cookie = `__session=${idToken}; path=/; max-age=3600; SameSite=Lax`;
                                console.log('✅ Firebase ID token stored in cookie');
                                
                                // Dispatch event so other scripts know the token is ready
                                window.dispatchEvent(new CustomEvent('wavelengthTokenReady', { 
                                    detail: { uid: user.uid } 
                                }));
                            } catch (error) {
                                console.error('❌ Failed to get ID token:', error);
                            }
                        } else {
                            // Clear cookie on sign out
                            document.cookie = '__session=; path=/; max-age=0';
                            console.log('🔓 Cleared authentication cookie (no user)');
                        }
                    };
                    
                    // Listen for auth state changes and store token
                    // This fires IMMEDIATELY when listener is attached if user is already signed in,
                    // or later when auth state is restored from localStorage
                    console.log('🎯 Setting up auth state listener and token storage...');
                    let tokenStored = false;
                    onAuthStateChanged(auth, async (user) => {
                        console.log('� Auth state changed:', user ? `User: ${user.uid}` : 'No user');
                        if (user && !tokenStored) {
                            console.log('👤 User authenticated, storing token...');
                            await storeToken(user);
                            tokenStored = true;
                        } else if (!user && tokenStored) {
                            console.log('🚪 User signed out, clearing token...');
                            await storeToken(null);
                            tokenStored = false;
                        }
                    });
                    
                    // Refresh token periodically (every 55 minutes)
                    setInterval(async () => {
                        const user = auth.currentUser;
                        if (user) {
                            try {
                                const idToken = await user.getIdToken(true); // Force refresh
                                document.cookie = `__session=${idToken}; path=/; max-age=3600; SameSite=Lax`;
                                console.log('🔄 Firebase ID token refreshed');
                            } catch (error) {
                                console.error('Failed to refresh ID token:', error);
                            }
                        }
                    }, 55 * 60 * 1000); // 55 minutes
                    
                    // Setup periodic session checking
                    setInterval(() => {
                        if (window.sessionManager.clearExpiredSession()) {
                            console.log('Session expired and cleared');
                        }
                    }, 5 * 60 * 1000); // Check every 5 minutes
                    
                    console.log('✅ Firebase initialized - auth listener active, token storage ready');
                    return { auth, database };
                    
                }).catch((error) => {
                    console.error('Failed to set Firebase persistence:', error);
                    throw error;
                });
            });
        });
};

// Session status display (optional utility)
window.showSessionStatus = function() {
    if (window.sessionManager && window.sessionManager.isSessionValid()) {
        const remaining = window.sessionManager.formatRemainingTime();
        console.log(`Session valid for another ${remaining}`);
        return remaining;
    } else {
        console.log('No active session');
        return null;
    }
};