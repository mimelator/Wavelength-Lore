/**
 * Song Data Validator
 * 
 * Validates song data against the Firebase schema defined in GitHub Issue #130
 */

/**
 * Validate song data against required schema
 * @param {Object} songData - Song data to validate
 * @returns {Object} - Validation result with isValid flag and errors array
 */
function validateSongData(songData) {
    const errors = [];

    // Required fields
    if (!songData.title || typeof songData.title !== 'string') {
        errors.push('title is required and must be a string');
    }

    if (!songData.season || !Number.isInteger(parseInt(songData.season))) {
        errors.push('season is required and must be an integer');
    }

    if (!songData.episodeNumber || !Number.isInteger(parseInt(songData.episodeNumber))) {
        errors.push('episodeNumber is required and must be an integer');
    }

    if (!songData.duration || typeof songData.duration !== 'string') {
        errors.push('duration is required and must be a string');
    }

    if (!songData.url || typeof songData.url !== 'string') {
        errors.push('url is required and must be a string');
    }

    // Optional but type-checked fields
    if (songData.artist && typeof songData.artist !== 'string') {
        errors.push('artist must be a string');
    }

    if (songData.lyrics && typeof songData.lyrics !== 'string') {
        errors.push('lyrics must be a string');
    }

    if (songData.published !== undefined && typeof songData.published !== 'boolean') {
        errors.push('published must be a boolean');
    }

    // Validate duration format (MM:SS or M:SS)
    if (songData.duration && !isDurationValid(songData.duration)) {
        errors.push('duration must be in MM:SS format (e.g., "3:45" or "10:23")');
    }

    // Validate season and episode ranges
    const season = parseInt(songData.season);
    const episode = parseInt(songData.episodeNumber);

    if (season < 1 || season > 10) {
        errors.push('season must be between 1 and 10');
    }

    if (episode < 1 || episode > 50) {
        errors.push('episodeNumber must be between 1 and 50');
    }

    // Validate metadata if provided
    if (songData.metadata) {
        const metadataValidation = validateMetadata(songData.metadata);
        if (!metadataValidation.isValid) {
            errors.push(...metadataValidation.errors);
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validate duration format (MM:SS)
 * @param {string} duration - Duration string
 * @returns {boolean} - True if valid format
 */
function isDurationValid(duration) {
    const durationRegex = /^\d{1,2}:\d{2}$/;
    if (!durationRegex.test(duration)) {
        return false;
    }

    const [minutes, seconds] = duration.split(':').map(Number);
    return seconds >= 0 && seconds < 60 && minutes >= 0;
}

/**
 * Validate metadata object
 * @param {Object} metadata - Metadata object
 * @returns {Object} - Validation result
 */
function validateMetadata(metadata) {
    const errors = [];

    if (typeof metadata !== 'object' || metadata === null) {
        errors.push('metadata must be an object');
        return { isValid: false, errors };
    }

    // Optional metadata fields with type checking
    if (metadata.albumArt && typeof metadata.albumArt !== 'string') {
        errors.push('metadata.albumArt must be a string');
    }

    if (metadata.genre && typeof metadata.genre !== 'string') {
        errors.push('metadata.genre must be a string');
    }

    if (metadata.episodeId && typeof metadata.episodeId !== 'string') {
        errors.push('metadata.episodeId must be a string');
    }

    if (metadata.keywords && !Array.isArray(metadata.keywords)) {
        errors.push('metadata.keywords must be an array');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

module.exports = {
    validateSongData,
    isDurationValid,
    validateMetadata
};