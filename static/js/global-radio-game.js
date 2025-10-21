// Global Radio Game - Appears on all non-forum pages for authenticated users

class GlobalRadioGame {
    constructor() {
        this.stats = {
            mushrooms: parseInt(localStorage.getItem('mushroom_count') || '0'),
            stars: parseInt(localStorage.getItem('star_count') || '0'),
            horseshoes: parseInt(localStorage.getItem('horseshoe_count') || '0'),
            sparkles: parseInt(localStorage.getItem('sparkle_count') || '0'),
            crystals: parseInt(localStorage.getItem('crystal_count') || '0'),
            moons: parseInt(localStorage.getItem('moon_count') || '0'),
            goblins: parseInt(localStorage.getItem('goblin_count') || '0')
        };

        this.isActive = localStorage.getItem('global_radio_game_active') === 'true';
        this.isEnabled = localStorage.getItem('global_radio_game_enabled') !== 'false'; // Enabled by default
        this.spawnInterval = null;
        this.activeElements = [];

        // Sound effects
        this.soundEnabled = localStorage.getItem('radio_sound_enabled') !== 'false';
        this.audioContext = null;

        this.init();
    }

    init() {
        // Check if game is enabled
        if (!this.isEnabled) {
            this.hideGame();
            return;
        }

        this.bindControls();
        this.updateStats();
        this.initSoundSystem();

        // Restore previous active state
        if (this.isActive) {
            this.showWidget();
            this.startSpawning();
        }
    }

    bindControls() {
        const toggle = document.getElementById('radioGameToggle');
        const closeBtn = document.getElementById('closeGameBtn');

        if (toggle) {
            toggle.addEventListener('click', () => this.toggleWidget());
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideWidget());
        }
    }

    toggleWidget() {
        if (this.isActive) {
            this.hideWidget();
        } else {
            this.showWidget();
        }
    }

    showWidget() {
        const widget = document.getElementById('radioGameWidget');
        if (widget) {
            widget.classList.add('active');
            this.isActive = true;
            localStorage.setItem('global_radio_game_active', 'true');
            this.startSpawning();
        }
    }

    hideWidget() {
        const widget = document.getElementById('radioGameWidget');
        if (widget) {
            widget.classList.remove('active');
            this.isActive = false;
            localStorage.setItem('global_radio_game_active', 'false');
            this.stopSpawning();
        }
    }

    hideGame() {
        const gameContainer = document.getElementById('globalRadioGame');
        if (gameContainer) {
            gameContainer.classList.add('disabled');
        }
    }

    showGame() {
        const gameContainer = document.getElementById('globalRadioGame');
        if (gameContainer) {
            gameContainer.classList.remove('disabled');
        }
    }

    startSpawning() {
        if (this.spawnInterval) return; // Already spawning

        this.spawnInterval = setInterval(() => {
            this.spawnCollectible();
        }, 3000); // Spawn every 3 seconds
    }

    stopSpawning() {
        if (this.spawnInterval) {
            clearInterval(this.spawnInterval);
            this.spawnInterval = null;
        }

        // Clear all active elements
        this.activeElements.forEach(el => el.element.remove());
        this.activeElements = [];
    }

    spawnCollectible() {
        const canvas = document.getElementById('globalGameCanvas');
        if (!canvas) return;

        // Random collectible type
        const types = [
            { class: 'mushroom', emoji: '🍄', points: 10 },
            { class: 'star', emoji: '⭐', points: 5 },
            { class: 'horseshoe', emoji: '🧲', points: 15 },
            { class: 'sparkle', emoji: '✨', points: 5 },
            { class: 'crystal', emoji: '💎', points: 8 },
            { class: 'moon', emoji: '🌙', points: 7 }
        ];

        // Rare goblin (5% chance)
        if (Math.random() < 0.05) {
            types.push({ class: 'goblin', emoji: '👺', points: 25 });
        }

        const type = types[Math.floor(Math.random() * types.length)];

        const element = document.createElement('div');
        element.className = `mystical-element ${type.class}`;
        element.textContent = type.emoji;
        element.style.position = 'absolute';
        element.style.left = `${Math.random() * 80 + 10}%`;
        element.style.top = `${Math.random() * 70 + 10}%`;
        element.style.fontSize = '2rem';
        element.style.cursor = 'pointer';
        element.style.animation = 'float 3s ease-in-out infinite, fadeIn 0.3s ease';
        element.style.transition = 'all 0.3s ease';
        element.style.zIndex = '10';

        // Apply horseshoe neon green effect
        if (type.class === 'horseshoe') {
            element.style.filter = 'drop-shadow(0 0 8px #00ff00) drop-shadow(0 0 15px #39ff14) brightness(0) saturate(100%) invert(100%) sepia(100%) saturate(10000%) hue-rotate(90deg)';
        }

        element.addEventListener('click', () => this.collectItem(element, type));

        canvas.appendChild(element);

        const elementData = { element, type, timestamp: Date.now() };
        this.activeElements.push(elementData);

        // Remove after 5 seconds if not clicked
        setTimeout(() => {
            if (element.parentNode) {
                element.style.opacity = '0';
                setTimeout(() => {
                    element.remove();
                    this.activeElements = this.activeElements.filter(e => e.element !== element);
                }, 300);
            }
        }, 5000);
    }

    collectItem(element, type) {
        // Play sound
        this.playCollectSound(type);

        // Animate collection
        element.style.transform = 'scale(1.5) rotate(360deg)';
        element.style.opacity = '0';

        // Update stats
        this.stats[type.class + 's']++;
        localStorage.setItem(`${type.class}_count`, this.stats[type.class + 's']);
        this.updateStats();

        // Sync to Firebase if available
        this.syncToFirebase();

        // Remove element
        setTimeout(() => {
            element.remove();
            this.activeElements = this.activeElements.filter(e => e.element !== element);
        }, 300);
    }

    updateStats() {
        // Update all stat displays
        document.getElementById('globalMushrooms').textContent = this.stats.mushrooms;
        document.getElementById('globalStars').textContent = this.stats.stars;
        document.getElementById('globalHorseshoes').textContent = this.stats.horseshoes;
        document.getElementById('globalSparkles').textContent = this.stats.sparkles;
        document.getElementById('globalCrystals').textContent = this.stats.crystals;
        document.getElementById('globalMoons').textContent = this.stats.moons;
        document.getElementById('globalGoblins').textContent = this.stats.goblins;

        // Calculate total score
        const totalScore = (this.stats.mushrooms * 10) +
                          (this.stats.stars * 5) +
                          (this.stats.horseshoes * 15) +
                          (this.stats.sparkles * 5) +
                          (this.stats.crystals * 8) +
                          (this.stats.moons * 7) +
                          (this.stats.goblins * 25);

        document.getElementById('globalTotalScore').textContent = totalScore;
    }

    async syncToFirebase() {
        // Only sync if Firebase is available and user is logged in
        if (!window.firebaseDB || !window.firebaseAuth || !window.firebaseAuth.currentUser) {
            return;
        }

        try {
            const userId = window.firebaseAuth.currentUser.uid;
            const userStatsRef = window.firebaseUtils.ref(window.firebaseDB, `users/${userId}/radioPlayerStats`);

            await window.firebaseUtils.set(userStatsRef, {
                mushrooms: this.stats.mushrooms,
                stars: this.stats.stars,
                horseshoes: this.stats.horseshoes,
                sparkles: this.stats.sparkles,
                crystals: this.stats.crystals,
                moons: this.stats.moons,
                goblins: this.stats.goblins,
                magicLevel: 1,
                lastUpdated: Date.now()
            });
        } catch (error) {
            console.error('Error syncing to Firebase:', error);
        }
    }

    // Initialize Web Audio API
    initSoundSystem() {
        if (!this.soundEnabled) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
            this.soundEnabled = false;
        }
    }

    // Play collect sound based on collectible type
    playCollectSound(type) {
        if (!this.soundEnabled || !this.audioContext) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Different sounds for each type (same as radio-player.js)
        switch (type.class) {
            case 'mushroom':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(400, now);
                oscillator.frequency.linearRampToValueAtTime(600, now + 0.1);
                break;
            case 'star':
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(800, now);
                oscillator.frequency.linearRampToValueAtTime(1200, now + 0.15);
                break;
            case 'horseshoe':
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(500, now);
                oscillator.frequency.linearRampToValueAtTime(300, now + 0.2);
                break;
            case 'sparkle':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(1000, now);
                oscillator.frequency.linearRampToValueAtTime(1500, now + 0.1);
                break;
            case 'crystal':
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(700, now);
                oscillator.frequency.linearRampToValueAtTime(900, now + 0.15);
                break;
            case 'moon':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(350, now);
                oscillator.frequency.linearRampToValueAtTime(550, now + 0.2);
                break;
            case 'goblin':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(300, now);
                oscillator.frequency.linearRampToValueAtTime(100, now + 0.3);
                break;
        }

        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        oscillator.start(now);
        oscillator.stop(now + 0.3);
    }

    // Public methods for enabling/disabling the game
    enableGame() {
        this.isEnabled = true;
        localStorage.setItem('global_radio_game_enabled', 'true');
        this.showGame();
        this.init();
    }

    disableGame() {
        this.isEnabled = false;
        localStorage.setItem('global_radio_game_enabled', 'false');
        this.stopSpawning();
        this.hideGame();
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.globalRadioGame = new GlobalRadioGame();
    });
} else {
    window.globalRadioGame = new GlobalRadioGame();
}
