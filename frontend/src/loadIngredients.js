require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/recipes';
const DB_NAME = 'recipes';
const PURVEYORS_COLLECTION = 'purveyors';
const INGREDIENTS_COLLECTION = 'ingredients';
const DEFAULT_PURVEYOR_NAME = 'Default';

async function loadIngredients() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    const db = client.db(DB_NAME);
    const purveyors = db.collection(PURVEYORS_COLLECTION);
    const ingredients = db.collection(INGREDIENTS_COLLECTION);

    // Create default purveyor if not exists
    let defaultPurveyor = await purveyors.findOne({ name: DEFAULT_PURVEYOR_NAME });
    if (!defaultPurveyor) {
      const result = await purveyors.insertOne({ name: DEFAULT_PURVEYOR_NAME });
      defaultPurveyor = { _id: result.insertedId, name: DEFAULT_PURVEYOR_NAME };
      console.log(`Created default purveyor: ${DEFAULT_PURVEYOR_NAME}`);
    } else {
      console.log(`Default purveyor found: ${DEFAULT_PURVEYOR_NAME}`);
    }

    // Load ingredients from JSON (in production, read from file)
    const ingredientData = require('../../sample-data/ingredients.json'); // Adjust path if needed

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

    console.log(`\nSummary: Inserted ${inserted}, Skipped ${skipped} duplicates. Total loaded: ${inserted + skipped}`);
  } catch (error) {
    console.error('Error loading ingredients:', error);
  } finally {
    await client.close();
  }
}

loadIngredients();
