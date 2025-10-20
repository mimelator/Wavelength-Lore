#!/usr/bin/env node

/**
 * Export Firebase data back to YAML files
 * This script reads data from Firebase and writes it back to the content YAML files
 * 
 * Usage: node scripts/export-firebase-to-yaml.js [--type=all|seasons|characters|lore|prompts]
 */

const yaml = require('js-yaml');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Use existing Firebase utilities
const firebaseUtils = require('../helpers/firebase-utils');
const { fetchDataAsAdmin } = require('../helpers/firebase-admin-utils');

// Initialize Firebase using existing utility
firebaseUtils.initializeFirebase('export-script');

/**
 * Export seasons data to YAML files
 */
async function exportSeasons() {
  console.log('📺 Exporting seasons...');
  
  const seasonsData = await firebaseUtils.fetchFromFirebase('videos');
  
  if (!seasonsData) {
    console.log('⚠️  No seasons data found in Firebase');
    return;
  }
  
  let exportedCount = 0;
  
  for (const seasonKey in seasonsData) {
    if (!seasonKey.startsWith('season')) continue;
    
    const seasonNumber = seasonKey.replace('season', '');
    const seasonData = seasonsData[seasonKey];
    const episodes = seasonData.episodes || {};
    
    // Build season YAML structure
    const seasonYaml = {
      title: seasonData.title || `Season ${seasonNumber}`,
      seasonLink: seasonData.seasonLink || '',
      image: seasonData.image || '',
      description: seasonData.description || '',
      episodes: {}
    };
    
    // Add episodes
    for (const episodeKey in episodes) {
      const episode = episodes[episodeKey];
      seasonYaml.episodes[episodeKey] = {
        title: episode.title,
        description: episode.description,
        keywords: episode.keywords || [],
        youtubeLink: episode.youtubeLink || '',
        image: episode.image || '',
        audio: episode.audio || '',
        carouselImages: episode.carouselImages || [],
        story: episode.story || '',
        lyrics: episode.lyrics || '',
        summary: episode.summary || ''
      };
      
      // Remove empty fields
      Object.keys(seasonYaml.episodes[episodeKey]).forEach(key => {
        const value = seasonYaml.episodes[episodeKey][key];
        if (value === '' || (Array.isArray(value) && value.length === 0)) {
          delete seasonYaml.episodes[episodeKey][key];
        }
      });
    }
    
    // Write to file
    const filePath = path.join(__dirname, '../content/seasons', `season${seasonNumber}.yaml`);
    const yamlContent = yaml.dump(seasonYaml, {
      lineWidth: -1,
      noRefs: true,
      sortKeys: false
    });
    
    await fs.writeFile(filePath, yamlContent, 'utf8');
    console.log(`✅ Exported season${seasonNumber}.yaml`);
    exportedCount++;
  }
  
  console.log(`📺 Exported ${exportedCount} season file(s)`);
}

/**
 * Export characters data to YAML file
 */
async function exportCharacters() {
  console.log('👥 Exporting characters...');
  
  const charactersData = await firebaseUtils.fetchFromFirebase('characters');
  
  if (!charactersData) {
    console.log('⚠️  No characters data found in Firebase');
    return;
  }
  
  // Export each category
  for (const category in charactersData) {
    if (!Array.isArray(charactersData[category])) continue;
    
    const characters = charactersData[category].map(char => ({
      id: char.id,
      title: char.title,
      description: char.description,
      keywords: char.keywords || [],
      image: char.image || '',
      image_gallery: char.image_gallery || []
    }));
    
    // Remove empty fields
    characters.forEach(char => {
      Object.keys(char).forEach(key => {
        const value = char[key];
        if (value === '' || (Array.isArray(value) && value.length === 0)) {
          delete char[key];
        }
      });
    });
    
    // Write to file
    const filePath = path.join(__dirname, '../content/characters', category, `${category}.yaml`);
    const yamlContent = yaml.dump(characters, {
      lineWidth: -1,
      noRefs: true,
      sortKeys: false
    });
    
    await fs.writeFile(filePath, yamlContent, 'utf8');
    console.log(`✅ Exported ${category}.yaml (${characters.length} characters)`);
  }
}

/**
 * Export lore data to YAML file
 */
async function exportLore() {
  console.log('📚 Exporting lore...');
  
  const loreData = await firebaseUtils.fetchFromFirebase('lore');
  
  if (!loreData) {
    console.log('⚠️  No lore data found in Firebase');
    return;
  }
  
  const loreYaml = {};
  
  // Group by type
  for (const loreId in loreData) {
    const lore = loreData[loreId];
    const type = lore.type || 'other';
    
    if (!loreYaml[type]) {
      loreYaml[type] = [];
    }
    
    const loreItem = {
      id: lore.id,
      title: lore.title,
      type: lore.type,
      keywords: lore.keywords || [],
      description: lore.description,
      image: lore.image || '',
      image_gallery: lore.image_gallery || []
    };
    
    // Remove empty fields
    Object.keys(loreItem).forEach(key => {
      const value = loreItem[key];
      if (value === '' || (Array.isArray(value) && value.length === 0)) {
        delete loreItem[key];
      }
    });
    
    loreYaml[type].push(loreItem);
  }
  
  // Write to file
  const filePath = path.join(__dirname, '../content/lore/wavelength-lore.yaml');
  const yamlContent = yaml.dump(loreYaml, {
    lineWidth: -1,
    noRefs: true,
    sortKeys: false
  });
  
  await fs.writeFile(filePath, yamlContent, 'utf8');
  console.log(`✅ Exported wavelength-lore.yaml`);
}

/**
 * Export prompts data to YAML file
 */
async function exportPrompts() {
  console.log('🎨 Exporting prompts...');
  
  // Use admin utils for prompts since they have restricted access
  const promptsData = await fetchDataAsAdmin('prompts');
  
  if (!promptsData) {
    console.log('⚠️  No prompts data found in Firebase');
    return;
  }
  
  const prompts = [];
  
  for (const promptId in promptsData) {
    const prompt = promptsData[promptId];
    
    const promptItem = {
      id: prompt.id,
      title: prompt.title,
      content: prompt.content,
      category: prompt.category || 'general',
      keywords: prompt.keywords || [],
      tags: prompt.tags || [],
      active: prompt.active !== false,
      linkedContent: prompt.linkedContent || {},
      createdAt: prompt.createdAt,
      updatedAt: prompt.updatedAt
    };
    
    // Remove empty fields
    Object.keys(promptItem).forEach(key => {
      const value = promptItem[key];
      if (value === '' || (Array.isArray(value) && value.length === 0) || 
          (typeof value === 'object' && Object.keys(value).length === 0)) {
        delete promptItem[key];
      }
    });
    
    prompts.push(promptItem);
  }
  
  // Write to file
  const filePath = path.join(__dirname, '../content/prompts/prompts.yaml');
  const yamlContent = yaml.dump(prompts, {
    lineWidth: -1,
    noRefs: true,
    sortKeys: false
  });
  
  await fs.writeFile(filePath, yamlContent, 'utf8');
  console.log(`✅ Exported prompts.yaml (${prompts.length} prompts)`);
}

/**
 * Main export function
 */
async function exportData() {
  try {
    console.log('🚀 Starting Firebase to YAML export...\n');
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    const typeArg = args.find(arg => arg.startsWith('--type='));
    const exportType = typeArg ? typeArg.split('=')[1] : 'all';
    
    if (exportType === 'all' || exportType === 'seasons') {
      await exportSeasons();
      console.log('');
    }
    
    if (exportType === 'all' || exportType === 'characters') {
      await exportCharacters();
      console.log('');
    }
    
    if (exportType === 'all' || exportType === 'lore') {
      await exportLore();
      console.log('');
    }
    
    if (exportType === 'all' || exportType === 'prompts') {
      await exportPrompts();
      console.log('');
    }
    
    console.log('✅ Export complete!');
    console.log('\n💡 Tip: Run with --type=seasons|characters|lore|prompts to export specific types');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  }
}

// Run export
exportData();
