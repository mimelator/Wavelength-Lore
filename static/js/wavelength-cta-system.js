/**
 * WAVELENGTH DYNAMIC CTA SYSTEM
 * Enhanced Call-to-Action components that adapt based on authentic content
 */

class WavelengthCTASystem {
  constructor() {
    this.ctaTemplates = {
      character: {
        primary: {
          icon: '🎭',
          title: 'Meet the Hero',
          fallbackCTA: 'Discover Journey'
        },
        episodes: {
          icon: '🎬',
          title: 'Watch Their Story',
          fallbackCTA: 'Find Episodes'
        },
        connections: {
          icon: '🔗',
          title: 'Character Network',
          fallbackCTA: 'Explore Network'
        },
        lore: {
          icon: '📚',
          title: 'Uncover Mysteries',
          fallbackCTA: 'Explore Lore'
        }
      },
      lore: {
        investigation: {
          icon: '🕵️‍♀️',
          title: 'Dive Into Mystery',
          fallbackCTA: 'Investigate Now'
        },
        connections: {
          icon: '🌐',
          title: 'Related Lore',
          fallbackCTA: 'Explore Connections'
        }
      }
    };
  }

  /**
   * Generate character tagline display with authentic content
   */
  generateCharacterTagline(character) {
    if (!character.tagline) return '';
    
    return `
      <div class="wavelength-character-tagline" 
           style="background: rgba(0,0,0,0.7); padding: 15px 25px; border-radius: 25px; 
                  margin: 20px auto; max-width: 600px; backdrop-filter: blur(10px); 
                  text-align: center;">
        <h2 style="margin: 0; font-size: 1.4rem; color: #fff; 
                   text-shadow: 2px 2px 4px rgba(0,0,0,0.8); font-style: italic;">
          "${character.tagline}"
        </h2>
      </div>
    `;
  }

  /**
   * Generate character stakes display with enhanced styling
   */
  generateCharacterStakes(character) {
    if (!character.stakes) return '';
    
    return `
      <div class="wavelength-character-stakes" 
           style="margin-top: 25px; padding: 20px; 
                  background: linear-gradient(135deg, rgba(139,69,19,0.1) 0%, rgba(184,134,11,0.1) 100%); 
                  border-left: 4px solid #b8860b; border-radius: 8px;">
        <h4 style="color: #b8860b; margin-bottom: 10px; font-size: 1.1rem;">⚔️ The Stakes</h4>
        <p style="color: #333; font-style: italic; margin: 0;">${character.stakes}</p>
      </div>
    `;
  }

  /**
   * Generate dynamic CTA button with authentic content
   */
  generateDynamicCTA(content, ctaType, targetUrl = '#') {
    const template = this.ctaTemplates[content.type || 'character'][ctaType];
    if (!template) return '';

    const ctaText = content.cta_text || content.investigation_cta || template.fallbackCTA;
    const buttonStyle = this.getCTAButtonStyle(ctaType);
    
    return `
      <div class="wavelength-cta-card" 
           style="background: rgba(255,255,255,0.15); padding: 20px; border-radius: 12px; 
                  backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2);">
        <div style="font-size: 2rem; margin-bottom: 10px;">${template.icon}</div>
        <h4 style="margin-bottom: 10px;">${template.title}</h4>
        <p style="font-size: 0.9rem; opacity: 0.9; margin-bottom: 15px;">
          ${this.generateContextualDescription(content, ctaType)}
        </p>
        <a href="${targetUrl}" class="wavelength-cta-btn" style="${buttonStyle.base}"
           onmouseover="this.style.background='${buttonStyle.hover}'; this.style.transform='translateY(-2px)'"
           onmouseout="this.style.background='${buttonStyle.base.match(/background: ([^;]+)/)[1]}'; this.style.transform='translateY(0)'">
          ${ctaText}
        </a>
      </div>
    `;
  }

  /**
   * Generate contextual description based on content
   */
  generateContextualDescription(content, ctaType) {
    // Use stakes for characters, intrigue_hook for lore
    if (content.stakes && ctaType === 'connections') {
      return content.stakes.length > 100 ? 
        (content.stakes.substring(0, 80) + '...') : 
        content.stakes;
    }
    
    if (content.intrigue_hook && ctaType === 'investigation') {
      return content.intrigue_hook.length > 100 ? 
        (content.intrigue_hook.substring(0, 120) + '...') : 
        content.intrigue_hook;
    }
    
    // Fallback descriptions
    const fallbacks = {
      episodes: `See ${content.title} in action across the Wavelength universe`,
      connections: `Discover how ${content.title} connects to other heroes`,
      lore: `Dive into the deeper mysteries surrounding ${content.title}`,
      investigation: `Uncover the secrets and mysteries surrounding ${content.title}`
    };
    
    return fallbacks[ctaType] || `Explore more about ${content.title}`;
  }

  /**
   * Get CTA button styling based on type
   */
  getCTAButtonStyle(ctaType) {
    const styles = {
      primary: {
        base: 'background: #ff6b6b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 20px; font-weight: bold; transition: all 0.3s ease; display: inline-block;',
        hover: '#ff5252'
      },
      episodes: {
        base: 'background: #ff6b6b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 20px; font-weight: bold; transition: all 0.3s ease; display: inline-block;',
        hover: '#ff5252'
      },
      connections: {
        base: 'background: #74b9ff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 20px; font-weight: bold; transition: all 0.3s ease; display: inline-block;',
        hover: '#0984e3'
      },
      lore: {
        base: 'background: #a29bfe; color: white; padding: 10px 20px; text-decoration: none; border-radius: 20px; font-weight: bold; transition: all 0.3s ease; display: inline-block;',
        hover: '#6c5ce7'
      },
      investigation: {
        base: 'background: #ffd700; color: #8b4513; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: bold; transition: all 0.3s ease; display: inline-block; border: 2px solid #fff; box-shadow: 0 4px 8px rgba(0,0,0,0.3);',
        hover: '#ffed4e'
      }
    };
    
    return styles[ctaType] || styles.primary;
  }

  /**
   * Generate lore intrigue hook with mystery styling
   */
  generateLoreIntrigueHook(lore) {
    if (!lore.intrigue_hook) return '';
    
    return `
      <div class="wavelength-lore-intrigue" 
           style="background: rgba(139,69,19,0.9); padding: 20px 30px; border-radius: 15px; 
                  margin: 25px auto; max-width: 700px; backdrop-filter: blur(10px); 
                  border: 2px solid rgba(184,134,11,0.5);">
        <div style="color: #ffd700; font-size: 1.8rem; margin-bottom: 10px; text-align: center;">🔍</div>
        <p style="margin: 0; font-size: 1.1rem; color: #fff; text-shadow: 2px 2px 4px rgba(0,0,0,0.8); 
                  line-height: 1.4; text-align: center; font-style: italic;">
          ${lore.intrigue_hook}
        </p>
        ${lore.mystery_level ? `
          <div style="margin-top: 15px; padding: 8px 15px; background: rgba(0,0,0,0.4); 
                      border-radius: 20px; text-align: center;">
            <span style="color: #ffd700; font-size: 0.9rem; font-weight: bold;">
              🌟 Mystery Level: ${lore.mystery_level}
            </span>
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Generate complete CTA grid for character pages
   */
  generateCharacterCTAGrid(character) {
    return `
      <section class="wavelength-character-cta-section" 
               style="margin: 40px 0; padding: 30px; 
                      background: linear-gradient(135deg, #8360c3 0%, #2ebf91 100%); 
                      border-radius: 15px; color: white; text-align: center;">
        <h3 style="margin-bottom: 20px; font-size: 1.5rem;">Dive Deeper into ${character.title}'s World</h3>
        
        <div class="wavelength-cta-grid" 
             style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
                    gap: 20px; margin: 25px 0;">
          ${this.generateDynamicCTA(character, 'episodes', '/')}
          ${this.generateDynamicCTA(character, 'connections', '/characters')}
          ${this.generateDynamicCTA(character, 'lore', '/lore')}
        </div>
      </section>
    `;
  }

  /**
   * Generate investigation CTA section for lore pages
   */
  generateLoreInvestigationCTA(lore) {
    if (!lore.investigation_cta) return '';
    
    return `
      <section class="wavelength-lore-cta-section" 
               style="margin: 40px 0; padding: 25px; 
                      background: linear-gradient(135deg, #8b4513 0%, #d2691e 100%); 
                      border-radius: 15px; color: white; text-align: center; 
                      border: 3px solid #ffd700;">
        <div style="font-size: 2.5rem; margin-bottom: 15px;">🕵️‍♀️</div>
        <h3 style="margin-bottom: 15px; font-size: 1.4rem; color: #ffd700;">
          Dive Deeper into the Mystery
        </h3>
        <p style="font-size: 1rem; opacity: 0.9; margin-bottom: 20px; max-width: 600px; 
                  margin-left: auto; margin-right: auto;">
          ${this.generateContextualDescription(lore, 'investigation')}
        </p>
        ${this.generateDynamicCTA(lore, 'investigation', '/lore')}
      </section>
    `;
  }
}

// Make the CTA system available globally
if (typeof window !== 'undefined') {
  window.WavelengthCTASystem = WavelengthCTASystem;
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WavelengthCTASystem;
}

console.log('🌊 Wavelength Dynamic CTA System loaded and ready!');