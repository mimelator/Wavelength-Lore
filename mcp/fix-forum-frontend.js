#!/usr/bin/env node

/**
 * Fix Forum Frontend Issues
 * Create a simple forum post display that works without complex Firebase client setup
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Forum Frontend Issues...\n');

// Create a simple forum post page template that works
const simpleForumPostTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><%= post ? post.title : 'Post Not Found' %> - Wavelength Forum</title>
    <link rel="stylesheet" href="/css/forum.css">
    <style>
        .forum-post-container {
            max-width: 800px;
            margin: 2rem auto;
            padding: 2rem;
            background: rgba(74, 71, 163, 0.1);
            border-radius: 1rem;
            border: 1px solid rgba(74, 71, 163, 0.3);
        }
        .post-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid rgba(74, 71, 163, 0.2);
        }
        .post-avatar {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: #4a47a3;
        }
        .post-meta {
            flex: 1;
        }
        .post-title {
            font-size: 1.5rem;
            font-weight: bold;
            color: #4a47a3;
            margin: 0 0 0.5rem 0;
        }
        .post-author {
            color: #666;
            font-size: 0.9rem;
        }
        .post-content {
            line-height: 1.6;
            margin: 1.5rem 0;
            white-space: pre-wrap;
        }
        .post-tags {
            display: flex;
            gap: 0.5rem;
            margin: 1rem 0;
        }
        .tag {
            background: rgba(74, 71, 163, 0.2);
            color: #4a47a3;
            padding: 0.25rem 0.75rem;
            border-radius: 1rem;
            font-size: 0.8rem;
        }
        .replies-section {
            margin-top: 2rem;
            padding-top: 2rem;
            border-top: 2px solid rgba(74, 71, 163, 0.2);
        }
        .reply {
            background: rgba(255, 255, 255, 0.5);
            padding: 1rem;
            border-radius: 0.5rem;
            margin: 1rem 0;
            border-left: 3px solid #4a47a3;
        }
        .reply-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.5rem;
            font-size: 0.9rem;
            color: #666;
        }
        .back-link {
            display: inline-block;
            margin-bottom: 1rem;
            color: #4a47a3;
            text-decoration: none;
            font-weight: bold;
        }
        .back-link:hover {
            text-decoration: underline;
        }
        .error-message {
            text-align: center;
            color: #e74c3c;
            font-size: 1.2rem;
            margin: 2rem 0;
        }
    </style>
</head>
<body>
    <%- include('partials/header') %>
    
    <main class="forum-post-container">
        <a href="/forum" class="back-link">← Back to Forum</a>
        
        <% if (post) { %>
            <article class="forum-post">
                <header class="post-header">
                    <img src="<%= post.authorAvatar || '/icons/hero-icon.svg' %>" 
                         alt="<%= post.authorName %>" 
                         class="post-avatar"
                         onerror="this.src='/icons/hero-icon.svg'">
                    <div class="post-meta">
                        <h1 class="post-title"><%= post.title %></h1>
                        <div class="post-author">
                            By <%= post.authorName %> • 
                            <%= new Date(post.createdAt).toLocaleDateString() %> • 
                            <%= post.views || 0 %> views
                        </div>
                    </div>
                </header>
                
                <div class="post-content"><%= post.content %></div>
                
                <% if (post.tags && post.tags.length > 0) { %>
                    <div class="post-tags">
                        <% post.tags.forEach(tag => { %>
                            <span class="tag">#<%= tag %></span>
                        <% }); %>
                    </div>
                <% } %>
            </article>
            
            <% if (replies && replies.length > 0) { %>
                <section class="replies-section">
                    <h3>Replies (<%= replies.length %>)</h3>
                    <% replies.forEach(reply => { %>
                        <div class="reply">
                            <div class="reply-header">
                                <strong><%= reply.authorName %></strong> • 
                                <%= new Date(reply.createdAt).toLocaleDateString() %>
                            </div>
                            <div class="reply-content"><%= reply.content %></div>
                        </div>
                    <% }); %>
                </section>
            <% } %>
            
        <% } else { %>
            <div class="error-message">
                <h2>Post Not Found</h2>
                <p>The requested post could not be found or may have been removed.</p>
                <a href="/forum" class="back-link">Return to Forum</a>
            </div>
        <% } %>
    </main>
    
    <%- include('partials/footer') %>
</body>
</html>`;

// Write the simple template
const templatePath = path.join(__dirname, '../views/forum/simple-post-page.ejs');
fs.writeFileSync(templatePath, simpleForumPostTemplate);
console.log('✅ Created simple forum post template');

// Update the forum route to use the simple template and fetch data server-side
const routeUpdateScript = `
// Add this to your forum.js route handler for /post/:postId

router.get('/post/:postId', async (req, res) => {
    const postId = req.params.postId;
    
    try {
        const { getAdminDatabase } = require('../helpers/firebase-admin-utils');
        const db = getAdminDatabase();
        
        if (!db) {
            return res.render('forum/simple-post-page', {
                post: null,
                replies: [],
                title: 'Post Not Found'
            });
        }
        
        // Fetch post data
        const postSnapshot = await db.ref(\`forum/posts/\${postId}\`).once('value');
        const post = postSnapshot.val();
        
        if (!post) {
            return res.render('forum/simple-post-page', {
                post: null,
                replies: [],
                title: 'Post Not Found'
            });
        }
        
        // Fetch replies
        const repliesSnapshot = await db.ref('forum/replies').once('value');
        const allReplies = repliesSnapshot.val() || {};
        const postReplies = Object.values(allReplies)
            .filter(reply => reply.postId === postId)
            .sort((a, b) => a.createdAt - b.createdAt);
        
        // Increment view count
        await db.ref(\`forum/posts/\${postId}/views\`).set((post.views || 0) + 1);
        
        res.render('forum/simple-post-page', {
            post: post,
            replies: postReplies,
            title: post.title + ' - Wavelength Forum'
        });
        
    } catch (error) {
        console.error('Error loading post:', error);
        res.render('forum/simple-post-page', {
            post: null,
            replies: [],
            title: 'Error Loading Post'
        });
    }
});`;

console.log('📝 Route update needed:');
console.log('   Replace the existing /post/:postId route in routes/forum.js with server-side data fetching');
console.log('   This will bypass the client-side Firebase issues');

console.log('\n🎯 Forum Frontend Fix Complete!');
console.log('   ✅ Simple post template created');
console.log('   📋 Server-side data fetching recommended');
console.log('   🔗 This will make posts load reliably without client-side Firebase complexity');

process.exit(0);