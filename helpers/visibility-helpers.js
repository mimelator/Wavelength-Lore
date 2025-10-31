/**
 * Unified Visibility Helper
 * 
 * Provides consistent visibility checking across all content types.
 * Supports three-tier visibility: draft, preview, published
 * 
 * Migration Strategy:
 * - New content uses `visibility` field
 * - Old content uses fallback to `published`/`visible`/`hidden`
 * - Gradually migrate all content to use `visibility`
 */

/**
 * Visibility states
 */
const VISIBILITY_STATES = {
    DRAFT: 'draft',
    PREVIEW: 'preview',
    PUBLISHED: 'published'
};

/**
 * Get visibility state from content item (with fallback for old fields)
 * @param {Object} item - Content item (character, lore, episode, song)
 * @returns {string} Visibility state: 'draft', 'preview', or 'published'
 */
function getVisibility(item) {
    // Prefer new unified field
    if (item.visibility) {
        const validStates = Object.values(VISIBILITY_STATES);
        if (validStates.includes(item.visibility)) {
            return item.visibility;
        }
    }

    // Fallback to old fields (migration support)
    // Priority: visible/hidden -> published -> default to draft
    
    // Check visible/hidden (legacy fields)
    if (item.visible === false || item.hidden === true) {
        return VISIBILITY_STATES.DRAFT;
    }
    
    // Check published field
    if (item.published === true) {
        return VISIBILITY_STATES.PUBLISHED;
    }
    
    if (item.published === false) {
        return VISIBILITY_STATES.DRAFT;
    }
    
    // Check status field (episodes)
    if (item.status === 'published') {
        return VISIBILITY_STATES.PUBLISHED;
    }
    
    if (item.status === 'hidden') {
        return VISIBILITY_STATES.DRAFT;
    }
    
    // Default: draft (most restrictive)
    return VISIBILITY_STATES.DRAFT;
}

/**
 * Check if content is visible to the current user
 * @param {Object} item - Content item
 * @param {Object} user - User object with permissions
 * @returns {boolean} True if user can see this content
 */
function isVisibleToUser(item, user = null) {
    const visibility = getVisibility(item);
    
    // Content creators see everything
    if (user?.isContentCreator) {
        return true;
    }
    
    // Published content is visible to everyone
    if (visibility === VISIBILITY_STATES.PUBLISHED) {
        return true;
    }
    
    // Preview users can see preview content
    if (visibility === VISIBILITY_STATES.PREVIEW) {
        if (user?.isPreviewUser || user?.isBetaTester) {
            return true;
        }
        // Content creators already handled above, but keep for clarity
        if (user?.isContentCreator) {
            return true;
        }
    }
    
    // Draft content with preview enabled
    if (visibility === VISIBILITY_STATES.DRAFT && item.previewEnabled === true) {
        if (user?.isPreviewUser || user?.isBetaTester || user?.isContentCreator) {
            return true;
        }
    }
    
    // Draft content is only visible to content creators
    return false;
}

/**
 * Filter array of items by visibility
 * @param {Array} items - Array of content items
 * @param {Object} user - User object with permissions
 * @returns {Array} Filtered array of visible items
 */
function filterByVisibility(items, user = null) {
    if (!Array.isArray(items)) {
        return [];
    }
    
    return items.filter(item => isVisibleToUser(item, user));
}

/**
 * Check if user has permission to preview content
 * @param {Object} user - User object
 * @returns {boolean} True if user can preview content
 */
function canPreview(user = null) {
    return !!(
        user?.isContentCreator ||
        user?.isPreviewUser ||
        user?.isBetaTester
    );
}

/**
 * Normalize visibility field (for migration)
 * Converts old fields to new visibility field
 * @param {Object} item - Content item
 * @returns {string} Normalized visibility state
 */
function normalizeVisibility(item) {
    return getVisibility(item);
}

/**
 * Set visibility on content item
 * @param {Object} item - Content item
 * @param {string} visibility - New visibility state
 * @param {Object} options - Additional options
 * @returns {Object} Updated item
 */
function setVisibility(item, visibility, options = {}) {
    const validStates = Object.values(VISIBILITY_STATES);
    
    if (!validStates.includes(visibility)) {
        throw new Error(`Invalid visibility state: ${visibility}. Must be one of: ${validStates.join(', ')}`);
    }
    
    const updated = { ...item };
    
    // Set new unified field
    updated.visibility = visibility;
    
    // Optionally update old fields for backward compatibility
    if (options.updateLegacyFields !== false) {
        // Update published field
        updated.published = visibility === VISIBILITY_STATES.PUBLISHED;
        
        // Update visible/hidden fields
        if (visibility === VISIBILITY_STATES.PUBLISHED) {
            updated.visible = true;
            updated.hidden = false;
        } else {
            updated.visible = false;
            updated.hidden = true;
        }
        
        // Update status field (if it exists)
        if (updated.status !== undefined) {
            if (visibility === VISIBILITY_STATES.PUBLISHED) {
                updated.status = 'published';
            } else {
                updated.status = 'hidden';
            }
        }
    }
    
    // Set published timestamp
    if (visibility === VISIBILITY_STATES.PUBLISHED && !updated.publishedAt) {
        updated.publishedAt = options.publishedAt || Date.now();
    }
    
    return updated;
}

/**
 * Check if content should be excluded from search engines
 * @param {Object} item - Content item
 * @returns {boolean} True if content should be noindex
 */
function shouldNoIndex(item) {
    const visibility = getVisibility(item);
    // Draft and preview content should not be indexed
    return visibility !== VISIBILITY_STATES.PUBLISHED;
}

module.exports = {
    VISIBILITY_STATES,
    getVisibility,
    isVisibleToUser,
    filterByVisibility,
    canPreview,
    normalizeVisibility,
    setVisibility,
    shouldNoIndex
};

