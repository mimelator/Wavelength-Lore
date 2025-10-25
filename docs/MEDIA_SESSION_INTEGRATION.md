# Media Session API Integration

## 🎵 System-Level Media Controls for Wavelength Radio

The Wavelength Radio Player now supports the **Media Session API**, enabling system-level media controls on supported devices and browsers.

### ✅ Features Implemented

#### 1. **Media Keys Support**
- ⏯️ Play/Pause - Hardware media keys or on-screen controls
- ⏭️ Next Track - Skip to next song
- ⏮️ Previous Track - Go back to previous song
- ⏩ Seek Forward - Jump ahead 10 seconds
- ⏪ Seek Backward - Jump back 10 seconds

#### 2. **Lock Screen Controls**
- Display track information on device lock screen
- Control playback without unlocking device
- Show album artwork from episode images

#### 3. **Notification Center**
- Media controls in system notification center
- Track metadata display (title, artist, album)
- Episode artwork display

#### 4. **Rich Metadata**
- **Title**: Track name
- **Artist**: "Wavelength Lore"
- **Album**: Season and Episode info (e.g., "Season 1 • Episode 1")
- **Artwork**: Episode images in multiple sizes (512x512, 256x256, 128x128)

#### 5. **Page Visibility Handling**
- Continues playback when tab is hidden
- Maintains playback when window loses focus
- Seamless background audio experience

### 🔧 Technical Implementation

#### Media Session API Methods

```javascript
// Initialize Media Session
initMediaSession() {
    navigator.mediaSession.setActionHandler('play', () => {...});
    navigator.mediaSession.setActionHandler('pause', () => {...});
    navigator.mediaSession.setActionHandler('previoustrack', () => {...});
    navigator.mediaSession.setActionHandler('nexttrack', () => {...});
    navigator.mediaSession.setActionHandler('seekbackward', () => {...});
    navigator.mediaSession.setActionHandler('seekforward', () => {...});
}

// Update Metadata
updateMediaSessionMetadata() {
    navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: 'Wavelength Lore',
        album: `Season ${track.season} • Episode ${track.episode}`,
        artwork: [...]
    });
}
```

#### Visibility Handling

```javascript
initVisibilityHandling() {
    document.addEventListener('visibilitychange', () => {
        // Continues playback when hidden
    });
    
    window.addEventListener('blur', () => {
        // Maintains playback when window loses focus
    });
}
```

### 📱 Supported Platforms

| Platform | Support | Features |
|----------|---------|----------|
| **Chrome/Edge (Desktop)** | ✅ Full | All media keys, notifications |
| **Chrome (Android)** | ✅ Full | Lock screen, notification controls |
| **Safari (macOS)** | ✅ Full | Touch Bar, lock screen |
| **Safari (iOS)** | ✅ Full | Lock screen, Control Center |
| **Firefox (Desktop)** | ✅ Full | Media keys, notifications |
| **Firefox (Android)** | ✅ Full | Lock screen controls |

### 🎮 User Experience

#### Desktop
1. **Media Keys**: Use keyboard media keys to control playback
2. **Notifications**: Control from system notification center
3. **Touch Bar** (Mac): Dedicated media controls on Touch Bar

#### Mobile
1. **Lock Screen**: Full controls without unlocking
2. **Control Center**: Quick access to playback controls
3. **Bluetooth**: Control from car stereo or headphones
4. **Notifications**: Persistent media notification

### 🧪 Testing

Run the Media Session API test suite:

```bash
node tests/radio-media-session.test.js
```

**Test Coverage**:
- ✅ Media Session API availability
- ✅ Action handlers registration
- ✅ Metadata updates on play
- ✅ Playback state synchronization
- ✅ Artwork display
- ✅ Visibility handling
- ✅ Cross-track metadata updates

### 📊 Benefits

1. **Native Experience**: Behaves like native music apps (Spotify, Apple Music)
2. **Accessibility**: Control without looking at screen
3. **Convenience**: Use hardware buttons and system controls
4. **Multitasking**: Control while using other apps
5. **Battery Efficient**: System-level integration reduces overhead

### 🔍 Console Logging

The implementation includes helpful console logs:

- `📱 Initializing Media Session API` - Initialization started
- `📱 Media key: Play/Pause/Next/Previous` - Media key pressed
- `📱 Updated media session: [Track Title]` - Metadata updated
- `👁️ Page hidden/visible` - Visibility changes
- `👁️ Window blurred/focused` - Focus changes

### 🚀 Future Enhancements

Potential additions:
- [ ] Seek bar in lock screen controls
- [ ] Playlist display in media controls
- [ ] Chapter markers for long tracks
- [ ] Audio focus management
- [ ] Picture-in-Picture mode

### 📝 Implementation Files

- `static/js/radio-player.js` - Main implementation
  - `initMediaSession()` - Initialize Media Session API
  - `updateMediaSessionMetadata()` - Update track metadata
  - `initVisibilityHandling()` - Handle page visibility
- `static/js/radio-player-init.js` - Initialization script
- `tests/radio-media-session.test.js` - Test suite

### 🎯 Conclusion

The Media Session API integration transforms the Wavelength Radio Player into a first-class media experience, matching the functionality of native music applications. Users can now control playback using system-level controls, making the web player feel like a native app.

**Status**: ✅ **Production Ready**

The implementation is complete, tested, and ready for production use across all supported platforms.
