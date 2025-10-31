/**
 * Duration Helper Utilities
 * 
 * Convert between duration formats for Firebase Songs Service
 */

/**
 * Convert duration string (MM:SS) to seconds
 * @param {string} duration - Duration in MM:SS format
 * @returns {number} - Duration in seconds
 */
function convertDurationToSeconds(duration) {
    if (typeof duration !== 'string') {
        throw new Error('Duration must be a string');
    }

    const parts = duration.split(':');
    if (parts.length !== 2) {
        throw new Error('Duration must be in MM:SS format');
    }

    const minutes = parseInt(parts[0], 10);
    const seconds = parseInt(parts[1], 10);

    if (isNaN(minutes) || isNaN(seconds)) {
        throw new Error('Duration parts must be numeric');
    }

    if (seconds < 0 || seconds >= 60) {
        throw new Error('Seconds must be between 0 and 59');
    }

    return (minutes * 60) + seconds;
}

/**
 * Convert seconds to duration string (MM:SS)
 * @param {number} seconds - Duration in seconds
 * @returns {string} - Duration in MM:SS format
 */
function convertSecondsToString(seconds) {
    if (typeof seconds !== 'number' || seconds < 0) {
        throw new Error('Seconds must be a non-negative number');
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Format duration (handles both string and number input)
 * @param {string|number} duration - Duration as string (MM:SS) or seconds
 * @returns {string} - Formatted duration string (MM:SS)
 */
function formatDuration(duration) {
    if (typeof duration === 'string') {
        // Validate and return as-is if already in correct format
        if (/^\d{1,2}:\d{2}$/.test(duration)) {
            return duration;
        }
        throw new Error('Invalid duration string format');
    }

    if (typeof duration === 'number') {
        return convertSecondsToString(duration);
    }

    throw new Error('Duration must be a string or number');
}

/**
 * Parse duration from various formats
 * @param {string|number} input - Duration input
 * @returns {Object} - Parsed duration with seconds and formatted string
 */
function parseDuration(input) {
    let seconds;
    let formatted;

    if (typeof input === 'string') {
        seconds = convertDurationToSeconds(input);
        formatted = input;
    } else if (typeof input === 'number') {
        seconds = input;
        formatted = convertSecondsToString(input);
    } else {
        throw new Error('Duration input must be string or number');
    }

    return {
        seconds,
        formatted,
        minutes: Math.floor(seconds / 60),
        remainingSeconds: seconds % 60
    };
}

/**
 * Validate duration format
 * @param {string} duration - Duration string to validate
 * @returns {boolean} - True if valid MM:SS format
 */
function isValidDurationFormat(duration) {
    if (typeof duration !== 'string') {
        return false;
    }

    const regex = /^\d{1,2}:\d{2}$/;
    if (!regex.test(duration)) {
        return false;
    }

    const [minutes, seconds] = duration.split(':').map(Number);
    return seconds >= 0 && seconds < 60 && minutes >= 0;
}

/**
 * Calculate total duration for a playlist
 * @param {Array} songs - Array of song objects with duration
 * @returns {Object} - Total duration statistics
 */
function calculatePlaylistDuration(songs) {
    let totalSeconds = 0;

    for (const song of songs) {
        try {
            if (song.duration) {
                const parsed = parseDuration(song.duration);
                totalSeconds += parsed.seconds;
            }
        } catch (error) {
            console.warn(`Invalid duration for song "${song.title}": ${song.duration}`);
        }
    }

    return {
        totalSeconds,
        formatted: convertSecondsToString(totalSeconds),
        hours: Math.floor(totalSeconds / 3600),
        minutes: Math.floor((totalSeconds % 3600) / 60),
        seconds: totalSeconds % 60,
        songCount: songs.length
    };
}

module.exports = {
    convertDurationToSeconds,
    convertSecondsToString,
    formatDuration,
    parseDuration,
    isValidDurationFormat,
    calculatePlaylistDuration
};