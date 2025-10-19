# AI Image Generation for Wavelength Lore

A comprehensive AI image generation system integrating Google's Imagen API via NanoOmega/Banana with automatic asset management.

## 🚀 Quick Start

### 1. Setup API Credentials
```bash
# Copy the example environment file
cp .env.ai.example .env.ai

# Edit with your API credentials
# Get your API key from: https://banana.dev
```

Add to your `.env` file:
```env
AI_API_KEY=your_banana_api_key_here
AI_API_ENDPOINT=https://api.banana.dev/start/v4/
AI_MODEL_KEY=google/imagen
```

### 2. Generate Your First Image
```bash
# Generate a single image
./scripts/ai-image-generator.js generate "Lucky the leprechaun in a magical forest"

# Generate and upload to assets automatically
./scripts/ai-image-generator.js workflow "mystical crystal cave" "locations/crystal-cave"
```

## 🎨 Commands

### **Generate Single Image**
```bash
./scripts/ai-image-generator.js generate "<prompt>"

# Examples:
./scripts/ai-image-generator.js generate "epic fantasy castle on a mountaintop"
./scripts/ai-image-generator.js generate "magical potion bottles glowing in darkness" --width=512 --height=768
```

### **Generate Multiple Variations**
```bash
./scripts/ai-image-generator.js variations "<prompt>" --count=5

# Examples:
./scripts/ai-image-generator.js variations "Lucky the leprechaun portrait" --count=3 --steps=60
./scripts/ai-image-generator.js variations "enchanted forest scene" --count=5 --guidance=8.0
```

### **Character Portraits**
```bash
./scripts/ai-image-generator.js character "<name>" "<description>"

# Examples:
./scripts/ai-image-generator.js character "Lucky" "mischievous leprechaun with green hat and twinkling eyes"
./scripts/ai-image-generator.js character "Aria" "elegant elven archer with silver hair"
```

### **Location Scenes**
```bash
./scripts/ai-image-generator.js location "<name>" "<description>"

# Examples:
./scripts/ai-image-generator.js location "Emerald Grove" "mystical forest with glowing trees and fairy lights"
./scripts/ai-image-generator.js location "Crystal Caverns" "underground cave system filled with luminous crystals"
```

### **Complete Workflow (Generate + Upload)**
```bash
./scripts/ai-image-generator.js workflow "<prompt>" "<target>"

# Examples:
./scripts/ai-image-generator.js workflow "magical library interior" "locations/enchanted-library"
./scripts/ai-image-generator.js workflow "battle scene with dragons" "scenes/epic-battles" --count=3
```

## ⚙️ Options

### **Generation Settings**
- `--width <number>` - Image width (default: 1024)
- `--height <number>` - Image height (default: 1024)
- `--steps <number>` - Generation steps, more = higher quality (default: 50)
- `--guidance <number>` - How closely to follow prompt (default: 7.5)
- `--seed <number>` - Random seed for reproducible results
- `--style <style>` - Style preset (photorealistic, fantasy-art, anime, etc.)

### **Workflow Settings**
- `--count <number>` - Number of variations to generate (default: 1)
- `--target <path>` - Asset target path for upload
- `--url-mode <mode>` - URL mode: relative, cdn, or absolute (default: relative)
- `--no-upload` - Skip automatic asset upload
- `--no-cleanup` - Keep temporary files after upload

## 🎯 Use Cases & Examples

### **Character Development**
```bash
# Generate multiple character portraits
./scripts/ai-image-generator.js character "Lucky" "leprechaun with mischievous grin" --count=5 --steps=60

# Different styles of the same character
./scripts/ai-image-generator.js variations "Lucky the leprechaun, cartoon style" --count=3 --style=cartoon
./scripts/ai-image-generator.js variations "Lucky the leprechaun, realistic style" --count=3 --style=photorealistic
```

### **World Building**
```bash
# Generate location concepts
./scripts/ai-image-generator.js location "Whispering Woods" "dark forest with ancient twisted trees"
./scripts/ai-image-generator.js location "Sky City" "floating city in the clouds with bridges of light"

# Scene compositions
./scripts/ai-image-generator.js workflow "epic battle between good and evil" "scenes/final-battle" --count=5 --width=1920 --height=1080
```

### **Asset Creation Pipeline**
```bash
# Generate and automatically upload episode assets
./scripts/ai-image-generator.js workflow "mystical portal opening" "season2/episode5/portal-scenes" --count=3

# Generate character portraits for website
./scripts/ai-image-generator.js character "Zara" "fierce warrior princess" --target="characters/zara/portraits" --url-mode=cdn
```

### **Rapid Prototyping**
```bash
# Quick concept generation
./scripts/ai-image-generator.js generate "magical sword glowing with power" --width=512 --height=512
./scripts/ai-image-generator.js generate "ancient spellbook with glowing runes" --steps=30

# Iterate on concepts
./scripts/ai-image-generator.js variations "crystal ball showing visions" --count=10 --seed=12345
```

## 🔧 Integration with Asset Manager

The AI image generator automatically integrates with the enhanced asset manager:

### **Automatic Upload**
```bash
# Generate and upload in one command
./scripts/ai-image-generator.js workflow "dragon lair interior" "locations/dragon-lair"

# What happens:
# 1. AI generates the image(s)
# 2. Saves to temp/ai-generated/
# 3. Calls asset-manager.js ai-upload
# 4. Processes images (resizing, optimization)
# 5. Uploads to static/images/ai-generated/locations/dragon-lair/
# 6. Generates asset URLs
# 7. Cleans up temporary files
```

### **Smart Asset Organization**
All AI-generated content is automatically organized under:
```
static/images/ai-generated/
├── characters/
│   ├── lucky/
│   └── aria/
├── locations/
│   ├── emerald-grove/
│   └── crystal-caverns/
├── scenes/
│   ├── battles/
│   └── magic/
└── objects/
    ├── weapons/
    └── artifacts/
```

### **URL Generation**
The system generates appropriate URLs based on your mode:

```bash
# Relative URLs (default for development)
--url-mode=relative
# Result: /images/ai-generated/characters/lucky/portrait.jpg

# CDN URLs (for production)
--url-mode=cdn  
# Result: https://df5sj8f594cdx.cloudfront.net/images/ai-generated/characters/lucky/portrait.jpg

# Absolute URLs
--url-mode=absolute
# Result: https://wavelengthlore.com/images/ai-generated/characters/lucky/portrait.jpg
```

## 🎨 Style Presets

### **Available Styles**
- `photorealistic` - Realistic, detailed images
- `fantasy-art` - Epic fantasy artwork style
- `anime` - Anime/manga style
- `cartoon` - Cartoon/animated style
- `digital-art` - Modern digital art
- `concept-art` - Game/movie concept art style
- `oil-painting` - Traditional oil painting
- `watercolor` - Watercolor painting style

### **Style Examples**
```bash
# Character in different styles
./scripts/ai-image-generator.js character "Lucky" "leprechaun with hat" --style=anime
./scripts/ai-image-generator.js character "Lucky" "leprechaun with hat" --style=oil-painting
./scripts/ai-image-generator.js character "Lucky" "leprechaun with hat" --style=concept-art
```

## 📋 Best Practices

### **Prompt Engineering**
```bash
# Good prompts are specific and descriptive
"Lucky the leprechaun with emerald green hat, mischievous smile, standing in magical forest with glowing mushrooms, fantasy art style, detailed"

# Include style and quality keywords
"epic fantasy castle, dramatic lighting, high detail, concept art, 4k quality"

# Specify composition
"close-up portrait of elven warrior, looking directly at camera, studio lighting"
```

### **Technical Settings**
```bash
# For high-quality final art
--steps=60 --guidance=8.0 --width=1024 --height=1024

# For quick concepts/drafts  
--steps=30 --guidance=7.0 --width=512 --height=512

# For variations/iterations
--seed=12345 --count=5 --guidance=7.5
```

### **Asset Management**
```bash
# Always use descriptive target paths
--target="characters/lucky/expressions"
--target="locations/emerald-grove/seasons/spring"
--target="objects/magical-items/swords"

# Use relative URLs for development, CDN for production
--url-mode=relative  # Development
--url-mode=cdn       # Production deployment
```

## 🔍 Troubleshooting

### **API Issues**
```bash
# Check API key configuration
echo $AI_API_KEY

# Test API connectivity
./scripts/ai-image-generator.js generate "test image" --steps=10
```

### **Generation Problems**
```bash
# Try reducing complexity for failed generations
--steps=30 --guidance=6.0

# Use different seeds for variations
--seed=12345

# Check prompt length (keep under 200 characters)
```

### **Asset Upload Issues**
```bash
# Generate without uploading to debug
./scripts/ai-image-generator.js generate "test" --no-upload

# Check temp directory
ls -la temp/ai-generated/

# Manual upload
./scripts/asset-manager.js ai-upload --path=temp/ai-generated --target=test
```

## 🔄 Workflow Integration

### **Content Creation Pipeline**
1. **Concept Generation**: Use `generate` or `variations` for initial concepts
2. **Refinement**: Use specific seeds and adjusted parameters
3. **Asset Creation**: Use `workflow` command for final assets
4. **Integration**: Assets automatically available in relative URLs
5. **Deployment**: Switch to CDN URLs for production

### **Character Development**
```bash
# 1. Initial concept
./scripts/ai-image-generator.js character "NewCharacter" "basic description"

# 2. Explore variations
./scripts/ai-image-generator.js variations "NewCharacter portrait" --count=10

# 3. Final character sheet
./scripts/ai-image-generator.js workflow "NewCharacter detailed portrait" "characters/newcharacter/final" --steps=60 --url-mode=cdn
```

This system provides a complete AI image generation pipeline perfectly integrated with the Wavelength Lore asset management system!