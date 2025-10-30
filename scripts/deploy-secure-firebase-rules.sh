#!/bin/bash

# Firebase Security Rules Deployment Script
# This script deploys the secure Firebase rules to fix the insecure global read access

echo "🔒 Firebase Security Rules Deployment"
echo "======================================"

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Please install it first:"
    echo "   npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not logged in to Firebase. Please run:"
    echo "   firebase login"
    exit 1
fi

echo "📋 Current Firebase configuration:"
echo "   Rules file: config/firebase-database-rules-secure.json"
echo "   Project: wavelength-lore-default-rtdb"
echo ""

# Show what will be deployed
echo "🔍 Security Rules Summary:"
echo "   ✅ Removed dangerous global '.read': true rule"
echo "   ✅ Kept public read access for: lore, characters, episodes, videos, leaderboard"
echo "   ✅ Kept public read access for: forum posts, replies, categories"
echo "   ✅ Protected user data with authentication requirements"
echo "   ✅ Protected analytics with script authentication"
echo ""

# Ask for confirmation
read -p "Deploy these secure rules to Firebase? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo "🚀 Deploying Firebase security rules..."

# Deploy the rules
firebase deploy --only database

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Firebase security rules deployed successfully!"
    echo ""
    echo "🔒 Security improvements applied:"
    echo "   • Removed global database read access"
    echo "   • Maintained functionality for leaderboard and public content"
    echo "   • Protected sensitive user data and analytics"
    echo "   • Forum functionality preserved with proper authentication"
    echo ""
    echo "📊 You should no longer see the insecure rules warning in Firebase Console"
else
    echo ""
    echo "❌ Deployment failed. Please check your Firebase configuration and try again."
    exit 1
fi