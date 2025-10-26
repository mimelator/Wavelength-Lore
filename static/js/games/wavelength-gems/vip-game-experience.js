/**
 * VIP Game Experience Manager - Simplified Retry System
 * Replaces complex ad-driven retry threshold with VIP-friendly mechanics
 * 
 * Philosophy: VIP+ members should have unlimited retries with minimal friction
 */

const VipGameExperience = {
    // Simplified configuration for VIP experience
    config: {
        // Very generous limits for VIP users
        unlimited: true,                    // VIP gets unlimited retries
        briefCooldown: 30,                 // 30 second cooldown between rapid retries (prevent spam)
        encouragementMessages: true,       // Show positive encouragement instead of limits
        storageKey: 'wavelength_vip_game_experience'
    },
    
    // Current state
    state: {
        lastRetryTime: null,
        consecutiveRetries: 0,
        sessionStartTime: Date.now()
    },
    
    /**
     * Initialize VIP game experience manager
     */
    init() {
        console.log('🌟 Initializing VIP Game Experience Manager');
        this.loadState();
        console.log('✨ VIP Gaming: Unlimited retries with enhanced experience');
    },
    
    /**
     * Load state from localStorage
     */
    loadState() {
        try {
            const savedData = localStorage.getItem(this.config.storageKey);
            if (savedData) {
                this.state = { ...this.state, ...JSON.parse(savedData) };
            }
        } catch (error) {
            console.log('📝 Creating new VIP game experience state');
        }
    },
    
    /**
     * Save state to localStorage
     */
    saveState() {
        try {
            localStorage.setItem(this.config.storageKey, JSON.stringify(this.state));
        } catch (error) {
            console.warn('⚠️ Could not save VIP game experience state');
        }
    },
    
    /**
     * Check if retry is allowed (always true for VIP, but may show encouragement)
     */
    canRetry() {
        const now = Date.now();
        const timeSinceLastRetry = this.state.lastRetryTime ? now - this.state.lastRetryTime : 0;
        
        // VIP members can always retry, but we track for experience optimization
        return {
            allowed: true,
            showEncouragement: this.state.consecutiveRetries >= 3,
            cooldownRemaining: Math.max(0, this.config.briefCooldown * 1000 - timeSinceLastRetry),
            isInCooldown: timeSinceLastRetry < (this.config.briefCooldown * 1000)
        };
    },
    
    /**
     * Record a retry attempt
     */
    recordRetry() {
        const now = Date.now();
        const timeSinceLastRetry = this.state.lastRetryTime ? now - this.state.lastRetryTime : 0;
        
        // If it's been more than 2 minutes since last retry, reset consecutive count
        if (timeSinceLastRetry > 120000) { // 2 minutes
            this.state.consecutiveRetries = 0;
        }
        
        this.state.lastRetryTime = now;
        this.state.consecutiveRetries++;
        
        this.saveState();
        
        console.log(`🎮 VIP Retry #${this.state.consecutiveRetries} - Keep going!`);
    },
    
    /**
     * Get encouragement message for VIP experience
     */
    getEncouragementMessage() {
        const messages = [
            "🌟 VIP Unlimited Retries - You've got this!",
            "💎 VIP Power: Every attempt makes you stronger!",
            "⭐ VIP Experience: No limits, just pure fun!",
            "🎯 VIP Gaming: Persistence is the path to mastery!",
            "🚀 VIP Benefits: Unlimited chances to achieve greatness!"
        ];
        
        return messages[Math.floor(Math.random() * messages.length)];
    },
    
    /**
     * Show VIP-friendly retry modal (replaces old threshold modal)
     */
    showVipRetryExperience() {
        const retryInfo = this.canRetry();
        
        if (retryInfo.isInCooldown) {
            // Brief cooldown to prevent spam clicking
            this.showBriefCooldownModal(retryInfo.cooldownRemaining);
        } else if (retryInfo.showEncouragement) {
            // Show encouragement after multiple retries
            this.showEncouragementModal();
        } else {
            // Direct retry - no modal needed
            return true; // Allow immediate retry
        }
        
        return false; // Modal shown, don't retry immediately
    },
    
    /**
     * Show brief cooldown modal (prevents spam clicking)
     */
    showBriefCooldownModal(remainingMs) {
        const modal = document.createElement('div');
        modal.id = 'vipCooldownModal';
        modal.className = 'level-modal';
        
        const seconds = Math.ceil(remainingMs / 1000);
        
        modal.innerHTML = `
            <div class="modal-content">
                <h2>🌟 VIP Moment</h2>
                <div class="level-stats">
                    <div class="stat-row vip-cooldown">
                        <span class="stat-label">Quick Break:</span>
                        <span class="stat-value">${seconds}s</span>
                    </div>
                </div>
                <p class="modal-description">
                    🎮 Take a quick breath! VIP unlimited retries resume in ${seconds} seconds.
                </p>
                <div class="modal-buttons">
                    <button class="btn btn-secondary" onclick="returnToMenu()">← Back to Menu</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('active'), 10);
        
        // Auto-close and enable retry after cooldown
        setTimeout(() => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        }, remainingMs);
    },
    
    /**
     * Show encouragement modal for persistent players
     */
    showEncouragementModal() {
        const modal = document.createElement('div');
        modal.id = 'vipEncouragementModal';
        modal.className = 'level-modal';
        
        const message = this.getEncouragementMessage();
        
        modal.innerHTML = `
            <div class="modal-content">
                <h2>💎 VIP Encouragement</h2>
                <div class="level-stats">
                    <div class="stat-row vip-encouragement">
                        <span class="stat-label">Attempts:</span>
                        <span class="stat-value">${this.state.consecutiveRetries}</span>
                    </div>
                </div>
                <p class="modal-description">
                    ${message}
                </p>
                <div class="modal-buttons">
                    <button class="btn btn-primary" onclick="closeVipModal(); retryLevel();">🚀 Keep Playing!</button>
                    <button class="btn btn-secondary" onclick="returnToMenu()">← Take a Break</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('active'), 10);
    },
    
    /**
     * Reset consecutive retries (called on level completion)
     */
    resetSession() {
        this.state.consecutiveRetries = 0;
        this.state.sessionStartTime = Date.now();
        this.saveState();
        console.log('🎉 VIP session reset - Great job!');
    }
};

// Global function to close VIP modals
function closeVipModal() {
    const modal = document.getElementById('vipCooldownModal') || 
                 document.getElementById('vipEncouragementModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
}

// Initialize VIP experience on page load
if (typeof window !== 'undefined') {
    window.VipGameExperience = VipGameExperience;
}

module.exports = VipGameExperience;