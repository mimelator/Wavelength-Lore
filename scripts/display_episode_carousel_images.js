const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Path to the seasons directory
const seasonsDir = path.join(__dirname, '../content/seasons');

/**
 * Displays all carousel images for a given season and episode number.
 * @param {number} seasonNumber - The season number to look up.
 * @param {number} episodeNumber - The episode number to look up.
 */
function displayEpisodeCarouselImages(seasonNumber, episodeNumber) {
  try {
    // Construct the season file path
    const seasonFilePath = path.join(seasonsDir, `season${seasonNumber}.yaml`);

    // Check if the season file exists
    if (!fs.existsSync(seasonFilePath)) {
      console.error(`Season file not found: ${seasonFilePath}`);
      return;
    }

    // Read the season YAML file
    const fileContents = fs.readFileSync(seasonFilePath, 'utf8');
    const seasonData = yaml.load(fileContents);

    // Ensure the season data has episodes
    if (!seasonData.episodes) {
      console.error(`No episodes found in season ${seasonNumber}.`);
      return;
    }

    // Find the episode by episode number
    const episodeKey = `episode${episodeNumber}`;
    const episode = seasonData.episodes[episodeKey];

    if (!episode) {
      console.error(`Episode not found for season ${seasonNumber}, episode ${episodeNumber}.`);
      return;
    }

    // Check if the episode has carousel images
    if (!episode.carouselImages || episode.carouselImages.length === 0) {
      console.log(`No carousel images found for season ${seasonNumber}, episode ${episodeNumber}.`);
      return;
    }

    // Display the carousel images
    console.log(`Carousel images for season ${seasonNumber}, episode ${episodeNumber}:`);
    episode.carouselImages.forEach((image, index) => {
      console.log(`${index + 1}. ${image}`);
    });
  } catch (error) {
    console.error('Error reading season file:', error);
  }
}

// Command-line arguments
const args = process.argv.slice(2);
if (args.length !== 2) {
  console.error('Usage: node display_episode_carousel_images.js <seasonNumber> <episodeNumber>');
  process.exit(1);
}

const [seasonNumber, episodeNumber] = args.map(Number);
displayEpisodeCarouselImages(seasonNumber, episodeNumber);