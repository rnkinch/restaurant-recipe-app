const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const uri = "mongodb://mongo:27017/recipeDB";
const client = new MongoClient(uri);

async function createAdmin() {
  try {
    await client.connect();
    const database = client.db("recipeDB");
    const users = database.collection("users");

    // Delete existing admin user
    await users.deleteOne({ username: "admin" });

    // Create new admin user
    const password = "SecurePassword123";
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const adminUser = {
      username: "admin",
      email: "admin@example.com",
      password: hashedPassword,
      role: "admin",
      createdAt: new Date(),
      isActive: true
    };

    const result = await users.insertOne(adminUser);
    console.log("Admin user created successfully:", result.insertedId);
    console.log("Username: admin");
    console.log("Password: SecurePassword123");

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

createAdmin();
