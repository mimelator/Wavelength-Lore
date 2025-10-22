/**
 * Level Briefing Modal & UI System
 * Displays level information, lore, and objectives before gameplay
 */

const levelBriefingUI = {
    /**
     * Create and show the level briefing modal
     */
    showBriefing(levelConfig) {
        if (!levelConfig) return;

        // Create modal container
        const modal = document.createElement('div');
        modal.id = 'levelBriefingModal';
        modal.className = 'level-briefing-modal';
        modal.innerHTML = this.generateBriefingHTML(levelConfig);

        // Add to DOM
        document.body.appendChild(modal);

        // Add event listeners
        const closeBtn = modal.querySelector('.briefing-close');
        const playBtn = modal.querySelector('.briefing-play-btn');
        if (closeBtn) closeBtn.addEventListener('click', () => this.closeBriefing());
        if (playBtn) playBtn.addEventListener('click', () => this.closeBriefing());

        // Add carousel handlers if present
        const carouselPrev = modal.querySelector('.carousel-prev');
        const carouselNext = modal.querySelector('.carousel-next');
        const dots = modal.querySelectorAll('.carousel-dot');

        if (carouselPrev || carouselNext) {
            if (carouselPrev) carouselPrev.addEventListener('click', () => this.previousImage(modal));
            if (carouselNext) carouselNext.addEventListener('click', () => this.nextImage(modal));

            // Add dot click handlers
            modal.querySelectorAll('.dot').forEach((dot, idx) => {
                dot.addEventListener('click', () => this.goToImage(modal, idx));
            });
        }

        // Show with animation
        setTimeout(() => modal.classList.add('show'), 10);

        console.log(`📖 Showing briefing for Level ${levelConfig.level}: "${levelConfig.title}"`);
    },

    /**
     * Move to next carousel image
     */
    nextImage(modal) {
        const images = modal.querySelectorAll('.carousel-image');
        const currentIdx = Array.from(images).findIndex(img => img.classList.contains('active'));
        const nextIdx = (currentIdx + 1) % images.length;
        this.goToImage(modal, nextIdx);
    },

    /**
     * Move to previous carousel image
     */
    previousImage(modal) {
        const images = modal.querySelectorAll('.carousel-image');
        const currentIdx = Array.from(images).findIndex(img => img.classList.contains('active'));
        const prevIdx = (currentIdx - 1 + images.length) % images.length;
        this.goToImage(modal, prevIdx);
    },

    /**
     * Go to specific carousel image
     */
    goToImage(modal, index) {
        const images = modal.querySelectorAll('.carousel-image');
        const dots = modal.querySelectorAll('.dot');

        // Remove active class from all
        images.forEach(img => img.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));

        // Add active class to selected
        if (images[index]) images[index].classList.add('active');
        if (dots[index]) dots[index].classList.add('active');
    },

    /**
     * Close the level briefing modal
     */
    closeBriefing() {
        const modal = document.getElementById('levelBriefingModal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
    },

    /**
     * Generate HTML for briefing modal
     */
    generateBriefingHTML(levelConfig) {
        const theme = levelConfig.theme || {};
        const bgColor = theme.primaryColor || '#8B5CF6';
        const briefing = levelConfig.narrative?.briefing || 'Begin your quest...';
        const title = levelConfig.title || 'Level';
        const difficulty = levelConfig.difficulty || 'medium';
        const carouselImages = theme.carouselImages || (theme.backgroundImage ? [theme.backgroundImage] : []);

        return `
            <div class="briefing-overlay"></div>
            <div class="briefing-content" style="--primary-color: ${bgColor};">
                <div class="briefing-header">
                    <h1 class="briefing-title">${title}</h1>
                    <button class="briefing-close">&times;</button>
                </div>

                <div class="briefing-body">
                    <div class="briefing-image-section">
                        ${carouselImages.length > 0 ? `
                            <div class="briefing-carousel">
                                <div class="carousel-images">
                                    ${carouselImages.map((img, idx) => `
                                        <img src="${img}" alt="Gallery ${idx + 1}" class="carousel-image ${idx === 0 ? 'active' : ''}">
                                    `).join('')}
                                </div>
                                ${carouselImages.length > 1 ? `
                                    <button class="carousel-prev">❮</button>
                                    <button class="carousel-next">❯</button>
                                    <div class="carousel-dots">
                                        ${carouselImages.map((_, idx) => `
                                            <span class="dot ${idx === 0 ? 'active' : ''}" data-index="${idx}"></span>
                                        `).join('')}
                                    </div>
                                ` : ''}
                            </div>
                        ` : `
                            <div class="briefing-placeholder">📖</div>
                        `}
                    </div>

                    <div class="briefing-info">
                        <div class="briefing-meta">
                            <span class="meta-item">Level ${levelConfig.level}</span>
                            <span class="meta-item difficulty-${difficulty}">${difficulty.toUpperCase()}</span>
                            ${levelConfig.season ? `<span class="meta-item">Season ${levelConfig.season}</span>` : ''}
                        </div>

                        <p class="briefing-text">${briefing}</p>

                        ${this.generateObjectives(levelConfig.objectives)}
                    </div>
                </div>

                <div class="briefing-footer">
                    <button class="briefing-play-btn">Begin Level</button>
                </div>
            </div>
        `;
    },

    /**
     * Generate objectives HTML
     */
    generateObjectives(objectives) {
        if (!objectives) return '';

        let html = '<div class="briefing-objectives">';

        if (objectives.primary) {
            html += `
                <div class="objective primary">
                    <span class="objective-icon">🎯</span>
                    <div>
                        <div class="objective-title">Primary Objective</div>
                        <div class="objective-desc">${objectives.primary.description || 'Complete the level'}</div>
                    </div>
                </div>
            `;
        }

        if (objectives.secondary && objectives.secondary.length > 0) {
            objectives.secondary.forEach((obj, idx) => {
                html += `
                    <div class="objective secondary">
                        <span class="objective-icon">✨</span>
                        <div>
                            <div class="objective-title">Bonus ${idx + 1}</div>
                            <div class="objective-desc">${obj.description || 'Complete bonus objective'}</div>
                        </div>
                    </div>
                `;
            });
        }

        html += '</div>';
        return html;
    },

    /**
     * Show quick briefing overlay (minimal version)
     */
    showQuickBriefing(levelConfig, duration = 3000) {
        if (!levelConfig) return;

        const overlay = document.createElement('div');
        overlay.className = 'quick-briefing';
        overlay.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid ${levelConfig.theme?.primaryColor || '#8B5CF6'};
            border-radius: 8px;
            padding: 20px 40px;
            color: white;
            text-align: center;
            z-index: 1000;
            font-size: 24px;
            font-weight: bold;
            animation: fadeInScale 0.3s ease-out;
        `;

        overlay.innerHTML = `
            ${levelConfig.title}
        `;

        document.body.appendChild(overlay);

        setTimeout(() => {
            overlay.style.animation = 'fadeOutScale 0.3s ease-out forwards';
            setTimeout(() => overlay.remove(), 300);
        }, duration);
    }
};

// Inject CSS styles for briefing UI
function injectBriefingStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Level Briefing Modal */
        .level-briefing-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .briefing-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            animation: fadeIn 0.3s ease-out;
        }

        .briefing-content {
            position: relative;
            background: linear-gradient(135deg, rgba(30, 30, 50, 0.95) 0%, rgba(40, 40, 60, 0.95) 100%);
            border: 2px solid var(--primary-color);
            border-radius: 12px;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
            animation: slideUp 0.3s ease-out;
        }

        .briefing-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid var(--primary-color);
        }

        .briefing-title {
            font-size: 28px;
            color: var(--primary-color);
            margin: 0;
            font-weight: bold;
        }

        .briefing-close {
            background: none;
            border: none;
            color: var(--primary-color);
            font-size: 32px;
            cursor: pointer;
            padding: 0;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s;
        }

        .briefing-close:hover {
            transform: scale(1.2);
        }

        .briefing-body {
            padding: 20px;
            display: flex;
            gap: 20px;
        }

        .briefing-image-section {
            flex-shrink: 0;
            width: 150px;
            height: 150px;
            border-radius: 8px;
            overflow: hidden;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--primary-color);
        }

        .briefing-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .briefing-placeholder {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 60px;
        }

        /* Carousel Styles */
        .briefing-carousel {
            position: relative;
            width: 100%;
            height: 100%;
        }

        .carousel-images {
            position: relative;
            width: 100%;
            height: 100%;
        }

        .carousel-image {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
        }

        .carousel-image.active {
            opacity: 1;
        }

        .carousel-prev,
        .carousel-next {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(0, 0, 0, 0.5);
            color: white;
            border: none;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            z-index: 10;
        }

        .carousel-prev:hover,
        .carousel-next:hover {
            background: rgba(0, 0, 0, 0.8);
            transform: translateY(-50%) scale(1.1);
        }

        .carousel-prev {
            left: 5px;
        }

        .carousel-next {
            right: 5px;
        }

        .carousel-dots {
            position: absolute;
            bottom: 8px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 6px;
            z-index: 10;
        }

        .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.5);
            cursor: pointer;
            transition: all 0.2s;
            border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .dot:hover {
            background: rgba(255, 255, 255, 0.7);
        }

        .dot.active {
            background: white;
            width: 10px;
            height: 10px;
            border-color: white;
        }

        .briefing-info {
            flex: 1;
            min-width: 0;
        }

        .briefing-meta {
            display: flex;
            gap: 12px;
            margin-bottom: 12px;
            flex-wrap: wrap;
        }

        .meta-item {
            font-size: 12px;
            padding: 4px 10px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
            color: #ddd;
            text-transform: uppercase;
            font-weight: 600;
        }

        .meta-item.difficulty-easy {
            background: rgba(16, 185, 129, 0.2);
            color: #4ade80;
        }

        .meta-item.difficulty-medium {
            background: rgba(245, 158, 11, 0.2);
            color: #fbbf24;
        }

        .meta-item.difficulty-hard {
            background: rgba(239, 68, 68, 0.2);
            color: #f87171;
        }

        .meta-item.difficulty-expert {
            background: rgba(168, 85, 247, 0.2);
            color: #d8b4fe;
        }

        .briefing-text {
            color: #ccc;
            font-size: 14px;
            line-height: 1.6;
            margin: 0 0 16px 0;
        }

        .briefing-objectives {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .objective {
            display: flex;
            gap: 10px;
            padding: 10px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 6px;
            border-left: 3px solid var(--primary-color);
        }

        .objective.secondary {
            border-left-color: #f59e0b;
            opacity: 0.9;
        }

        .objective-icon {
            font-size: 18px;
            flex-shrink: 0;
        }

        .objective-title {
            font-size: 12px;
            font-weight: bold;
            color: var(--primary-color);
            text-transform: uppercase;
        }

        .objective-desc {
            font-size: 13px;
            color: #bbb;
            margin-top: 2px;
        }

        .briefing-footer {
            padding: 20px;
            border-top: 1px solid var(--primary-color);
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        }

        .briefing-play-btn {
            background: var(--primary-color);
            color: white;
            border: none;
            padding: 10px 30px;
            border-radius: 6px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s;
            text-transform: uppercase;
        }

        .briefing-play-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 0 15px rgba(139, 92, 246, 0.5);
        }

        .briefing-play-btn:active {
            transform: scale(0.95);
        }

        /* Animations */
        @keyframes fadeIn {
            from {
                opacity: 0;
            }
            to {
                opacity: 1;
            }
        }

        @keyframes slideUp {
            from {
                transform: translateY(30px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }

        @keyframes fadeInScale {
            from {
                opacity: 0;
                transform: translate(-50%, -50%) scale(0.8);
            }
            to {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
            }
        }

        @keyframes fadeOutScale {
            from {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
            }
            to {
                opacity: 0;
                transform: translate(-50%, -50%) scale(0.8);
            }
        }

        /* Responsive */
        @media (max-width: 600px) {
            .briefing-content {
                max-width: 95%;
            }

            .briefing-body {
                flex-direction: column;
            }

            .briefing-image-section {
                width: 100%;
                height: 200px;
            }

            .briefing-title {
                font-size: 22px;
            }

            .briefing-footer {
                justify-content: center;
            }

            .briefing-play-btn {
                flex: 1;
            }
        }
    `;

    document.head.appendChild(style);
}

// Inject styles when module loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectBriefingStyles);
} else {
    injectBriefingStyles();
}
