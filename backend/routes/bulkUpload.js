const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const BulkUploadUtility = require('../utils/bulkUpload');
const { authenticateToken, requireEditPermission } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = '/app/uploads/temp';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `bulk-upload-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const excludedTypes = ['.json', '.xml'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (excludedTypes.includes(ext)) {
      cb(new Error('JSON and XML files are not allowed. Templates must be handled independently from file uploads.'), false);
    } else if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV, XLSX, and XLS files are allowed.'), false);
    }
  }
});

const bulkUpload = new BulkUploadUtility();

/**
 * GET /api/bulk-upload/template
 * Get template for bulk upload
 */
router.get('/template', authenticateToken, requireEditPermission, (req, res) => {
  try {
    const template = bulkUpload.getTemplate();
    res.json({
      success: true,
      template
    });
  } catch (error) {
    console.error('Error getting template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get template',
      error: error.message
    });
  }
});

/**
 * POST /api/bulk-upload/upload
 * Upload recipes from file
 */
router.post('/upload', authenticateToken, requireEditPermission, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase().substring(1);
    const options = {
      skipDuplicates: req.body.skipDuplicates === 'true',
      user: req.user,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    };

    // Parse the uploaded file
    const recipesData = await bulkUpload.parseFile(filePath, fileExt);
    
    if (!recipesData || recipesData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No data found in file'
      });
    }

    // Upload recipes
    const results = await bulkUpload.uploadRecipes(recipesData, options);

    // Clean up temporary file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: `Bulk upload completed. ${results.successful} successful, ${results.failed} failed, ${results.skipped.length} skipped. ${results.successful > 0 ? 'All successful uploads have been logged in the change log.' : ''}`,
      results
    });

  } catch (error) {
    console.error('Bulk upload error:', error);
    
    // Clean up temporary file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Bulk upload failed',
      error: error.message
    });
  }
});

/**
 * POST /api/bulk-upload/google-sheets
 * Upload recipes from Google Sheets
 */
router.post('/google-sheets', authenticateToken, requireEditPermission, async (req, res) => {
  try {
    const { sheetId, credentials, skipDuplicates = false } = req.body;

    if (!sheetId) {
      return res.status(400).json({
        success: false,
        message: 'Google Sheet ID is required'
      });
    }

    if (!credentials) {
      return res.status(400).json({
        success: false,
        message: 'Google Sheets credentials are required'
      });
    }

    const options = { 
      skipDuplicates,
      user: req.user,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    };

    // Parse Google Sheets data
    const recipesData = await bulkUpload.parseGoogleSheets(sheetId, credentials);
    
    if (!recipesData || recipesData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No data found in Google Sheet'
      });
    }

    // Upload recipes
    const results = await bulkUpload.uploadRecipes(recipesData, options);

    res.json({
      success: true,
      message: `Google Sheets upload completed. ${results.successful} successful, ${results.failed} failed, ${results.skipped.length} skipped. ${results.successful > 0 ? 'All successful uploads have been logged in the change log.' : ''}`,
      results
    });

  } catch (error) {
    console.error('Google Sheets upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Google Sheets upload failed',
      error: error.message
    });
  }
});

/**
 * POST /api/bulk-upload/preview
 * Preview recipes before uploading
 */
router.post('/preview', authenticateToken, requireEditPermission, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase().substring(1);

    // Parse the uploaded file
    const recipesData = await bulkUpload.parseFile(filePath, fileExt);
    
    if (!recipesData || recipesData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No data found in file'
      });
    }

    // Validate first 10 recipes for preview
    const previewCount = Math.min(10, recipesData.length);
    const previewData = recipesData.slice(0, previewCount);
    const validationResults = [];

    for (let i = 0; i < previewData.length; i++) {
      const recipeData = previewData[i];
      const validation = bulkUpload.validateRecipeData(recipeData);
      validationResults.push({
        row: i + 1,
        recipe: recipeData.name || 'Unknown',
        isValid: validation.isValid,
        errors: validation.errors
      });
    }

    // Clean up temporary file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: `Preview of first ${previewCount} recipes`,
      total: recipesData.length,
      preview: validationResults
    });

  } catch (error) {
    console.error('Preview error:', error);
    
    // Clean up temporary file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Preview failed',
      error: error.message
    });
  }
});

/**
 * GET /api/bulk-upload/supported-formats
 * Get list of supported file formats
 */
router.get('/supported-formats', authenticateToken, (req, res) => {
  res.json({
    success: true,
    formats: bulkUpload.supportedFormats,
    excludedFormats: bulkUpload.excludedFormats,
    maxFileSize: '10MB',
    note: 'JSON and XML formats are not supported for bulk uploads. Templates must be handled independently.'
  });
});

module.exports = router;
