const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');
const DefaultTemplate = require('../models/DefaultTemplate');

// Get template for a recipe (custom if exists, else default)
router.get('/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (recipe && recipe.pdfTemplate) {
      return res.json({ template: recipe.pdfTemplate });
    }

    const defaultTpl = await DefaultTemplate.findOne({ name: 'recipe-default' });
    return res.json({ template: defaultTpl?.template || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// Save template for a specific recipe
router.post('/:id', async (req, res) => {
  try {
    const { template } = req.body;
    await Recipe.findByIdAndUpdate(req.params.id, { pdfTemplate: template });
    res.json({ message: 'Template saved for recipe' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save template' });
  }
});

// Save/update the default template
router.post('/default/save', async (req, res) => {
  try {
    const { template } = req.body;
    await DefaultTemplate.findOneAndUpdate(
      { name: 'recipe-default' },
      { template },
      { upsert: true }
    );
    res.json({ message: 'Default template saved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save default template' });
  }
});

module.exports = router;
