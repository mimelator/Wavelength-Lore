# Episode Creation Pipeline CLI

**Phase 1 Implementation: CLI Framework & Song Upload**

A comprehensive command-line interface for creating, managing, and tracking Wavelength episodes through a 10-step production pipeline.

## Features

### Phase 1.1: CLI Framework ✅
- **Interactive Menu System**: Easy-to-use command-line interface
- **Episode State Management**: Firebase-backed episode tracking
- **Progress Tracking**: Visual progress bars through 10-step pipeline
- **Episode Operations**: Create, continue, view status, delete episodes
- **Batch Operations**: Multi-episode management capabilities

### Phase 1.2: Song Upload ✅
- **MP3 File Upload**: Drag-and-drop or file path selection
- **Audio Metadata Extraction**: Duration, bitrate, sample rate detection
- **S3 Integration**: Organized cloud storage (season/episode/version)
- **Metadata Collection**: Song title, artist, lyrics input
- **File Validation**: Size limits, format checking

## Installation

1. **Install Dependencies**:
   ```bash
   npm install music-metadata
   ```

2. **Environment Setup**:
   Ensure these environment variables are configured:
   ```bash
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_SERVICE_ACCOUNT_KEY=path/to/service-account.json
   AWS_REGION=us-east-1
   S3_BUCKET_NAME=wavelength-assets
   ```

3. **Firebase Setup**:
   - Initialize Firebase Admin SDK
   - Configure Firestore database
   - Set up authentication

## Usage

### Quick Start

```bash
# Start the Episode Creator CLI
npm run episode:create

# Alternative command
npm run episode:cli
```

### CLI Menu Options

```
🌊 WAVELENGTH EPISODE CREATOR v1.0
═══════════════════════════════════════

1. 🎬 Create New Episode
2. 🔄 Continue Existing Episode  
3. 📊 View Episode Status
4. 🗑️  Delete Episode (Testing)
5. 📦 Batch Operations
6. 🚪 Exit

Choose an option (1-6):
```

### Episode Creation Workflow

1. **Episode Information**:
   - Season number
   - Episode number  
   - Episode title
   - Brief description

2. **Song Upload** (Step 2 of 10):
   - Upload MP3 file (drag-and-drop or file path)
   - Extract audio metadata (duration, format, bitrate)
   - Enter song title and artist
   - Add lyrics (optional)
   - Upload to S3 with organized structure

3. **Progress Tracking**:
   - Visual progress bars
   - Step completion status
   - Time estimates
   - Next action indicators

## File Structure

```
cli/
├── episode-creator.js              # Main CLI interface
├── commands/
│   ├── create-episode.js           # Episode creation command
│   ├── delete-episode.js           # Episode deletion (testing)
│   └── batch-operations.js         # Multi-episode operations
├── steps/
│   └── song-upload.js              # Song upload step (Phase 1.2)
└── utils/
    ├── episode-state-manager.js    # Firebase episode management
    └── progress-tracker.js         # 10-step pipeline tracking
```

## Episode State Schema

Episodes are stored in Firebase with this structure:

```javascript
{
  id: "episode-001",
  season: 1,
  episodeNumber: 1,
  title: "Episode Title",
  description: "Brief description",
  status: "in-progress",          // draft, in-progress, completed
  visibility: "hidden",           // hidden, published
  currentStep: 2,                 // 1-10 pipeline step
  stepStatus: {
    1: { completed: true, completedAt: "2024-01-15T10:00:00Z" },
    2: { completed: true, completedAt: "2024-01-15T10:30:00Z" },
    // ... steps 3-10
  },
  songMetadata: {
    title: "Song Title",
    artist: "Artist Name", 
    duration: 240.5,              // seconds
    url: "https://s3.../song.mp3",
    lyrics: "Song lyrics...",
    s3Key: "songs/season-1/episode-1/current/song.mp3"
  },
  createdAt: "2024-01-15T10:00:00Z",
  updatedAt: "2024-01-15T10:30:00Z"
}
```

## S3 Storage Structure

Songs are organized in S3 with version control:

```
s3://wavelength-assets/
└── songs/
    └── season-1/
        └── episode-1/
            ├── current/
            │   └── wavelength-s1e1.mp3
            └── archive/
                ├── wavelength-s1e1-v1-timestamp.mp3
                └── wavelength-s1e1-v2-timestamp.mp3
```

## 10-Step Pipeline

The complete episode creation pipeline:

1. **Episode Setup** - Basic episode information
2. **Song Upload** - MP3 file upload and metadata ✅
3. **Episode Content** - Story content and narrative
4. **Character Integration** - NPC and character data
5. **Review & Editing** - Content review and refinement
6. **Audio Processing** - Final audio processing
7. **Metadata Finalization** - Complete episode metadata
8. **Quality Assurance** - Final testing and validation
9. **Publishing Preparation** - Pre-publication setup
10. **Episode Publication** - Make episode live

## Testing & Development

### Episode Deletion
For testing purposes, episodes can be immediately deleted:

```bash
# Select option 4 in CLI menu
4. 🗑️ Delete Episode (Testing)
```

**Note**: Episode editing capabilities come in Phase 5. During development, deletion allows for clean testing cycles.

### Batch Operations
Manage multiple episodes:
- Bulk status updates
- Progress synchronization
- Batch deletions for testing

## Error Handling

The CLI includes comprehensive error handling:

- **File Validation**: MP3 format, size limits, file existence
- **Network Errors**: S3 upload failures, Firebase connection issues
- **User Input**: Invalid choices, missing files, malformed data
- **Graceful Degradation**: Basic metadata when music-metadata unavailable

## Dependencies

### Required
- `firebase-admin`: Episode state management
- `aws-sdk`: S3 file upload
- `chalk`: CLI colors and formatting
- `readline`: Interactive prompts

### Optional
- `music-metadata`: Enhanced audio metadata extraction
  - **Without**: Uses basic file size estimation
  - **With**: Accurate duration, bitrate, embedded metadata

## Future Phases

- **Phase 2**: Dynamic Radio Player with Firebase integration
- **Phase 3**: Advanced episode content management
- **Phase 4**: Character and NPC integration
- **Phase 5**: Full editing and review capabilities

## Troubleshooting

### Common Issues

1. **music-metadata not found**:
   ```bash
   npm install music-metadata
   ```

2. **Firebase connection errors**:
   - Check `FIREBASE_PROJECT_ID`
   - Verify service account key path
   - Ensure Firestore is enabled

3. **S3 upload failures**:
   - Verify AWS credentials
   - Check `S3_BUCKET_NAME` environment variable
   - Ensure bucket exists and has write permissions

4. **File not found errors**:
   - Use absolute file paths
   - Check file permissions
   - Verify MP3 format

## Version History

- **v1.0** (Phase 1): CLI Framework & Song Upload
  - Interactive menu system
  - Episode state management
  - MP3 upload with S3 integration
  - Progress tracking through 10-step pipeline

---

**🌊 WAVELENGTH Episode Creation Pipeline - Phase 1 Complete**