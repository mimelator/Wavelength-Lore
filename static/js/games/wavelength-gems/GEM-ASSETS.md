# Gem Assets for Game Features

This document explains the gem assets used for different game features and UI elements in Wavelength Gems.

## Available Gem Images

The following SVG images are available for use in the game UI:

1. **Special Gem** (`/static/images/special-gem.svg`): Default gem used for special UI elements
2. **Life Gem** (`/static/images/life-gem.svg`): Used for extra life indicators
3. **Power Gem** (`/static/images/power-gem.svg`): Used for power-up indicators
4. **Multiplier Gem** (`/static/images/multiplier-gem.svg`): Used for score multiplier displays

## Usage in the Code

The gems are dynamically loaded in the game UI based on the type of feature being displayed:

```javascript
// Example for life gem display
const featureImage = document.getElementById('game-feature-image');
if (featureImage) {
  featureImage.src = '/static/images/life-gem.svg';
}
```

Different UI methods can update the image source to show appropriate gem types for various game features.

## Customizing Gems

If you need to customize the gem appearances:

1. Edit the SVG files directly
2. Modify the gradients and colors in the `defs` section
3. Update the polygon fills and stroke colors

## Adding New Gem Types

To add a new gem type:

1. Duplicate one of the existing gem SVG files
2. Modify the colors and effects as needed
3. Save with a descriptive name in the `/static/images/` directory
4. Update the relevant reward method to use the new gem image

## Troubleshooting

If a gem image is not displaying:

1. Verify the file exists at the correct path
2. Check for console errors related to image loading
3. Ensure the image ID in the HTML matches what's being used in JavaScript
4. Try clearing the browser cache if updates are not showing