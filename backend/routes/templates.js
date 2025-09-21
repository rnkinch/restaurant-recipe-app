const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');
const DefaultTemplate = require('../models/DefaultTemplate');

// Get template for a recipe (custom if exists, else default)
router.get('/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id).select('pdfTemplate');
    if (recipe && recipe.pdfTemplate) {
      return res.json({ template: recipe.pdfTemplate });
    }

    const defaultTpl = await DefaultTemplate.findOne({ name: 'recipe-default' });
    return res.json({ template: defaultTpl?.template || null });
  } catch (err) {
    console.error('Fetch template error:', err.message);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// Get default template
router.get('/default', async (req, res) => {
  try {
    const defaultTpl = await DefaultTemplate.findOne({ name: 'recipe-default' });
    return res.json({ template: defaultTpl?.template || null });
  } catch (err) {
    console.error('Fetch default template error:', err.message);
    res.status(500).json({ error: 'Failed to fetch default template' });
  }
});

// Save template for a specific recipe
router.post('/:id', async (req, res) => {
  try {
    const { template } = req.body;
    if (!template) {
      return res.status(400).json({ error: 'Template data is required' });
    }
    const recipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      { pdfTemplate: template },
      { new: true }
    );
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    res.json({ message: 'Template saved for recipe' });
  } catch (err) {
    console.error('Save template error:', err.message);
    res.status(500).json({ error: 'Failed to save template' });
  }
});

// Save/update the default template
router.post('/default/save', async (req, res) => {
  try {
    const { template } = req.body;
    if (!template) {
      return res.status(400).json({ error: 'Template data is required' });
    }
    const updatedTemplate = await DefaultTemplate.findOneAndUpdate(
      { name: 'recipe-default' },
      { template },
      { upsert: true, new: true }
    );
    res.json({ message: 'Default template saved', template: updatedTemplate.template });
  } catch (err) {
    console.error('Save default template error:', err.message);
    res.status(500).json({ error: 'Failed to save default template' });
  }
});

module.exports = router;