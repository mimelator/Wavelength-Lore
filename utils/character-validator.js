/**
 * Character Data Validator
 * 
 * Validates character data structure and content for Firebase storage
 * Includes CTA field validation for Issue #80 requirements
 * 
 * GitHub Issue: #152 - Milestone 2.1.2: CLI CRUD Activities
 * Related Issue: #80 - Character CTA Enhancement Fields
 */

/**
 * Validate character data against schema
 * @param {Object} characterData - Character data to validate
 * @param {boolean} isPartialUpdate - Whether this is a partial update (allows missing required fields)
 * @returns {Object} - Validation result with isValid flag and errors array
 */
function validateCharacterData(characterData, isPartialUpdate = false) {
    const errors = [];
    const warnings = [];

    // Required fields for new characters (skip for partial updates)
    if (!isPartialUpdate) {
        if (!characterData.name || typeof characterData.name !== 'string' || characterData.name.trim().length === 0) {
            errors.push('Name is required and must be a non-empty string');
        }
    }

    // Validate name if provided
    if (characterData.name !== undefined) {
        if (typeof characterData.name !== 'string') {
            errors.push('Name must be a string');
        } else if (characterData.name.trim().length === 0) {
            errors.push('Name cannot be empty');
        } else if (characterData.name.length > 100) {
            warnings.push('Name is longer than 100 characters');
        }
    }

    // Validate title if provided
    if (characterData.title !== undefined) {
        if (typeof characterData.title !== 'string') {
            errors.push('Title must be a string');
        } else if (characterData.title.length > 150) {
            warnings.push('Title is longer than 150 characters');
        }
    }

    // Validate role if provided
    if (characterData.role !== undefined) {
        const validRoles = ['protagonist', 'antagonist', 'main', 'supporting', 'villain', 'minor', 'npc'];
        if (typeof characterData.role !== 'string') {
            errors.push('Role must be a string');
        } else if (!validRoles.includes(characterData.role.toLowerCase())) {
            warnings.push(`Role should be one of: ${validRoles.join(', ')}`);
        }
    }

    // Validate description if provided
    if (characterData.description !== undefined) {
        if (typeof characterData.description !== 'string') {
            errors.push('Description must be a string');
        } else if (characterData.description.length > 5000) {
            warnings.push('Description is longer than 5000 characters');
        }
    }

    // Validate backstory if provided
    if (characterData.backstory !== undefined) {
        if (typeof characterData.backstory !== 'string') {
            errors.push('Backstory must be a string');
        } else if (characterData.backstory.length > 10000) {
            warnings.push('Backstory is longer than 10000 characters');
        }
    }

    // Validate traits array if provided
    if (characterData.traits !== undefined) {
        if (!Array.isArray(characterData.traits)) {
            errors.push('Traits must be an array');
        } else {
            characterData.traits.forEach((trait, index) => {
                if (typeof trait !== 'string') {
                    errors.push(`Trait ${index + 1} must be a string`);
                } else if (trait.trim().length === 0) {
                    warnings.push(`Trait ${index + 1} is empty`);
                } else if (trait.length > 50) {
                    warnings.push(`Trait ${index + 1} is longer than 50 characters`);
                }
            });

            if (characterData.traits.length > 15) {
                warnings.push('More than 15 traits may be excessive');
            }
        }
    }

    // Validate CTA Enhancement Fields (Issue #80)
    validateCTAField(characterData, 'tagline', 200, errors, warnings);
    validateCTAField(characterData, 'stakes', 500, errors, warnings);
    validateCTAField(characterData, 'cta_text', 50, errors, warnings);
    validateCTAField(characterData, 'cta_hook', 300, errors, warnings);
    validateCTAField(characterData, 'power_statement', 200, errors, warnings);

    // Validate image path if provided
    if (characterData.image !== undefined) {
        if (typeof characterData.image !== 'string') {
            errors.push('Image path must be a string');
        } else if (characterData.image.length > 0 && !isValidImagePath(characterData.image)) {
            warnings.push('Image path should start with / or http and end with a valid image extension');
        }
    }

    // Validate avatar gallery if provided
    if (characterData.avatarGallery !== undefined) {
        if (!Array.isArray(characterData.avatarGallery)) {
            errors.push('Avatar gallery must be an array');
        } else {
            characterData.avatarGallery.forEach((imageUrl, index) => {
                if (typeof imageUrl !== 'string') {
                    errors.push(`Avatar ${index + 1} must be a string`);
                } else if (!isValidImagePath(imageUrl)) {
                    warnings.push(`Avatar ${index + 1} should be a valid image path`);
                }
            });

            if (characterData.avatarGallery.length > 20) {
                warnings.push('More than 20 avatar images may impact performance');
            }
        }
    }

    // Validate episodes array if provided
    if (characterData.episodes !== undefined) {
        if (!Array.isArray(characterData.episodes)) {
            errors.push('Episodes must be an array');
        } else {
            characterData.episodes.forEach((episodeId, index) => {
                if (typeof episodeId !== 'string') {
                    errors.push(`Episode ${index + 1} ID must be a string`);
                } else if (!isValidEpisodeId(episodeId)) {
                    warnings.push(`Episode ${index + 1} ID should follow format "s1e1"`);
                }
            });
        }
    }

    // Validate relationships object if provided
    if (characterData.relationships !== undefined) {
        if (typeof characterData.relationships !== 'object' || characterData.relationships === null) {
            errors.push('Relationships must be an object');
        } else {
            const validRelationshipTypes = ['ally', 'enemy', 'friend', 'rival', 'family', 'mentor', 'student', 'neutral'];
            Object.entries(characterData.relationships).forEach(([characterId, relationship]) => {
                if (!isValidId(characterId)) {
                    warnings.push(`Relationship character ID "${characterId}" should follow kebab-case format`);
                }
                if (typeof relationship !== 'string') {
                    errors.push(`Relationship with "${characterId}" must be a string`);
                } else if (!validRelationshipTypes.includes(relationship.toLowerCase())) {
                    warnings.push(`Relationship with "${characterId}" should be one of: ${validRelationshipTypes.join(', ')}`);
                }
            });
        }
    }

    // Validate lore connections array if provided
    if (characterData.loreConnections !== undefined) {
        if (!Array.isArray(characterData.loreConnections)) {
            errors.push('Lore connections must be an array');
        } else {
            characterData.loreConnections.forEach((loreId, index) => {
                if (typeof loreId !== 'string') {
                    errors.push(`Lore connection ${index + 1} ID must be a string`);
                } else if (!isValidId(loreId)) {
                    warnings.push(`Lore connection ${index + 1} ID should follow kebab-case format`);
                }
            });
        }
    }

    // Validate published status if provided
    if (characterData.published !== undefined && typeof characterData.published !== 'boolean') {
        errors.push('Published status must be a boolean');
    }

    // Validate metadata if provided
    if (characterData.metadata !== undefined) {
        validateCharacterMetadata(characterData.metadata, errors, warnings);
    }

    return {
        isValid: errors.length === 0,
        errors: errors,
        warnings: warnings
    };
}

/**
 * Validate CTA field (Issue #80)
 * @param {Object} characterData - Character data object
 * @param {string} fieldName - Name of CTA field to validate
 * @param {number} maxLength - Maximum length for the field
 * @param {Array} errors - Errors array to append to
 * @param {Array} warnings - Warnings array to append to
 */
function validateCTAField(characterData, fieldName, maxLength, errors, warnings) {
    if (characterData[fieldName] !== undefined) {
        if (typeof characterData[fieldName] !== 'string') {
            errors.push(`${fieldName} must be a string`);
        } else if (characterData[fieldName].length > maxLength) {
            warnings.push(`${fieldName} is longer than ${maxLength} characters`);
        } else if (characterData[fieldName].trim().length === 0) {
            warnings.push(`${fieldName} is empty`);
        }
    }
}

/**
 * Validate character metadata object
 * @param {Object} metadata - Metadata object to validate
 * @param {Array} errors - Errors array to append to
 * @param {Array} warnings - Warnings array to append to
 */
function validateCharacterMetadata(metadata, errors, warnings) {
    if (typeof metadata !== 'object' || metadata === null) {
        errors.push('Metadata must be an object');
        return;
    }

    // Validate character type
    if (metadata.characterType !== undefined) {
        const validTypes = ['main', 'supporting', 'villain', 'npc', 'cameo'];
        if (typeof metadata.characterType !== 'string') {
            errors.push('Metadata character type must be a string');
        } else if (!validTypes.includes(metadata.characterType.toLowerCase())) {
            warnings.push(`Metadata character type should be one of: ${validTypes.join(', ')}`);
        }
    }

    // Validate species
    if (metadata.species !== undefined && typeof metadata.species !== 'string') {
        errors.push('Metadata species must be a string');
    }

    // Validate age
    if (metadata.age !== undefined && typeof metadata.age !== 'string') {
        errors.push('Metadata age must be a string');
    }

    // Validate location
    if (metadata.location !== undefined) {
        if (typeof metadata.location !== 'string') {
            errors.push('Metadata location must be a string');
        } else if (!isValidId(metadata.location)) {
            warnings.push('Metadata location should reference a valid lore location ID');
        }
    }

    // Validate weapons array
    if (metadata.weapons !== undefined) {
        if (!Array.isArray(metadata.weapons)) {
            errors.push('Metadata weapons must be an array');
        } else {
            metadata.weapons.forEach((weapon, index) => {
                if (typeof weapon !== 'string') {
                    errors.push(`Metadata weapon ${index + 1} must be a string`);
                }
            });
        }
    }

    // Validate abilities array
    if (metadata.abilities !== undefined) {
        if (!Array.isArray(metadata.abilities)) {
            errors.push('Metadata abilities must be an array');
        } else {
            metadata.abilities.forEach((ability, index) => {
                if (typeof ability !== 'string') {
                    errors.push(`Metadata ability ${index + 1} must be a string`);
                }
            });
        }
    }

    // Validate AI enhanced flag
    if (metadata.aiEnhanced !== undefined && typeof metadata.aiEnhanced !== 'boolean') {
        errors.push('Metadata aiEnhanced must be a boolean');
    }

    // Validate content rating
    if (metadata.contentRating !== undefined) {
        const validRatings = ['all-ages', 'teen', 'mature'];
        if (typeof metadata.contentRating !== 'string') {
            errors.push('Metadata content rating must be a string');
        } else if (!validRatings.includes(metadata.contentRating.toLowerCase())) {
            warnings.push(`Metadata content rating should be one of: ${validRatings.join(', ')}`);
        }
    }
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
 * Validate episode ID format
 * @param {string} episodeId - Episode ID to validate
 * @returns {boolean} - Whether episode ID follows format "s1e1"
 */
function isValidEpisodeId(episodeId) {
    if (!episodeId || typeof episodeId !== 'string') {
        return false;
    }

    // Should match pattern like "s1e1", "s2e10", etc.
    const episodeIdRegex = /^s\d+e\d+$/;
    return episodeIdRegex.test(episodeId);
}

/**
 * Get character validation schema for reference
 * @returns {Object} - Complete character data schema
 */
function getCharacterSchema() {
    return {
        // Required fields
        name: { type: 'string', required: true, maxLength: 100 },
        
        // Optional core fields
        title: { type: 'string', maxLength: 150 },
        role: { type: 'string', enum: ['protagonist', 'antagonist', 'main', 'supporting', 'villain', 'minor', 'npc'] },
        description: { type: 'string', maxLength: 5000 },
        backstory: { type: 'string', maxLength: 10000 },
        traits: { type: 'array', itemType: 'string', maxItems: 15 },
        
        // CTA Enhancement Fields (Issue #80)
        tagline: { type: 'string', maxLength: 200, description: 'Character motto or catchphrase' },
        stakes: { type: 'string', maxLength: 500, description: 'What this character has at risk' },
        cta_text: { type: 'string', maxLength: 50, description: 'Call-to-action button text' },
        cta_hook: { type: 'string', maxLength: 300, description: 'Engaging hook to draw users' },
        power_statement: { type: 'string', maxLength: 200, description: 'Strong statement about character' },
        
        // Visual assets
        image: { type: 'string', validation: 'image-path' },
        avatarGallery: { type: 'array', itemType: 'string', maxItems: 20 },
        
        // Relationships
        episodes: { type: 'array', itemType: 'string', validation: 'episode-id' },
        relationships: { type: 'object', valueType: 'string' },
        loreConnections: { type: 'array', itemType: 'string', validation: 'id-format' },
        
        // Status fields
        published: { type: 'boolean', default: true },
        hidden: { type: 'boolean', default: false },
        
        // Metadata object
        metadata: {
            type: 'object',
            properties: {
                characterType: { type: 'string', enum: ['main', 'supporting', 'villain', 'npc', 'cameo'] },
                species: { type: 'string', default: 'human' },
                age: { type: 'string' },
                location: { type: 'string', validation: 'id-format' },
                weapons: { type: 'array', itemType: 'string' },
                abilities: { type: 'array', itemType: 'string' },
                aiEnhanced: { type: 'boolean', default: false },
                contentRating: { type: 'string', enum: ['all-ages', 'teen', 'mature'], default: 'all-ages' }
            }
        }
    };
}

/**
 * Validate CTA fields completeness for a character
 * @param {Object} character - Character object to check
 * @returns {Object} - CTA validation result with completeness score
 */
function validateCTACompleteness(character) {
    const ctaFields = ['tagline', 'stakes', 'cta_text', 'cta_hook', 'power_statement'];
    const completedFields = [];
    const missingFields = [];
    
    ctaFields.forEach(field => {
        if (character[field] && character[field].trim().length > 0) {
            completedFields.push(field);
        } else {
            missingFields.push(field);
        }
    });
    
    const completenessScore = (completedFields.length / ctaFields.length) * 100;
    
    return {
        completenessScore: completenessScore,
        completedFields: completedFields,
        missingFields: missingFields,
        isComplete: completenessScore === 100,
        recommendations: generateCTARecommendations(missingFields, character)
    };
}

/**
 * Generate CTA improvement recommendations
 * @param {Array} missingFields - Array of missing CTA fields
 * @param {Object} character - Character object
 * @returns {Array} - Array of recommendation strings
 */
function generateCTARecommendations(missingFields, character) {
    const recommendations = [];
    
    missingFields.forEach(field => {
        switch (field) {
            case 'tagline':
                recommendations.push(`Add a memorable tagline that captures ${character.name}'s essence`);
                break;
            case 'stakes':
                recommendations.push(`Define what ${character.name} has at risk to create emotional investment`);
                break;
            case 'cta_text':
                recommendations.push(`Create compelling call-to-action button text for ${character.name}'s page`);
                break;
            case 'cta_hook':
                recommendations.push(`Write an engaging hook to draw users into ${character.name}'s story`);
                break;
            case 'power_statement':
                recommendations.push(`Craft a powerful statement that defines ${character.name}'s importance`);
                break;
        }
    });
    
    return recommendations;
}

module.exports = {
    validateCharacterData,
    validateCTAField,
    validateCharacterMetadata,
    isValidImagePath,
    isValidId,
    isValidEpisodeId,
    getCharacterSchema,
    validateCTACompleteness,
    generateCTARecommendations
};