/**
 * Lore Data Validator
 * 
 * Validates lore entry data structure and content for Firebase storage
 * Includes comprehensive validation for categories, tags, relationships, and content
 * 
 * GitHub Issue: #152 - Milestone 2.1.2: CLI CRUD Activities
 */

/**
 * Validate lore data against schema
 * @param {Object} loreData - Lore data to validate
 * @param {boolean} isPartialUpdate - Whether this is a partial update (allows missing required fields)
 * @returns {Object} - Validation result with isValid flag and errors array
 */
function validateLoreData(loreData, isPartialUpdate = false) {
    const errors = [];
    const warnings = [];

    // Required fields for new lore entries (skip for partial updates)
    if (!isPartialUpdate) {
        if (!loreData.title || typeof loreData.title !== 'string' || loreData.title.trim().length === 0) {
            errors.push('Title is required and must be a non-empty string');
        }
    }

    // Validate title if provided
    if (loreData.title !== undefined) {
        if (typeof loreData.title !== 'string') {
            errors.push('Title must be a string');
        } else if (loreData.title.trim().length === 0) {
            errors.push('Title cannot be empty');
        } else if (loreData.title.length > 200) {
            warnings.push('Title is longer than 200 characters');
        }
    }

    // Validate summary if provided
    if (loreData.summary !== undefined) {
        if (typeof loreData.summary !== 'string') {
            errors.push('Summary must be a string');
        } else if (loreData.summary.length > 500) {
            warnings.push('Summary is longer than 500 characters');
        }
    }

    // Validate content if provided
    if (loreData.content !== undefined) {
        if (typeof loreData.content !== 'string') {
            errors.push('Content must be a string');
        } else if (loreData.content.length > 50000) {
            warnings.push('Content is longer than 50,000 characters');
        }
    }

    // Validate category if provided
    if (loreData.category !== undefined) {
        if (typeof loreData.category !== 'string') {
            errors.push('Category must be a string');
        } else {
            const validCategories = [
                'world-building', 'character-lore', 'music-theory', 'magic-system',
                'locations', 'events', 'artifacts', 'concepts', 'history', 'general'
            ];
            
            if (!validCategories.includes(loreData.category)) {
                warnings.push(`Category '${loreData.category}' is not in standard categories`);
            }
        }
    }

    // Validate subcategory if provided
    if (loreData.subcategory !== undefined) {
        if (typeof loreData.subcategory !== 'string') {
            errors.push('Subcategory must be a string');
        } else if (loreData.subcategory.length > 100) {
            warnings.push('Subcategory is longer than 100 characters');
        }
    }

    // Validate tags if provided
    if (loreData.tags !== undefined) {
        if (!Array.isArray(loreData.tags)) {
            errors.push('Tags must be an array');
        } else {
            loreData.tags.forEach((tag, index) => {
                if (typeof tag !== 'string') {
                    errors.push(`Tag at index ${index} must be a string`);
                } else if (tag.trim().length === 0) {
                    errors.push(`Tag at index ${index} cannot be empty`);
                } else if (tag.length > 50) {
                    warnings.push(`Tag '${tag}' is longer than 50 characters`);
                }
            });
            
            if (loreData.tags.length > 20) {
                warnings.push('More than 20 tags may impact performance');
            }
        }
    }

    // Validate content type if provided
    if (loreData.contentType !== undefined) {
        if (typeof loreData.contentType !== 'string') {
            errors.push('Content type must be a string');
        } else {
            const validContentTypes = [
                'entry', 'location', 'event', 'character-lore', 'concept',
                'artifact', 'spell', 'technique', 'history', 'theory'
            ];
            
            if (!validContentTypes.includes(loreData.contentType)) {
                warnings.push(`Content type '${loreData.contentType}' is not in standard types`);
            }
        }
    }

    // Validate importance if provided
    if (loreData.importance !== undefined) {
        if (typeof loreData.importance !== 'string') {
            errors.push('Importance must be a string');
        } else {
            const validImportance = ['low', 'medium', 'high', 'critical'];
            
            if (!validImportance.includes(loreData.importance)) {
                errors.push(`Importance must be one of: ${validImportance.join(', ')}`);
            }
        }
    }

    // Validate spoiler level if provided
    if (loreData.spoilerLevel !== undefined) {
        if (typeof loreData.spoilerLevel !== 'number' || !Number.isInteger(loreData.spoilerLevel)) {
            errors.push('Spoiler level must be an integer');
        } else if (loreData.spoilerLevel < 0 || loreData.spoilerLevel > 5) {
            errors.push('Spoiler level must be between 0 and 5');
        }
    }

    // Validate status if provided
    if (loreData.status !== undefined) {
        if (typeof loreData.status !== 'string') {
            errors.push('Status must be a string');
        } else {
            const validStatuses = ['draft', 'review', 'approved', 'published', 'archived'];
            
            if (!validStatuses.includes(loreData.status)) {
                errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
            }
        }
    }

    // Validate published flag if provided
    if (loreData.published !== undefined) {
        if (typeof loreData.published !== 'boolean') {
            errors.push('Published must be a boolean');
        }
    }

    // Validate related entries if provided
    if (loreData.relatedEntries !== undefined) {
        if (!Array.isArray(loreData.relatedEntries)) {
            errors.push('Related entries must be an array');
        } else {
            loreData.relatedEntries.forEach((entryId, index) => {
                if (typeof entryId !== 'string' || entryId.trim().length === 0) {
                    errors.push(`Related entry at index ${index} must be a non-empty string`);
                }
            });
        }
    }

    // Validate related characters if provided
    if (loreData.relatedCharacters !== undefined) {
        if (!Array.isArray(loreData.relatedCharacters)) {
            errors.push('Related characters must be an array');
        } else {
            loreData.relatedCharacters.forEach((characterId, index) => {
                if (typeof characterId !== 'string' || characterId.trim().length === 0) {
                    errors.push(`Related character at index ${index} must be a non-empty string`);
                }
            });
        }
    }

    // Validate related episodes if provided
    if (loreData.relatedEpisodes !== undefined) {
        if (!Array.isArray(loreData.relatedEpisodes)) {
            errors.push('Related episodes must be an array');
        } else {
            loreData.relatedEpisodes.forEach((episodeId, index) => {
                if (typeof episodeId !== 'string' || episodeId.trim().length === 0) {
                    errors.push(`Related episode at index ${index} must be a non-empty string`);
                }
            });
        }
    }

    // Validate keywords if provided
    if (loreData.keywords !== undefined) {
        if (!Array.isArray(loreData.keywords)) {
            errors.push('Keywords must be an array');
        } else {
            loreData.keywords.forEach((keyword, index) => {
                if (typeof keyword !== 'string') {
                    errors.push(`Keyword at index ${index} must be a string`);
                } else if (keyword.trim().length === 0) {
                    errors.push(`Keyword at index ${index} cannot be empty`);
                } else if (keyword.length > 100) {
                    warnings.push(`Keyword '${keyword}' is longer than 100 characters`);
                }
            });
            
            if (loreData.keywords.length > 50) {
                warnings.push('More than 50 keywords may impact performance');
            }
        }
    }

    // Validate images if provided
    if (loreData.images !== undefined) {
        if (!Array.isArray(loreData.images)) {
            errors.push('Images must be an array');
        } else {
            loreData.images.forEach((imageUrl, index) => {
                if (typeof imageUrl !== 'string') {
                    errors.push(`Image URL at index ${index} must be a string`);
                } else if (imageUrl.trim().length === 0) {
                    errors.push(`Image URL at index ${index} cannot be empty`);
                } else if (!isValidUrl(imageUrl)) {
                    warnings.push(`Image URL at index ${index} may not be a valid URL`);
                }
            });
            
            if (loreData.images.length > 20) {
                warnings.push('More than 20 images may impact performance');
            }
        }
    }

    // Validate primary image if provided
    if (loreData.primaryImage !== undefined) {
        if (typeof loreData.primaryImage !== 'string') {
            errors.push('Primary image must be a string');
        } else if (loreData.primaryImage.length > 0 && !isValidUrl(loreData.primaryImage)) {
            warnings.push('Primary image may not be a valid URL');
        }
    }

    // Validate author if provided
    if (loreData.author !== undefined) {
        if (typeof loreData.author !== 'string') {
            errors.push('Author must be a string');
        } else if (loreData.author.trim().length === 0) {
            errors.push('Author cannot be empty');
        } else if (loreData.author.length > 100) {
            warnings.push('Author name is longer than 100 characters');
        }
    }

    // Validate editors if provided
    if (loreData.editors !== undefined) {
        if (!Array.isArray(loreData.editors)) {
            errors.push('Editors must be an array');
        } else {
            loreData.editors.forEach((editor, index) => {
                if (typeof editor !== 'string' || editor.trim().length === 0) {
                    errors.push(`Editor at index ${index} must be a non-empty string`);
                }
            });
        }
    }

    // Validate references if provided
    if (loreData.references !== undefined) {
        if (!Array.isArray(loreData.references)) {
            errors.push('References must be an array');
        } else {
            loreData.references.forEach((reference, index) => {
                if (typeof reference !== 'object' || reference === null) {
                    errors.push(`Reference at index ${index} must be an object`);
                } else {
                    if (!reference.title || typeof reference.title !== 'string') {
                        errors.push(`Reference at index ${index} must have a title`);
                    }
                    if (reference.url && typeof reference.url !== 'string') {
                        errors.push(`Reference URL at index ${index} must be a string`);
                    }
                    if (reference.url && !isValidUrl(reference.url)) {
                        warnings.push(`Reference URL at index ${index} may not be valid`);
                    }
                }
            });
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Validate lore search parameters
 * @param {Object} searchParams - Search parameters
 * @returns {Object} - Validation result
 */
function validateLoreSearchParams(searchParams) {
    const errors = [];
    const warnings = [];

    if (searchParams.query !== undefined) {
        if (typeof searchParams.query !== 'string') {
            errors.push('Search query must be a string');
        } else if (searchParams.query.length > 500) {
            warnings.push('Search query is very long and may impact performance');
        }
    }

    if (searchParams.category !== undefined) {
        if (typeof searchParams.category !== 'string') {
            errors.push('Category filter must be a string');
        }
    }

    if (searchParams.tags !== undefined) {
        if (!Array.isArray(searchParams.tags)) {
            errors.push('Tags filter must be an array');
        }
    }

    if (searchParams.importance !== undefined) {
        const validImportance = ['low', 'medium', 'high', 'critical'];
        if (!validImportance.includes(searchParams.importance)) {
            errors.push(`Importance filter must be one of: ${validImportance.join(', ')}`);
        }
    }

    if (searchParams.contentType !== undefined) {
        if (typeof searchParams.contentType !== 'string') {
            errors.push('Content type filter must be a string');
        }
    }

    if (searchParams.published !== undefined) {
        if (typeof searchParams.published !== 'boolean') {
            errors.push('Published filter must be a boolean');
        }
    }

    if (searchParams.limit !== undefined) {
        if (typeof searchParams.limit !== 'number' || !Number.isInteger(searchParams.limit)) {
            errors.push('Limit must be an integer');
        } else if (searchParams.limit < 1 || searchParams.limit > 1000) {
            errors.push('Limit must be between 1 and 1000');
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Validate lore entry completeness and quality
 * @param {Object} loreEntry - Complete lore entry
 * @returns {Object} - Quality assessment
 */
function validateLoreQuality(loreEntry) {
    const qualityChecks = {
        hasTitle: Boolean(loreEntry.title && loreEntry.title.trim().length > 0),
        hasSummary: Boolean(loreEntry.summary && loreEntry.summary.trim().length > 0),
        hasContent: Boolean(loreEntry.content && loreEntry.content.trim().length > 0),
        hasCategory: Boolean(loreEntry.category && loreEntry.category !== 'general'),
        hasTags: Boolean(loreEntry.tags && loreEntry.tags.length > 0),
        hasKeywords: Boolean(loreEntry.keywords && loreEntry.keywords.length > 0),
        hasImage: Boolean(loreEntry.primaryImage || (loreEntry.images && loreEntry.images.length > 0)),
        hasRelationships: Boolean(
            (loreEntry.relatedEntries && loreEntry.relatedEntries.length > 0) ||
            (loreEntry.relatedCharacters && loreEntry.relatedCharacters.length > 0) ||
            (loreEntry.relatedEpisodes && loreEntry.relatedEpisodes.length > 0)
        ),
        appropriateLength: Boolean(loreEntry.content && loreEntry.content.length >= 100)
    };

    // Calculate quality score (percentage)
    const totalChecks = Object.keys(qualityChecks).length;
    const passedChecks = Object.values(qualityChecks).filter(Boolean).length;
    const qualityScore = Math.round((passedChecks / totalChecks) * 100);

    // Determine quality level
    let qualityLevel = 'poor';
    if (qualityScore >= 90) qualityLevel = 'excellent';
    else if (qualityScore >= 75) qualityLevel = 'good';
    else if (qualityScore >= 50) qualityLevel = 'fair';

    // Generate improvement suggestions
    const suggestions = [];
    if (!qualityChecks.hasTitle) suggestions.push('Add a descriptive title');
    if (!qualityChecks.hasSummary) suggestions.push('Add a summary to help users understand the content quickly');
    if (!qualityChecks.hasContent) suggestions.push('Add detailed content to make this entry valuable');
    if (!qualityChecks.hasCategory) suggestions.push('Set a specific category instead of "general"');
    if (!qualityChecks.hasTags) suggestions.push('Add tags to improve discoverability');
    if (!qualityChecks.hasKeywords) suggestions.push('Add keywords for better search functionality');
    if (!qualityChecks.hasImage) suggestions.push('Add visual assets to make the entry more engaging');
    if (!qualityChecks.hasRelationships) suggestions.push('Link to related entries, characters, or episodes');
    if (!qualityChecks.appropriateLength) suggestions.push('Expand content to at least 100 characters for better value');

    return {
        score: qualityScore,
        level: qualityLevel,
        checks: qualityChecks,
        suggestions,
        isComplete: qualityScore >= 75
    };
}

/**
 * Helper function to validate URL format
 */
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

/**
 * Validate lore ID format
 * @param {string} loreId - Lore entry ID
 * @returns {boolean} - Whether ID is valid
 */
function isValidLoreId(loreId) {
    if (typeof loreId !== 'string') return false;
    if (loreId.length < 1 || loreId.length > 100) return false;
    
    // Allow letters, numbers, hyphens, and underscores
    const validPattern = /^[a-zA-Z0-9_-]+$/;
    return validPattern.test(loreId);
}

/**
 * Validate search parameters for lore queries
 */
function validateSearchParams(params) {
    const errors = [];
    
    if (!params || typeof params !== 'object') {
        return { isValid: false, errors: ['Search parameters must be an object'] };
    }
    
    // Validate query if provided
    if (params.query !== undefined) {
        if (typeof params.query !== 'string') {
            errors.push('Query must be a string');
        } else if (params.query.length > 500) {
            errors.push('Query too long (max 500 characters)');
        }
    }
    
    // Validate category if provided
    if (params.category !== undefined) {
        const validCategories = ['place', 'thing', 'villain', 'nature', 'band'];
        if (!validCategories.includes(params.category)) {
            errors.push(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
        }
    }
    
    // Validate tags if provided
    if (params.tags !== undefined) {
        if (!Array.isArray(params.tags)) {
            errors.push('Tags must be an array');
        } else if (params.tags.some(tag => typeof tag !== 'string')) {
            errors.push('All tags must be strings');
        }
    }
    
    // Validate limit if provided
    if (params.limit !== undefined) {
        if (!Number.isInteger(params.limit) || params.limit < 1 || params.limit > 1000) {
            errors.push('Limit must be an integer between 1 and 1000');
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Assess lore quality and provide improvement suggestions
 */
function assessLoreQuality(lore) {
    const checks = {
        hasTitle: lore.title && lore.title.length > 0,
        hasDescription: lore.description && lore.description.length > 20,
        hasCategory: lore.category && lore.category.length > 0,
        hasImage: lore.image && lore.image.length > 0,
        hasTags: lore.tags && Array.isArray(lore.tags) && lore.tags.length > 0,
        hasRelationships: lore.relationships && Array.isArray(lore.relationships) && lore.relationships.length > 0,
        richDescription: lore.description && lore.description.length > 100,
        multipleTags: lore.tags && lore.tags.length >= 3,
        hasEnhancement: lore.enhanced || lore.enhanced_title || lore.enhanced_description
    };
    
    const score = Object.values(checks).filter(Boolean).length * (100 / Object.keys(checks).length);
    
    const suggestions = [];
    if (!checks.hasTitle) suggestions.push('Add a compelling title');
    if (!checks.hasDescription) suggestions.push('Add a detailed description (min 20 characters)');
    if (!checks.hasCategory) suggestions.push('Assign to a category (place, thing, villain, nature, band)');
    if (!checks.hasImage) suggestions.push('Add an image URL');
    if (!checks.hasTags) suggestions.push('Add relevant tags for discoverability');
    if (!checks.hasRelationships) suggestions.push('Connect to other lore items');
    if (!checks.richDescription) suggestions.push('Expand description for richer content (100+ characters)');
    if (!checks.multipleTags) suggestions.push('Add more tags (3+ recommended)');
    if (!checks.hasEnhancement) suggestions.push('Consider AI enhancement for dramatic impact');
    
    return {
        score: Math.round(score),
        checks,
        suggestions,
        grade: score >= 90 ? 'Excellent' : score >= 75 ? 'Good' : score >= 60 ? 'Fair' : 'Needs Improvement'
    };
}

/**
 * Generate comprehensive quality report for lore item
 */
function generateQualityReport(lore) {
    const quality = assessLoreQuality(lore);
    const contentMetrics = calculateContentMetrics(lore);
    
    return {
        ...quality,
        metrics: contentMetrics,
        recommendations: generateRecommendations(quality, contentMetrics)
    };
}

module.exports = {
    validateLoreData,
    validateSearchParams,
    assessLoreQuality,
    generateQualityReport
};