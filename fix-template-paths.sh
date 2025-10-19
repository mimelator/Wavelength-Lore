#!/bin/bash

# Fix template CSS and icon paths to remove /static/ prefix
# This makes them consistent with Express routing

echo "Fixing template paths to remove /static/ prefix..."

# Files to fix
files=(
    "views/lore.ejs"
    "views/character-gallery.ejs"
    "views/admin/group-management.ejs"
    "views/lore-gallery.ejs"
    "views/forum/home-page.ejs"
    "views/forum/post-page.ejs"
    "views/forum/guidelines.ejs"
    "views/forum/category-page.ejs"
    "views/forum/recent.ejs"
    "views/forum/search.ejs"
    "views/forum/help.ejs"
    "views/forum/create-post-page.ejs"
    "views/forum/admin.ejs"
    "views/forum/popular.ejs"
)

# Counter for files processed
count=0

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "Processing: $file"
        
        # Fix CSS paths: /static/css/ -> /css/
        sed -i '' 's|<%= cdnUrl %>/static/css/|<%= cdnUrl %>/css/|g' "$file"
        
        # Fix icon paths: /static/icons/ -> /icons/
        sed -i '' 's|<%= cdnUrl %>/static/icons/|<%= cdnUrl %>/icons/|g' "$file"
        
        # Also fix any hardcoded /static/css paths without cdnUrl
        sed -i '' 's|href="/static/css/|href="/css/|g' "$file"
        
        ((count++))
    else
        echo "Warning: $file not found"
    fi
done

echo "✅ Fixed $count template files"
echo "Templates now use consistent paths matching Express routing"