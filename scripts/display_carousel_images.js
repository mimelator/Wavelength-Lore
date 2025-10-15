const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

function displayCarouselImages(characterId) {
    try {
        const yamlPath = path.join(__dirname, '../content/characters/wavelength/wavelength.yaml');
        const yamlContent = yaml.load(fs.readFileSync(yamlPath, 'utf8'));

        const character = yamlContent.find(entry => entry.id === characterId);
        if (!character) {
            console.error(`Character with ID '${characterId}' not found.`);
            return;
        }

        if (!character.image_gallery || character.image_gallery.length === 0) {
            console.log(`No carousel images found for character '${characterId}'.`);
            return;
        }

        console.log(`Carousel images for character '${characterId}':`);
        character.image_gallery.forEach((image, index) => {
            console.log(`${index + 1}. ${image}`);
        });
    } catch (err) {
        console.error('An error occurred:', err);
    }
}

// Example usage
const characterId = process.argv[2];
if (!characterId) {
    console.error('Please provide a character ID as an argument.');
    process.exit(1);
}

displayCarouselImages(characterId);