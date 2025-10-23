/**
 * This file contains the database schema for the user gallery feature.
 * It defines the structure for storing user-saved images.
 */

const mongoose = require('mongoose');

// Schema for a saved image
const SavedImageSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  url: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: 'Captured Image'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  sourceUrl: String,
  width: Number,
  height: Number,
  alt: String,
  pageTitle: String
});

// Create indexes for faster queries
SavedImageSchema.index({ userId: 1, timestamp: -1 });

// Create the model
const SavedImage = mongoose.model('SavedImage', SavedImageSchema);

module.exports = SavedImage;