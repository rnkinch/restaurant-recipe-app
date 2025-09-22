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

module.exports = router;