/**
 * Episode Data Validator
 * 
 * Validates episode data structure and content for Firebase storage
 * Ensures data integrity for episode CRUD operations
 * 
 * GitHub Issue: #152 - Milestone 2.1.2: CLI CRUD Activities
 */

/**
 * Validate episode data against schema
 * @param {Object} episodeData - Episode data to validate
 * @param {boolean} isPartialUpdate - Whether this is a partial update (allows missing required fields)
 * @returns {Object} - Validation result with isValid flag and errors array
 */
function validateEpisodeData(episodeData, isPartialUpdate = false) {
    const errors = [];
    const warnings = [];

    // Required fields for new episodes (skip for partial updates)
    if (!isPartialUpdate) {
        if (!episodeData.title || typeof episodeData.title !== 'string' || episodeData.title.trim().length === 0) {
            errors.push('Title is required and must be a non-empty string');
        }

        if (!episodeData.season || !Number.isInteger(episodeData.season) || episodeData.season < 1) {
            errors.push('Season must be a positive integer');
        }

        if (!episodeData.episodeNumber || !Number.isInteger(episodeData.episodeNumber) || episodeData.episodeNumber < 1) {
            errors.push('Episode number must be a positive integer');
        }
    }

    // Validate title if provided
    if (episodeData.title !== undefined) {
        if (typeof episodeData.title !== 'string') {
            errors.push('Title must be a string');
        } else if (episodeData.title.trim().length === 0) {
            errors.push('Title cannot be empty');
        } else if (episodeData.title.length > 200) {
            warnings.push('Title is longer than 200 characters');
        }
    }

    // Validate season if provided
    if (episodeData.season !== undefined) {
        if (!Number.isInteger(episodeData.season) || episodeData.season < 1 || episodeData.season > 10) {
            errors.push('Season must be an integer between 1 and 10');
        }
    }

    // Validate episode number if provided
    if (episodeData.episodeNumber !== undefined) {
        if (!Number.isInteger(episodeData.episodeNumber) || episodeData.episodeNumber < 1 || episodeData.episodeNumber > 50) {
            errors.push('Episode number must be an integer between 1 and 50');
        }
    }

    // Validate description if provided
    if (episodeData.description !== undefined) {
        if (typeof episodeData.description !== 'string') {
            errors.push('Description must be a string');
        } else if (episodeData.description.length > 5000) {
            warnings.push('Description is longer than 5000 characters');
        }
    }

    // Validate YouTube link if provided
    if (episodeData.youtubeLink !== undefined) {
        if (typeof episodeData.youtubeLink !== 'string') {
            errors.push('YouTube link must be a string');
        } else if (episodeData.youtubeLink.length > 0 && !isValidYouTubeUrl(episodeData.youtubeLink)) {
            errors.push('YouTube link must be a valid YouTube URL');
        }
    }

    // Validate image path if provided
    if (episodeData.image !== undefined) {
        if (typeof episodeData.image !== 'string') {
            errors.push('Image path must be a string');
        } else if (episodeData.image.length > 0 && !isValidImagePath(episodeData.image)) {
            warnings.push('Image path should start with / or http and end with a valid image extension');
        }
    }

    // Validate carousel images if provided
    if (episodeData.carouselImages !== undefined) {
        if (!Array.isArray(episodeData.carouselImages)) {
            errors.push('Carousel images must be an array');
        } else {
            episodeData.carouselImages.forEach((imageUrl, index) => {
                if (typeof imageUrl !== 'string') {
                    errors.push(`Carousel image ${index + 1} must be a string`);
                } else if (!isValidImagePath(imageUrl)) {
                    warnings.push(`Carousel image ${index + 1} should be a valid image path`);
                }
            });

            if (episodeData.carouselImages.length > 50) {
                warnings.push('More than 50 carousel images may impact performance');
            }
        }
    }

    // Validate keywords if provided
    if (episodeData.keywords !== undefined) {
        if (!Array.isArray(episodeData.keywords)) {
            errors.push('Keywords must be an array');
        } else {
            episodeData.keywords.forEach((keyword, index) => {
                if (typeof keyword !== 'string') {
                    errors.push(`Keyword ${index + 1} must be a string`);
                } else if (keyword.trim().length === 0) {
                    warnings.push(`Keyword ${index + 1} is empty`);
                } else if (keyword.length > 50) {
                    warnings.push(`Keyword ${index + 1} is longer than 50 characters`);
                }
            });

            if (episodeData.keywords.length > 20) {
                warnings.push('More than 20 keywords may be excessive');
            }
        }
    }

    // Validate characters array if provided
    if (episodeData.characters !== undefined) {
        if (!Array.isArray(episodeData.characters)) {
            errors.push('Characters must be an array');
        } else {
            episodeData.characters.forEach((characterId, index) => {
                if (typeof characterId !== 'string') {
                    errors.push(`Character ${index + 1} ID must be a string`);
                } else if (!isValidId(characterId)) {
                    warnings.push(`Character ${index + 1} ID should follow kebab-case format`);
                }
            });
        }
    }

    // Validate lore items array if provided
    if (episodeData.loreItems !== undefined) {
        if (!Array.isArray(episodeData.loreItems)) {
            errors.push('Lore items must be an array');
        } else {
            episodeData.loreItems.forEach((loreId, index) => {
                if (typeof loreId !== 'string') {
                    errors.push(`Lore item ${index + 1} ID must be a string`);
                } else if (!isValidId(loreId)) {
                    warnings.push(`Lore item ${index + 1} ID should follow kebab-case format`);
                }
            });
        }
    }

    // Validate published status if provided
    if (episodeData.published !== undefined && typeof episodeData.published !== 'boolean') {
        errors.push('Published status must be a boolean');
    }

    // Validate metadata if provided
    if (episodeData.metadata !== undefined) {
        if (typeof episodeData.metadata !== 'object' || episodeData.metadata === null) {
            errors.push('Metadata must be an object');
        } else {
            // Validate specific metadata fields
            if (episodeData.metadata.duration !== undefined) {
                if (typeof episodeData.metadata.duration !== 'string') {
                    errors.push('Metadata duration must be a string');
                } else if (!isValidDuration(episodeData.metadata.duration)) {
                    warnings.push('Metadata duration should be in format "MM:SS" or "H:MM:SS"');
                }
            }

            if (episodeData.metadata.genre !== undefined && typeof episodeData.metadata.genre !== 'string') {
                errors.push('Metadata genre must be a string');
            }

            if (episodeData.metadata.mood !== undefined && typeof episodeData.metadata.mood !== 'string') {
                errors.push('Metadata mood must be a string');
            }

            if (episodeData.metadata.contentWarnings !== undefined && !Array.isArray(episodeData.metadata.contentWarnings)) {
                errors.push('Metadata content warnings must be an array');
            }
        }
    }

    return {
        isValid: errors.length === 0,
        errors: errors,
        warnings: warnings
    };
}

/**
 * Validate YouTube URL format
 * @param {string} url - YouTube URL to validate
 * @returns {boolean} - Whether URL is valid YouTube URL
 */
function isValidYouTubeUrl(url) {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    return youtubeRegex.test(url);
}

/**
 * Validate image path format
 * @param {string} path - Image path to validate
 * @returns {boolean} - Whether path appears to be valid image path
 */
function isValidImagePath(path) {
    if (!path || typeof path !== 'string') {
        return false;
    }

    // Must start with / or http
    if (!path.startsWith('/') && !path.startsWith('http')) {
        return false;
    }

    // Should end with common image extensions
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
    return imageExtensions.some(ext => path.toLowerCase().endsWith(ext));
}

/**
 * Validate ID format (kebab-case)
 * @param {string} id - ID to validate
 * @returns {boolean} - Whether ID follows kebab-case format
 */
function isValidId(id) {
    if (!id || typeof id !== 'string') {
        return false;
    }

    // Should be kebab-case: lowercase letters, numbers, and hyphens
    const kebabCaseRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    return kebabCaseRegex.test(id);
}

/**
 * Validate duration format
 * @param {string} duration - Duration string to validate
 * @returns {boolean} - Whether duration is in valid format
 */
function isValidDuration(duration) {
    if (!duration || typeof duration !== 'string') {
        return false;
    }

    // Matches formats: "M:SS", "MM:SS", or "H:MM:SS"
    const durationRegex = /^(\d{1,2}:)?[0-5]?\d:[0-5]\d$/;
    return durationRegex.test(duration);
}

/**
 * Get episode validation schema for reference
 * @returns {Object} - Complete episode data schema
 */
function getEpisodeSchema() {
    return {
        // Required fields
        title: { type: 'string', required: true, maxLength: 200 },
        season: { type: 'integer', required: true, min: 1, max: 10 },
        episodeNumber: { type: 'integer', required: true, min: 1, max: 50 },
        
        // Optional core fields
        description: { type: 'string', maxLength: 5000 },
        youtubeLink: { type: 'string', validation: 'youtube-url' },
        image: { type: 'string', validation: 'image-path' },
        
        // Array fields
        carouselImages: { type: 'array', itemType: 'string', maxItems: 50 },
        keywords: { type: 'array', itemType: 'string', maxItems: 20 },
        characters: { type: 'array', itemType: 'string', validation: 'id-format' },
        loreItems: { type: 'array', itemType: 'string', validation: 'id-format' },
        
        // Status fields
        published: { type: 'boolean', default: true },
        hidden: { type: 'boolean', default: false },
        
        // Metadata object
        metadata: {
            type: 'object',
            properties: {
                duration: { type: 'string', validation: 'duration-format' },
                genre: { type: 'string', default: 'Fantasy Adventure' },
                mood: { type: 'string' },
                contentWarnings: { type: 'array', itemType: 'string' }
            }
        }
    };
}

module.exports = {
    validateEpisodeData,
    isValidYouTubeUrl,
    isValidImagePath,
    isValidId,
    isValidDuration,
    getEpisodeSchema
};