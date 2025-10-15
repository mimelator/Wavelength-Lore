const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const seasonsDir = path.join(__dirname, '../content/seasons');
const staticImagesDir = path.join(__dirname, '../static/images/seasons');
const cloudfrontBaseUrl = 'https://df5sj8f594cdx.cloudfront.net/images/seasons';

/**
 * Copies the image to the static directory and returns the CloudFront URL.
 * @param {string} seasonNumber - The season number.
 * @param {string} episodeNumber - The episode number.
 * @param {string} imagePath - The path of the image to copy.
 * @returns {string} - The CloudFront URL of the copied image.
 */
function copyImageToStaticDir(seasonNumber, episodeNumber, imagePath) {
  const imageFileName = path.basename(imagePath);
  const destinationDir = path.join(
    staticImagesDir,
    `season${seasonNumber}`,
    `episodes/episode${episodeNumber}/images`
  );

  // Ensure the destination directory exists
  if (!fs.existsSync(destinationDir)) {
    fs.mkdirSync(destinationDir, { recursive: true });
  }

  // Copy the image to the destination directory
  const destinationPath = path.join(destinationDir, imageFileName);
  fs.copyFileSync(imagePath, destinationPath);

  // Return the CloudFront URL
  return `${cloudfrontBaseUrl}/season${seasonNumber}/episodes/episode${episodeNumber}/images/${imageFileName}`;
}

/**
 * Processes a single image or all images in a folder.
 * @param {number} seasonNumber - The season number.
 * @param {number} episodeNumber - The episode number.
 * @param {string} inputPath - The path to the image file or folder.
 * @returns {string[]} - An array of CloudFront URLs for the processed images.
 */
function processInputPath(seasonNumber, episodeNumber, inputPath) {
  const urls = [];
  const validImageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp']; // Supported image extensions

  if (fs.lstatSync(inputPath).isDirectory()) {
    const files = fs.readdirSync(inputPath);
    for (const file of files) {
      const fullPath = path.join(inputPath, file);
      const fileExtension = path.extname(file).toLowerCase();

      if (fs.lstatSync(fullPath).isFile() && validImageExtensions.includes(fileExtension)) {
        urls.push(copyImageToStaticDir(seasonNumber, episodeNumber, fullPath));
      } else if (fs.lstatSync(fullPath).isFile()) {
        console.error(`Invalid file type: ${fullPath}. Only image files are allowed.`);
      }
    }
  } else {
    const fileExtension = path.extname(inputPath).toLowerCase();
    if (validImageExtensions.includes(fileExtension)) {
      urls.push(copyImageToStaticDir(seasonNumber, episodeNumber, inputPath));
    } else {
      console.error(`Invalid file type: ${inputPath}. Only image files are allowed.`);
    }
  }

  return urls;
}

/**
 * Adds a new image entry to the episode in the YAML file.
 * @param {number} seasonNumber - The season number.
 * @param {number} episodeNumber - The episode number.
 * @param {string} inputPath - The path to the image file or folder.
 */
function addEpisodeImage(seasonNumber, episodeNumber, inputPath) {
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

    // Ensure the episode has a carouselImages array
    if (!episode.carouselImages) {
      episode.carouselImages = [];
    }

    // Process the input path and get CloudFront URLs
    const cloudfrontUrls = processInputPath(seasonNumber, episodeNumber, inputPath);

    // Filter out URLs that already exist in the carouselImages array
    const newUrls = cloudfrontUrls.filter((url) => !episode.carouselImages.includes(url));

    if (newUrls.length === 0) {
      console.log(`No new images to add for season ${seasonNumber}, episode ${episodeNumber}. All provided images already exist.`);
      return;
    }

    // Add the new images to the carouselImages array
    episode.carouselImages.push(...newUrls);

    // Write the updated YAML back to the file
    const updatedYaml = yaml.dump(seasonData, { lineWidth: -1 });
    fs.writeFileSync(seasonFilePath, updatedYaml, 'utf8');

    console.log(`Successfully added images to season ${seasonNumber}, episode ${episodeNumber}:`, newUrls);
  } catch (error) {
    console.error('Error updating season YAML file:', error);
  }
}

// Command-line arguments
const args = process.argv.slice(2);
if (args.length !== 3) {
  console.error('Usage: node add_episode_image.js <seasonNumber> <episodeNumber> <imagePath|folderPath>');
  process.exit(1);
}

const [seasonNumber, episodeNumber, inputPath] = args;
addEpisodeImage(Number(seasonNumber), Number(episodeNumber), inputPath);