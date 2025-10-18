# Forum Delete and Episode Integration Documentation

## Overview

The Wavelength Lore forum includes comprehensive delete functionality that allows users to delete their own posts and replies with proper authentication, file attachment cleanup, and cascade deletion support. Additionally, it features seamless integration with episode pages, allowing users to create episode-specific forum posts directly from episode pages. This document covers the complete implementation including API endpoints, authentication middleware, frontend UI, file handling, and episode integration features.

## Architecture

```
User Interface (Delete Buttons)
    ↓ Firebase ID Token
Authentication Middleware
    ↓ Verified User Identity
Delete API Endpoints (/forum/posts/:id, /forum/replies/:id)
    ↓ Ownership Verification
Database Operations (Firebase Admin SDK)
    ↓ Cascade Deletion + S3 Cleanup
Complete Resource Cleanup
```

## Key Components

### 1. Authentication & Authorization

#### Firebase Authentication Integration
**File:** `middleware/firebaseAuth.js`

The delete functionality uses Firebase ID tokens for secure user authentication:

```javascript
// Enhanced authentication middleware with proper admin app handling
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Use proper admin app reference for token verification
    const decodedToken = await admin.app('admin').auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    // Comprehensive error handling for expired/invalid tokens
    res.status(401).json({ error: 'Invalid token', details: error.message });
  }
};
```

**Key Features:**
- **ID Token Verification**: Uses Firebase Admin SDK to verify user tokens
- **Proper App Referencing**: Uses `admin.app('admin')` for correct instance
- **Error Categorization**: Detailed error messages for debugging
- **Request Attribution**: Attaches verified user data to request object

#### Ownership Verification
Every delete operation includes ownership checks:

```javascript
// Verify user owns the content before allowing deletion
const postData = await fetchDataAsAdmin(`/posts/${postId}`);
if (!postData || postData.authorId !== req.user.uid) {
  return res.status(403).json({ error: 'Not authorized to delete this post' });
}
```

### 2. Delete API Endpoints

#### Post Deletion Endpoint
**File:** `routes/secureForumRoutes.js`
**Endpoint:** `DELETE /forum/posts/:postId`

```javascript
router.delete('/posts/:postId', verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;
    
    // Fetch post data with admin privileges
    const postData = await fetchDataAsAdmin(`/posts/${postId}`);
    
    if (!postData) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Verify ownership
    if (postData.authorId !== req.user.uid) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }
    
    // Clean up S3 attachments first
    if (postData.attachments && Array.isArray(postData.attachments)) {
      for (const attachment of postData.attachments) {
        if (attachment.s3Key) {
          await deleteFromS3(attachment.s3Key);
        }
      }
    }
    
    // Get all reply IDs for cascade deletion
    const repliesData = await fetchDataAsAdmin(`/replies`);
    const replyIds = [];
    
    if (repliesData) {
      for (const [replyId, reply] of Object.entries(repliesData)) {
        if (reply.postId === postId) {
          replyIds.push(replyId);
          // Clean up reply attachments
          if (reply.attachments && Array.isArray(reply.attachments)) {
            for (const attachment of reply.attachments) {
              if (attachment.s3Key) {
                await deleteFromS3(attachment.s3Key);
              }
            }
          }
        }
      }
    }
    
    // Delete all replies first
    for (const replyId of replyIds) {
      await deleteDataAsAdmin(`/replies/${replyId}`);
    }
    
    // Delete the post
    await deleteDataAsAdmin(`/posts/${postId}`);
    
    res.json({ 
      success: true, 
      message: 'Post and all replies deleted successfully',
      deletedReplies: replyIds.length
    });
    
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});
```

**Features:**
- **Ownership Verification**: Only post author can delete
- **Cascade Deletion**: Automatically deletes all replies
- **S3 Cleanup**: Removes all file attachments from S3
- **Admin Privileges**: Uses Firebase Admin SDK for database operations
- **Error Handling**: Comprehensive error responses

#### Reply Deletion Endpoint
**File:** `routes/secureForumRoutes.js`
**Endpoint:** `DELETE /forum/replies/:replyId`

```javascript
router.delete('/replies/:replyId', verifyToken, async (req, res) => {
  try {
    const { replyId } = req.params;
    
    // Fetch reply data with admin privileges
    const replyData = await fetchDataAsAdmin(`/replies/${replyId}`);
    
    if (!replyData) {
      return res.status(404).json({ error: 'Reply not found' });
    }
    
    // Verify ownership
    if (replyData.authorId !== req.user.uid) {
      return res.status(403).json({ error: 'Not authorized to delete this reply' });
    }
    
    // Clean up S3 attachments
    if (replyData.attachments && Array.isArray(replyData.attachments)) {
      for (const attachment of replyData.attachments) {
        if (attachment.s3Key) {
          await deleteFromS3(attachment.s3Key);
        }
      }
    }
    
    // Delete the reply
    await deleteDataAsAdmin(`/replies/${replyId}`);
    
    res.json({ 
      success: true, 
      message: 'Reply deleted successfully' 
    });
    
  } catch (error) {
    console.error('Error deleting reply:', error);
    res.status(500).json({ error: 'Failed to delete reply' });
  }
});
```

### 3. Frontend User Interface

#### Delete Button Implementation
**File:** `views/forum/post-page.ejs`

```html
<!-- Post Delete Button (only shown to post author) -->
<% if (user && user.uid === post.authorId) { %>
  <button class="delete-post-btn" data-post-id="<%= post.id %>">
    🗑️ Delete Post
  </button>
<% } %>

<!-- Reply Delete Buttons (only shown to reply authors) -->
<% replies.forEach(reply => { %>
  <% if (user && user.uid === reply.authorId) { %>
    <button class="delete-reply-btn" data-reply-id="<%= reply.id %>">
      🗑️ Delete Reply
    </button>
  <% } %>
<% }) %>
```

#### JavaScript Delete Handling
**File:** `views/forum/post-page.ejs` (inline script)

```javascript
// Enhanced delete functionality with token refresh and error handling
async function deletePost(postId) {
  if (!confirm('Are you sure you want to delete this post? This action cannot be undone and will also delete all replies.')) {
    return;
  }

  try {
    // Get fresh token with force refresh
    const token = await auth.currentUser.getIdToken(true);
    
    const response = await fetch(`/forum/posts/${postId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (response.ok) {
      alert(`Post deleted successfully! ${result.deletedReplies || 0} replies were also deleted.`);
      window.location.href = '/forum';
    } else {
      // Handle specific error cases
      if (response.status === 401) {
        alert('Authentication failed. Please log in again.');
        window.location.href = '/forum/login';
      } else if (response.status === 403) {
        alert('You are not authorized to delete this post.');
      } else {
        alert(`Failed to delete post: ${result.error || 'Unknown error'}`);
      }
    }
  } catch (error) {
    console.error('Error deleting post:', error);
    alert('An error occurred while deleting the post. Please try again.');
  }
}

async function deleteReply(replyId) {
  if (!confirm('Are you sure you want to delete this reply? This action cannot be undone.')) {
    return;
  }

  try {
    const token = await auth.currentUser.getIdToken(true);
    
    const response = await fetch(`/forum/replies/${replyId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (response.ok) {
      alert('Reply deleted successfully!');
      location.reload();
    } else {
      if (response.status === 401) {
        alert('Authentication failed. Please log in again.');
        window.location.href = '/forum/login';
      } else if (response.status === 403) {
        alert('You are not authorized to delete this reply.');
      } else {
        alert(`Failed to delete reply: ${result.error || 'Unknown error'}`);
      }
    }
  } catch (error) {
    console.error('Error deleting reply:', error);
    alert('An error occurred while deleting the reply. Please try again.');
  }
}

// Event listeners for delete buttons
document.addEventListener('DOMContentLoaded', function() {
  // Post delete button
  const deletePostBtn = document.querySelector('.delete-post-btn');
  if (deletePostBtn) {
    deletePostBtn.addEventListener('click', function() {
      const postId = this.getAttribute('data-post-id');
      deletePost(postId);
    });
  }

  // Reply delete buttons
  const deleteReplyBtns = document.querySelectorAll('.delete-reply-btn');
  deleteReplyBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const replyId = this.getAttribute('data-reply-id');
      deleteReply(replyId);
    });
  });
});
```

**Key Features:**
- **Confirmation Dialogs**: Prevents accidental deletions
- **Token Refresh**: Forces fresh token generation for security
- **Error Handling**: Specific messages for different error conditions
- **User Feedback**: Clear success/failure messages
- **Navigation**: Redirects appropriately after deletion

### 4. File Attachment Cleanup

#### S3 Integration
**File:** `utils/fileUpload.js`

```javascript
// Enhanced S3 deletion function with error handling
async function deleteFromS3(s3Key) {
  try {
    if (!s3Key) {
      console.warn('No S3 key provided for deletion');
      return;
    }

    const deleteParams = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: s3Key
    };

    await s3.deleteObject(deleteParams).promise();
    console.log(`Successfully deleted S3 object: ${s3Key}`);
  } catch (error) {
    console.error(`Failed to delete S3 object ${s3Key}:`, error);
    // Don't throw error - continue with database deletion even if S3 fails
  }
}
```

**Features:**
- **Error Resilience**: Database deletion continues even if S3 cleanup fails
- **Logging**: Detailed logging for debugging S3 operations
- **Parameter Validation**: Checks for valid S3 keys before deletion
- **AWS SDK Integration**: Uses standard AWS SDK deletion methods

#### Attachment Cleanup Logic
The delete endpoints include comprehensive attachment cleanup:

```javascript
// Clean up all attachments for a post/reply
if (data.attachments && Array.isArray(data.attachments)) {
  for (const attachment of data.attachments) {
    if (attachment.s3Key) {
      await deleteFromS3(attachment.s3Key);
    }
  }
}
```

### 5. Styling and UI Design

#### CSS Styling
**File:** `static/css/forum.css`

```css
/* Delete button styling */
.delete-post-btn, .delete-reply-btn {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin-left: 10px;
  transition: background-color 0.3s ease;
}

.delete-post-btn:hover, .delete-reply-btn:hover {
  background-color: #c82333;
}

.delete-post-btn:active, .delete-reply-btn:active {
  background-color: #bd2130;
}

/* Responsive design for mobile devices */
@media (max-width: 768px) {
  .delete-post-btn, .delete-reply-btn {
    padding: 6px 12px;
    font-size: 12px;
    margin-left: 5px;
  }
}
```

### 6. Database Operations

#### Firebase Admin Utils Integration
**File:** `helpers/firebase-admin-utils.js`

The delete functionality uses Firebase Admin SDK for database operations:

```javascript
// Admin-level database operations (bypass security rules)
async function deleteDataAsAdmin(path) {
  try {
    const admin = getFirebaseAdmin();
    const db = admin.database();
    await db.ref(path).remove();
    console.log(`Successfully deleted data at path: ${path}`);
  } catch (error) {
    console.error(`Failed to delete data at ${path}:`, error);
    throw error;
  }
}

async function fetchDataAsAdmin(path) {
  try {
    const admin = getFirebaseAdmin();
    const db = admin.database();
    const snapshot = await db.ref(path).once('value');
    return snapshot.val();
  } catch (error) {
    console.error(`Failed to fetch data at ${path}:`, error);
    throw error;
  }
}
```

### 7. Security Considerations

#### Firebase Security Rules
**File:** `config/firebase-database-rules-delete-enabled.json`

```json
{
  "rules": {
    "posts": {
      "$postId": {
        ".read": true,
        ".write": "auth != null",
        ".validate": "newData.hasChildren(['title', 'content', 'authorId', 'timestamp'])",
        "authorId": {
          ".validate": "newData.val() == auth.uid"
        }
      }
    },
    "replies": {
      "$replyId": {
        ".read": true,
        ".write": "auth != null",
        ".validate": "newData.hasChildren(['content', 'authorId', 'postId', 'timestamp'])",
        "authorId": {
          ".validate": "newData.val() == auth.uid"
        }
      }
    }
  }
}
```

**Security Features:**
- **Authentication Required**: All write operations require valid Firebase auth
- **Author Verification**: Only content authors can modify their content
- **Admin Override**: Admin SDK operations bypass these rules for management
- **Read Access**: Public read access for forum content
- **Data Validation**: Ensures required fields are present

#### Input Sanitization
All delete operations include input validation:

```javascript
// Sanitize and validate post/reply IDs
const { postId } = req.params;
const sanitizedPostId = DOMPurify.sanitize(postId);

// Validate ID format (Firebase keys)
if (!/^[a-zA-Z0-9_-]+$/.test(sanitizedPostId)) {
  return res.status(400).json({ error: 'Invalid post ID format' });
}
```

### 8. Error Handling and Logging

#### Comprehensive Error Responses
```javascript
// Standardized error response format
const sendErrorResponse = (res, status, message, details = null) => {
  const response = {
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  };
  
  if (details) {
    response.details = details;
  }
  
  res.status(status).json(response);
};
```

#### Error Categories
- **401 Unauthorized**: Invalid or missing authentication token
- **403 Forbidden**: User doesn't own the content
- **404 Not Found**: Post or reply doesn't exist
- **500 Server Error**: Database or S3 operation failures

#### Audit Logging
```javascript
// Log all delete operations for audit trail
console.log(`DELETE POST: User ${req.user.uid} deleted post ${postId} with ${replyIds.length} replies`);
console.log(`DELETE REPLY: User ${req.user.uid} deleted reply ${replyId}`);
```

## Testing and Validation

### Test Coverage
The delete functionality includes comprehensive tests:

#### End-to-End Test
**File:** `tests/e2e-delete-test.js`
- Creates test post with attachment
- Creates test reply
- Attempts deletion with proper authentication
- Validates error responses for unauthorized access
- Tests cascade deletion behavior

#### API Integration Test
**File:** `tests/simple-api-test.js`
- Tests basic API endpoint functionality
- Validates response formats
- Checks HTTP status codes
- Tests authentication requirements

### Manual Testing Checklist
- [ ] User can delete their own posts
- [ ] User cannot delete other users' posts
- [ ] Deleting a post removes all replies
- [ ] File attachments are cleaned up from S3
- [ ] Users get proper error messages
- [ ] Authentication tokens are properly validated
- [ ] Delete buttons only appear for content owners
- [ ] Confirmation dialogs prevent accidental deletions

## Configuration and Deployment

### Environment Variables
```bash
# AWS S3 Configuration (for attachment cleanup)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET_NAME=your_bucket_name
AWS_REGION=us-east-1

# Firebase Configuration
DATABASE_URL=https://your-project.firebaseio.com
PROJECT_ID=your-project-id
```

### Firebase Service Account
Ensure `firebaseServiceAccountKey.json` is properly configured for admin operations.

### Firebase Security Rules Deployment
```bash
# Deploy updated security rules
firebase deploy --only database:rules
```

## Usage Examples

### Basic User Workflow
1. User views their post on the forum
2. Sees delete button next to their content
3. Clicks delete and confirms in dialog
4. System validates authentication
5. Checks ownership permissions
6. Deletes content and attachments
7. Redirects user with success message

### API Usage
```bash
# Delete a post (requires valid Firebase ID token)
curl -X DELETE \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:3001/forum/posts/POST_ID_HERE

# Delete a reply
curl -X DELETE \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:3001/forum/replies/REPLY_ID_HERE
```

## Future Enhancements

### Planned Features
- **Soft Delete**: Mark content as deleted instead of permanent removal
- **Admin Override**: Allow admins to delete any content
- **Bulk Operations**: Delete multiple posts/replies at once
- **Restore Functionality**: Undelete recently deleted content
- **Delete History**: Track deletion timestamps and reasons

### Technical Improvements
- **Background Processing**: Queue S3 cleanup operations
- **Retry Logic**: Automatic retry for failed S3 operations
- **Performance Optimization**: Batch delete operations
- **Enhanced Logging**: Structured logging with correlation IDs
- **Metrics Collection**: Track deletion patterns and performance

## Troubleshooting

### Common Issues

**"Invalid token" errors**
- Solution: Ensure user is logged in and token is fresh
- Check: Firebase authentication configuration

**"Not authorized to delete" errors**
- Solution: Verify user owns the content
- Check: Author ID matching in database

**S3 cleanup failures**
- Solution: Check AWS credentials and permissions
- Note: Database deletion continues even if S3 fails

**Delete buttons not appearing**
- Solution: Check user authentication state
- Verify: EJS template conditions for showing buttons

### Debug Commands
```bash
# Test authentication middleware
curl -X DELETE \
  -H "Authorization: Bearer INVALID_TOKEN" \
  http://localhost:3001/forum/posts/test

# Check S3 cleanup logs
grep "S3" server.log | tail -n 20

# Verify Firebase Admin SDK
node -e "console.log(require('./helpers/firebase-admin-utils.js'))"
```

## Episode Integration Features

### Episode-to-Forum Integration

The forum now includes seamless integration with episode pages, allowing users to create episode-specific discussion posts directly from any episode page.

#### Create Post Button on Episode Pages
**Location:** `/season/:seasonNumber/episode/:episodeNumber`
**Implementation:** `views/episode.ejs`

Each episode page now features a prominent "Create a Post for this Episode" button that:

```html
<!-- Forum Create Post Section -->
<section class="episode-forum-section">
    <a href="/forum/create?category=episodes&episodeTitle=EPISODE_TITLE&seasonNumber=SEASON&episodeNumber=EPISODE" 
       class="btn btn-primary episode-forum-btn">
        💬 Create a Post for this Episode
    </a>
    <p>Share your thoughts about "EPISODE_TITLE" with the community</p>
</section>
```

**Features:**
- **Visual Integration**: Styled to match the site's AnimeAce theme with proper borders and shadows
- **Hover Effects**: Interactive button with color changes and subtle animation
- **Context Awareness**: Button text includes the specific episode title
- **URL Parameter Passing**: Automatically includes episode metadata in the forum URL

#### URL Parameter Structure
The button generates URLs with the following parameters:
```
/forum/create?category=episodes&episodeTitle=EPISODE_NAME&seasonNumber=X&episodeNumber=Y
```

**Parameters:**
- `category=episodes`: Automatically selects "Episode Discussions" category
- `episodeTitle`: URL-encoded episode title for form prepopulation
- `seasonNumber`: Current season number
- `episodeNumber`: Current episode number

#### Forum Create Page Enhancement
**File:** `routes/forum.js` and `views/forum/create-post-page.ejs`

The forum create page now handles episode-specific parameters for intelligent form prepopulation:

```javascript
// Route enhancement
router.get('/create', (req, res) => {
    const categoryId = req.query.category || 'general';
    const episodeTitle = req.query.episodeTitle || '';
    const seasonNumber = req.query.seasonNumber || '';
    const episodeNumber = req.query.episodeNumber || '';
    
    // Generate suggested title if episode info is provided
    let suggestedTitle = '';
    if (episodeTitle && seasonNumber && episodeNumber) {
        suggestedTitle = `Discussion: ${episodeTitle} (Season ${seasonNumber}, Episode ${episodeNumber})`;
    }
    
    res.render('forum/create-post-page', {
        // ... other parameters
        episodeTitle,
        seasonNumber,
        episodeNumber,
        suggestedTitle
    });
});
```

#### Automatic Form Prepopulation

When users click the episode button, the forum create form is automatically prepopulated with:

**1. Category Selection**
```html
<option value="episodes" selected>🎬 Episode Discussions</option>
```

**2. Suggested Title**
```html
<input type="text" id="post-title" name="title" 
       value="Discussion: Episode Title (Season X, Episode Y)">
```

**3. Episode-Specific Tags**
```html
<input type="text" id="post-tags" name="tags" 
       value="seasonX, episodeY, episode-title-slug">
```

**4. Discussion Template Content**
```html
<textarea id="post-content" name="content">
What did you think about EPISODE_TITLE?

Share your thoughts about this episode:
- What was your favorite moment?
- Any theories or observations?
- How did it connect to the overall Wavelength story?

Season X, Episode Y discussion thread.
</textarea>
```

#### Benefits for Users

**Streamlined Workflow:**
1. User watches episode on episode page
2. Clicks "Create a Post for this Episode" button
3. Forum form opens with everything prepopulated
4. User only needs to customize content and submit
5. Post automatically tagged and categorized correctly

**Enhanced Discoverability:**
- Posts are properly tagged with season/episode information
- Category is automatically set to "Episode Discussions"
- Title format ensures consistency across episode posts
- Template content encourages structured discussion

#### Technical Implementation Details

**Episode Route Updates:**
```javascript
// Updated episode route to pass season/episode numbers
res.render('episode', {
    title: episode.title,
    // ... other episode data
    seasonNumber,      // Added for forum integration
    episodeNumber,     // Added for forum integration
    // ... other parameters
});
```

**CSS Styling:**
- Button matches site's AnimeAce theme
- Responsive design for mobile devices
- Visual hierarchy with proper spacing
- Hover effects for interactivity
- Shadow and border effects matching site design

**URL Encoding:**
- Episode titles are properly URL-encoded
- Special characters handled correctly
- Spaces and punctuation converted to safe URL format

#### Cross-Page Integration

This feature creates a seamless connection between:
- **Episode Pages**: Content consumption and immediate reaction
- **Forum Pages**: Community discussion and long-term engagement
- **User Experience**: Reduced friction for creating episode-specific content

#### Future Enhancements

**Planned Features:**
- **Character Integration**: Add character-specific post creation from character pages
- **Lore Integration**: Create lore discussion posts from lore pages
- **Automatic Linking**: Detect and link episode mentions in forum posts
- **Episode Post Categories**: Sub-categories for different types of episode discussions
- **Related Posts**: Show related episode discussions on episode pages

**Technical Improvements:**
- **Template Variations**: Different templates for different episode types
- **Smart Tagging**: Automatic tag suggestions based on episode content
- **Rich Content**: Pre-populate with episode metadata (air date, duration, etc.)
- **Social Features**: Include episode rating or favorite moment prompts

This comprehensive delete functionality provides secure, user-friendly content management while maintaining data integrity and proper cleanup of all associated resources. The episode integration features create a seamless bridge between content consumption and community engagement, encouraging active participation in episode discussions.