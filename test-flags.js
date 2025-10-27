#!/usr/bin/env node

/**
 * Simple test to check Firebase schema enhancer flags
 */

console.log('🔍 Testing Firebase Schema Enhancer flags...');

// Parse command line arguments (same as the main script)
const args = process.argv.slice(2);
const flags = {
  dryRun: args.includes('--dry-run'),
  charactersOnly: args.includes('--characters'),
  episodesOnly: args.includes('--episodes'),
  loreOnly: args.includes('--lore'),
  analyticsOnly: args.includes('--analytics'),
  backup: args.includes('--backup'),
  rollback: args.includes('--rollback'),
  useAuthenticContent: args.includes('--use-authentic-content')
};

console.log('📊 Parsed flags:', flags);

// Check the same logic
const shouldUpdateCharacters = !flags.episodesOnly && !flags.loreOnly && !flags.analyticsOnly;
const shouldUpdateEpisodes = !flags.charactersOnly && !flags.loreOnly && !flags.analyticsOnly;
const shouldUpdateLore = !flags.charactersOnly && !flags.episodesOnly && !flags.analyticsOnly;
const shouldUpdateAnalytics = !flags.charactersOnly && !flags.episodesOnly && !flags.loreOnly;

console.log('🎯 Update decisions:');
console.log(`   Characters: ${shouldUpdateCharacters}`);
console.log(`   Episodes: ${shouldUpdateEpisodes}`);
console.log(`   Lore: ${shouldUpdateLore}`);
console.log(`   Analytics: ${shouldUpdateAnalytics}`);
console.log(`   Use Authentic Content: ${flags.useAuthenticContent}`);

if (flags.useAuthenticContent) {
  console.log('✨ Would generate authentic content');
} else {
  console.log('📝 Would use generic content');
}

console.log('✅ Test complete - no execution errors');