/**
 * Wavelength Gems - Match-3 Game Engine
 * Core game logic with smooth animations and visual feedback
 */

// Game configuration
const GAME_CONFIG = {
    ROWS: 8,
    COLS: 8,
    GEM_TYPES: ['daphne', 'jasper', 'miles', 'ivy', 'echo', 'atlas'],
    MATCH_MIN: 3,
    BASE_POINTS: 100,
    ANIMATION_DURATION: 300, // Duration of animations in ms
    GOBLIN_IMAGES: [ // Random goblin images for the glitch easter egg
        '/static/images/characters/wavelength/TheBattleOfTheShire-050.webp',
        '/static/images/characters/wavelength/TheBattleOfTheShire-058.webp',
        '/static/images/characters/wavelength/yeti-1.webp',
        '/static/images/characters/wavelength/yeti-2.webp'
    ],
    GOBLIN_MESSAGES: [
        "Goblin mischief detected! 👹",
        "The goblins are at it again!",
        "Pesky goblin interference!",
        "Goblin glitch in progress...",
        "A wild goblin appears!",
        "Goblins in the gemworks!"
    ]
};

// Animation frame tracking
let animationFrames = new Map(); // Map of gem positions to their animation state

// ═════════════════════════════════════════════════════════════════════════════
// CANVAS RENDERING SYSTEM
// ═════════════════════════════════════════════════════════════════════════════

let canvasManager = {
    canvas: null,
    ctx: null,
    dpi: window.devicePixelRatio || 1,
    boardPadding: 5, // Reduced from 10 for more board space
    gemGapSize: 2,
    gemImages: {}, // Cache for gem images
    animatingGems: new Map(), // Track gems currently animating on canvas

    // Theme support
    backgroundImage: null, // Current level background image
    backgroundImageCache: {}, // Cache for loaded images
    themeColors: {
        primary: '#8B5CF6',
        secondary: '#EC4899',
        accent: '#FF6B6B'
    },
    backgroundOpacity: 0.15,

    /**
     * Initialize Canvas rendering
     */
    init() {
        // Find or create canvas element
        let canvas = document.getElementById('gemsCanvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'gemsCanvas';
            canvas.style.cssText = `
                display: block;
                width: 100%;
                max-width: 100%;
                height: auto;
                background: transparent;
                touch-action: none;
                cursor: pointer;
            `;

            // Insert canvas into gameBoard div
            const gameBoard = document.getElementById('gameBoard');
            if (gameBoard) {
                // Clear the board's old content
                gameBoard.innerHTML = '';
                gameBoard.appendChild(canvas);
            }
        }

        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resizeCanvas();

        // Add event listeners for clicks/touches
        canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        canvas.addEventListener('touchstart', (e) => this.handleCanvasClick(e));

        // Resize on window resize
        window.addEventListener('resize', () => this.resizeCanvas());
    },

    /**
     * Resize canvas to match viewport dimensions
     */
    resizeCanvas() {
        if (!this.canvas) return;

        const width = window.innerWidth;
        const height = window.innerHeight;

        // Account for DPI for sharp rendering
        this.canvas.width = width * this.dpi;
        this.canvas.height = height * this.dpi;

        // Scale context for DPI
        this.ctx.scale(this.dpi, this.dpi);

        // Calculate board dimensions
        this.calculateBoardDimensions();
    },

    /**
     * Calculate board position and size within canvas
     */
    calculateBoardDimensions() {
        const viewport = window.innerWidth;
        const isMobile = viewport <= 768;

        // Calculate gem size
        let gemSize;
        if (isMobile) {
            gemSize = 52; // Fixed size for mobile
        } else {
            // Desktop calculation
            const availableWidth = viewport - (this.boardPadding * 2);
            const gapTotal = (GAME_CONFIG.COLS - 1) * this.gemGapSize;
            gemSize = Math.floor((availableWidth - gapTotal) / GAME_CONFIG.COLS);
            gemSize = Math.max(40, Math.min(gemSize, 100)); // Increased from 85 to 100 for much larger gems
        }

        // Calculate board width and height
        const boardWidth = (GAME_CONFIG.COLS * gemSize) + ((GAME_CONFIG.COLS - 1) * this.gemGapSize);
        const boardHeight = (GAME_CONFIG.ROWS * gemSize) + ((GAME_CONFIG.ROWS - 1) * this.gemGapSize);

        // Center the board horizontally
        const boardX = (viewport - boardWidth) / 2;
        const boardY = 60; // Reduced from 100 for more vertical space

        this.boardX = boardX;
        this.boardY = boardY;
        this.gemSize = gemSize;
        this.boardWidth = boardWidth;
        this.boardHeight = boardHeight;

        console.log(`📏 Board dimensions: ${gemSize}px gems | Board: ${boardWidth}x${boardHeight}px | Position: (${boardX}, ${boardY})`);
    },

    /**
     * Draw the entire board with animations
     */
    draw() {
        if (!this.ctx || !this.canvas) return;

        // Clear canvas completely (removes all previous drawing including shadow artifacts)
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // NOTE: drawBackgroundImage() disabled - we use the page background instead
        // this.drawBackgroundImage();

        // Draw board background
        this.drawBoardBackground();

        // Draw all gems
        this.drawAllGems();

        // Draw particle effects
        animationSystem.drawParticles();

        // Draw animations on top
        animationSystem.drawAnimations();

        // Highlight selected gem (drawn last so it's on top)
        if (gameState.selectedGem) {
            this.drawSelectedHighlight();
        }
    },

    /**
     * Start continuous animation loop
     */
    startAnimationLoop() {
        let lastTime = performance.now();

        const animate = (currentTime) => {
            // Calculate delta time for particle updates (in milliseconds)
            const deltaTime = currentTime - lastTime;
            lastTime = currentTime;

            // Update all animations
            animationSystem.updateAnimations(currentTime);

            // Update particle effects
            animationSystem.updateParticles(deltaTime);

            // Redraw canvas
            this.draw();

            // Continue loop if animations are active (always use RAF for smooth rendering)
            animationSystem.animationFrameId = requestAnimationFrame(animate);
        };

        // Start the loop
        animationSystem.animationFrameId = requestAnimationFrame(animate);
    },

    /**
     * Stop animation loop
     */
    stopAnimationLoop() {
        if (animationSystem.animationFrameId) {
            cancelAnimationFrame(animationSystem.animationFrameId);
            animationSystem.animationFrameId = null;
        }
    },

    /**
     * Draw board background rectangle
     */
    drawBoardBackground() {
        const ctx = this.ctx;

        // Use primary color with dark overlay
        const primaryColor = this.themeColors.primary;
        const rgbColor = this.hexToRgb(primaryColor);
        const fillStyle = `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, 0.15)`;
        const strokeStyle = `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, 0.5)`;

        ctx.fillStyle = fillStyle;
        ctx.fillRect(
            this.boardX - this.boardPadding,
            this.boardY - this.boardPadding,
            this.boardWidth + (this.boardPadding * 2),
            this.boardHeight + (this.boardPadding * 2)
        );

        // Draw glowing border using primary theme color
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = 2;
        ctx.shadowColor = primaryColor;
        ctx.shadowBlur = 10;
        ctx.strokeRect(
            this.boardX - this.boardPadding,
            this.boardY - this.boardPadding,
            this.boardWidth + (this.boardPadding * 2),
            this.boardHeight + (this.boardPadding * 2)
        );
        ctx.shadowColor = 'transparent';
    },

    /**
     * Draw all gems on the board
     */
    drawAllGems() {
        for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
            for (let col = 0; col < GAME_CONFIG.COLS; col++) {
                const gemType = gameState.board[row][col];
                if (gemType) {
                    this.drawGem(row, col, gemType);
                }
            }
        }
    },

    /**
     * Draw a single gem
     * Adjacent gems to selected are scaled up with animation that restarts on each click
     */
    drawGem(row, col, gemType) {
        // Check if this gem is adjacent to the selected gem
        let isAdjacent = false;
        let scale = 1.0;
        
        if (gameState.selectedGem) {
            const { row: sRow, col: sCol } = gameState.selectedGem;
            const adjacents = [
                { row: sRow - 1, col: sCol },
                { row: sRow + 1, col: sCol },
                { row: sRow, col: sCol - 1 },
                { row: sRow, col: sCol + 1 }
            ];
            isAdjacent = adjacents.some(adj => adj.row === row && adj.col === col);
            if (isAdjacent) {
                // Use same animation as the highlight
                const timeSinceSelection = (Date.now() - gameState.highlightAnimationStartTime) / 1000;
                const pulse = Math.sin(timeSinceSelection * 3.5) * 0.5 + 0.5;
                scale = 1.15 + (pulse * 0.20); // Animate between 1.15 and 1.35
            }
        }

        const baseX = this.boardX + (col * (this.gemSize + this.gemGapSize));
        const baseY = this.boardY + (row * (this.gemSize + this.gemGapSize));
        
        const scaledSize = this.gemSize * scale;
        const offset = (scaledSize - this.gemSize) / 2;
        const x = baseX - offset;
        const y = baseY - offset;

        const ctx = this.ctx;

        // Get gem color
        const color = this.getGemColor(gemType);

        // Draw gem with rounded corners
        ctx.fillStyle = color;
        ctx.shadowColor = `rgba(${color}, 0.5)`;
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Rounded rectangle
        const radius = 4;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + scaledSize - radius, y);
        ctx.quadraticCurveTo(x + scaledSize, y, x + scaledSize, y + radius);
        ctx.lineTo(x + scaledSize, y + scaledSize - radius);
        ctx.quadraticCurveTo(x + scaledSize, y + scaledSize, x + scaledSize - radius, y + scaledSize);
        ctx.lineTo(x + radius, y + scaledSize);
        ctx.quadraticCurveTo(x, y + scaledSize, x, y + scaledSize - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();

        // Draw emoji/character (scaled with gem)
        ctx.font = `${Math.floor(scaledSize * 0.6)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'white';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 3;

        const emoji = getGemEmoji(gemType);
        ctx.fillText(emoji, x + scaledSize / 2, y + scaledSize / 2);

        // Reset shadow
        ctx.shadowColor = 'transparent';
    },

    /**
     * Draw selection highlight
     */
    drawSelectedHighlight() {
        const { row, col } = gameState.selectedGem;
        const x = this.boardX + (col * (this.gemSize + this.gemGapSize));
        const y = this.boardY + (row * (this.gemSize + this.gemGapSize));

        const ctx = this.ctx;
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 10;

        const radius = 4;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + this.gemSize - radius, y);
        ctx.quadraticCurveTo(x + this.gemSize, y, x + this.gemSize, y + radius);
        ctx.lineTo(x + this.gemSize, y + this.gemSize - radius);
        ctx.quadraticCurveTo(x + this.gemSize, y + this.gemSize, x + this.gemSize - radius, y + this.gemSize);
        ctx.lineTo(x + radius, y + this.gemSize);
        ctx.quadraticCurveTo(x, y + this.gemSize, x, y + this.gemSize - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.stroke();

        ctx.shadowColor = 'transparent';

        // Draw highlights for adjacent valid moves
        this.drawAdjacentHighlights(row, col);
    },

    /**
     * Draw highlight rings around valid adjacent gems
     * Enhanced with animated glow and scale effects that restart on each click
     */
    drawAdjacentHighlights(row, col) {
        const ctx = this.ctx;
        const adjacents = [
            { row: row - 1, col: col },
            { row: row + 1, col: col },
            { row: row, col: col - 1 },
            { row: row, col: col + 1 }
        ];

        // Calculate animation values based on time since selection - VERY dramatic
        const timeSinceSelection = (Date.now() - gameState.highlightAnimationStartTime) / 1000;
        const pulse = Math.sin(timeSinceSelection * 3.5) * 0.5 + 0.5; // Oscillates between 0 and 1
        
        // Animate scale between 1.15 and 1.35 (MUCH larger growth - 15% to 35%)
        const animatedScale = 1.15 + (pulse * 0.20);
        
        // Animate glow between 25 and 45 (VERY dramatic glow)
        const animatedGlow = 25 + (pulse * 20);
        
        // Animate line width between 5 and 9 (very thick pulse)
        const animatedLineWidth = 5 + (pulse * 4);
        
        // Animate opacity for extra drama
        const animatedAlpha = 0.8 + (pulse * 0.2); // Between 0.8 and 1.0

        for (const { row: aRow, col: aCol } of adjacents) {
            // Check if adjacent position is valid
            if (aRow < 0 || aRow >= GAME_CONFIG.ROWS || aCol < 0 || aCol >= GAME_CONFIG.COLS) {
                continue;
            }

            const ax = this.boardX + (aCol * (this.gemSize + this.gemGapSize));
            const ay = this.boardY + (aRow * (this.gemSize + this.gemGapSize));

            // Calculate scaled size and offset
            const scaledSize = this.gemSize * animatedScale;
            const offset = (scaledSize - this.gemSize) / 2;

            // Draw highlight with animated properties
            ctx.strokeStyle = `rgba(255, 215, 0, ${animatedAlpha})`;
            ctx.lineWidth = animatedLineWidth;
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = animatedGlow;

            const radius = 6; // Rounded corners
            ctx.beginPath();
            ctx.moveTo(ax - offset + radius, ay - offset);
            ctx.lineTo(ax - offset + scaledSize - radius, ay - offset);
            ctx.quadraticCurveTo(ax - offset + scaledSize, ay - offset, ax - offset + scaledSize, ay - offset + radius);
            ctx.lineTo(ax - offset + scaledSize, ay - offset + scaledSize - radius);
            ctx.quadraticCurveTo(ax - offset + scaledSize, ay - offset + scaledSize, ax - offset + scaledSize - radius, ay - offset + scaledSize);
            ctx.lineTo(ax - offset + radius, ay - offset + scaledSize);
            ctx.quadraticCurveTo(ax - offset, ay - offset + scaledSize, ax - offset, ay - offset + scaledSize - radius);
            ctx.lineTo(ax - offset, ay - offset + radius);
            ctx.quadraticCurveTo(ax - offset, ay - offset, ax - offset + radius, ay - offset);
            ctx.closePath();
            ctx.stroke();

            ctx.shadowColor = 'transparent';
        }
    },

    /**
     * Handle clicks on canvas
     */
    handleCanvasClick(e) {
        e.preventDefault();

        // Get mouse position relative to canvas
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        let x, y;
        if (e.touches) {
            x = (e.touches[0].clientX - rect.left) * scaleX;
            y = (e.touches[0].clientY - rect.top) * scaleY;
        } else {
            x = (e.clientX - rect.left) * scaleX;
            y = (e.clientY - rect.top) * scaleY;
        }

        // Unscale for DPI
        x /= this.dpi;
        y /= this.dpi;

        // Convert pixel coordinates to board row/col
        const col = Math.floor((x - this.boardX) / (this.gemSize + this.gemGapSize));
        const row = Math.floor((y - this.boardY) / (this.gemSize + this.gemGapSize));

        // Validate click is within bounds
        if (row >= 0 && row < GAME_CONFIG.ROWS && col >= 0 && col < GAME_CONFIG.COLS) {
            onGemClick(row, col);
        }
    },

    /**
     * Get color for gem type
     */
    getGemColor(gemType) {
        const colors = {
            daphne: '#8B5CF6',  // Purple
            jasper: '#EF4444',  // Red
            miles: '#3B82F6',   // Blue
            ivy: '#10B981',     // Green
            echo: '#F59E0B',    // Orange
            atlas: '#EC4899'    // Pink
        };
        return colors[gemType] || '#999999';
    },

    /**
     * Convert hex color to RGB object
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 139, g: 92, b: 246 }; // Default to purple if invalid
    },

    /**
     * Load background image asynchronously
     */
    loadBackgroundImage(imagePath) {
        if (!imagePath) {
            this.backgroundImage = null;
            return Promise.resolve(null);
        }

        // Return cached image if already loaded
        if (this.backgroundImageCache[imagePath]) {
            this.backgroundImage = this.backgroundImageCache[imagePath];
            return Promise.resolve(this.backgroundImage);
        }

        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                this.backgroundImageCache[imagePath] = img;
                this.backgroundImage = img;
                resolve(img);
            };
            img.onerror = () => {
                console.warn(`⚠️ Failed to load background image: ${imagePath}`);
                this.backgroundImage = null;
                resolve(null);
            };
            img.src = imagePath;
        });
    },

    /**
     * Apply level theme colors
     */
    applyTheme(themeConfig) {
        if (!themeConfig) return;

        if (themeConfig.primaryColor) {
            this.themeColors.primary = themeConfig.primaryColor;
        }
        if (themeConfig.secondaryColor) {
            this.themeColors.secondary = themeConfig.secondaryColor;
        }
        if (themeConfig.accentColor) {
            this.themeColors.accent = themeConfig.accentColor;
        }
        if (themeConfig.backgroundImage) {
            this.loadBackgroundImage(themeConfig.backgroundImage);
        }
        if (themeConfig.backgroundOpacity !== undefined) {
            this.backgroundOpacity = themeConfig.backgroundOpacity;
        }

        console.log(`🎨 Theme applied - Primary: ${this.themeColors.primary}`);
    },

    /**
     * Draw background image with opacity
     */
    drawBackgroundImage() {
        if (!this.backgroundImage || !this.backgroundImage.complete) {
            return;
        }

        const ctx = this.ctx;
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;

        // Save context state
        ctx.save();

        // Set opacity
        ctx.globalAlpha = this.backgroundOpacity;

        // Draw image to fill canvas while maintaining aspect ratio
        const imgAspect = this.backgroundImage.width / this.backgroundImage.height;
        const canvasAspect = canvasWidth / canvasHeight;

        let drawWidth, drawHeight, offsetX, offsetY;

        if (imgAspect > canvasAspect) {
            // Image is wider - fit to height
            drawHeight = canvasHeight;
            drawWidth = canvasHeight * imgAspect;
            offsetX = (canvasWidth - drawWidth) / 2;
            offsetY = 0;
        } else {
            // Image is taller - fit to width
            drawWidth = canvasWidth;
            drawHeight = canvasWidth / imgAspect;
            offsetX = 0;
            offsetY = (canvasHeight - drawHeight) / 2;
        }

        ctx.drawImage(
            this.backgroundImage,
            offsetX,
            offsetY,
            drawWidth,
            drawHeight
        );

        // Restore context state
        ctx.restore();
    }
};

// ═════════════════════════════════════════════════════════════════════════════
// ANIMATION SYSTEM
// ═════════════════════════════════════════════════════════════════════════════

let animationSystem = {
    activeAnimations: new Map(), // Map of "row,col" to animation state
    scorePopups: [], // Array of floating score displays
    comboOverlay: null, // Current combo overlay animation
    particles: [], // Array of active particle effects
    animationFrameId: null,

    /**
     * Register a gem animation
     * Type: 'swap', 'fall', 'spawn', 'removal'
     */
    startAnimation(row, col, type, options = {}) {
        const key = `${row},${col}`;
        const now = performance.now();

        this.activeAnimations.set(key, {
            row,
            col,
            type,
            startTime: now,
            duration: options.duration || 300,
            delay: options.delay || 0,
            targetRow: options.targetRow || row,
            targetCol: options.targetCol || col,
            easing: options.easing || 'easeInOutCubic',
            progress: 0
        });
    },

    /**
     * Update all active animations
     */
    updateAnimations(currentTime) {
        const toRemove = [];

        for (const [key, anim] of this.activeAnimations.entries()) {
            const elapsed = currentTime - anim.startTime - anim.delay;

            if (elapsed < 0) {
                // Still in delay phase
                anim.progress = 0;
            } else if (elapsed >= anim.duration) {
                // Animation complete
                anim.progress = 1;
                toRemove.push(key);
            } else {
                // In progress
                anim.progress = elapsed / anim.duration;
            }
        }

        // Remove completed animations
        toRemove.forEach(key => this.activeAnimations.delete(key));

        // Update score popups
        this.updateScorePopups(currentTime);

        // Update combo overlay
        this.updateComboOverlay(currentTime);
    },

    /**
     * Get animation progress with easing
     */
    getEasingValue(progress, easing = 'easeInOutCubic') {
        const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
        const easeInQuad = (t) => t * t;
        const easeOutQuad = (t) => t * (2 - t);
        const easeOutBounce = (t) => {
            const n1 = 7.5625, d1 = 2.75;
            if (t < 1 / d1) return n1 * t * t;
            else if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
            else if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
            else return n1 * (t -= 2.625 / d1) * t + 0.984375;
        };

        const easings = {
            easeInOutCubic, easeOutCubic, easeInQuad, easeOutQuad, easeOutBounce,
            linear: (t) => t
        };

        return (easings[easing] || easeInOutCubic)(Math.min(progress, 1));
    },

    /**
     * Create a score popup animation
     */
    createScorePopup(row, col, points) {
        const x = canvasManager.boardX + (col * (canvasManager.gemSize + canvasManager.gemGapSize)) + canvasManager.gemSize / 2;
        const y = canvasManager.boardY + (row * (canvasManager.gemSize + canvasManager.gemGapSize)) + canvasManager.gemSize / 2;

        this.scorePopups.push({
            x,
            y,
            points,
            startTime: performance.now(),
            duration: 1200 // 1.2 seconds
        });
    },

    /**
     * Update score popups
     */
    updateScorePopups(currentTime) {
        const toRemove = [];

        for (let i = 0; i < this.scorePopups.length; i++) {
            const popup = this.scorePopups[i];
            const elapsed = currentTime - popup.startTime;
            const progress = Math.max(0, elapsed / popup.duration);

            if (progress >= 1) {
                // Mark for removal
                toRemove.push(i);
            }

            // Always calculate position and opacity (even if > 1, for smooth final frame)
            popup.currentY = popup.y - (progress * 60); // Move up 60px
            popup.opacity = Math.max(0, 1 - progress); // Fade out (never negative)
        }

        // Remove completed popups (in reverse order to maintain indices)
        for (let i = toRemove.length - 1; i >= 0; i--) {
            this.scorePopups.splice(toRemove[i], 1);
        }
    },

    /**
     * Create combo overlay animation
     */
    createComboOverlay(combo) {
        const now = performance.now();
        this.comboOverlay = {
            combo,
            startTime: now,
            duration: 1500, // 1.5 seconds total
            holdDuration: 500 // Hold at full size for 500ms
        };
    },

    /**
     * Update combo overlay animation
     */
    updateComboOverlay(currentTime) {
        if (!this.comboOverlay) return;

        const elapsed = currentTime - this.comboOverlay.startTime;

        if (elapsed >= this.comboOverlay.duration) {
            // Animation complete
            this.comboOverlay = null;
        }
    },

    /**
     * Draw all active animations
     */
    drawAnimations() {
        const ctx = canvasManager.ctx;

        // Draw animating gems
        for (const [, anim] of this.activeAnimations.entries()) {
            const eased = this.getEasingValue(anim.progress, anim.easing);

            // Calculate current position based on animation type
            let currentRow = anim.row;
            let currentCol = anim.col;
            let opacity = 1;
            let scale = 1;

            switch (anim.type) {
                case 'swap':
                    // Interpolate between positions
                    currentRow = anim.row + (anim.targetRow - anim.row) * eased;
                    currentCol = anim.col + (anim.targetCol - anim.col) * eased;
                    break;

                case 'fall':
                    // Only vertical movement for falling
                    currentRow = anim.row + (anim.targetRow - anim.row) * eased;
                    break;

                case 'spawn':
                    // Scale in effect
                    scale = eased;
                    opacity = eased;
                    break;

                case 'removal':
                    // Scale and fade out
                    scale = 1 - (eased * 0.3);
                    opacity = 1 - eased;
                    break;
            }

            const gemType = gameState.board[anim.row]?.[anim.col];
            if (gemType) {
                this.drawAnimatingGem(currentRow, currentCol, gemType, scale, opacity);
            }
        }

        // Draw combo overlay
        if (this.comboOverlay) {
            this.drawComboOverlay();
        }

        // Draw score popups
        ctx.font = `bold 24px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (const popup of this.scorePopups) {
            ctx.fillStyle = `rgba(255, 215, 0, ${popup.opacity})`;
            ctx.shadowColor = `rgba(0, 0, 0, ${popup.opacity * 0.8})`;
            ctx.shadowBlur = 10;
            ctx.fillText(`+${popup.points}`, popup.x, popup.currentY);
        }

        ctx.shadowColor = 'transparent';
    },

    /**
     * Draw combo overlay animation
     */
    drawComboOverlay() {
        const ctx = canvasManager.ctx;
        const currentTime = performance.now();
        const elapsed = currentTime - this.comboOverlay.startTime;
        const { duration, holdDuration, combo } = this.comboOverlay;

        // Scale animation: 0-holdDuration = scale up, holdDuration-duration = scale down
        let scale = 1;
        let opacity = 1;

        if (elapsed < holdDuration) {
            // Scale in from small to large
            scale = 0.3 + (elapsed / holdDuration) * 0.7; // 0.3 to 1.0
        } else {
            // Hold for a bit then scale out and fade
            const fadeStart = holdDuration + 400;
            if (elapsed >= fadeStart) {
                const fadeDuration = duration - fadeStart;
                const fadeProgress = (elapsed - fadeStart) / fadeDuration;
                opacity = Math.max(0, 1 - fadeProgress);
                scale = 1 + (fadeProgress * 0.2); // Slight grow as it fades
            }
        }

        // Get combo text
        let comboText = '';
        let comboColor = '#FFD700'; // Gold
        if (combo === 2) {
            comboText = 'COMBO!';
            comboColor = '#FFA500'; // Orange
        } else if (combo === 3) {
            comboText = 'GREAT!';
            comboColor = '#FF6347'; // Tomato
        } else if (combo === 4) {
            comboText = 'AMAZING!';
            comboColor = '#FF1493'; // Deep pink
        } else if (combo >= 5) {
            comboText = 'MEGA COMBO!';
            comboColor = '#FFD700'; // Gold
        } else {
            comboText = 'COMBO!';
        }

        // Center position on board
        const centerX = canvasManager.boardX + canvasManager.boardWidth / 2;
        const centerY = canvasManager.boardY + canvasManager.boardHeight / 2;

        // Draw semi-transparent background
        const boxWidth = 250 * scale;
        const boxHeight = 100 * scale;
        ctx.fillStyle = `rgba(0, 0, 0, ${opacity * 0.6})`;
        ctx.beginPath();
        ctx.roundRect(
            centerX - boxWidth / 2,
            centerY - boxHeight / 2,
            boxWidth,
            boxHeight,
            20
        );
        ctx.fill();

        // Draw combo text
        ctx.font = `bold ${Math.floor(60 * scale)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = `rgba(${this.hexToRgb(comboColor)}, ${opacity})`;
        ctx.shadowColor = `rgba(0, 0, 0, ${opacity * 0.8})`;
        ctx.shadowBlur = 15;
        ctx.fillText(comboText, centerX, centerY - 15 * scale);

        // Draw combo multiplier
        ctx.font = `bold ${Math.floor(40 * scale)}px Arial`;
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.shadowBlur = 10;
        ctx.fillText(`x${combo}`, centerX, centerY + 25 * scale);

        ctx.shadowColor = 'transparent';
    },

    /**
     * Draw a single animating gem at intermediate position
     */
    drawAnimatingGem(row, col, gemType, scale = 1, opacity = 1) {
        const ctx = canvasManager.ctx;

        // Convert row/col (may be decimals) to pixel coordinates
        const x = canvasManager.boardX + (col * (canvasManager.gemSize + canvasManager.gemGapSize));
        const y = canvasManager.boardY + (row * (canvasManager.gemSize + canvasManager.gemGapSize));

        const gemSize = canvasManager.gemSize;
        const radius = 4;

        // Apply scale from center
        const centerX = x + gemSize / 2;
        const centerY = y + gemSize / 2;
        const scaledSize = gemSize * scale;
        const scaledX = centerX - scaledSize / 2;
        const scaledY = centerY - scaledSize / 2;

        ctx.globalAlpha = opacity;

        // Get gem color
        const color = canvasManager.getGemColor(gemType);

        // Draw gem with rounded corners
        ctx.fillStyle = color;
        ctx.shadowColor = `rgba(${this.hexToRgb(color)}, ${opacity * 0.5})`;
        ctx.shadowBlur = 10;

        // Rounded rectangle
        ctx.beginPath();
        ctx.moveTo(scaledX + radius, scaledY);
        ctx.lineTo(scaledX + scaledSize - radius, scaledY);
        ctx.quadraticCurveTo(scaledX + scaledSize, scaledY, scaledX + scaledSize, scaledY + radius);
        ctx.lineTo(scaledX + scaledSize, scaledY + scaledSize - radius);
        ctx.quadraticCurveTo(scaledX + scaledSize, scaledY + scaledSize, scaledX + scaledSize - radius, scaledY + scaledSize);
        ctx.lineTo(scaledX + radius, scaledY + scaledSize);
        ctx.quadraticCurveTo(scaledX, scaledY + scaledSize, scaledX, scaledY + scaledSize - radius);
        ctx.lineTo(scaledX, scaledY + radius);
        ctx.quadraticCurveTo(scaledX, scaledY, scaledX + radius, scaledY);
        ctx.closePath();
        ctx.fill();

        // Draw emoji
        ctx.font = `${Math.floor(scaledSize * 0.6)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.shadowColor = `rgba(0, 0, 0, ${opacity * 0.8})`;
        ctx.shadowBlur = 3;

        const emoji = getGemEmoji(gemType);
        ctx.fillText(emoji, centerX, centerY);

        ctx.globalAlpha = 1;
        ctx.shadowColor = 'transparent';
    },

    /**
     * Convert hex color to RGB string for rgba
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (result) {
            return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
        }
        return '0, 0, 0';
    },

    /**
     * Create particle effect at position
     */
    createParticles(x, y, effectType = 'sparkles', count = 8) {
        const effectConfig = {
            sparkles: {
                colors: ['#FFD700', '#FFA500', '#FF6B6B'],
                speed: 3,
                lifetime: 800,
                size: 4
            },
            mist: {
                colors: ['rgba(200, 150, 255, 0.6)', 'rgba(150, 200, 255, 0.5)'],
                speed: 1.5,
                lifetime: 1200,
                size: 8
            },
            crystals: {
                colors: ['#8B5CF6', '#EC4899', '#3B82F6'],
                speed: 2.5,
                lifetime: 1000,
                size: 6
            }
        };

        const config = effectConfig[effectType] || effectConfig.sparkles;

        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const velocity = config.speed + (Math.random() * 2 - 1);

            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                color: config.colors[Math.floor(Math.random() * config.colors.length)],
                size: config.size,
                lifetime: config.lifetime,
                age: 0,
                type: effectType
            });
        }
    },

    /**
     * Update particle effects
     */
    updateParticles(deltaTime) {
        const toRemove = [];

        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            p.age += deltaTime;
            p.x += p.vx;
            p.y += p.vy;

            // Apply gravity
            p.vy += 0.1;

            // Fade out
            p.opacity = Math.max(0, 1 - (p.age / p.lifetime));

            if (p.age >= p.lifetime) {
                toRemove.push(i);
            }
        }

        // Remove dead particles (in reverse order to preserve indices)
        for (let i = toRemove.length - 1; i >= 0; i--) {
            this.particles.splice(toRemove[i], 1);
        }
    },

    /**
     * Draw all active particles
     */
    drawParticles() {
        const ctx = canvasManager.ctx;

        for (const p of this.particles) {
            ctx.save();
            ctx.globalAlpha = p.opacity;
            ctx.fillStyle = p.color;
            ctx.beginPath();

            // Draw circles for particles
            ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    },

    /**
     * Check if any animations or popups are active
     */
    isAnimating() {
        return this.activeAnimations.size > 0 || this.scorePopups.length > 0 || this.comboOverlay !== null || this.particles.length > 0;
    }
};

// Initialize canvas when page loads
document.addEventListener('DOMContentLoaded', () => {
    if (document.readyState === 'loading') return;
    canvasManager.init();
});

// Also try to init immediately if DOM is ready
if (document.readyState === 'interactive' || document.readyState === 'complete') {
    canvasManager.init();
}

// Get responsive gem size based on viewport width
// Calculates size so 8x8 board fits perfectly with gaps
function getGemSize() {
    const width = window.innerWidth;
    const isMobile = width <= 768;

    if (isMobile) {
        // Mobile: Use fixed small gem size that fits 8 columns in constrained viewport
        // Need to account for all viewport sizes (460-530px)
        // At 470px viewport: (8 gems × 54px) + (7 gaps × 2px) + (2px padding) = 468px (fits!)
        // At 460px viewport: (8 gems × 54px) + (7 gaps × 1px) = 455px (safe!)
        // Use 52px to ensure safety margin across all mobile sizes
        const gemSize = 52;
        console.log(`📏 Mobile viewport (${width}px): Using fixed gem size ${gemSize}px to fit 8 columns safely with margins`);
        return gemSize;
    }

    // Desktop: Calculate based on viewport
    const GAP_SIZE = 1;
    const BOARD_PADDING = 2;
    const WRAPPER_PADDING = 2;
    const CONTAINER_PADDING = 2;
    const BORDER_WIDTH = 1;
    const SAFETY_MARGIN = 5;

    const totalOverhead = SAFETY_MARGIN + WRAPPER_PADDING + CONTAINER_PADDING +
                         (BOARD_PADDING * 2) + (BORDER_WIDTH * 2);

    const availableWidth = width - totalOverhead;
    const calculatedGemSize = Math.floor((availableWidth - (GAP_SIZE * 7)) / 8);
    let gemSize = Math.max(40, Math.min(calculatedGemSize, 100)); // Increased from 85 to 100 for much larger board

    console.log(`📏 Desktop viewport: ${width}px | Overhead: ${totalOverhead}px | Available: ${availableWidth}px | Calculated: ${calculatedGemSize}px | Final gem size: ${gemSize}px`);
    return gemSize;
}

// Game state
let gameState = {
    board: [],
    selectedGem: null,
    highlightAnimationStartTime: 0, // Timestamp when highlight animation started
    score: 0,
    level: 1,
    levelConfig: null, // Current level configuration (loaded from LEVELS)
    moves: Infinity,
    targetScore: null, // Primary objective target from level config
    isPaused: false,
    isAnimating: false,
    soundEnabled: true,
    combo: 0,
    totalCascades: 0, // Total cascades achieved this level (for objectives)
    history: [],
    maxCascades: 10, // Maximum cascade depth to prevent infinite loops
    currentCascadeDepth: 0,
    animationTimeout: null, // Track animation timeout for failsafe
    gemSize: 60, // Will be set dynamically by getGemSize()
    gemTypes: [] // Gem types available in this level
};

// Initialize background manager
let gameBackgroundManager = null;
if (typeof GameBackgroundManager !== 'undefined') {
    console.log('✅ GameBackgroundManager class found, initializing...');
    gameBackgroundManager = new GameBackgroundManager();
    console.log('✅ gameBackgroundManager initialized:', gameBackgroundManager);
} else {
    console.error('❌ GameBackgroundManager class not found! Check if game-background.js is loaded.');
}

/**
 * Load a specific level by level number
 */
async function loadLevel(levelNumber) {
    // Get level configuration from LEVELS array (from levels.js)
    if (typeof getLevel === 'undefined') {
        console.warn('⚠️ Level system not loaded - using default game config');
        return null;
    }

    const levelConfig = await getLevel(levelNumber);
    if (!levelConfig) {
        console.error(`❌ Level ${levelNumber} not found`);
        return null;
    }

    // Apply level configuration to game state
    gameState.level = levelNumber;
    gameState.levelConfig = levelConfig;
    gameState.moves = levelConfig.constraints.moveLimit;
    gameState.targetScore = levelConfig.objectives.primary.target;
    gameState.gemTypes = levelConfig.constraints.gemTypes;
    gameState.maxCascades = levelConfig.constraints.cascadeLimit;
    gameState.totalCascades = 0; // Reset cascade counter for new level

    // Apply visual theme (colors, background, effects)
    if (levelConfig.theme && canvasManager) {
        canvasManager.applyTheme(levelConfig.theme);
        applyContainerGradient(levelConfig.theme);
    }

    // Load background images and effects
    if (gameBackgroundManager) {
        gameBackgroundManager.loadLevelImages(levelConfig);
        
        // Set weather based on level theme or particle effect
        const weatherMap = {
            'lucky_sparkles': 'clear',
            'forest_mist': 'wind',
            'ice_crystals': 'snow',
            'battle_sparks': 'clear'
        };
        const weather = weatherMap[levelConfig.theme?.particleEffect] || 'clear';
        gameBackgroundManager.setWeather(weather);
    }

    // Update sidebar information
    updateSidebarInfo(levelConfig);

    console.log(`🎮 Level ${levelNumber} loaded: "${levelConfig.title}"`);
    console.log(`📊 Moves: ${gameState.moves}, Target Score: ${gameState.targetScore}`);
    console.log(`💎 Gem Types: ${gameState.gemTypes.join(', ')}`);
    console.log(`🎨 Theme: Primary=${levelConfig.theme.primaryColor}, Secondary=${levelConfig.theme.secondaryColor}`);

    return levelConfig;
}

/**
 * Apply animated gradient to game container based on theme colors
 * Note: Game container stays OPAQUE for readability
 */
function applyContainerGradient(theme) {
    const container = document.querySelector('.gems-game-container');
    if (!container) return;

    const primary = theme.primaryColor || '#8B5CF6';
    const secondary = theme.secondaryColor || '#EC4899';
    const accent = theme.accentColor || '#FF6B6B';

    // Convert hex to rgba - keeping HIGH opacity for container readability
    const hexToRgba = (hex, alpha) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    // Create opaque gradient with theme color tints over solid dark base
    const gradient = `
        linear-gradient(
            135deg,
            rgba(15, 15, 30, 0.98),
            ${hexToRgba(primary, 0.85)},
            ${hexToRgba(secondary, 0.85)},
            rgba(15, 15, 30, 0.98)
        )
    `;

    container.style.background = gradient;
    container.style.backgroundSize = '400% 400%';
    container.style.animation = 'gradientShift 20s ease infinite';

    // Update border glow color
    const borderColor = hexToRgba(primary, 0.6);
    container.style.borderColor = borderColor;
    container.style.boxShadow = `
        0 8px 32px ${hexToRgba(primary, 0.4)},
        inset 0 0 60px ${hexToRgba(primary, 0.15)}
    `;

    console.log(`🎨 Applied opaque animated gradient to container: ${primary} → ${secondary} → ${accent}`);
}

/**
 * Update sidebar with level information
 */
function updateSidebarInfo(levelConfig) {
    // Update left sidebar - Level Info
    const levelTitle = document.getElementById('sidebarLevelTitle');
    const levelSubtitle = document.getElementById('sidebarLevelSubtitle');
    const levelDescription = document.getElementById('sidebarLevelDescription');
    const episodeLink = document.getElementById('sidebarEpisodeLink');
    const objectives = document.getElementById('sidebarObjectives');

    if (levelTitle) levelTitle.textContent = `Level ${levelConfig.level}`;
    if (levelSubtitle) levelSubtitle.textContent = levelConfig.title;
    if (levelDescription) levelDescription.textContent = levelConfig.description;

    // Set episode link
    if (episodeLink && levelConfig.episodeKey) {
        const [season, episode] = levelConfig.episodeKey.split('/');
        const seasonNum = season.replace('season', '');
        const episodeNum = episode.replace('episode', '');
        episodeLink.href = `/season/${seasonNum}/episode/${episodeNum}`;
        episodeLink.style.display = 'inline-block';
    } else if (episodeLink) {
        episodeLink.style.display = 'none';
    }

    // Update objectives list
    if (objectives) {
        objectives.innerHTML = '';
        
        // Primary objective
        const primaryLi = document.createElement('li');
        primaryLi.textContent = levelConfig.objectives.primary.description;
        primaryLi.id = 'objectivePrimary';
        objectives.appendChild(primaryLi);

        // Secondary objectives
        if (levelConfig.objectives.secondary && levelConfig.objectives.secondary.length > 0) {
            levelConfig.objectives.secondary.forEach((obj, index) => {
                const li = document.createElement('li');
                li.textContent = obj.description;
                li.id = `objectiveSecondary${index}`;
                
                // Add progress indicator for cascades
                if (obj.type === 'cascades') {
                    li.innerHTML = `${obj.description} <span id="cascadeProgress" style="color: #fbbf24;">(0/${obj.target})</span>`;
                }
                
                objectives.appendChild(li);
            });
        }
    }
}

/**
 * Initialize a new game
 */
async function initGame(levelNumber = 1) {
    // Log page load state FIRST thing - use multiple console methods to ensure visibility
    const loadTime = performance.now();
    const isMobile = window.innerWidth <= 768;
    const timestamp = new Date().toLocaleTimeString();

    // Log initialization info
    console.log(`✅ GEMS GAME INIT - ${timestamp} - Viewport: ${window.innerWidth}px, Mobile: ${isMobile}`);
    console.log(`════════════════════════════════════════`);
    console.log(`🎮 WAVELENGTH GEMS INITIALIZING`);
    console.log(`⏱️  Load Time: ${loadTime.toFixed(0)}ms | Viewport: ${window.innerWidth}x${window.innerHeight}px | Mobile: ${isMobile}`);
    console.log(`════════════════════════════════════════`);

    // Disable collectibles while playing (keep radio visible)
    if (window.globalRadioGame && window.globalRadioGame.disableCollectiblesOnly) {
        window.globalRadioGame.disableCollectiblesOnly();
    }

    // Set responsive gem size
    gameState.gemSize = getGemSize();
    console.log(`📏 Gem size set to: ${gameState.gemSize}px (viewport width: ${window.innerWidth}px)`);

    gameState = {
        board: [],
        selectedGem: null,
        highlightAnimationStartTime: 0,
        score: 0,
        level: levelNumber,
        levelConfig: null,
        moves: Infinity,
        targetScore: null,
        isPaused: false,
        isAnimating: false,
        soundEnabled: true,
        combo: 0,
        history: [],
        maxCascades: 10,
        currentCascadeDepth: 0,
        shouldAnimateNewGems: false, // Flag to control spawn animation
        gemSize: gameState.gemSize, // Preserve the dynamically set gem size
        gemTypes: [] // Will be set by loadLevel
    };

    // Load level configuration if level system is available (AWAIT this!)
    if (typeof getLevel === 'function') {
        await loadLevel(levelNumber);
    } else {
        console.warn('⚠️ Level system not loaded - using default settings');
    }

    // Apply gem size to CSS with AGGRESSIVE overrides to break through any constraints
    // CRITICAL: Must override BOTH media query AND inline styles with !important
    const style = document.createElement('style');
    style.textContent = `
        /* FORCE mobile gem size - overrides media queries and browser defaults */
        .gem {
            width: ${gameState.gemSize}px !important;
            height: ${gameState.gemSize}px !important;
            min-width: ${gameState.gemSize}px !important;
            min-height: ${gameState.gemSize}px !important;
            max-width: ${gameState.gemSize}px !important;
            max-height: ${gameState.gemSize}px !important;
            flex: none !important;
            flex-shrink: 0 !important;
            flex-grow: 0 !important;
        }

        @media (max-width: 768px) {
            .gem {
                width: ${gameState.gemSize}px !important;
                height: ${gameState.gemSize}px !important;
                min-width: ${gameState.gemSize}px !important;
                min-height: ${gameState.gemSize}px !important;
                max-width: ${gameState.gemSize}px !important;
                max-height: ${gameState.gemSize}px !important;
                aspect-ratio: unset !important;
                flex: none !important;
                flex-shrink: 0 !important;
                flex-grow: 0 !important;
            }

            #gameBoard {
                max-width: none !important;
                width: fit-content !important;
                margin: 0 auto !important;
                overflow: visible !important;
            }

            .game-board-wrapper {
                width: 100% !important;
                max-width: 100% !important;
                overflow: visible !important;
            }

            .gems-game-container {
                width: 100% !important;
                max-width: 100% !important;
                overflow: visible !important;
            }
        }

        /* ADDITIONAL: Non-media query overrides for when media query doesn't apply */
        @supports (display: grid) {
            .gem {
                width: ${gameState.gemSize}px !important;
                height: ${gameState.gemSize}px !important;
            }
        }
    `;
    document.head.appendChild(style);
    console.log(`📐 Injected gem size CSS: ${gameState.gemSize}px (Mobile: ${window.innerWidth <= 768}px) with AGGRESSIVE !important overrides`);


    // Canvas rendering handles all layout independently - no CSS workarounds needed

    animationFrames.clear();

    // Show level briefing if available
    if (gameState.levelConfig && typeof levelBriefingUI !== 'undefined') {
        levelBriefingUI.showBriefing(gameState.levelConfig);
    }

    generateBoard();
    renderBoard();
    updateUI();
}

/**
 * Generate initial random board
 */
function generateBoard() {
    gameState.board = [];

    for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
        gameState.board[row] = [];
        for (let col = 0; col < GAME_CONFIG.COLS; col++) {
            let gemType;
            do {
                gemType = getRandomGemType();
            } while (createMatchAt(row, col, gemType));

            gameState.board[row][col] = gemType;
        }
    }
}

/**
 * Check if placing a gem would create an immediate match
 * Improved to check all four directions (left, right, up, down)
 * Only checks positions that have already been filled
 */
function createMatchAt(row, col, gemType) {
    const board = gameState.board;
    
    // Safety check: ensure row exists
    if (!board[row]) return false;
    
    // Check horizontal (left side) - only if positions exist
    if (col >= 2 && board[row][col - 1] && board[row][col - 2]) {
        if (board[row][col - 1] === gemType && board[row][col - 2] === gemType) {
            return true;
        }
    }
    
    // Check horizontal (right side) - only if positions exist
    if (col <= GAME_CONFIG.COLS - 3 && board[row][col + 1] && board[row][col + 2]) {
        if (board[row][col + 1] === gemType && board[row][col + 2] === gemType) {
            return true;
        }
    }
    
    // Check horizontal (middle) - only if positions exist
    if (col >= 1 && col <= GAME_CONFIG.COLS - 2 && board[row][col - 1] && board[row][col + 1]) {
        if (board[row][col - 1] === gemType && board[row][col + 1] === gemType) {
            return true;
        }
    }

    // Check vertical (top side) - only if positions exist
    if (row >= 2 && board[row - 1] && board[row - 2]) {
        if (board[row - 1][col] === gemType && board[row - 2][col] === gemType) {
            return true;
        }
    }
    
    // Check vertical (bottom side) - only if positions exist
    if (row <= GAME_CONFIG.ROWS - 3 && board[row + 1] && board[row + 2]) {
        if (board[row + 1][col] === gemType && board[row + 2][col] === gemType) {
            return true;
        }
    }
    
    // Check vertical (middle) - only if positions exist
    if (row >= 1 && row <= GAME_CONFIG.ROWS - 2 && board[row - 1] && board[row + 1]) {
        if (board[row - 1][col] === gemType && board[row + 1][col] === gemType) {
            return true;
        }
    }

    return false;
}

/**
 * Get random gem type
 */
function getRandomGemType() {
    // Use level-specific gem types if a level is loaded, otherwise use all gem types
    const gemTypesAvailable = gameState.gemTypes && gameState.gemTypes.length > 0
        ? gameState.gemTypes
        : GAME_CONFIG.GEM_TYPES;

    return gemTypesAvailable[Math.floor(Math.random() * gemTypesAvailable.length)];
}

/**
 * Handle gem click
 */
function onGemClick(row, col) {
    // Find the gem element to verify its actual position
    const gemElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    const actualRow = gemElement ? gemElement.dataset.row : 'NOT FOUND';
    const actualCol = gemElement ? gemElement.dataset.col : 'NOT FOUND';
    const actualType = gemElement ? gemElement.dataset.type : 'NOT FOUND';
    
    // Get the gem's position in the DOM (for CSS Grid debugging)
    const allGems = Array.from(document.querySelectorAll('.gem'));
    const domIndex = gemElement ? allGems.indexOf(gemElement) : -1;
    const expectedIndex = row * GAME_CONFIG.COLS + col; // Expected index for row-major order
    
    console.log(`🖱️ Click: [${row}][${col}] | Gem data-attrs: [${actualRow}][${actualCol}] type=${actualType} | DOM index: ${domIndex} (expected: ${expectedIndex}) | isAnimating: ${gameState.isAnimating}, isPaused: ${gameState.isPaused}`);
    
    if (gameState.isAnimating || gameState.isPaused) {
        console.log('⏸️ Click blocked -', gameState.isAnimating ? 'animating' : 'paused');
        return;
    }

    if (!gameState.selectedGem) {
        // First selection
        gameState.selectedGem = { row, col };
        gameState.highlightAnimationStartTime = Date.now(); // Reset animation timer
        highlightGem(row, col);
        console.log('✅ First gem selected:', row, col);
    } else {
        // Second selection
        const dist = Math.abs(row - gameState.selectedGem.row) + Math.abs(col - gameState.selectedGem.col);

        if (dist === 1) {
            // Adjacent gem - swap
            console.log('🔄 Swapping gems:', gameState.selectedGem, 'with', {row, col});
            unhighlightGem();
            swapGems(gameState.selectedGem.row, gameState.selectedGem.col, row, col);
            gameState.selectedGem = null;
        } else if (dist === 0) {
            // Same gem - deselect
            unhighlightGem();
            gameState.selectedGem = null;
            console.log('❌ Deselected gem');
        } else {
            // Not adjacent - select new gem
            console.log(`⚠️ Gems not adjacent! Distance: ${dist} (from [${gameState.selectedGem.row}][${gameState.selectedGem.col}] to [${row}][${col}])`);
            unhighlightGem();
            gameState.selectedGem = { row, col };
            gameState.highlightAnimationStartTime = Date.now(); // Reset animation timer
            highlightGem(row, col);
            console.log('🔄 Changed selection to:', row, col);
        }
    }
}

/**
 * Swap two gems with animation
 */
function swapGems(row1, col1, row2, col2) {
    console.log('🔄 Starting swap:', {row1, col1, row2, col2});
    
    // Capture board state before swap
    const beforeSwap = createBoardSnapshot('Before Swap');
    
    console.log('📍 Before swap:');
    console.log(`  [${row1}][${col1}] = ${gameState.board[row1][col1]}`);
    console.log(`  [${row2}][${col2}] = ${gameState.board[row2][col2]}`);
    
    gameState.isAnimating = true;
    
    // Clear any existing animation timeout
    if (gameState.animationTimeout) {
        clearTimeout(gameState.animationTimeout);
    }
    
    // Failsafe: if animation doesn't complete in 10 seconds, force reset
    gameState.animationTimeout = setTimeout(() => {
        console.error('⚠️ Animation timeout! Forcing isAnimating = false');
        gameState.isAnimating = false;
        gameState.combo = 0;
        gameState.currentCascadeDepth = 0;
        gameState.animationTimeout = null;
        updateUI();
    }, 10000);

    // Swap in board immediately
    [gameState.board[row1][col1], gameState.board[row2][col2]] =
    [gameState.board[row2][col2], gameState.board[row1][col1]];
    
    console.log('📍 After swap:');
    console.log(`  [${row1}][${col1}] = ${gameState.board[row1][col1]}`);
    console.log(`  [${row2}][${col2}] = ${gameState.board[row2][col2]}`);
    // Capture board state after swap
    const afterSwap = createBoardSnapshot('After Swap');
    compareBoardSnapshots(beforeSwap, afterSwap);

    // Save to history for undo
    gameState.history.push({
        row1, col1, row2, col2,
        gem1: gameState.board[row1][col1],
        gem2: gameState.board[row2][col2]
    });

    // Decrease moves if not infinite
    if (gameState.moves !== Infinity) {
        gameState.moves--;
    }

    // Render the swap animation
    animateSwap(row1, col1, row2, col2, () => {
        console.log('🔄 Swap animation complete, updating data attributes...');
        // After animation completes, update data attributes to match swapped data
        const gem1 = document.querySelector(`[data-row="${row1}"][data-col="${col1}"]`);
        const gem2 = document.querySelector(`[data-row="${row2}"][data-col="${col2}"]`);
        console.log('Found gem1:', gem1 ? `${gem1.dataset.row},${gem1.dataset.col} type=${gem1.dataset.type}` : 'NOT FOUND');
        console.log('Found gem2:', gem2 ? `${gem2.dataset.row},${gem2.dataset.col} type=${gem2.dataset.type}` : 'NOT FOUND');
        console.log('Board expects at [' + row1 + '][' + col1 + ']:', gameState.board[row1][col1]);
        console.log('Board expects at [' + row2 + '][' + col2 + ']:', gameState.board[row2][col2]);
        
        if (gem1) {
            console.log(`Updating gem1 from [${gem1.dataset.row}][${gem1.dataset.col}] to [${row2}][${col2}]`);
            gem1.dataset.row = row2;
            gem1.dataset.col = col2;
        }
        if (gem2) {
            console.log(`Updating gem2 from [${gem2.dataset.row}][${gem2.dataset.col}] to [${row1}][${col1}]`);
            gem2.dataset.row = row1;
            gem2.dataset.col = col1;
        }
        // Don't call renderBoard() here - wait for match detection
        // If there's a match, gravity will handle DOM reordering
        // If no match, swap-back will handle it
    });

    // Check for matches after swap animation
    setTimeout(() => {
        const matches = findMatches();

        if (matches.length > 0) {
            // Found matches - start combo at 1
            gameState.combo = 1;
            gameState.currentCascadeDepth = 0; // Reset cascade depth on new player move
            console.log('🎮 Match found! Combo reset to:', gameState.combo, 'Matches:', matches.length);
            clearAllHighlights(); // Clear highlights before animating matches
            playSound('match');
            highlightMatches(matches); // Highlight matched gems briefly
            setTimeout(() => {
                animateMatches(matches);
            }, 300); // Brief delay to show the match
        } else {
            // No match - swap back with animation
            console.log('❌ No match found, swapping back...');
            console.log('📍 Before swap-back:');
            console.log(`  [${row1}][${col1}] = ${gameState.board[row1][col1]}`);
            console.log(`  [${row2}][${col2}] = ${gameState.board[row2][col2]}`);
            
            // Show shake animation first
            showInvalidSwap(row1, col1, row2, col2);
            
            setTimeout(() => {
                [gameState.board[row1][col1], gameState.board[row2][col2]] =
                [gameState.board[row2][col2], gameState.board[row1][col1]];
                
                console.log('📍 After swap-back:');
                console.log(`  [${row1}][${col1}] = ${gameState.board[row1][col1]}`);
                console.log(`  [${row2}][${col2}] = ${gameState.board[row2][col2]}`);
                console.log('❌ No match. Combo reset to 0');
                
                gameState.combo = 0;
                playSound('invalid');
                animateSwap(row1, col1, row2, col2, () => {
                    // After swap-back animation, update data attributes back
                    const gem1 = document.querySelector(`[data-row="${row2}"][data-col="${col2}"]`);
                    const gem2 = document.querySelector(`[data-row="${row1}"][data-col="${col1}"]`);
                    if (gem1) {
                        gem1.dataset.row = row1;
                        gem1.dataset.col = col1;
                    }
                    if (gem2) {
                        gem2.dataset.row = row2;
                        gem2.dataset.col = col2;
                    }
                    // Don't call renderBoard() here - board should already be correct
                    // Data attributes are back to original positions after swap-back
                    console.log('🎨 Swap-back complete, data attributes restored');
                    gameState.isAnimating = false;
                
                    // Clear animation timeout
                    if (gameState.animationTimeout) {
                        clearTimeout(gameState.animationTimeout);
                        gameState.animationTimeout = null;
                    }
                    
                    // Clear all visual highlights since swap failed
                    clearAllHighlights();
                    
                    // Note: verifyBoardConsistency() disabled - checks DOM elements which don't exist with Canvas rendering
                });
            }, 400); // Wait for shake animation
        }
    }, GAME_CONFIG.ANIMATION_DURATION);

    // Don't call renderBoard here - let the animation system handle DOM updates
    // renderBoard() will be called after matches are cleared or swap-back completes
}

/**
 * Canvas-based swap animation
 */
function animateSwap(row1, col1, row2, col2, callback) {
    console.log(`🎬 Starting swap animation: [${row1}][${col1}] <-> [${row2}][${col2}]`);

    // Start animations for both gems
    animationSystem.startAnimation(row1, col1, 'swap', {
        duration: 300,
        targetRow: row2,
        targetCol: col2,
        easing: 'easeOutCubic'
    });

    animationSystem.startAnimation(row2, col2, 'swap', {
        duration: 300,
        targetRow: row1,
        targetCol: col1,
        easing: 'easeOutCubic'
    });

    // Start animation loop
    canvasManager.startAnimationLoop();

    // Call callback when animation completes
    setTimeout(() => {
        console.log(`✅ Swap animation complete`);
        // Clear animations
        animationSystem.activeAnimations.clear();
        canvasManager.draw();

        if (callback) callback();
    }, 300);
}

/**
 * Canvas-based match animation with removal effects
 */
function animateMatches(matches) {
    console.log(`🎯 Animating ${matches.length} matched gems`);

    // Calculate score for this match
    const matchCount = matches.length;
    const baseScore = GAME_CONFIG.BASE_POINTS * matchCount;
    const comboMultiplier = Math.max(1, gameState.combo);
    const matchScore = baseScore * comboMultiplier;

    // Update game score
    gameState.score += matchScore;

    // Start removal animations for each matched gem
    matches.forEach(({ row, col }) => {
        animationSystem.startAnimation(row, col, 'removal', {
            duration: 300,
            easing: 'easeInQuad'
        });

        // Create score popup for this gem
        const pointsPerGem = Math.floor(matchScore / matches.length);
        animationSystem.createScorePopup(row, col, pointsPerGem);
    });

    // Start animation loop
    canvasManager.startAnimationLoop();

    // After removal animation, show combo and apply gravity
    setTimeout(() => {
        console.log(`✅ Match animation complete - clearing gems`);

        // Clear the matched gems from board data
        matches.forEach(({ row, col }) => {
            gameState.board[row][col] = null;
        });

        // Clear removal animations
        animationSystem.activeAnimations.clear();
        canvasManager.draw();

        // Show combo indicator if combo > 1
        if (gameState.combo > 1) {
            console.log(`🎊 COMBO x${gameState.combo}!`);
            animationSystem.createComboOverlay(gameState.combo);
            
            // Increment total cascades (combo of 2+ means at least 1 cascade happened)
            gameState.totalCascades++;
            console.log(`🔥 Total cascades this level: ${gameState.totalCascades}`);
        }

        // Apply gravity and fill empty spaces
        setTimeout(() => {
            animateGravity();
        }, 100);
    }, 300);
}

/**
 * Show floating score popup from gem position
 */
function showScorePopup(gemElement, points) {
    const popup = document.createElement('div');
    popup.className = 'score-popup';
    popup.textContent = '+' + Math.round(points);

    const rect = gemElement.getBoundingClientRect();
    popup.style.left = (rect.left + rect.width / 2) + 'px';
    popup.style.top = (rect.top + rect.height / 2) + 'px';
    popup.style.transform = 'translate(-50%, -50%)';

    document.body.appendChild(popup);

    // Remove after animation
    setTimeout(() => popup.remove(), 800);
}

/**
 * Show combo multiplier indicator
 */
function showComboIndicator() {
    // Remove existing indicator
    const existing = document.querySelector('.combo-indicator');
    if (existing) existing.remove();

    const indicator = document.createElement('div');
    indicator.className = 'combo-indicator';
    indicator.innerHTML = `<div class="combo-text">COMBO x${gameState.combo}!</div>`;

    document.body.appendChild(indicator);

    console.log('🎊 Showing combo indicator:', gameState.combo);

    // Remove after animation (400ms for animation + 100ms display time)
    setTimeout(() => {
        if (indicator.parentNode) {
            indicator.remove();
        }
    }, 500);
}

/**
 * Canvas-based gravity animation with staggered falling
 */
function animateGravity() {
    console.log('🎬 animateGravity() called');

    // Calculate which gems fall and where
    const newBoard = [];
    for (let i = 0; i < GAME_CONFIG.ROWS; i++) {
        newBoard[i] = [];
        for (let j = 0; j < GAME_CONFIG.COLS; j++) {
            newBoard[i][j] = null;
        }
    }

    // Track movements for animation
    const movements = [];

    for (let col = 0; col < GAME_CONFIG.COLS; col++) {
        let writePos = GAME_CONFIG.ROWS - 1;

        for (let row = GAME_CONFIG.ROWS - 1; row >= 0; row--) {
            if (gameState.board[row][col] !== null) {
                const gemType = gameState.board[row][col];
                const fallDistance = writePos - row;

                if (fallDistance > 0) {
                    movements.push({
                        fromRow: row,
                        toRow: writePos,
                        col,
                        gemType,
                        fallDistance,
                        staggerDelay: col * 30 // 30ms per column
                    });
                }

                newBoard[writePos][col] = gemType;
                writePos--;
            }
        }
    }

    // If no movements needed, just fill empty spaces
    if (movements.length === 0) {
        console.log('📊 No gems need to fall, filling empty spaces...');
        gameState.board = newBoard;

        try {
            fillEmpty();

            setTimeout(() => {
                gameState.currentCascadeDepth++;

                if (gameState.currentCascadeDepth > gameState.maxCascades) {
                    console.warn('⚠️ Maximum cascade depth reached');
                    gameState.isAnimating = false;
                    gameState.combo = 0;
                    gameState.currentCascadeDepth = 0;
                    clearAllHighlights();
                    updateUI();
                    return;
                }

                const newMatches = findMatches();
                if (newMatches.length > 0) {
                    gameState.combo++;
                    console.log(`🔄 Cascade match! Combo: ${gameState.combo}`);
                    highlightMatches(newMatches);
                    setTimeout(() => animateMatches(newMatches), 300);
                } else {
                    // No more cascades - reset combo and animation state
                    gameState.combo = 0;
                    gameState.currentCascadeDepth = 0;
                    gameState.isAnimating = false;
                    clearAllHighlights();
                    updateUI();
                }
            }, 400);
        } catch (error) {
            console.error('❌ Error in fillEmpty:', error);
            gameState.isAnimating = false;
            gameState.combo = 0;
            gameState.currentCascadeDepth = 0;
            updateUI();
        }
        return;
    }

    console.log(`📊 ${movements.length} gems falling with stagger animation`);

    // Start staggered fall animations
    movements.forEach(movement => {
        setTimeout(() => {
            animationSystem.startAnimation(movement.fromRow, movement.col, 'fall', {
                duration: 500, // Increased from 300ms for slower, more satisfying fall
                targetRow: movement.toRow,
                easing: 'easeOutBounce'
            });
        }, movement.staggerDelay);
    });

    // Start animation loop
    canvasManager.startAnimationLoop();

    // Calculate total animation time
    const maxStaggerDelay = Math.max(...movements.map(m => m.staggerDelay));
    const totalAnimationTime = maxStaggerDelay + 500;

    // After animation completes, update board state and fill empty spaces
    setTimeout(() => {
        console.log('✅ Gravity animation complete');

        // Update board state with new positions
        gameState.board = newBoard;

        // Clear animations and redraw
        animationSystem.activeAnimations.clear();
        canvasManager.draw();

        // Fill empty spaces with new gems
        try {
            fillEmpty();
        } catch (error) {
            console.error('❌ Error in fillEmpty:', error);
            // Recover by setting isAnimating to false
            gameState.isAnimating = false;
            gameState.combo = 0;
            gameState.currentCascadeDepth = 0;
            updateUI();
            return;
        }

        // Check for cascade matches after filling
        // Extend timeout to ensure fillEmpty() and renderBoard() complete fully
        setTimeout(() => {
            // Increment cascade depth
            gameState.currentCascadeDepth++;

            // Safety check: prevent infinite cascades
            if (gameState.currentCascadeDepth > gameState.maxCascades) {
                console.warn('⚠️ Maximum cascade depth reached (' + gameState.maxCascades + '), stopping cascades');
                gameState.combo = 0;
                gameState.currentCascadeDepth = 0;
                gameState.isAnimating = false;

                // Clear animation timeout
                if (gameState.animationTimeout) {
                    clearTimeout(gameState.animationTimeout);
                    gameState.animationTimeout = null;
                }

                updateUI();
                return;
            }

            const newMatches = findMatches();
            if (newMatches.length > 0) {
                gameState.combo++;
                console.log('🔄 Cascade match! Combo incremented to:', gameState.combo, 'Cascade depth:', gameState.currentCascadeDepth, 'Matches:', newMatches.length);
                playSound('match');
                highlightMatches(newMatches); // Highlight before animating
                setTimeout(() => {
                    animateMatches(newMatches);
                }, 300);
            } else {
                // No more cascades - reset combo and animation state
                gameState.combo = 0;
                gameState.currentCascadeDepth = 0;
                gameState.isAnimating = false;

                // Clear animation timeout since we're done
                if (gameState.animationTimeout) {
                    clearTimeout(gameState.animationTimeout);
                    gameState.animationTimeout = null;
                }

                // Clear all highlights now that cascades are complete
                clearAllHighlights();

                // Note: verifyBoardConsistency() disabled - checks DOM elements which don't exist with Canvas rendering
                // The board consistency is now managed entirely through the internal gameState.board array

                updateUI();
            }
        }, GAME_CONFIG.ANIMATION_DURATION + 100); // Add extra buffer to ensure renderBoard completes
    }, totalAnimationTime);
}

/**
 * Fill empty spaces with new gems (avoiding immediate matches)
 * Improved to fill bottom-up to ensure all positions are validated correctly
 */
function fillEmpty() {
    let filledCount = 0;
    let nullCount = 0;
    const newlyFilledPositions = []; // Track which positions we fill
    
    // First, count how many null positions we have
    for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
        for (let col = 0; col < GAME_CONFIG.COLS; col++) {
            if (gameState.board[row][col] === null) {
                nullCount++;
            }
        }
    }
    
    console.log('🔍 fillEmpty starting: found', nullCount, 'null positions');
    
    // Fill from bottom to top, left to right to ensure proper validation
    for (let row = GAME_CONFIG.ROWS - 1; row >= 0; row--) {
        for (let col = 0; col < GAME_CONFIG.COLS; col++) {
            if (gameState.board[row][col] === null) {
                // Avoid creating immediate matches
                let gemType;
                let attemptCount = 0;
                const maxAttempts = GAME_CONFIG.GEM_TYPES.length * 10; // More reasonable max attempts
                
                do {
                    gemType = getRandomGemType();
                    attemptCount++;
                    
                    if (attemptCount > maxAttempts) {
                        // Emergency fallback: try each gem type sequentially
                        for (let i = 0; i < GAME_CONFIG.GEM_TYPES.length; i++) {
                            gemType = GAME_CONFIG.GEM_TYPES[i];
                            if (!createMatchAt(row, col, gemType)) {
                                break;
                            }
                        }
                        console.warn('⚠️ fillEmpty: Using fallback gem selection at [' + row + '][' + col + ']');
                        break;
                    }
                } while (createMatchAt(row, col, gemType));
                
                gameState.board[row][col] = gemType;
                newlyFilledPositions.push({ row, col });
                filledCount++;
            }
        }
    }
    
    console.log('📦 Filled:', filledCount, 'empty spaces (expected:', nullCount + ') at cascade depth:', gameState.currentCascadeDepth);

    // Set flag to animate new gems, then render
    gameState.shouldAnimateNewGems = true;
    renderBoard();
    gameState.shouldAnimateNewGems = false;
}

/**
 * Find all matches on the board
 */
function findMatches() {
    const matches = [];
    const visited = new Set();

    // Check horizontal matches
    for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
        for (let col = 0; col < GAME_CONFIG.COLS - 2; col++) {
            const gem = gameState.board[row][col];
            if (gem === gameState.board[row][col + 1] && gem === gameState.board[row][col + 2]) {
                const matchCells = [];
                for (let i = col; i < GAME_CONFIG.COLS && gameState.board[row][i] === gem; i++) {
                    const key = `${row},${i}`;
                    if (!visited.has(key)) {
                        matchCells.push({ row, col: i });
                        visited.add(key);
                    }
                }
                if (matchCells.length >= GAME_CONFIG.MATCH_MIN) {
                    matches.push(...matchCells);
                }
            }
        }
    }

    // Check vertical matches
    for (let col = 0; col < GAME_CONFIG.COLS; col++) {
        for (let row = 0; row < GAME_CONFIG.ROWS - 2; row++) {
            const gem = gameState.board[row][col];
            if (gem === gameState.board[row + 1][col] && gem === gameState.board[row + 2][col]) {
                const matchCells = [];
                for (let i = row; i < GAME_CONFIG.ROWS && gameState.board[i][col] === gem; i++) {
                    const key = `${i},${col}`;
                    if (!visited.has(key)) {
                        matchCells.push({ row: i, col });
                        visited.add(key);
                    }
                }
                if (matchCells.length >= GAME_CONFIG.MATCH_MIN) {
                    matches.push(...matchCells);
                }
            }
        }
    }

    return matches;
}

/**
 * Render the game board
 * Intelligently updates only what changed to preserve animations
 */
/**
 * Render the game board
 * Reorders existing gems and adds/removes as needed without flashing
 */
function renderBoard() {
    // With Canvas rendering, animations are handled differently
    // Canvas doesn't have CSS classes, so we just draw the current state
    // and let the animation loop handle transitions

    // Draw the board immediately using Canvas
    canvasManager.draw();
}

/**
 * NOTE: createGemElement is no longer needed - Canvas rendering handles all gem drawing
 * Keeping function stub for backward compatibility if any code references it
 */
function createGemElement(row, col, gemType) {
    // Canvas rendering - no DOM elements needed
    return null;
}

/**
 * Get emoji for gem type
 */
/**
 * Get emoji for gem type
 * Can be themed per level - defaults to standard gems
 */
function getGemEmoji(gemType) {
    // Check if current level has custom gem themes
    if (gameState.levelConfig && gameState.levelConfig.gemThemes) {
        const themed = gameState.levelConfig.gemThemes[gemType];
        if (themed) return themed;
    }

    // Default gem emojis
    const emojis = {
        'daphne': '💜',
        'jasper': '💙',
        'miles': '💚',
        'ivy': '💕',
        'echo': '🧡',
        'atlas': '💎'
    };
    return emojis[gemType] || '✨';
}

/**
 * Highlight selected gem (Canvas-based - just redraw with highlight)
 */
function highlightGem(row, col) {
    // Canvas rendering handles highlighting through gameState.selectedGem
    // Just redraw the board with the new selection
    canvasManager.draw();
}

/**
 * Highlight valid adjacent gems that can be swapped with (Canvas-based)
 * Note: Canvas rendering doesn't need DOM-based highlighting - stored in state
 */
function highlightValidTargets(row, col) {
    // With Canvas, adjacent gems are visually highlighted during rendering
    // Store valid targets in gameState if needed for later reference
    const adjacents = [
        { row: row - 1, col: col, dir: 'up' },
        { row: row + 1, col: col, dir: 'down' },
        { row: row, col: col - 1, dir: 'left' },
        { row: row, col: col + 1, dir: 'right' }
    ];

    const validTargets = adjacents.filter(({ row: r, col: c }) =>
        r >= 0 && r < GAME_CONFIG.ROWS && c >= 0 && c < GAME_CONFIG.COLS
    );

    canvasManager.draw();
}

/**
 * Unhighlight gem (Canvas-based)
 */
function unhighlightGem() {
    // Canvas rendering handles unhighlighting by clearing gameState.selectedGem
    canvasManager.draw();
}

/**
 * Clear all highlights and selections (Canvas-based)
 */
function clearAllHighlights() {
    gameState.selectedGem = null;
    canvasManager.draw();
}

/**
 * Toggle pause
 */
function togglePause() {
    gameState.isPaused = !gameState.isPaused;
    const pauseBtn = document.getElementById('pauseBtn');
    pauseBtn.textContent = gameState.isPaused ? '▶ Resume' : '⏸ Pause';
}

/**
 * Debug: Print board state to console
 */
function debugBoardState() {
    console.log('=== BOARD STATE DEBUG ===');
    console.log('Visual board layout:');
    
    for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
        let rowStr = `Row ${row}: `;
        for (let col = 0; col < GAME_CONFIG.COLS; col++) {
            const gemType = gameState.board[row][col];
            const emoji = getGemEmoji(gemType);
            rowStr += emoji + ' ';
        }
        console.log(rowStr);
    }
    
    console.log('\nInternal board data:');
    console.table(gameState.board);
    
    console.log('\nDOM elements:');
    const gems = document.querySelectorAll('.gem');
    console.log(`Total DOM gems: ${gems.length}`);
    
    console.log('\nDOM Order Check (for CSS Grid):');
    const allGems = Array.from(gems);
    allGems.forEach((gem, domIndex) => {
        const row = parseInt(gem.dataset.row);
        const col = parseInt(gem.dataset.col);
        const type = gem.dataset.type;
        const expectedIndex = row * GAME_CONFIG.COLS + col;
        const orderMatch = domIndex === expectedIndex ? '✅' : '❌';
        const internalType = gameState.board[row] ? gameState.board[row][col] : 'undefined';
        const typeMatch = type === internalType ? '✅' : '❌';
        console.log(`${orderMatch} DOM[${domIndex}]: data=[${row}][${col}]=${type} (exp.idx:${expectedIndex}) Internal=${internalType} ${typeMatch}`);
    });
    
    console.log('========================');
}

/**
 * Create a snapshot of the current board for debugging
 */
function createBoardSnapshot(label) {
    const snapshot = {
        label: label,
        timestamp: new Date().toISOString(),
        internalBoard: gameState.board.map(row => [...row]),
        domGems: []
    };
    
    const gems = document.querySelectorAll('.gem');
    gems.forEach(gem => {
        snapshot.domGems.push({
            row: parseInt(gem.dataset.row),
            col: parseInt(gem.dataset.col),
            type: gem.dataset.type
        });
    });
    
    return snapshot;
}

/**
 * Compare two board snapshots
 */
function compareBoardSnapshots(before, after) {
    console.log(`\n=== COMPARING: ${before.label} → ${after.label} ===`);
    
    // Compare internal boards
    let internalChanges = 0;
    for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
        for (let col = 0; col < GAME_CONFIG.COLS; col++) {
            const beforeVal = before.internalBoard[row][col];
            const afterVal = after.internalBoard[row][col];
            if (beforeVal !== afterVal) {
                console.log(`  Internal[${row}][${col}]: ${beforeVal} → ${afterVal}`);
                internalChanges++;
            }
        }
    }
    
    console.log(`Total internal changes: ${internalChanges}`);
    console.log(`DOM gems before: ${before.domGems.length}, after: ${after.domGems.length}`);
    console.log('====================================\n');
}

// Expose debug functions globally
window.debugBoardState = debugBoardState;
window.createBoardSnapshot = createBoardSnapshot;
window.compareBoardSnapshots = compareBoardSnapshots;

/**
 * Verify board consistency between DOM and internal state
 * Returns true if consistent, false if there are mismatches
 */
function verifyBoardConsistency() {
    let isConsistent = true;
    const errors = [];
    
    // Check all positions in internal board
    for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
        for (let col = 0; col < GAME_CONFIG.COLS; col++) {
            const internalGem = gameState.board[row][col];
            const domGem = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            
            if (internalGem !== null) {
                // Internal board has a gem at this position
                if (!domGem) {
                    errors.push(`❌ Missing DOM element at [${row}][${col}] (should be ${internalGem})`);
                    isConsistent = false;
                } else if (domGem.dataset.type !== internalGem) {
                    errors.push(`❌ Mismatch at [${row}][${col}]: DOM=${domGem.dataset.type}, Internal=${internalGem}`);
                    isConsistent = false;
                }
            } else {
                // Internal board has null at this position
                if (domGem) {
                    errors.push(`❌ Unexpected DOM element at [${row}][${col}] (type=${domGem.dataset.type}, should be null)`);
                    isConsistent = false;
                }
            }
        }
    }
    
    // Check for DOM gems with wrong coordinates
    const allDomGems = document.querySelectorAll('.gem');
    allDomGems.forEach(gem => {
        const row = parseInt(gem.dataset.row);
        const col = parseInt(gem.dataset.col);
        
        if (isNaN(row) || isNaN(col)) {
            errors.push(`❌ Invalid coordinates on DOM gem: row=${gem.dataset.row}, col=${gem.dataset.col}`);
            isConsistent = false;
        }
    });
    
    if (!isConsistent) {
        console.error('⚠️ BOARD CONSISTENCY CHECK FAILED:');
        errors.forEach(err => console.error(err));
        debugBoardState();
    } else {
        console.log('✅ Board consistency verified');
    }
    
    return isConsistent;
}

// Expose debug functions globally
window.debugBoardState = debugBoardState;
window.verifyBoardConsistency = verifyBoardConsistency;

/**
 * Toggle sound
 */
function toggleSound() {
    gameState.soundEnabled = !gameState.soundEnabled;
    const soundBtn = document.getElementById('soundBtn');
    soundBtn.textContent = gameState.soundEnabled ? '🔊 Sound On' : '🔇 Sound Off';
}

/**
 * Play sound effect
 */
function playSound(type) {
    if (!gameState.soundEnabled) return;

    // Create audio context for simple beep sounds
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        switch (type) {
            case 'match':
                oscillator.frequency.value = 800;
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.2);
                break;
            case 'invalid':
                oscillator.frequency.value = 300;
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.1);
                break;
        }
    } catch (e) {
        console.log('Audio not available');
    }
}

/**
 * Update UI displays
 */
function updateUI() {
    document.getElementById('scoreDisplay').textContent = gameState.score.toLocaleString();
    document.getElementById('levelDisplay').textContent = gameState.level;
    document.getElementById('movesDisplay').textContent = gameState.moves === Infinity ? '∞' : gameState.moves;
    
    // Update target score display if element exists
    const targetDisplay = document.getElementById('targetDisplay');
    if (targetDisplay && gameState.targetScore) {
        targetDisplay.textContent = gameState.targetScore.toLocaleString();
    }
    
    // Update cascades display if there's a cascade objective
    updateCascadesDisplay();
    
    // Check for level completion after UI update
    checkLevelCompletion();
}

/**
 * Update cascades counter in UI
 */
function updateCascadesDisplay() {
    const cascadesStat = document.getElementById('cascadesStat');
    const cascadesDisplay = document.getElementById('cascadesDisplay');
    const cascadesTarget = document.getElementById('cascadesTarget');
    
    if (!cascadesStat || !cascadesDisplay || !cascadesTarget) return;
    
    // Check if current level has cascade objective
    if (gameState.levelConfig && gameState.levelConfig.objectives.secondary) {
        const cascadeObjective = gameState.levelConfig.objectives.secondary.find(obj => obj.type === 'cascades');
        
        if (cascadeObjective) {
            // Show cascades stat
            cascadesStat.style.display = '';
            cascadesDisplay.textContent = gameState.totalCascades;
            cascadesTarget.textContent = ` / ${cascadeObjective.target}`;
            
            // Highlight when objective is met
            if (gameState.totalCascades >= cascadeObjective.target) {
                cascadesDisplay.style.color = '#10b981'; // Green
                cascadesDisplay.style.fontWeight = 'bold';
            } else {
                cascadesDisplay.style.color = '';
                cascadesDisplay.style.fontWeight = '';
            }
            
            // Update sidebar cascade progress
            const cascadeProgress = document.getElementById('cascadeProgress');
            if (cascadeProgress) {
                cascadeProgress.textContent = `(${gameState.totalCascades}/${cascadeObjective.target})`;
                if (gameState.totalCascades >= cascadeObjective.target) {
                    cascadeProgress.style.color = '#10b981'; // Green when complete
                    cascadeProgress.style.fontWeight = 'bold';
                }
            }
            
            return;
        }
    }
    
    // Hide if no cascade objective
    cascadesStat.style.display = 'none';
}

/**
 * Check if level objectives have been met
 */
function checkLevelCompletion() {
    if (!gameState.levelConfig) return;
    
    const primary = gameState.levelConfig.objectives.primary;
    
    // Check if primary objective is met
    let objectiveMet = false;
    switch (primary.type) {
        case 'score':
            objectiveMet = gameState.score >= primary.target;
            break;
        case 'matches':
            // Would need to track match count
            break;
        case 'cascades':
            // Would need to track cascade count
            break;
    }
    
    // Level complete!
    if (objectiveMet && !gameState.isPaused) {
        onLevelComplete();
    }
    
    // Level failed - out of moves without reaching objective
    if (gameState.moves <= 0 && !objectiveMet && !gameState.isPaused) {
        onLevelFailed();
    }
}

/**
 * Handle level completion
 */
function onLevelComplete() {
    gameState.isPaused = true;
    
    console.log('🎉 Level Complete!');
    console.log(`   Score: ${gameState.score}`);
    console.log(`   Moves Remaining: ${gameState.moves}`);
    
    // Calculate stars (1-3 based on performance)
    const stars = calculateStars();
    
    // Submit score to Firebase
    submitScoreToFirebase();
    
    // Save level progress to Firebase
    saveLevelProgress(stars, true);
    
    // Show completion modal
    showLevelCompleteModal(stars);
}

/**
 * Handle level failure
 */
function onLevelFailed() {
    gameState.isPaused = true;
    
    console.log('😢 Level Failed - Out of moves');
    console.log(`   Final Score: ${gameState.score}`);
    console.log(`   Target Score: ${gameState.targetScore}`);
    
    // Show failure modal
    showLevelFailedModal();
}

/**
 * Calculate star rating (1-3) based on performance
 */
function calculateStars() {
    if (!gameState.levelConfig) return 1;
    
    const targetScore = gameState.targetScore;
    const actualScore = gameState.score;
    
    // 3 stars: 150% or more of target
    if (actualScore >= targetScore * 1.5) return 3;
    
    // 2 stars: 120% or more of target
    if (actualScore >= targetScore * 1.2) return 2;
    
    // 1 star: reached target
    return 1;
}

/**
 * Update score with count-up animation
 */
function updateScoreAnimated(points) {
    const oldScore = gameState.score;
    gameState.score += points;
    const newScore = gameState.score;
    
    const scoreElement = document.getElementById('scoreDisplay');
    const duration = 300; // ms
    const steps = 20;
    const increment = (newScore - oldScore) / steps;
    const stepDuration = duration / steps;
    
    let currentStep = 0;
    const interval = setInterval(() => {
        currentStep++;
        const displayScore = Math.floor(oldScore + (increment * currentStep));
        scoreElement.textContent = displayScore.toLocaleString();
        
        if (currentStep >= steps) {
            clearInterval(interval);
            scoreElement.textContent = newScore.toLocaleString();
        }
    }, stepDuration);
}

/**
 * Submit score to Firebase
 */
async function submitScoreToFirebase() {
    try {
        const token = await getFirebaseToken();
        if (!token) {
            console.log('No auth token available, skipping score submission');
            return;
        }

        const response = await fetch('/api/games/scores/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                gameId: 'wavelength-gems',
                score: gameState.score,
                level: gameState.level,
                combo: gameState.combo,
                timestamp: new Date().toISOString()
            })
        });

        const data = await response.json();
        if (data.success) {
            console.log('Score submitted successfully', data);
            if (data.newHighScore) {
                showNotification('🎉 New high score!');
            }
        } else {
            console.error('Failed to submit score:', data.error);
        }
    } catch (error) {
        console.error('Error submitting score:', error);
    }
}

/**
 * Save level progression to Firebase
 * Tracks completion, best score, stars earned for each level
 */
async function saveLevelProgress(stars, completed = true) {
    try {
        const token = await getFirebaseToken();
        if (!token) {
            console.log('No auth token available, skipping level progress save');
            return;
        }

        const progressData = {
            levelId: gameState.level,
            status: completed ? 'completed' : 'in_progress',
            score: gameState.score,
            stars: stars,
            movesUsed: (gameState.levelConfig?.constraints.moveLimit || 0) - gameState.moves,
            combo: gameState.combo,
            timestamp: new Date().toISOString()
        };

        const response = await fetch('/api/games/wavelength-gems/level-progress', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(progressData)
        });

        const data = await response.json();
        if (data.success) {
            console.log('✅ Level progress saved:', progressData);
            return data;
        } else {
            console.error('Failed to save level progress:', data.error);
        }
    } catch (error) {
        console.error('Error saving level progress:', error);
    }
    return null;
}

/**
 * Load user's level progress from Firebase
 */
async function loadLevelProgress() {
    try {
        const token = await getFirebaseToken();
        if (!token) return null;

        const response = await fetch('/api/games/wavelength-gems/level-progress', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        // Check if response is ok before parsing JSON
        if (!response.ok) {
            if (response.status === 404) {
                console.log('📊 No level progress found yet (new player)');
                return null;
            }
            console.warn(`⚠️ Failed to load level progress: ${response.status} ${response.statusText}`);
            return null;
        }

        const data = await response.json();
        if (data.success) {
            console.log('📊 Level progress loaded:', data.progress);
            return data.progress;
        }
    } catch (error) {
        console.error('Error loading level progress:', error);
    }
    return null;
}

/**
 * Get Firebase ID token
 */
async function getFirebaseToken() {
    try {
        if (window.firebaseAuth && window.firebaseAuth.currentUser) {
            return await window.firebaseAuth.currentUser.getIdToken();
        }
    } catch (error) {
        console.error('Error getting Firebase token:', error);
    }
    return null;
}

/**
 * Load user stats from Firebase
 */
async function loadUserStats() {
    try {
        const token = await getFirebaseToken();
        if (!token) return;

        const response = await fetch('/api/games/wavelength-gems/user-stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (data.success) {
            gameState.userStats = data.stats;
            console.log('User stats loaded:', data.stats);
        }
    } catch (error) {
        console.error('Error loading user stats:', error);
    }
}

/**
 * Show notification
 */
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #8b5cf6, #6366f1);
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        font-weight: bold;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

/**
 * Highlight matched gems before removal
 */
function highlightMatches(matches) {
    matches.forEach(match => {
        const gem = document.querySelector(`[data-row="${match.row}"][data-col="${match.col}"]`);
        if (gem) {
            gem.classList.add('matched');
        }
    });
}

/**
 * Show invalid swap animation
 */
function showInvalidSwap(row1, col1, row2, col2) {
    const gem1 = document.querySelector(`[data-row="${row1}"][data-col="${col1}"]`);
    const gem2 = document.querySelector(`[data-row="${row2}"][data-col="${col2}"]`);
    
    if (gem1) gem1.classList.add('invalid-swap');
    if (gem2) gem2.classList.add('invalid-swap');
    
    setTimeout(() => {
        if (gem1) gem1.classList.remove('invalid-swap');
        if (gem2) gem2.classList.remove('invalid-swap');
    }, 400);
}

/**
 * Show floating points text
 */
function showFloatingPoints(points, row, col) {
    const boardElement = document.getElementById('gameBoard');
    const gem = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    
    if (!gem || !boardElement) return;
    
    const rect = gem.getBoundingClientRect();
    const boardRect = boardElement.getBoundingClientRect();
    
    const floatingText = document.createElement('div');
    floatingText.className = 'floating-points';
    floatingText.textContent = `+${points}`;
    floatingText.style.left = `${rect.left - boardRect.left + rect.width/2}px`;
    floatingText.style.top = `${rect.top - boardRect.top}px`;
    
    boardElement.appendChild(floatingText);
    
    setTimeout(() => {
        floatingText.remove();
    }, 1000);
}

/**
 * Show combo multiplier indicator
 */
function showComboIndicator(combo) {
    if (combo <= 1) return;
    
    const boardElement = document.getElementById('gameBoard');
    if (!boardElement) return;
    
    const comboText = document.createElement('div');
    comboText.className = 'combo-indicator';
    
    if (combo === 2) comboText.textContent = 'COMBO! 2x';
    else if (combo === 3) comboText.textContent = 'GREAT! 3x';
    else if (combo === 4) comboText.textContent = 'AMAZING! 4x';
    else comboText.textContent = `MEGA! ${combo}x`;
    
    boardElement.appendChild(comboText);
    
    setTimeout(() => {
        comboText.remove();
    }, 600);
}

/**
 * Show notification
 */
function showNotification_old(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #8b5cf6, #6366f1);
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        font-weight: bold;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out forwards';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * End game and submit score
 */
function endGame() {
    gameState.isPaused = true;
    submitScoreToFirebase();
}

/**
 * Show Goblin Glitch Easter Egg
 * "It's not a bug, it's a goblin!" 
 * Appears IN the hole at the bottom of the game board
 */
function showGoblinGlitch() {
    console.log('👹 showGoblinGlitch() called!');
    
    // Get the game board wrapper (parent of the board)
    const boardWrapper = document.querySelector('.game-board-wrapper');
    if (!boardWrapper) {
        console.error('❌ Could not find .game-board-wrapper');
        return;
    }
    
    // Remove any existing goblin
    const existingGoblin = document.querySelector('.goblin-glitch');
    const existingTooltip = document.querySelector('.goblin-tooltip');
    if (existingGoblin) existingGoblin.remove();
    if (existingTooltip) existingTooltip.remove();
    
    // Create goblin container
    const goblin = document.createElement('div');
    goblin.className = 'goblin-glitch';
    
    // Random goblin image
    const randomImage = GAME_CONFIG.GOBLIN_IMAGES[Math.floor(Math.random() * GAME_CONFIG.GOBLIN_IMAGES.length)];
    goblin.innerHTML = `<img src="${randomImage}" alt="Mischievous Goblin">`;
    
    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'goblin-tooltip';
    const randomMessage = GAME_CONFIG.GOBLIN_MESSAGES[Math.floor(Math.random() * GAME_CONFIG.GOBLIN_MESSAGES.length)];
    tooltip.textContent = randomMessage;
    
    // Add to game board wrapper (so it appears over the board)
    boardWrapper.appendChild(goblin);
    boardWrapper.appendChild(tooltip);
    
    console.log('👹 Goblin elements added to DOM');
    
    // Animate in
    requestAnimationFrame(() => {
        goblin.classList.add('active');
        tooltip.classList.add('active');
        console.log('👹 Goblin animated in!');
        
        // Add glitch shake
        setTimeout(() => {
            goblin.classList.add('glitching');
        }, 200);
    });
    
    // Remove after 3 seconds
    setTimeout(() => {
        goblin.classList.remove('active', 'glitching');
        tooltip.classList.remove('active');
        
        setTimeout(() => {
            goblin.remove();
            tooltip.remove();
            console.log('👹 Goblin removed');
        }, 500);
    }, 3000);
    
    console.log('👹 Goblin glitch easter egg triggered!');
}

// ═════════════════════════════════════════════════════════════════════════════
// LEVEL COMPLETION MODALS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Show level complete modal with stars and next level option
 */
function showLevelCompleteModal(stars) {
    const modal = document.createElement('div');
    modal.id = 'levelCompleteModal';
    modal.className = 'level-modal';
    
    const nextLevel = getNextLevel(gameState.level);
    const hasNextLevel = nextLevel !== null;
    
    modal.innerHTML = `
        <div class="level-modal-content">
            <h2>🎉 Level Complete!</h2>
            <div class="level-complete-stats">
                <div class="stars-display">
                    ${generateStarsHTML(stars)}
                </div>
                <div class="stat-row">
                    <span class="stat-label">Score:</span>
                    <span class="stat-value">${gameState.score.toLocaleString()}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Target:</span>
                    <span class="stat-value">${gameState.targetScore.toLocaleString()}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Moves Left:</span>
                    <span class="stat-value">${gameState.moves}</span>
                </div>
            </div>
            <div class="level-modal-buttons">
                ${hasNextLevel ? `<button class="btn btn-primary" onclick="loadNextLevel()">Next Level →</button>` : ''}
                <button class="btn btn-secondary" onclick="retryLevel()">↻ Retry</button>
                <button class="btn btn-secondary" onclick="returnToMenu()">← Menu</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Animate in
    setTimeout(() => modal.classList.add('active'), 10);
}

/**
 * Show level failed modal
 */
function showLevelFailedModal() {
    const modal = document.createElement('div');
    modal.id = 'levelFailedModal';
    modal.className = 'level-modal';
    
    const shortfall = gameState.targetScore - gameState.score;
    
    modal.innerHTML = `
        <div class="level-modal-content failed">
            <h2>😢 Level Failed</h2>
            <div class="level-complete-stats">
                <p class="failure-message">Out of moves!</p>
                <div class="stat-row">
                    <span class="stat-label">Your Score:</span>
                    <span class="stat-value">${gameState.score.toLocaleString()}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Target:</span>
                    <span class="stat-value">${gameState.targetScore.toLocaleString()}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Needed:</span>
                    <span class="stat-value">${shortfall.toLocaleString()} more</span>
                </div>
            </div>
            <div class="level-modal-buttons">
                <button class="btn btn-primary" onclick="retryLevel()">↻ Try Again</button>
                <button class="btn btn-secondary" onclick="returnToMenu()">← Menu</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Animate in
    setTimeout(() => modal.classList.add('active'), 10);
}

/**
 * Generate stars HTML
 */
function generateStarsHTML(stars) {
    const totalStars = 3;
    let html = '';
    for (let i = 0; i < totalStars; i++) {
        if (i < stars) {
            html += '<span class="star filled">⭐</span>';
        } else {
            html += '<span class="star empty">☆</span>';
        }
    }
    return html;
}

/**
 * Load next level
 */
async function loadNextLevel() {
    const nextLevel = await getNextLevel(gameState.level);
    if (nextLevel) {
        closeLevelModal();
        await initGame(nextLevel.level);
    }
}

/**
 * Retry current level
 */
async function retryLevel() {
    closeLevelModal();
    await initGame(gameState.level);
}

/**
 * Return to level selection menu
 */
function returnToMenu() {
    closeLevelModal();
    showLevelSelectionMenu();
}

/**
 * Close level completion modal
 */
function closeLevelModal() {
    const modal = document.getElementById('levelCompleteModal') || document.getElementById('levelFailedModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
}

/**
 * Show level selection menu with progress indicators
 */
async function showLevelSelectionMenu() {
    const modal = document.createElement('div');
    modal.id = 'levelSelectionModal';
    modal.className = 'level-modal';
    
    // Show loading state
    modal.innerHTML = `
        <div class="level-modal-content wide">
            <h2>🎮 Select Level</h2>
            <p style="text-align: center; color: rgba(255,255,255,0.8);">Loading levels...</p>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
    
    // Load user's level progress
    const userProgress = await loadLevelProgress() || {};
    
    // Build completed levels array for unlocking check
    const completedLevels = Object.keys(userProgress)
        .filter(levelNum => userProgress[levelNum]?.status === 'completed')
        .map(levelNum => parseInt(levelNum));
    
    const allLevels = await getAllLevels();
    const levelsHTML = allLevels.map(level => {
        const levelProgress = userProgress[level.level];
        const stars = levelProgress?.bestStars || 0;
        const completed = levelProgress?.status === 'completed';
        const starsHTML = generateStarsHTML(stars);
        
        // Check if level is unlocked (Level 1 always unlocked, others need previous completed)
        const isUnlocked = level.level === 1 || completedLevels.includes(level.level - 1);
        
        // If locked, show a different button style
        if (!isUnlocked) {
            return `
                <button class="level-button locked" disabled>
                    <div class="level-number">Level ${level.level}</div>
                    <div class="level-title">${level.title}</div>
                    <div class="level-locked">🔒 Locked</div>
                    <div class="level-unlock-hint">Complete Level ${level.level - 1}</div>
                </button>
            `;
        }
        
        return `
            <button class="level-button ${completed ? 'completed' : ''}" onclick="startLevel(${level.level})">
                <div class="level-number">Level ${level.level}</div>
                <div class="level-title">${level.title}</div>
                <div class="level-difficulty">${level.difficulty}</div>
                ${completed ? `<div class="level-stars">${starsHTML}</div>` : ''}
                ${levelProgress?.bestScore ? `<div class="level-best-score">Best: ${levelProgress.bestScore.toLocaleString()}</div>` : ''}
            </button>
        `;
    }).join('');
    
    // Update modal content
    modal.querySelector('.level-modal-content').innerHTML = `
        <h2>🎮 Select Level</h2>
        <div class="level-selection-grid">
            ${levelsHTML}
        </div>
        <div class="level-modal-buttons">
            <button class="btn btn-secondary" onclick="closeLevelSelectionModal()">Cancel</button>
        </div>
    `;
}

/**
 * Start a specific level
 */
async function startLevel(levelNumber) {
    closeLevelSelectionModal();
    await initGame(levelNumber);
}

/**
 * Close level selection modal
 */
function closeLevelSelectionModal() {
    const modal = document.getElementById('levelSelectionModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
}

// Make functions available globally
window.loadNextLevel = loadNextLevel;
window.retryLevel = retryLevel;
window.returnToMenu = returnToMenu;
window.startLevel = startLevel;
window.closeLevelSelectionModal = closeLevelSelectionModal;
window.showLevelSelectionMenu = showLevelSelectionMenu;

