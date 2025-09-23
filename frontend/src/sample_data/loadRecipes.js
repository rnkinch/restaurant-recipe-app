require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/recipes';
const DB_NAME = 'recipeDB';
const PURVEYORS_COLLECTION = 'purveyors';
const INGREDIENTS_COLLECTION = 'ingredients';
const RECIPES_COLLECTION = 'recipes';

async function loadRecipes() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    const db = client.db(DB_NAME);
    const purveyors = db.collection(PURVEYORS_COLLECTION);
    const ingredients = db.collection(INGREDIENTS_COLLECTION);
    const recipes = db.collection(RECIPES_COLLECTION);

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
        image: recipe.image || null,
        createdAt: new Date()
      });
      inserted++;
      console.log(`Inserted: ${recipe.name}`);
    }

    console.log(`\nSummary: Inserted ${inserted}, Skipped ${skipped} duplicates. Total loaded: ${inserted + skipped}`);
  } catch (error) {
    console.error('Error loading recipes:', error.message);
  } finally {
    await client.close();
  }
}

loadRecipes();