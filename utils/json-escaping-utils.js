/**
 * 🔧 WAVELENGTH JSON ESCAPING UTILITIES
 * 
 * Reusable JSON escaping/unescaping functions for safe data attribute handling
 * Used across the site for CTA content, character data, lore objects, etc.
 */

/**
 * Escape JSON content for safe use in HTML data attributes
 * @param {string} jsonString - JSON string to escape
 * @returns {string} - Escaped string safe for HTML attributes
 */
function escapeJsonForHtml(jsonString) {
  if (typeof jsonString !== 'string') {
    throw new Error('escapeJsonForHtml expects a string input');
  }
  
  return jsonString
    .replace(/&/g, '&amp;')    // Escape ampersands first (before other HTML entities)
    .replace(/</g, '&lt;')     // Escape less than
    .replace(/>/g, '&gt;')     // Escape greater than
    .replace(/"/g, '&quot;')   // Escape quotes with HTML entity
    .replace(/'/g, '&#x27;')   // Escape single quotes
    .replace(/\\/g, '\\\\');   // Escape backslashes last
}

/**
 * Safely unescape JSON data from HTML data attributes (returns string)
 * Reverses the escaping done by escapeJsonForHtml()
 * @param {string} escapedJson - Escaped JSON string from HTML attribute
 * @returns {string} Unescaped JSON string
 */
function unescapeJsonFromHtml(escapedJson) {
  if (typeof escapedJson !== 'string') {
    throw new Error('unescapeJsonFromHtml expects a string input');
  }
  
  return escapedJson
    .replace(/\\\\/g, '\\')     // Unescape backslashes first
    .replace(/&#x27;/g, "'")    // Unescape single quotes/apostrophes
    .replace(/&quot;/g, '"')    // Unescape double quotes
    .replace(/&gt;/g, '>')      // Unescape greater than
    .replace(/&lt;/g, '<')      // Unescape less than
    .replace(/&amp;/g, '&');    // Unescape ampersands last
}

/**
 * Safely unescape and parse JSON data from HTML data attributes
 * @param {string} escapedJson - Escaped JSON string from HTML attribute
 * @returns {any} Parsed JSON data, or null if parsing fails
 */
function unescapeAndParseJsonFromHtml(escapedJson) {
  try {
    const unescapedData = unescapeJsonFromHtml(escapedJson);
    return JSON.parse(unescapedData);
  } catch (error) {
    console.error('Failed to unescape and parse JSON from HTML:', error);
    console.error('Raw escaped data:', escapedJson);
    return null; // Return null on parse failure
  }
}

/**
 * Escape text content for HTML attributes (for data-phrase, etc.)
 * @param {string} text - Text to escape for HTML attribute
 * @returns {string} Safely escaped text
 */
function escapeTextForHtml(text) {
  if (typeof text !== 'string') {
    text = String(text);
  }
  
  return text
    .replace(/&/g, '&amp;')    // Escape ampersands first
    .replace(/"/g, '&quot;')   // Escape double quotes
    .replace(/'/g, '&#x27;')   // Escape single quotes
    .replace(/</g, '&lt;')     // Escape less than
    .replace(/>/g, '&gt;');    // Escape greater than
}

/**
 * Test the JSON escaping with problematic content
 * @returns {boolean} True if tests pass, false otherwise
 */
function testJsonEscaping() {
  console.log('🧪 Testing JSON escaping utilities...');
  
  const testData = [
    {
      name: 'Test "Character" with quotes',
      description: 'Contains \'apostrophes\' and "quotes"',
      content: 'Has <script>alert("xss")</script> tags',
      path: 'Contains\\backslashes\\and\\paths',
      special: 'Ampersands & other chars'
    }
  ];
  
  try {
    // Test escaping
    const escaped = escapeJsonForHtml(testData);
    console.log('✅ JSON escaping successful');
    
    // Test unescaping
    const unescaped = unescapeJsonFromHtml(escaped);
    console.log('✅ JSON unescaping successful');
    
    // Test data integrity
    const original = testData[0];
    const roundtrip = unescaped[0];
    
    const integrityChecks = [
      original.name === roundtrip.name,
      original.description === roundtrip.description,
      original.content === roundtrip.content,
      original.path === roundtrip.path,
      original.special === roundtrip.special
    ];
    
    const allPassed = integrityChecks.every(check => check === true);
    
    if (allPassed) {
      console.log('✅ Data integrity verified - all special characters preserved');
      return true;
    } else {
      console.log('❌ Data integrity failed - some characters were corrupted');
      return false;
    }
    
  } catch (error) {
    console.log('❌ JSON escaping test failed:', error.message);
    return false;
  }
}

/**
 * Create safe disambiguation modal data attributes
 * @param {object|string} data - The data object to be stored in the attribute, or CTA object
 * @param {Array} conflicts - Array of conflict objects (optional, for backward compatibility)
 * @returns {string} HTML attribute string with escaped content
 */
function createDisambiguationAttributes(data, conflicts = []) {
  try {
    // Handle both old-style (phrase, conflicts) and new-style (data object) calls
    let contentObject;
    if (typeof data === 'string') {
      // Old-style call: createDisambiguationAttributes(phrase, conflicts)
      contentObject = { phrase: data, conflicts: conflicts };
    } else {
      // New-style call: createDisambiguationAttributes(ctaData)
      contentObject = data;
    }
    
    const jsonString = JSON.stringify(contentObject);
    const escapedJson = escapeJsonForHtml(jsonString);
    
    return `data-disambiguation-content="${escapedJson}"`;
  } catch (error) {
    console.error('Failed to create disambiguation attributes:', error);
    return 'data-disambiguation-content=""';
  }
}

/**
 * Parse disambiguation modal data attributes safely
 * @param {HTMLElement} element - Element with data attributes
 * @returns {object} Object with phrase and conflicts, or null if parsing fails
 */
function parseDisambiguationAttributes(element) {
  try {
    const contentAttr = element.dataset.disambiguationContent || '';
    if (!contentAttr) {
      return null;
    }
    
    const parsed = unescapeAndParseJsonFromHtml(contentAttr);
    return parsed;
  } catch (error) {
    console.error('Failed to parse disambiguation attributes:', error);
    return null;
  }
}

// Export for Node.js modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    escapeJsonForHtml,
    unescapeJsonFromHtml,
    unescapeAndParseJsonFromHtml,
    unescapeJsonFromHtml,
    escapeTextForHtml,
    testJsonEscaping,
    createDisambiguationAttributes,
    parseDisambiguationAttributes
  };
}

// Export for browser usage
if (typeof window !== 'undefined') {
  window.WavelengthJsonUtils = {
    escapeJsonForHtml,
    unescapeJsonFromHtml,
    escapeTextForHtml,
    testJsonEscaping,
    createDisambiguationAttributes,
    parseDisambiguationAttributes
  };
}