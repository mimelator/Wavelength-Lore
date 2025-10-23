/**
 * Enhanced Merchandise Routes with AI Upscaling
 * 
 * Provides intelligent image quality enhancement for print merchandise
 * Extends existing merchandise functionality with AI-powered upscaling
 */

const express = require('express');
const router = express.Router();
const EnhancedPrintifyService = require('../services/enhanced-printify-service');
const { ensureAuthenticated } = require('../middleware/auth');
const { getGalleryImageById } = require('../utils/gallery/helpers');

const enhancedPrintifyService = new EnhancedPrintifyService();

/**
 * Serve the enhanced merchandise page
 * GET /enhanced-merchandise
 */
router.get('/', ensureAuthenticated, (req, res) => {
  res.render('enhanced-merchandise', {
    title: 'AI-Enhanced Merchandise Creator',
    user: req.user
  });
});

/**
 * Preview image quality and enhancement recommendations
 * GET /api/merchandise/preview-quality?imageId=123
 */
router.get('/preview-quality', ensureAuthenticated, async (req, res) => {
  try {
    const { imageId } = req.query;
    
    if (!imageId) {
      return res.status(400).json({
        success: false,
        error: 'Image ID is required'
      });
    }
    
    // Get image from gallery
    const imageResult = await getGalleryImageById(req.user.uid, imageId);
    if (!imageResult.success) {
      return res.status(404).json({
        success: false,
        error: 'Image not found in gallery'
      });
    }
    
    // Get quality recommendations
    const recommendations = await enhancedPrintifyService.getQualityRecommendations(imageResult.buffer);
    
    res.json({
      success: true,
      image: {
        id: imageId,
        title: imageResult.title,
        originalUrl: imageResult.url
      },
      qualityAssessment: recommendations
    });
    
  } catch (error) {
    console.error('Error previewing quality:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze image quality'
    });
  }
});

/**
 * Preview enhancement without processing
 * POST /api/merchandise/preview-enhancement
 */
router.post('/preview-enhancement', ensureAuthenticated, async (req, res) => {
  try {
    const { imageId, enhancementOptions = {} } = req.body;
    
    if (!imageId) {
      return res.status(400).json({
        success: false,
        error: 'Image ID is required'
      });
    }
    
    // Get image from gallery
    const imageResult = await getGalleryImageById(req.user.uid, imageId);
    if (!imageResult.success) {
      return res.status(404).json({
        success: false,
        error: 'Image not found in gallery'
      });
    }
    
    // Preview enhancement
    const preview = await enhancedPrintifyService.previewEnhancement(
      imageResult.buffer,
      {
        contentType: enhancementOptions.contentType,
        character: imageResult.character,
        style: enhancementOptions.style
      }
    );
    
    res.json({
      success: true,
      image: {
        id: imageId,
        title: imageResult.title,
        originalUrl: imageResult.url
      },
      enhancementPreview: preview
    });
    
  } catch (error) {
    console.error('Error previewing enhancement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to preview enhancement'
    });
  }
});

/**
 * Create enhanced merchandise product
 * POST /api/merchandise/create-enhanced
 */
router.post('/create-enhanced', ensureAuthenticated, async (req, res) => {
  try {
    const {
      imageId,
      productType,
      customization = {},
      enhancementOptions = {}
    } = req.body;
    
    if (!imageId || !productType) {
      return res.status(400).json({
        success: false,
        error: 'Image ID and product type are required'
      });
    }
    
    // Get image from gallery
    const imageResult = await getGalleryImageById(req.user.uid, imageId);
    if (!imageResult.success) {
      return res.status(404).json({
        success: false,
        error: 'Image not found in gallery'
      });
    }
    
    // Get product type configuration
    const productTypes = require('../config/product-types');
    const typeConfig = productTypes.getProductTypeConfig(productType);
    
    if (!typeConfig) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product type'
      });
    }
    
    // Generate product title
    const productTitle = productTypes.generateProductName(productType, {
      imageName: imageResult.title,
      character: imageResult.character,
      customName: customization.title
    });
    
    // Create enhanced product
    const productData = {
      imageBuffer: imageResult.buffer,
      fileName: `${imageResult.title}.jpg`,
      blueprintId: typeConfig.blueprintId,
      printProviderId: typeConfig.printProviderId,
      title: productTitle,
      description: customization.description || typeConfig.description,
      basePrice: typeConfig.basePrice,
      userId: req.user.uid,
      originalImageId: imageId,
      upscaleOptions: {
        contentType: enhancementOptions.contentType || 'illustration',
        character: imageResult.character,
        style: enhancementOptions.style,
        upscaleMethod: enhancementOptions.method || 'auto'
      }
    };
    
    const result = await enhancedPrintifyService.createEnhancedProduct(productData);
    
    if (result.success) {
      res.json({
        success: true,
        product: result.product,
        imageEnhancement: result.imageEnhancement,
        printQualityOptimized: result.printQualityOptimized,
        message: result.printQualityOptimized 
          ? 'Product created with AI-enhanced print quality!'
          : 'Product created with original image quality'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Error creating enhanced product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create enhanced merchandise'
    });
  }
});

/**
 * Create multiple enhanced products from one image
 * POST /api/merchandise/create-enhanced-batch
 */
router.post('/create-enhanced-batch', ensureAuthenticated, async (req, res) => {
  try {
    const {
      imageId,
      productTypes,
      customization = {},
      enhancementOptions = {}
    } = req.body;
    
    if (!imageId || !Array.isArray(productTypes) || productTypes.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Image ID and product types array are required'
      });
    }
    
    // Get image from gallery
    const imageResult = await getGalleryImageById(req.user.uid, imageId);
    if (!imageResult.success) {
      return res.status(404).json({
        success: false,
        error: 'Image not found in gallery'
      });
    }
    
    // Get product type configurations
    const productTypesConfig = require('../config/product-types');
    const productConfigs = productTypes.map(type => {
      const config = productTypesConfig.getProductTypeConfig(type);
      if (!config) {
        throw new Error(`Invalid product type: ${type}`);
      }
      
      return {
        blueprintId: config.blueprintId,
        printProviderId: config.printProviderId,
        title: productTypesConfig.generateProductName(type, {
          imageName: imageResult.title,
          character: imageResult.character,
          customName: customization.title
        }),
        description: customization.description || config.description,
        basePrice: config.basePrice
      };
    });
    
    // Create batch of enhanced products
    const batchData = {
      imageBuffer: imageResult.buffer,
      fileName: `${imageResult.title}.jpg`,
      productTypes: productConfigs,
      baseTitle: imageResult.title,
      userId: req.user.uid,
      originalImageId: imageId,
      upscaleOptions: {
        contentType: enhancementOptions.contentType || 'illustration',
        character: imageResult.character,
        style: enhancementOptions.style,
        upscaleMethod: enhancementOptions.method || 'auto'
      }
    };
    
    const result = await enhancedPrintifyService.createEnhancedProductBatch(batchData);
    
    if (result.success) {
      res.json({
        success: true,
        batchResults: result.productResults,
        imageEnhancement: result.imageEnhancement,
        successCount: result.successCount,
        totalCount: result.totalCount,
        message: `Successfully created ${result.successCount}/${result.totalCount} enhanced products${
          result.imageEnhancement.enhanced ? ' with AI-enhanced print quality!' : ''
        }`
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Error creating enhanced product batch:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create enhanced merchandise batch'
    });
  }
});

/**
 * Get enhancement history for user
 * GET /api/merchandise/enhancement-history
 */
router.get('/enhancement-history', ensureAuthenticated, async (req, res) => {
  try {
    // This would integrate with a database to track enhancement history
    // For now, return a placeholder response
    res.json({
      success: true,
      history: [],
      message: 'Enhancement history tracking will be implemented with database integration'
    });
    
  } catch (error) {
    console.error('Error getting enhancement history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get enhancement history'
    });
  }
});

module.exports = router;