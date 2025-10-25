// Initialize radio player when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.wavelengthRadio = new WavelengthRadio();
});

// Add level up animation
const levelUpAnimationStyle = document.createElement('style');
levelUpAnimationStyle.textContent = `
    @keyframes levelUpPulse {
        0%, 100% { transform: translate(-50%, -50%) scale(1); }
        50% { transform: translate(-50%, -50%) scale(1.2); }
    }
`;
document.head.appendChild(levelUpAnimationStyle);
