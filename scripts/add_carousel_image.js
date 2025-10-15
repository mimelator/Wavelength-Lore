const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Path to the wavelength.yaml file
const yamlFilePath = path.join(__dirname, '../content/characters/wavelength/wavelength.yaml');
// Path to the static images directory
const staticImagesDir = path.join(__dirname, '../static/images/characters/wavelength');
// CloudFront base URL
const cloudfrontBaseUrl = 'https://df5sj8f594cdx.cloudfront.net/images/characters/wavelength';

/**
 * Copies the image to the static directory and returns the CloudFront URL.
 * @param {string} imagePath - The path of the image to copy.
 * @returns {string} - The CloudFront URL of the copied image.
 */
function copyImageToStaticDir(imagePath) {
  const imageFileName = path.basename(imagePath);
  const destinationPath = path.join(staticImagesDir, imageFileName);

  // Ensure the static images directory exists
  if (!fs.existsSync(staticImagesDir)) {
    fs.mkdirSync(staticImagesDir, { recursive: true });
  }

  // Copy the image to the static directory
  fs.copyFileSync(imagePath, destinationPath);

  // Return the CloudFront URL
  return `${cloudfrontBaseUrl}/${imageFileName}`;
}

/**
 * Processes a single image or all images in a folder.
 * @param {string} inputPath - The path to the image file or folder.
 * @returns {string[]} - An array of CloudFront URLs for the processed images.
 */
function processInputPath(inputPath) {
  const urls = [];
  const validImageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp']; // Supported image extensions

  if (fs.lstatSync(inputPath).isDirectory()) {
    const files = fs.readdirSync(inputPath);
    for (const file of files) {
      const fullPath = path.join(inputPath, file);
      const fileExtension = path.extname(file).toLowerCase();

      if (fs.lstatSync(fullPath).isFile() && validImageExtensions.includes(fileExtension)) {
        urls.push(copyImageToStaticDir(fullPath));
      }
    }
  } else {
    const fileExtension = path.extname(inputPath).toLowerCase();
    if (validImageExtensions.includes(fileExtension)) {
      urls.push(copyImageToStaticDir(inputPath));
    } else {
      console.error(`Invalid file type: ${inputPath}. Only image files are allowed.`);
    }
  }

  return urls;
}

function addCarouselImage(characterId, inputPath) {
  try {
    // Read the YAML file
    const fileContents = fs.readFileSync(yamlFilePath, 'utf8');
    const data = yaml.load(fileContents);

    // Find the character by ID
    const character = data.find((entry) => entry.id === characterId);
    if (!character) {
      console.error(`Character with ID '${characterId}' not found.`);
      return;
    }

    // Ensure the image_gallery exists
    if (!character.image_gallery) {
      character.image_gallery = [];
    }

    // Process the input path and get CloudFront URLs
    const cloudfrontUrls = processInputPath(inputPath);

    // Filter out URLs that already exist in the image_gallery
    const newUrls = cloudfrontUrls.filter((url) => !character.image_gallery.includes(url));

    if (newUrls.length === 0) {
      console.log(`No new images to add for character '${characterId}'. All provided images already exist.`);
      return;
    }

    // Add the new images to the gallery
    character.image_gallery.push(...newUrls);

    // Write the updated YAML back to the file
    const updatedYaml = yaml.dump(data, { lineWidth: -1 });
    fs.writeFileSync(yamlFilePath, updatedYaml, 'utf8');

    console.log(`Successfully added images to character '${characterId}':`, newUrls);
  } catch (error) {
    console.error('Error updating wavelength.yaml:', error);
  }
}

// Command-line arguments
const args = process.argv.slice(2);
if (args.length !== 2) {
  console.error('Usage: node add_carousel_image.js <characterId> <imagePath|folderPath>');
  process.exit(1);
}

const [characterId, inputPath] = args;
addCarouselImage(characterId, inputPath);