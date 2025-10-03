#!/usr/bin/env node

// Production sample data loader
// This script runs the sample data loading with the correct MongoDB URI for production

require('dotenv').config();
const { MongoClient } = require('mongodb');
const path = require('path');

// Production MongoDB URI - connects to the Docker container
const MONGODB_URI = 'mongodb://mongo-container:27017/recipeDB';
const DB_NAME = 'recipeDB';

async function loadPurveyors() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    const db = client.db(DB_NAME);
    const purveyors = db.collection('purveyors');

    // Load purveyors from JSON
    const purveyorData = require('./purveyors.json');

    let inserted = 0;
    let skipped = 0;

    for (const { name } of purveyorData) {
      const existing = await purveyors.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
      if (existing) {
        skipped++;
        console.log(`Skipped duplicate: ${name}`);
      } else {
        await purveyors.insertOne({
          name,
          createdAt: new Date()
        });
        inserted++;
        console.log(`Inserted: ${name}`);
      }
    }

    console.log(`\nPurveyors Summary: Inserted ${inserted}, Skipped ${skipped} duplicates. Total loaded: ${inserted + skipped}`);
  } catch (error) {
    console.error('Error loading purveyors:', error);
  } finally {
    await client.close();
  }
}

async function loadIngredients() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    const db = client.db(DB_NAME);
    const purveyors = db.collection('purveyors');
    const ingredients = db.collection('ingredients');

    // Create default purveyor if not exists
    const DEFAULT_PURVEYOR_NAME = 'Default';
    let defaultPurveyor = await purveyors.findOne({ name: DEFAULT_PURVEYOR_NAME });
    if (!defaultPurveyor) {
      const result = await purveyors.insertOne({ name: DEFAULT_PURVEYOR_NAME });
      defaultPurveyor = { _id: result.insertedId, name: DEFAULT_PURVEYOR_NAME };
      console.log(`Created default purveyor: ${DEFAULT_PURVEYOR_NAME}`);
    } else {
      console.log(`Default purveyor found: ${DEFAULT_PURVEYOR_NAME}`);
    }

    // Load ingredients from JSON
    const ingredientData = require('./ingredients.json');

    let inserted = 0;
    let skipped = 0;

    for (const { name } of ingredientData) {
      const existing = await ingredients.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
      if (existing) {
        skipped++;
        console.log(`Skipped duplicate: ${name}`);
      } else {
        await ingredients.insertOne({
          name,
          purveyor: defaultPurveyor._id,
          createdAt: new Date()
        });
        inserted++;
        console.log(`Inserted: ${name}`);
      }
    }

    console.log(`\nIngredients Summary: Inserted ${inserted}, Skipped ${skipped} duplicates. Total loaded: ${inserted + skipped}`);
  } catch (error) {
    console.error('Error loading ingredients:', error);
  } finally {
    await client.close();
  }
}

async function loadRecipes() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    const db = client.db(DB_NAME);
    const purveyors = db.collection('purveyors');
    const ingredients = db.collection('ingredients');
    const recipes = db.collection('recipes');

    // Fetch purveyor and ingredient ObjectIds
    const purveyorNames = [
      'Green Valley Farms',
      'Tuscan Imports',
      'Coastal Seafood Co.',
      'Midwest Grain Supply',
      'Artisan Cheese Market'
    ];
    const purveyorData = await purveyors.find({ name: { $in: purveyorNames } }).toArray();
    if (purveyorData.length === 0) {
      throw new Error('No purveyors found. Please load purveyors first.');
    }
    const purveyorIds = purveyorData.map(p => p._id.toString());

    const ingredientNames = require('./ingredients.json').map(i => i.name);
    const ingredientData = await ingredients.find({ name: { $in: ingredientNames } }).toArray();
    if (ingredientData.length === 0) {
      throw new Error('No ingredients found. Please load ingredients first.');
    }
    const ingredientMap = new Map(ingredientData.map(i => [i.name.toLowerCase(), i._id]));

    // Load recipes from JSON
    const recipeData = require('./recipes.json');

    let inserted = 0;
    let skipped = 0;

    for (const recipe of recipeData) {
      const existing = await recipes.findOne({ name: { $regex: new RegExp(`^${recipe.name}$`, 'i') } });
      if (existing) {
        skipped++;
        console.log(`Skipped duplicate: ${recipe.name}`);
        continue;
      }

      // Map ingredient names to ObjectIds
      const mappedIngredients = recipe.ingredients.map(ing => {
        const ingredientId = ingredientMap.get(ing.ingredient.toLowerCase());
        if (!ingredientId) {
          console.warn(`Ingredient not found: ${ing.ingredient}, skipping`);
          return null;
        }
        return {
          ingredient: ingredientId,
          quantity: ing.quantity,
          measure: ing.measure
        };
      }).filter(ing => ing !== null);

      if (mappedIngredients.length === 0) {
        console.warn(`No valid ingredients for recipe: ${recipe.name}, skipping`);
        continue;
      }

      // Assign a random purveyor to ingredients for consistency
      const purveyorId = purveyorIds[Math.floor(Math.random() * purveyorIds.length)];

      await recipes.insertOne({
        name: recipe.name,
        ingredients: mappedIngredients,
        steps: recipe.steps,
        platingGuide: recipe.platingGuide,
        allergens: recipe.allergens,
        serviceTypes: recipe.serviceTypes,
        active: recipe.active,
        image: null,
        createdAt: new Date()
      });
      inserted++;
      console.log(`Inserted: ${recipe.name}`);
    }

    console.log(`\nRecipes Summary: Inserted ${inserted}, Skipped ${skipped} duplicates. Total loaded: ${inserted + skipped}`);
  } catch (error) {
    console.error('Error loading recipes:', error);
  } finally {
    await client.close();
  }
}

async function loadAllSampleData() {
  console.log('Starting sample data loading...');
  
  try {
    await loadPurveyors();
    await loadIngredients();
    await loadRecipes();
    console.log('\n✅ All sample data loaded successfully!');
  } catch (error) {
    console.error('❌ Error loading sample data:', error);
  }
}

// Run the appropriate function based on command line arguments
const command = process.argv[2];

switch (command) {
  case 'purveyors':
    loadPurveyors();
    break;
  case 'ingredients':
    loadIngredients();
    break;
  case 'recipes':
    loadRecipes();
    break;
  case 'all':
  default:
    loadAllSampleData();
    break;
}
