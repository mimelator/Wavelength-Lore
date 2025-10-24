/**
 * Border Selection JavaScript
 * 
 * Provides interactive functionality for the border selection modal
 * including real-time preview generation and configuration management.
 */

let currentImageData = null;
let currentBorderConfig = null;
let debounceTimer = null;

/**
 * Opens the border selection modal for a specific image
 * @param {string} imageUrl - URL of the image to add borders to
 * @param {Object} imageData - Additional image metadata
 */
function openBorderModal(imageUrl, imageData = {}) {
    currentImageData = {
        url: imageUrl,
        ...imageData
    };
    
    // Set the original image preview
    document.getElementById('originalImagePreview').src = imageUrl;
    document.getElementById('borderedImagePreview').src = '';
    
    // Reset form to defaults
    resetBorderForm();
    
    // Show the modal
    document.getElementById('borderSelectionModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    console.log('🎨 Border modal opened for image:', imageUrl);
}

/**
 * Closes the border selection modal
 */
function closeBorderModal() {
    document.getElementById('borderSelectionModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Clear current data
    currentImageData = null;
    currentBorderConfig = null;
    
    // Hide loading spinner
    document.getElementById('borderLoadingSpinner').style.display = 'none';
    
    console.log('❌ Border modal closed');
}

/**
 * Resets the border form to default values
 */
function resetBorderForm() {
    // Reset border type
    document.getElementById('borderType').value = 'solid';
    updateBorderType();
    
    // Reset solid border options
    document.getElementById('solidColor').value = '#000000';
    document.getElementById('solidWidth').value = '10';
    document.getElementById('solidOpacity').value = '1';
    
    // Update value displays
    updateRangeDisplays();
    
    // Disable apply button
    document.getElementById('applyBorderBtn').disabled = true;
    
    console.log('🔄 Border form reset to defaults');
}

/**
 * Updates the border type selection and shows appropriate options
 */
function updateBorderType() {
    const borderType = document.getElementById('borderType').value;
    
    // Hide all options first
    const optionSections = document.querySelectorAll('.border-options');
    optionSections.forEach(section => {
        section.style.display = 'none';
    });
    
    // Show the selected option section
    const selectedSection = document.getElementById(`${borderType}BorderOptions`);
    if (selectedSection) {
        selectedSection.style.display = 'block';
    }
    
    // Update border preview with debouncing
    updateBorderPreview();
    
    console.log(`🎨 Border type changed to: ${borderType}`);
}

/**
 * Updates range input displays with current values
 */
function updateRangeDisplays() {
    const ranges = [
        { input: 'solidWidth', display: 'solidWidthValue' },
        { input: 'solidOpacity', display: 'solidOpacityValue' },
        { input: 'gradientWidth', display: 'gradientWidthValue' },
        { input: 'featherRadius', display: 'featherRadiusValue' },
        { input: 'fadeDistance', display: 'fadeDistanceValue' }
    ];
    
    ranges.forEach(range => {
        const input = document.getElementById(range.input);
        const display = document.getElementById(range.display);
        
        if (input && display) {
            display.textContent = input.value;
            
            // Add event listener for real-time updates
            input.addEventListener('input', () => {
                display.textContent = input.value;
                updateBorderPreview();
            });
        }
    });
}

/**
 * Updates the border preview with debouncing to avoid excessive API calls
 */
function updateBorderPreview() {
    // Clear existing debounce timer
    if (debounceTimer) {
        clearTimeout(debounceTimer);
    }
    
    // Set new debounce timer
    debounceTimer = setTimeout(() => {
        generateBorderPreview();
    }, 500); // 500ms debounce
}

/**
 * Generates a border preview using the current configuration
 */
async function generateBorderPreview() {
    if (!currentImageData || !currentImageData.url) {
        console.warn('⚠️ No image data available for border preview');
        return;
    }
    
    // Show loading spinner
    document.getElementById('borderLoadingSpinner').style.display = 'block';
    document.getElementById('applyBorderBtn').disabled = true;
    
    try {
        // Build border configuration
        const borderConfig = buildBorderConfig();
        currentBorderConfig = borderConfig;
        
        console.log('🎨 Generating border preview with config:', borderConfig);
        
        // Call border preview API
        const response = await fetch('/api/merchandise/border-preview', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sourceImageUrl: currentImageData.url,
                borderConfig: borderConfig
            })
        });
        
        if (!response.ok) {
            throw new Error(`Border preview failed: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.borderedImageUrl) {
            // Update the preview image
            document.getElementById('borderedImagePreview').src = result.borderedImageUrl;
            document.getElementById('applyBorderBtn').disabled = false;
            
            console.log('✅ Border preview generated successfully:', result.borderedImageUrl);
        } else {
            throw new Error(result.error || 'Unknown error generating border preview');
        }
        
    } catch (error) {
        console.error('❌ Error generating border preview:', error);
        showNotification('Error generating border preview: ' + error.message, 'error');
        
        // Clear the preview image
        document.getElementById('borderedImagePreview').src = '';
        
    } finally {
        // Hide loading spinner
        document.getElementById('borderLoadingSpinner').style.display = 'none';
    }
}

/**
 * Builds border configuration object from form inputs
 * @returns {Object} Border configuration object
 */
function buildBorderConfig() {
    const borderType = document.getElementById('borderType').value;
    const config = { type: borderType };
    
    switch (borderType) {
        case 'solid':
            config.color = document.getElementById('solidColor').value;
            config.width = parseInt(document.getElementById('solidWidth').value);
            config.opacity = parseFloat(document.getElementById('solidOpacity').value);
            break;
            
        case 'gradient':
            config.gradientType = document.getElementById('gradientType').value;
            config.direction = document.getElementById('gradientDirection').value;
            config.width = parseInt(document.getElementById('gradientWidth').value);
            config.colors = [
                document.getElementById('gradientColor1').value,
                document.getElementById('gradientColor2').value
            ];
            
            // Add any additional gradient colors
            const additionalColors = document.querySelectorAll('.additional-gradient-color');
            additionalColors.forEach(colorInput => {
                config.colors.push(colorInput.value);
            });
            break;
            
        case 'pattern':
            config.patternType = document.getElementById('patternType').value;
            config.size = document.getElementById('patternSize').value;
            config.color = document.getElementById('patternColor').value;
            break;
            
        case 'wavelength-theme':
            config.theme = document.getElementById('wavelengthTheme').value;
            config.density = document.getElementById('themeDensity').value;
            config.colorScheme = document.getElementById('themeColorScheme').value;
            break;
            
        case 'blend':
            config.blendMode = document.getElementById('blendMode').value;
            config.featherRadius = parseInt(document.getElementById('featherRadius').value);
            config.fadeDistance = parseInt(document.getElementById('fadeDistance').value);
            break;
    }
    
    return config;
}

/**
 * Applies the current border configuration to the image
 */
async function applyBorderToImage() {
    if (!currentImageData || !currentBorderConfig) {
        console.warn('⚠️ No image data or border config available');
        return;
    }
    
    try {
        showNotification('Applying border to image...', 'info');
        
        // Call the border application API
        const response = await fetch('/api/merchandise/border-preview/apply', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sourceImageUrl: currentImageData.url,
                borderConfig: currentBorderConfig,
                metadata: {
                    originalImageId: currentImageData.id,
                    vendorId: currentImageData.vendorId,
                    productType: currentImageData.productType
                }
            })
        });
        
        if (!response.ok) {
            throw new Error(`Border application failed: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('✅ Border applied successfully!', 'success');
            
            // Close the modal
            closeBorderModal();
            
            // Refresh the vendor catalog to show the new bordered image
            if (typeof refreshVendorCatalog === 'function') {
                refreshVendorCatalog();
            }
            
            console.log('✅ Border applied successfully:', result);
            
        } else {
            throw new Error(result.error || 'Unknown error applying border');
        }
        
    } catch (error) {
        console.error('❌ Error applying border:', error);
        showNotification('Error applying border: ' + error.message, 'error');
    }
}

/**
 * Applies a preset border configuration
 * @param {string} presetName - Name of the preset to apply
 */
function applyPreset(presetName) {
    console.log(`🎨 Applying preset: ${presetName}`);
    
    const presets = {
        classic: {
            type: 'solid',
            color: '#000000',
            width: 10,
            opacity: 1
        },
        fire: {
            type: 'gradient',
            gradientType: 'linear',
            direction: '45deg',
            width: 20,
            colors: ['#ff4500', '#ff8c00', '#ffd700']
        },
        ocean: {
            type: 'gradient',
            gradientType: 'radial',
            direction: 'center',
            width: 25,
            colors: ['#1e90ff', '#00bfff', '#87ceeb']
        },
        goblin: {
            type: 'wavelength-theme',
            theme: 'goblin-king',
            density: 'medium',
            colorScheme: 'dark'
        },
        blend: {
            type: 'blend',
            blendMode: 'soft-light',
            featherRadius: 30,
            fadeDistance: 60
        }
    };
    
    const preset = presets[presetName];
    if (!preset) {
        console.warn(`⚠️ Unknown preset: ${presetName}`);
        return;
    }
    
    // Apply preset to form
    document.getElementById('borderType').value = preset.type;
    updateBorderType();
    
    // Apply preset-specific settings
    switch (preset.type) {
        case 'solid':
            document.getElementById('solidColor').value = preset.color;
            document.getElementById('solidWidth').value = preset.width;
            document.getElementById('solidOpacity').value = preset.opacity;
            break;
            
        case 'gradient':
            document.getElementById('gradientType').value = preset.gradientType;
            document.getElementById('gradientDirection').value = preset.direction;
            document.getElementById('gradientWidth').value = preset.width;
            if (preset.colors.length >= 2) {
                document.getElementById('gradientColor1').value = preset.colors[0];
                document.getElementById('gradientColor2').value = preset.colors[1];
            }
            break;
            
        case 'wavelength-theme':
            document.getElementById('wavelengthTheme').value = preset.theme;
            document.getElementById('themeDensity').value = preset.density;
            document.getElementById('themeColorScheme').value = preset.colorScheme;
            break;
            
        case 'blend':
            document.getElementById('blendMode').value = preset.blendMode;
            document.getElementById('featherRadius').value = preset.featherRadius;
            document.getElementById('fadeDistance').value = preset.fadeDistance;
            break;
    }
    
    // Update range displays and generate preview
    updateRangeDisplays();
    updateBorderPreview();
    
    showNotification(`🎨 Applied ${presetName} preset`, 'success');
}

/**
 * Adds an additional color picker to gradient configuration
 */
function addGradientColor() {
    const colorGroup = document.querySelector('.color-picker-group');
    const addButton = colorGroup.querySelector('button');
    
    // Create new color input
    const newColorInput = document.createElement('input');
    newColorInput.type = 'color';
    newColorInput.className = 'additional-gradient-color';
    newColorInput.value = '#0000ff';
    newColorInput.addEventListener('change', updateBorderPreview);
    
    // Insert before the add button
    colorGroup.insertBefore(newColorInput, addButton);
    
    // Add remove button if this is the first additional color
    if (colorGroup.querySelectorAll('.additional-gradient-color').length === 1) {
        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.textContent = '- Remove';
        removeButton.onclick = removeGradientColor;
        colorGroup.appendChild(removeButton);
    }
    
    updateBorderPreview();
    console.log('➕ Added gradient color picker');
}

/**
 * Removes additional gradient color pickers
 */
function removeGradientColor() {
    const additionalColors = document.querySelectorAll('.additional-gradient-color');
    if (additionalColors.length > 0) {
        // Remove the last additional color
        additionalColors[additionalColors.length - 1].remove();
        
        // Remove the remove button if no additional colors left
        if (additionalColors.length === 1) {
            const removeButton = document.querySelector('.color-picker-group button[onclick="removeGradientColor"]');
            if (removeButton) {
                removeButton.remove();
            }
        }
        
        updateBorderPreview();
        console.log('➖ Removed gradient color picker');
    }
}

/**
 * Shows a notification to the user
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, info, warning)
 */
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 10000;
        max-width: 300px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    `;
    
    // Set background color based on type
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
    
    console.log(`📢 Notification (${type}): ${message}`);
}

// Initialize the border selection functionality when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Update range displays
    updateRangeDisplays();
    
    // Close modal when clicking outside
    document.getElementById('borderSelectionModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeBorderModal();
        }
    });
    
    // Handle escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && document.getElementById('borderSelectionModal').style.display !== 'none') {
            closeBorderModal();
        }
    });
    
    console.log('✅ Border selection functionality initialized');
});