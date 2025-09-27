require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/recipes';
const DB_NAME = 'recipeDB';
const PURVEYORS_COLLECTION = 'purveyors';

async function loadPurveyors() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    const db = client.db(DB_NAME);
    const purveyors = db.collection(PURVEYORS_COLLECTION);

    // Load purveyors from JSON (in production, read from file)
    const purveyorData = require('./purveyors.json'); // Adjust path if needed

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

    console.log(`\nSummary: Inserted ${inserted}, Skipped ${skipped} duplicates. Total loaded: ${inserted + skipped}`);
  } catch (error) {
    console.error('Error loading purveyors:', error);
  } finally {
    await client.close();
  }
}

loadPurveyors();
