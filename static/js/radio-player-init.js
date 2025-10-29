// Initialize radio player when DOM is ready, but only when the widget container exists.
// Some pages (for example a dedicated /radio page with a different main player)
// intentionally must not initialize the standard widget. To avoid conflicts we
// check for the presence of a container element before creating the instance.
document.addEventListener('DOMContentLoaded', () => {
    // Look for the widget by data attribute or legacy class name
    const widgetContainer = document.querySelector('[data-wavelength-radio-widget], .wavelength-radio-widget');
    if (!widgetContainer) {
        // No widget on this page; skip initialization to avoid interfering with a
        // different main player implementation (e.g., /radio).
        if (window.console && console.debug) console.debug('Wavelength Radio: widget container not found; skipping initialization.');
        return;
    }

    try {
        window.wavelengthRadio = new WavelengthRadio();
    } catch (err) {
        console.error('Wavelength Radio initialization failed:', err);
    }
});

// Note: Level up animation styles are defined in radio-player.js to avoid duplication
