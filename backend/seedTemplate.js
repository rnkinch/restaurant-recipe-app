// Run with: node seedTemplate.js
require('dotenv').config();
const mongoose = require('mongoose');
const Template = require('./models/Template');

// Default template JSON
const defaultTemplate = {
  basePdf: null,
  schemas: [
    {
      name: 'Recipe Name',
      type: 'text',
      position: { x: 50, y: 50 },
      width: 300,
      height: 20,
    },
    {
      name: 'Ingredients',
      type: 'text',
      position: { x: 50, y: 100 },
      width: 300,
      height: 100,
    },
    {
      name: 'Steps',
      type: 'text',
      position: { x: 50, y: 220 },
      width: 300,
      height: 200,
    },
  ],
};

async function seed() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/recipeDB';
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

    // Check if default template already exists
    let template = await Template.findOne({ name: 'default' });
    if (template) {
      console.log('✅ Default template already exists. Updating it...');
      template.json = defaultTemplate;
      await template.save();
    } else {
      console.log('✅ Creating default template...');
      await Template.create({
        name: 'default',
        recipeId: null,
        json: defaultTemplate,
      });
    }

    console.log('🎉 Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seed();
seed
