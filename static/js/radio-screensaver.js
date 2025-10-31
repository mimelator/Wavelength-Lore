// Wavelength Radio Screensaver Module
// Handles screen saver mode with image galleries, transitions, and customization

class RadioScreenSaver {
    constructor(radioPlayer) {
        this.radio = radioPlayer;
        this.active = false;
        this.interval = null;
        this.images = [];
        this.currentIndex = 0;
        this.exitHintTimeout = null;
        this.titleFadeTimeout = null;
        this.badgeSpawnInterval = null;
        
        // Auto-countdown properties
        this.autoCountdownEnabled = localStorage.getItem('wavelength_auto_screensaver') !== 'false'; // enabled by default
        this.countdownDuration = parseInt(localStorage.getItem('wavelength_screensaver_countdown') || '5'); // 5 seconds default
        this.countdownTimer = null;
        this.countdownInterval = null;
        this.countdownOverlay = null;
        
        this.init();
    }

    init() {
        this.loadPreferences();
        this.bindControls();
    }

    bindControls() {
        // Toggle button
        const toggleBtn = document.getElementById('screensaverToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggle());
        }

        // Minimal controls
        const playPause = document.getElementById('screensaverPlayPause');
        const prev = document.getElementById('screensaverPrev');
        const next = document.getElementById('screensaverNext');

        if (playPause) {
            playPause.addEventListener('click', (e) => {
                e.stopPropagation();
                this.radio.togglePlay();
            });
        }

        if (prev) {
            prev.addEventListener('click', (e) => {
                e.stopPropagation();
                this.radio.previous();
            });
        }

        if (next) {
            next.addEventListener('click', (e) => {
                e.stopPropagation();
                this.radio.next();
            });
        }

        // Customization toggle
        const customizationToggle = document.getElementById('customizationToggle');
        const customizationPanel = document.getElementById('customizationPanel');
        
        if (customizationToggle && customizationPanel) {
            customizationToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                customizationPanel.classList.toggle('expanded');
            });
        }

        // Weather buttons
        document.querySelectorAll('.weather-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const weatherMode = btn.dataset.weather;
                
                if (weatherMode === 'auto') {
                    document.querySelectorAll('.weather-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.radio.setWeatherMode('auto');
                } else {
                    btn.classList.toggle('active');
                    const autoBtn = document.querySelector('.weather-btn[data-weather="auto"]');
                    if (btn.classList.contains('active') && autoBtn) {
                        autoBtn.classList.remove('active');
                    }
                    this.radio.updateActiveWeatherModes();
                }
                
                this.savePreferences();
            });
        });

        // Image effect buttons
        document.querySelectorAll('.image-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                btn.classList.toggle('active');
                this.updateImageEffects();
                this.savePreferences();
            });
        });

        // Game mode buttons
        document.querySelectorAll('.game-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.game-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.radio.updateGameMode();
                this.savePreferences();
            });
        });

        // Lyrics buttons
        document.querySelectorAll('.lyrics-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.lyrics-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.updateLyrics();
                this.savePreferences();
            });
        });

        // Title buttons
        document.querySelectorAll('.title-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.title-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.savePreferences();
            });
        });

        // Transition buttons
        document.querySelectorAll('.transition-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.transition-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                localStorage.setItem('wavelength_screensaver_transitions', btn.dataset.transition);
                this.savePreferences();
            });
        });

        // Animation buttons
        document.querySelectorAll('.animation-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.animation-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                localStorage.setItem('wavelength_screensaver_animation', btn.dataset.animation);
                this.updateImageAnimation();
                this.savePreferences();
            });
        });

        // Summary buttons
        document.querySelectorAll('.summary-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.summary-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.updateSummary();
                this.savePreferences();
            });
        });

        // Badges buttons
        document.querySelectorAll('.badges-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.badges-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.updateBadges();
                this.savePreferences();
            });
        });

        // Exit on keydown
        document.addEventListener('keydown', (e) => {
            if (this.active) this.exit();
        });

        // Exit on overlay click
        const overlay = document.getElementById('screensaverOverlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                const customizationPanel = document.getElementById('customizationPanel');
                const isCustomizationOpen = customizationPanel?.classList.contains('expanded');
                
                if (isCustomizationOpen && !e.target.closest('.screensaver-customization')) {
                    customizationPanel.classList.remove('expanded');
                    return;
                }
                
                if (!e.target.closest('.screensaver-minimal-controls') && 
                    !e.target.closest('.screensaver-customization')) {
                    this.exit();
                }
            });
        }
    }

    savePreferences() {
        const preferences = {
            weather: Array.from(document.querySelectorAll('.weather-btn.active')).map(b => b.dataset.weather),
            imageEffects: Array.from(document.querySelectorAll('.image-btn.active')).map(b => b.dataset.effect),
            gameMode: document.querySelector('.game-btn.active')?.dataset.game || 'off',
            lyrics: document.querySelector('.lyrics-btn.active')?.dataset.lyrics || 'off',
            title: document.querySelector('.title-btn.active')?.dataset.title || 'on',
            transition: document.querySelector('.transition-btn.active')?.dataset.transition,
            animation: document.querySelector('.animation-btn.active')?.dataset.animation,
            summary: document.querySelector('.summary-btn.active')?.dataset.summary,
            badges: document.querySelector('.badges-btn.active')?.dataset.badges
        };

        localStorage.setItem('wavelength_screensaver_prefs', JSON.stringify(preferences));
    }

    loadPreferences() {
        const saved = localStorage.getItem('wavelength_screensaver_prefs');
        if (!saved) return;

        const prefs = JSON.parse(saved);

        // Restore weather
        document.querySelectorAll('.weather-btn').forEach(btn => {
            btn.classList.toggle('active', prefs.weather.includes(btn.dataset.weather));
        });

        // Restore image effects
        document.querySelectorAll('.image-btn').forEach(btn => {
            btn.classList.toggle('active', prefs.imageEffects.includes(btn.dataset.effect));
        });

        // Restore game mode
        document.querySelectorAll('.game-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.game === prefs.gameMode);
        });

        // Restore lyrics
        document.querySelectorAll('.lyrics-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lyrics === prefs.lyrics);
        });

        // Restore title
        document.querySelectorAll('.title-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.title === prefs.title);
        });

        // Restore transition
        if (prefs.transition) {
            document.querySelectorAll('.transition-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.transition === prefs.transition);
            });
        }

        // Restore animation
        const animationPref = prefs.animation || 'on';
        document.querySelectorAll('.animation-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.animation === animationPref);
        });
        this.updateImageAnimation();

        // Restore summary
        if (prefs.summary) {
            document.querySelectorAll('.summary-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.summary === prefs.summary);
            });
        }

        // Restore badges
        const badgesPref = prefs.badges || 'on';
        document.querySelectorAll('.badges-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.badges === badgesPref);
        });
    }

    toggle() {
        if (this.active) {
            this.exit();
        } else {
            this.enter();
        }
    }

    enter() {
        this.active = true;
        const overlay = document.getElementById('screensaverOverlay');
        const gallery = overlay.querySelector('.screensaver-gallery');

        // Auto-play if needed
        if (this.radio.currentTrackIndex === -1 && this.radio.playlist.length > 0) {
            this.radio.playTrack(0);
        }

        // Collect images from episode directories
        this.images = [];
        console.log('🎨 Screensaver: Collecting images from episode directories');
        
        // Load images from the current track first
        if (this.radio.currentTrackIndex >= 0) {
            const track = this.radio.playlist[this.radio.currentTrackIndex];
            console.log(`🎨 Current track: S${track.season}E${track.episodeNumber}`);
            this.addEpisodeImages(track);
        }

        // If no images from current track, load from all episodes
        if (this.images.length === 0) {
            console.log('🎨 No images from current track, loading from all episodes');
            this.radio.playlist.forEach(track => {
                this.addEpisodeImages(track);
            });
        }

        // Remove duplicates
        this.images = [...new Set(this.images)];
        console.log(`🎨 Total screensaver images loaded: ${this.images.length}`);

        if (this.images.length === 0) {
            console.warn('🎨 No images found for screensaver');
            // Fallback to a default image if available
            const defaultImage = '/images/wavelength-og-default.webp';
            this.images.push(defaultImage);
            console.log('🎨 Using default fallback image');
        }

        // Populate gallery
        gallery.innerHTML = '';
        this.images.forEach((src, i) => {
            const img = document.createElement('img');
            img.src = src;
            img.alt = `Episode gallery image ${i + 1}`;
            if (i === 0) img.classList.add('active');
            gallery.appendChild(img);
        });

        // Show overlay
        overlay.classList.add('active');
        document.body.classList.add('screensaver-active');

        // Start features
        this.currentIndex = 0;
        this.startRotation();
        this.radio.startWeatherEffects();
        this.updateImageEffects();
        this.updateImageAnimation();
        this.updateLyrics();
        this.showTitle();
        this.updateSummary();
        this.radio.updateGameMode();
        this.updateBadges();

        // Show exit hint
        const exitHint = overlay.querySelector('.screensaver-exit-hint');
        if (exitHint) {
            exitHint.style.opacity = '1';
            exitHint.style.visibility = 'visible';

            if (this.exitHintTimeout) clearTimeout(this.exitHintTimeout);

            this.exitHintTimeout = setTimeout(() => {
                exitHint.style.opacity = '0';
                setTimeout(() => exitHint.style.visibility = 'hidden', 500);
            }, 5000);
        }

        console.log(`🎨 Screensaver activated with ${this.images.length} images`);
    }

    addEpisodeImages(track) {
        // Try to load images from episode directory structure
        const season = track.season;
        const episode = track.episodeNumber;
        
        // Default images that should exist for most episodes
        const potentialImages = [
            `/images/seasons/season${season}/episodes/episode${episode}/image.webp`,
            `/images/seasons/season${season}/image.webp`
        ];
        
        // Add these base images
        potentialImages.forEach(imagePath => {
            this.images.push(imagePath);
        });
        
        // Also try to load from the images/ subdirectory
        // These are the gallery images we found
        const episodeImagePatterns = [
            'MyLuckyCharm', 'JumpRightIn', 'DreamWithMe', 'Daphne', 'Falling', 
            'OnceMore', 'HistoryLessons', 'LifeInTheShire', 'FeedTheCrows', 'KeepOn', 
            'BackToTheShire', 'GoblinKing', 'Psychopath', 'Countdown', 'AMiseryOfGoblins',
            'SlowTime', 'YouWontSeeItComing', 'SayGoodbyeToTheShire', 'IceFortress',
            'TheIceWhales', 'SneakAttack', 'FrozenPeace', 'RebuildTheShire', 
            'WereComingForYou', 'PrepareForBattle', 'LockedAndLoaded', 'TheKingHasFled',
            'GoblinsRule', 'IceBlueGreed', 'TheShireFortress', 'BattleOfTheShire',
            'SongOfMourning', 'TheShireDream'
        ];
        
        // Try to find images that match episode patterns
        episodeImagePatterns.forEach(pattern => {
            for (let i = 1; i <= 20; i++) {
                const paddedNum = i.toString().padStart(2, '0');
                const imagePath = `/images/seasons/season${season}/episodes/episode${episode}/images/${pattern}-${paddedNum}.webp`;
                this.images.push(imagePath);
            }
        });
        
        console.log(`🎨 Added potential images for S${season}E${episode}: ${track.title}`);
    }

    exit() {
        this.active = false;
        const overlay = document.getElementById('screensaverOverlay');

        overlay.classList.remove('active');
        document.body.classList.remove('screensaver-active');

        this.stopRotation();
        this.radio.stopWeatherEffects();
        this.radio.stopGame();
        this.stopBadgeSpawning();

        // Clear lyrics
        const lyricsContainer = document.querySelector('.screensaver-lyrics');
        if (lyricsContainer) {
            lyricsContainer.classList.remove('visible');
            lyricsContainer.innerHTML = '';
        }

        // Clear title
        const titleOverlay = document.querySelector('.screensaver-title-overlay');
        if (titleOverlay) {
            titleOverlay.classList.remove('visible', 'fade-out');
        }
        if (this.titleFadeTimeout) {
            clearTimeout(this.titleFadeTimeout);
            this.titleFadeTimeout = null;
        }

        if (this.exitHintTimeout) {
            clearTimeout(this.exitHintTimeout);
            this.exitHintTimeout = null;
        }

        console.log('🎨 Screensaver exited');
    }

    updateImages() {
        if (!this.active) return;
        
        const overlay = document.getElementById('screensaverOverlay');
        const gallery = overlay?.querySelector('.screensaver-gallery');
        if (!gallery) return;

        // Collect new images
        this.images = [];
        
        if (this.radio.currentTrackIndex >= 0) {
            const track = this.radio.playlist[this.radio.currentTrackIndex];
            
            if (track.images?.length > 0) {
                track.images.forEach(img => this.images.push(this.radio.cdnUrl + img));
            }
            
            if (this.images.length === 0 && track.episodeImage) {
                this.images.push(this.radio.cdnUrl + track.episodeImage);
            }
        }

        if (this.images.length > 0) {
            gallery.innerHTML = '';
            this.images.forEach((src, i) => {
                const img = document.createElement('img');
                img.src = src;
                img.alt = `Episode gallery image ${i + 1}`;
                if (i === 0) img.classList.add('active');
                gallery.appendChild(img);
            });

            this.currentIndex = 0;
            this.updateLyrics();
            this.showTitle();
            this.updateSummary();
            this.updateImageAnimation();
        }
    }

    startRotation() {
        this.interval = setInterval(() => this.rotate(), 8000);
    }

    stopRotation() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    rotate() {
        const gallery = document.querySelector('.screensaver-gallery');
        if (!gallery) return;

        const images = gallery.querySelectorAll('img');
        if (images.length <= 1) return;

        const currentImg = images[this.currentIndex];
        this.currentIndex = (this.currentIndex + 1) % images.length;
        const nextImg = images[this.currentIndex];

        const transitions = [
            'transition-fade', 'transition-slide-left', 'transition-slide-right',
            'transition-slide-up', 'transition-slide-down', 'transition-zoom-in',
            'transition-zoom-out', 'transition-rotate-left', 'transition-rotate-right',
            'transition-blur', 'transition-diagonal-tl', 'transition-diagonal-br'
        ];

        images.forEach(img => transitions.forEach(t => img.classList.remove(t)));

        const transitionsSetting = localStorage.getItem('wavelength_screensaver_transitions');
        if (transitionsSetting !== 'off') {
            const randomTransition = transitions[Math.floor(Math.random() * transitions.length)];
            currentImg.classList.add(randomTransition);
            nextImg.classList.add(randomTransition);
        }

        currentImg.classList.remove('active');
        currentImg.classList.add('fading-out');
        nextImg.classList.remove('fading-out');
        nextImg.classList.add('active');

        setTimeout(() => currentImg.classList.remove('fading-out'), 3000);
    }

    updateImageEffects() {
        const activeEffects = Array.from(document.querySelectorAll('.image-btn.active')).map(b => b.dataset.effect);
        this.applyImageEffects(activeEffects);
    }

    applyImageEffects(effects) {
        const gallery = document.querySelector('.screensaver-gallery');
        if (!gallery) return;

        let keyframes = '@keyframes customWarpFilter {\n    0% { filter:';
        const filters = [];
        
        if (effects.includes('hue')) filters.push(' hue-rotate(0deg)');
        if (effects.includes('brightness')) filters.push(' brightness(0.9)');
        if (effects.includes('contrast')) filters.push(' contrast(1)');
        
        keyframes += filters.join('') + ';\n';
        
        const transforms = [];
        if (effects.includes('zoom')) transforms.push(' scale(1)');
        if (effects.includes('rotate')) transforms.push(' rotate(0deg)');
        
        if (transforms.length > 0) {
            keyframes += '        transform:' + transforms.join('') + ';\n';
        }
        
        keyframes += '    }\n    50% { filter:';
        
        const filters50 = [];
        if (effects.includes('hue')) filters50.push(' hue-rotate(180deg)');
        if (effects.includes('brightness')) filters50.push(' brightness(1.2)');
        if (effects.includes('contrast')) filters50.push(' contrast(1.35)');
        
        keyframes += filters50.join('') + ';\n';
        
        if (transforms.length > 0) {
            keyframes += '        transform:';
            const transforms50 = [];
            if (effects.includes('zoom')) transforms50.push(' scale(1.25)');
            if (effects.includes('rotate')) transforms50.push(' rotate(3deg)');
            keyframes += transforms50.join('') + ';\n';
        }
        
        keyframes += '    }\n    100% { filter:';
        
        const filters100 = [];
        if (effects.includes('hue')) filters100.push(' hue-rotate(360deg)');
        if (effects.includes('brightness')) filters100.push(' brightness(0.9)');
        if (effects.includes('contrast')) filters100.push(' contrast(1)');
        
        keyframes += filters100.join('') + ';\n';
        
        if (transforms.length > 0) {
            keyframes += '        transform:';
            const transforms100 = [];
            if (effects.includes('zoom')) transforms100.push(' scale(1)');
            if (effects.includes('rotate')) transforms100.push(' rotate(0deg)');
            keyframes += transforms100.join('') + ';\n';
        }
        
        keyframes += '    }\n}\n';

        let styleEl = document.getElementById('customImageEffects');
        if (styleEl) styleEl.remove();

        if (effects.length > 0) {
            styleEl = document.createElement('style');
            styleEl.id = 'customImageEffects';
            styleEl.textContent = keyframes + '\n.screensaver-gallery img { animation: customWarpFilter 45s ease-in-out infinite !important; }';
            document.head.appendChild(styleEl);
        } else {
            styleEl = document.createElement('style');
            styleEl.id = 'customImageEffects';
            styleEl.textContent = '.screensaver-gallery img { animation: warpFilter 45s ease-in-out infinite !important; }';
            document.head.appendChild(styleEl);
        }
    }

    updateImageAnimation() {
        const animationSetting = localStorage.getItem('wavelength_screensaver_animation') || 'on';
        const gallery = document.querySelector('.screensaver-gallery');
        if (!gallery) return;

        gallery.querySelectorAll('img').forEach(img => {
            img.classList.toggle('no-animation', animationSetting === 'off');
        });
    }

    showTitle() {
        const activeTitleBtn = document.querySelector('.title-btn.active');
        const showTitle = activeTitleBtn ? activeTitleBtn.dataset.title === 'on' : true;
        if (!showTitle) return;

        const titleOverlay = document.querySelector('.screensaver-title-overlay');
        const titleContent = titleOverlay?.querySelector('.title-content');
        if (!titleOverlay || !titleContent) return;

        const track = this.radio.playlist[this.radio.currentTrackIndex];
        titleContent.textContent = track?.title || 'Unknown Track';

        if (this.titleFadeTimeout) clearTimeout(this.titleFadeTimeout);

        titleOverlay.classList.remove('fade-out');
        titleOverlay.classList.add('visible');

        this.titleFadeTimeout = setTimeout(() => {
            titleOverlay.classList.add('fade-out');
            titleOverlay.classList.remove('visible');
        }, 3000);
    }

    updateSummary() {
        const summaryOverlay = document.querySelector('.screensaver-summary-overlay');
        const summaryContent = summaryOverlay?.querySelector('.summary-content');
        if (!summaryOverlay || !summaryContent) return;

        const activeSummaryBtn = document.querySelector('.summary-btn.active');
        const showSummary = activeSummaryBtn ? activeSummaryBtn.dataset.summary === 'on' : false;

        if (!showSummary) {
            summaryOverlay.classList.remove('visible');
            summaryContent.innerHTML = '';
            return;
        }

        const track = this.radio.playlist[this.radio.currentTrackIndex];
        const summary = track?.summary || 'No summary available';
        const episodeTitle = track?.episodeTitle || track?.title || 'Unknown Episode';
        const season = track?.season || '?';
        const episode = track?.episode || '?';

        summaryContent.innerHTML = `<strong>Season ${season}, Episode ${episode}: ${episodeTitle}</strong><br><br>${summary}`;
        summaryOverlay.classList.remove('fade-out');
        summaryOverlay.classList.add('visible');
    }

    updateLyrics() {
        const lyricsContainer = document.querySelector('.screensaver-lyrics');
        if (!lyricsContainer) return;

        const activeBtn = document.querySelector('.lyrics-btn.active');
        const mode = activeBtn ? activeBtn.dataset.lyrics : 'off';

        if (mode === 'off') {
            lyricsContainer.classList.remove('visible');
            lyricsContainer.innerHTML = '';
            return;
        }

        const track = this.radio.playlist[this.radio.currentTrackIndex];
        const lyrics = track?.lyrics || 'No lyrics available';

        lyricsContainer.classList.add('visible');

        let lyricsContent = lyricsContainer.querySelector('.lyrics-content');
        if (!lyricsContent) {
            lyricsContent = document.createElement('div');
            lyricsContent.className = 'lyrics-content';
            lyricsContainer.appendChild(lyricsContent);
        }

        lyricsContent.textContent = lyrics;
        lyricsContent.classList.remove('scrolling', 'static');
        
        if (mode === 'scroll') {
            lyricsContent.style.animation = 'none';
            void lyricsContent.offsetWidth;
            
            const duration = Math.max(20, lyrics.length / 3.5);
            lyricsContent.classList.add('scrolling');
            lyricsContent.style.animation = '';
            lyricsContent.style.animationDuration = `${duration}s`;
        } else if (mode === 'static') {
            lyricsContent.classList.add('static');
            lyricsContent.style.animationDuration = '';
        }
    }

    updateBadges() {
        const activeBadgesBtn = document.querySelector('.badges-btn.active');
        const showBadges = activeBadgesBtn ? activeBadgesBtn.dataset.badges === 'on' : true;

        if (showBadges) {
            if (!this.badgeSpawnInterval) this.startBadgeSpawning();
        } else {
            this.stopBadgeSpawning();
        }
    }

    startBadgeSpawning() {
        if (this.badgeSpawnInterval) clearInterval(this.badgeSpawnInterval);

        const spawnBadge = () => {
            const track = this.radio.playlist[this.radio.currentTrackIndex];
            if (!track) return;

            const characters = track.characters || [];
            
            if (characters.length === 0) {
                this.badgeSpawnInterval = setTimeout(spawnBadge, 5000 + Math.random() * 5000);
                return;
            }

            const character = characters[Math.floor(Math.random() * characters.length)];
            this.spawnFloatingBadge(character);

            this.badgeSpawnInterval = setTimeout(spawnBadge, 5000 + Math.random() * 5000);
        };

        this.badgeSpawnInterval = setTimeout(spawnBadge, 2000);
    }

    stopBadgeSpawning() {
        if (this.badgeSpawnInterval) {
            clearTimeout(this.badgeSpawnInterval);
            this.badgeSpawnInterval = null;
        }

        const badgesContainer = document.getElementById('screensaverBadges');
        if (badgesContainer) badgesContainer.innerHTML = '';
    }

    spawnFloatingBadge(character) {
        const badgesContainer = document.getElementById('screensaverBadges');
        if (!badgesContainer) return;

        const badgeWrapper = document.createElement('div');
        badgeWrapper.classList.add('screensaver-floating-badge-wrapper');

        const badge = document.createElement('img');
        badge.src = this.radio.cdnUrl + character.image;
        badge.alt = character.title;
        badge.classList.add('screensaver-floating-badge');

        const titleLabel = document.createElement('div');
        titleLabel.classList.add('screensaver-badge-title');
        titleLabel.textContent = character.title;

        badgeWrapper.appendChild(badge);
        badgeWrapper.appendChild(titleLabel);

        const left = 10 + Math.random() * 80;
        const top = 15 + Math.random() * 70;
        badgeWrapper.style.left = `${left}%`;
        badgeWrapper.style.top = `${top}%`;

        badgeWrapper.addEventListener('click', (e) => {
            e.stopPropagation();
            const url = character.url || (character.type === 'lore' ? `/lore/${character.id}` : `/character/${character.id}`);
            window.location.href = url;
        });

        badgesContainer.appendChild(badgeWrapper);

        const lifetime = 6000 + Math.random() * 4000;
        setTimeout(() => {
            badgeWrapper.classList.add('fading-out');
            setTimeout(() => badgeWrapper.remove(), 2000);
        }, lifetime);
    }

    // Auto-countdown functionality
    startAutoCountdown() {
        // Only start countdown if enabled and not already in screensaver mode
        if (!this.autoCountdownEnabled || this.active) {
            return;
        }

        console.log(`🎨 Starting screensaver auto-countdown: ${this.countdownDuration}s`);
        
        this.createCountdownOverlay();
        this.countdownTimer = this.countdownDuration;
        
        // Update countdown display immediately
        this.updateCountdownDisplay();
        
        // Start countdown interval
        this.countdownInterval = setInterval(() => {
            this.countdownTimer--;
            this.updateCountdownDisplay();
            
            if (this.countdownTimer <= 0) {
                this.executeAutoScreensaver();
            }
        }, 1000);
        
        // Set up interruption listeners
        this.setupCountdownInterruption();
    }

    createCountdownOverlay() {
        // Remove existing overlay if present
        this.removeCountdownOverlay();
        
        this.countdownOverlay = document.createElement('div');
        this.countdownOverlay.className = 'screensaver-auto-countdown';
        this.countdownOverlay.innerHTML = `
            <div class="countdown-content">
                <div class="countdown-icon">🎨</div>
                <div class="countdown-text">Screen Saver starting in</div>
                <div class="countdown-timer" id="countdownTimer">${this.countdownTimer}</div>
                <div class="countdown-actions">
                    <button class="countdown-cancel" id="countdownCancel">Cancel</button>
                    <button class="countdown-settings" id="countdownSettings">⚙️</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.countdownOverlay);
        
        // Bind cancel button
        document.getElementById('countdownCancel').addEventListener('click', () => {
            this.cancelAutoCountdown();
        });
        
        // Bind settings button  
        document.getElementById('countdownSettings').addEventListener('click', () => {
            this.showCountdownSettings();
        });
        
        // Fade in
        setTimeout(() => {
            this.countdownOverlay.classList.add('visible');
        }, 100);
    }

    updateCountdownDisplay() {
        const timerElement = document.getElementById('countdownTimer');
        if (timerElement) {
            timerElement.textContent = this.countdownTimer;
        }
    }

    setupCountdownInterruption() {
        // Add a delay before enabling interruption detection to avoid initial play click
        setTimeout(() => {
            if (!this.countdownInterval) return; // Countdown already finished or cancelled
            
            let mouseMoveCount = 0;
            const mouseMoveThreshold = 3; // Require 3 mouse moves to cancel
            
            const handleInterruption = (event) => {
                // For mousemove, require multiple movements to avoid accidental cancellation
                if (event.type === 'mousemove') {
                    mouseMoveCount++;
                    if (mouseMoveCount < mouseMoveThreshold) {
                        return;
                    }
                }
                
                console.log(`🎨 Screensaver auto-countdown cancelled by user interaction: ${event.type}`);
                this.cancelAutoCountdown();
                
                // Remove all event listeners after cancellation
                document.removeEventListener('mousemove', handleInterruption);
                document.removeEventListener('keydown', handleInterruption);
                document.removeEventListener('scroll', handleInterruption);
                document.removeEventListener('touchstart', handleInterruption);
                document.removeEventListener('click', handleInterruption);
            };
            
            // Add interruption listeners (removed mousedown as it's too sensitive)
            document.addEventListener('mousemove', handleInterruption);
            document.addEventListener('keydown', handleInterruption);
            document.addEventListener('scroll', handleInterruption);
            document.addEventListener('touchstart', handleInterruption);
            // Only listen for clicks outside the radio player area
            document.addEventListener('click', (event) => {
                // Don't cancel if clicking on radio controls
                if (!event.target.closest('.radio-player') && 
                    !event.target.closest('.screensaver-auto-countdown')) {
                    handleInterruption(event);
                }
            });
            
        }, 2000); // Wait 2 seconds before enabling interruption detection
    }

    cancelAutoCountdown() {
        console.log('🎨 Screensaver auto-countdown cancelled by user interaction');
        
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
        
        this.removeCountdownOverlay();
    }

    removeCountdownOverlay() {
        if (this.countdownOverlay) {
            this.countdownOverlay.classList.remove('visible');
            setTimeout(() => {
                if (this.countdownOverlay && this.countdownOverlay.parentNode) {
                    this.countdownOverlay.parentNode.removeChild(this.countdownOverlay);
                }
                this.countdownOverlay = null;
            }, 300);
        }
    }

    executeAutoScreensaver() {
        console.log('🎨 Auto-launching screensaver');
        
        // Clear countdown
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
        
        this.removeCountdownOverlay();
        
        // Launch screensaver
        this.enter();
    }

    showCountdownSettings() {
        // Create quick settings popup
        const settingsOverlay = document.createElement('div');
        settingsOverlay.className = 'countdown-settings-overlay';
        settingsOverlay.innerHTML = `
            <div class="countdown-settings-popup">
                <h3>🎨 Auto-Screensaver Settings</h3>
                <div class="setting-group">
                    <label>
                        <input type="checkbox" id="autoScreensaverEnabled" ${this.autoCountdownEnabled ? 'checked' : ''}>
                        Enable auto-screensaver
                    </label>
                </div>
                <div class="setting-group">
                    <label>Countdown duration (seconds):</label>
                    <select id="countdownDuration">
                        <option value="5" ${this.countdownDuration === 5 ? 'selected' : ''}>5 seconds</option>
                        <option value="10" ${this.countdownDuration === 10 ? 'selected' : ''}>10 seconds</option>
                        <option value="30" ${this.countdownDuration === 30 ? 'selected' : ''}>30 seconds</option>
                        <option value="60" ${this.countdownDuration === 60 ? 'selected' : ''}>1 minute</option>
                        <option value="120" ${this.countdownDuration === 120 ? 'selected' : ''}>2 minutes</option>
                        <option value="300" ${this.countdownDuration === 300 ? 'selected' : ''}>5 minutes</option>
                    </select>
                </div>
                <div class="setting-actions">
                    <button id="saveCountdownSettings">Save</button>
                    <button id="cancelCountdownSettings">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(settingsOverlay);
        
        // Show popup
        setTimeout(() => {
            settingsOverlay.classList.add('visible');
        }, 100);
        
        // Bind save button
        document.getElementById('saveCountdownSettings').addEventListener('click', () => {
            const enabled = document.getElementById('autoScreensaverEnabled').checked;
            const duration = parseInt(document.getElementById('countdownDuration').value);
            
            this.autoCountdownEnabled = enabled;
            this.countdownDuration = duration;
            
            // Save to localStorage
            localStorage.setItem('wavelength_auto_screensaver', enabled.toString());
            localStorage.setItem('wavelength_screensaver_countdown', duration.toString());
            
            console.log(`🎨 Auto-screensaver settings saved: enabled=${enabled}, duration=${duration}s`);
            
            // Remove settings popup
            settingsOverlay.classList.remove('visible');
            setTimeout(() => {
                if (settingsOverlay.parentNode) {
                    settingsOverlay.parentNode.removeChild(settingsOverlay);
                }
            }, 300);
            
            // If we're currently in countdown, restart with new duration
            if (this.countdownInterval && enabled) {
                this.cancelAutoCountdown();
                this.startAutoCountdown();
            }
        });
        
        // Bind cancel button
        document.getElementById('cancelCountdownSettings').addEventListener('click', () => {
            settingsOverlay.classList.remove('visible');
            setTimeout(() => {
                if (settingsOverlay.parentNode) {
                    settingsOverlay.parentNode.removeChild(settingsOverlay);
                }
            }, 300);
        });
    }

    // Method to be called when radio starts playing
    onRadioPlay() {
        // Start auto-countdown when radio starts playing (with small delay for better UX)
        if (!this.active) {
            setTimeout(() => {
                // Triple-check that audio is actually playing
                if (this.radio.isPlaying && 
                    !this.active && 
                    this.radio.audio && 
                    !this.radio.audio.paused && 
                    this.radio.audio.readyState >= 2) {
                    console.log('🎨 Starting screensaver countdown - audio confirmed playing');
                    this.startAutoCountdown();
                } else {
                    console.log('🎨 Skipping screensaver countdown - audio not actually playing', {
                        isPlaying: this.radio.isPlaying,
                        active: this.active,
                        paused: this.radio.audio?.paused,
                        readyState: this.radio.audio?.readyState
                    });
                }
            }, 1000); // 1 second delay
        }
    }

    // Method to be called when radio stops/pauses
    onRadioStop() {
        // Cancel countdown if radio stops
        this.cancelAutoCountdown();
    }
}
