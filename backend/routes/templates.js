const express = require('express');
const router = express.Router();
const DefaultTemplate = require('../models/DefaultTemplate');

// Get default template
router.get('/default', async (req, res) => {
  try {
    const defaultTpl = await DefaultTemplate.findOne({ name: 'recipe-default' });
    if (!defaultTpl) {
      console.log('No default template found in database');
      return res.json({ template: { fields: [] } });
    }
    console.log('Serving default template:', JSON.stringify(defaultTpl, null, 2));
    return res.json({ template: defaultTpl.template });
  } catch (err) {
    console.error('Fetch default template error:', err.message, err.stack);
    res.status(500).json({ error: `Failed to fetch default template: ${err.message}` });
  }
});

// Save/update the default template
router.post('/default/save', async (req, res) => {
  try {
    const { template } = req.body;
    if (!template || !Array.isArray(template.fields)) {
      console.error('Invalid template data:', JSON.stringify(req.body, null, 2));
      return res.status(400).json({ error: 'Template data with fields array is required' });
    }
    console.log('Saving default template:', JSON.stringify(template, null, 2));
    const updatedTemplate = await DefaultTemplate.findOneAndUpdate(
      { name: 'recipe-default' },
      { template },
      { upsert: true, new: true }
    );
    res.json({ message: 'Default template saved', template: updatedTemplate.template });
  } catch (err) {
    console.error('Save default template error:', err.message, err.stack);
    res.status(500).json({ error: `Failed to save default template: ${err.message}` });
  }
});

// Get all canvas templates
router.get('/canvas', async (req, res) => {
  try {
    const templates = await DefaultTemplate.find({ 
      name: { $regex: /^canvas-/ } 
    }).sort({ name: 1 });
    
    if (templates.length === 0) {
      return res.json({ templates: [] });
    }
    
    const templateList = templates.map(tpl => {
      const templateName = tpl.name ? tpl.name.replace('canvas-', '') : 'unknown';
      const displayName = tpl.displayName || templateName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      return {
        id: tpl._id.toString(),
        name: templateName,
        displayName: displayName,
        category: tpl.category || 'custom',
        isDefault: tpl.name === 'canvas-default',
        createdAt: tpl.createdAt,
        updatedAt: tpl.updatedAt,
        fieldCount: tpl.template?.fields?.length || 0
      };
    });
    
    return res.json({ templates: templateList });
  } catch (err) {
    console.error('Fetch canvas templates error:', err.message, err.stack);
    res.status(500).json({ error: `Failed to fetch canvas templates: ${err.message}` });
  }
});

// Get specific canvas template
router.get('/canvas/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    const templateName = templateId === 'default' ? 'canvas-default' : `canvas-${templateId}`;
    
    const template = await DefaultTemplate.findOne({ name: templateName });
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    console.log('Serving canvas template:', templateName);
    return res.json({ template: template.template });
  } catch (err) {
    console.error('Fetch canvas template error:', err.message, err.stack);
    res.status(500).json({ error: `Failed to fetch canvas template: ${err.message}` });
  }
});

// Create new canvas template
router.post('/canvas/create', async (req, res) => {
  try {
    const { templateName, displayName, category, template } = req.body;
    
    if (!templateName || !template || !Array.isArray(template.fields)) {
      return res.status(400).json({ 
        error: 'Template name and template data with fields array are required' 
      });
    }
    
    // Check if template name already exists
    const existingTemplate = await DefaultTemplate.findOne({ 
      name: `canvas-${templateName}` 
    });
    
    if (existingTemplate) {
      return res.status(409).json({ 
        error: 'Template name already exists' 
      });
    }
    
    const newTemplate = new DefaultTemplate({
      name: `canvas-${templateName}`,
      displayName: displayName || templateName,
      category: category || 'custom',
      template
    });
    
    await newTemplate.save();
    
    res.status(201).json({ 
      message: 'Template created successfully', 
      template: {
        id: newTemplate._id,
        name: templateName,
        displayName: newTemplate.displayName,
        category: newTemplate.category
      }
    });
  } catch (err) {
    console.error('Create canvas template error:', err.message, err.stack);
    res.status(500).json({ error: `Failed to create canvas template: ${err.message}` });
  }
});

// Save/update canvas template
router.post('/canvas/save', async (req, res) => {
  try {
    const { templateName, template } = req.body;
    
    if (!template || !Array.isArray(template.fields)) {
      return res.status(400).json({ error: 'Canvas template data with fields array is required' });
    }
    
    // Default to 'canvas-default' if no templateName provided (backward compatibility)
    const name = templateName ? `canvas-${templateName}` : 'canvas-default';
    
    // Generate display name from template name
    const displayName = templateName === 'default' 
      ? 'Default Template' 
      : templateName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    const updatedTemplate = await DefaultTemplate.findOneAndUpdate(
      { name },
      { 
        template,
        displayName: displayName,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );
    
    res.json({ 
      message: 'Canvas template saved', 
      template: updatedTemplate.template,
      templateId: updatedTemplate.name.replace('canvas-', '')
    });
  } catch (err) {
    console.error('Save canvas template error:', err.message, err.stack);
    res.status(500).json({ error: `Failed to save canvas template: ${err.message}` });
  }
});

// Delete canvas template
router.delete('/canvas/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    
    // Prevent deletion of default template
    if (templateId === 'default') {
      return res.status(400).json({ error: 'Cannot delete default template' });
    }
    
    const templateName = `canvas-${templateId}`;
    const result = await DefaultTemplate.findOneAndDelete({ name: templateName });
    
    if (!result) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    console.log('Deleted canvas template:', templateName);
    res.json({ message: 'Template deleted successfully' });
  } catch (err) {
    console.error('Delete canvas template error:', err.message, err.stack);
    res.status(500).json({ error: `Failed to delete canvas template: ${err.message}` });
  }
});

// Batch PDF generation using Konva template
router.post('/canvas/batch-pdf', async (req, res) => {
  try {
    const { recipeIds } = req.body;
    
    if (!recipeIds || !Array.isArray(recipeIds) || recipeIds.length === 0) {
      return res.status(400).json({ error: 'Recipe IDs array is required' });
    }

    // Load the saved template
    const template = await DefaultTemplate.findOne({ name: 'canvas-default' });
    if (!template || !template.template || !template.template.fields) {
      return res.status(404).json({ error: 'No saved template found. Please create and save a template first.' });
    }

    // Load recipes with populated ingredients
    const Recipe = require('../models/Recipe');
    const recipes = await Recipe.find({ _id: { $in: recipeIds } })
      .populate('ingredients.ingredient', 'name');
    
    if (recipes.length === 0) {
      return res.status(404).json({ error: 'No recipes found' });
    }

    // Generate PDF data for each recipe
    const pdfData = recipes.map(recipe => {
      // Create shapes from template with recipe-specific content
      const shapes = template.template.fields.map(field => {
        const shape = { ...field };
        
        // Update recipe-specific content
        if (field.id === 'recipe-title') {
          shape.text = recipe.name || 'Recipe Title';
        } else if (field.id === 'ingredients-content') {
          if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
            shape.text = recipe.ingredients.map(ing => {
              const ingredientName = ing.ingredient?.name || ing.ingredient || '';
              return `${ing.measure || ''} ${ingredientName}`.trim();
            }).join('\n');
          } else {
            shape.text = 'No ingredients listed';
          }
        } else if (field.id === 'steps-content') {
          shape.text = recipe.steps || 'No instructions provided';
        } else if (field.id === 'plating-guide-content') {
          shape.text = recipe.platingGuide || 'No plating guide provided';
        } else if (field.id === 'allergens-content') {
          shape.text = recipe.allergens && Array.isArray(recipe.allergens) 
            ? recipe.allergens.join(', ')
            : 'None listed';
        } else if (field.id === 'service-types-content') {
          shape.text = recipe.serviceTypes && Array.isArray(recipe.serviceTypes) 
            ? recipe.serviceTypes.join(', ')
            : 'Not specified';
        } else if (field.id === 'recipe-image') {
          // Keep image reference - will be handled by frontend
          shape.image = recipe.image;
        } else if (field.id === 'watermark') {
          // Keep watermark reference - will be handled by frontend
          shape.image = 'watermark';
        }
        
        return shape;
      });

      return {
        recipe: {
          _id: recipe._id,
          name: recipe.name,
          image: recipe.image
        },
        shapes: shapes
      };
    });

    res.json({
      success: true,
      template: template.template,
      recipes: pdfData,
      count: pdfData.length
    });

  } catch (err) {
    console.error('Batch PDF generation error:', err.message, err.stack);
    res.status(500).json({ error: `Failed to generate batch PDF: ${err.message}` });
  }
});

module.exports = router;