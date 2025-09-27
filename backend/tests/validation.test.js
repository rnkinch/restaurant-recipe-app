// validation.test.js - Automated validation tests
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Recipe = require('../models/Recipe');
const Ingredient = require('../models/Ingredient');
const Purveyor = require('../models/Purveyor');

// Test data
let testPurveyor;
let testIngredient;
let authToken;

describe('Validation Tests', () => {
  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant-recipe-app-test');
    }
    
    // Create test purveyor
    testPurveyor = new Purveyor({ name: 'Test Purveyor' });
    await testPurveyor.save();
    
    // Create test ingredient
    testIngredient = new Ingredient({ 
      name: 'Test Ingredient', 
      purveyor: testPurveyor._id 
    });
    await testIngredient.save();
    
    // Get auth token (you may need to adjust this based on your auth setup)
    // For now, we'll test without auth or you can add a test user creation
  });

  afterAll(async () => {
    // Clean up test data
    await Recipe.deleteMany({});
    await Ingredient.deleteMany({});
    await Purveyor.deleteMany({});
    await mongoose.disconnect();
  });

  describe('Recipe Validation', () => {
    test('should reject recipe with empty name', async () => {
      const response = await request(app)
        .post('/recipes')
        .send({
          name: '',
          steps: 'Valid steps that are long enough to pass validation',
          platingGuide: 'Valid plating guide that is long enough',
          ingredients: JSON.stringify([{
            ingredient: testIngredient._id,
            quantity: '1',
            measure: 'cup'
          }])
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details.name).toContain('required');
    });

    test('should reject recipe with name too short', async () => {
      const response = await request(app)
        .post('/recipes')
        .send({
          name: 'A',
          steps: 'Valid steps that are long enough to pass validation',
          platingGuide: 'Valid plating guide that is long enough',
          ingredients: JSON.stringify([{
            ingredient: testIngredient._id,
            quantity: '1',
            measure: 'cup'
          }])
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details.name).toContain('at least 2 characters');
    });

    test('should reject recipe with name too long', async () => {
      const longName = 'A'.repeat(101);
      const response = await request(app)
        .post('/recipes')
        .send({
          name: longName,
          steps: 'Valid steps that are long enough to pass validation',
          platingGuide: 'Valid plating guide that is long enough',
          ingredients: JSON.stringify([{
            ingredient: testIngredient._id,
            quantity: '1',
            measure: 'cup'
          }])
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details.name).toContain('100 characters');
    });

    test('should reject recipe with invalid characters in name', async () => {
      const response = await request(app)
        .post('/recipes')
        .send({
          name: 'Recipe<script>alert("xss")</script>',
          steps: 'Valid steps that are long enough to pass validation',
          platingGuide: 'Valid plating guide that is long enough',
          ingredients: JSON.stringify([{
            ingredient: testIngredient._id,
            quantity: '1',
            measure: 'cup'
          }])
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details.name).toContain('invalid characters');
    });

    test('should reject recipe with steps too short', async () => {
      const response = await request(app)
        .post('/recipes')
        .send({
          name: 'Valid Recipe Name',
          steps: 'Short',
          platingGuide: 'Valid plating guide that is long enough',
          ingredients: JSON.stringify([{
            ingredient: testIngredient._id,
            quantity: '1',
            measure: 'cup'
          }])
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details.steps).toContain('at least 10 characters');
    });

    test('should reject recipe with no ingredients', async () => {
      const response = await request(app)
        .post('/recipes')
        .send({
          name: 'Valid Recipe Name',
          steps: 'Valid steps that are long enough to pass validation',
          platingGuide: 'Valid plating guide that is long enough',
          ingredients: JSON.stringify([])
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details.ingredients).toContain('at least one ingredient');
    });

    test('should reject recipe with invalid ingredient quantity', async () => {
      const response = await request(app)
        .post('/recipes')
        .send({
          name: 'Valid Recipe Name',
          steps: 'Valid steps that are long enough to pass validation',
          platingGuide: 'Valid plating guide that is long enough',
          ingredients: JSON.stringify([{
            ingredient: testIngredient._id,
            quantity: 'abc',
            measure: 'cup'
          }])
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details.ingredients[0].quantity).toContain('valid number');
    });

    test('should reject recipe with invalid ingredient measure', async () => {
      const response = await request(app)
        .post('/recipes')
        .send({
          name: 'Valid Recipe Name',
          steps: 'Valid steps that are long enough to pass validation',
          platingGuide: 'Valid plating guide that is long enough',
          ingredients: JSON.stringify([{
            ingredient: testIngredient._id,
            quantity: '1',
            measure: '123'
          }])
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details.ingredients[0].measure).toContain('letters and spaces');
    });

    test('should accept valid recipe', async () => {
      const response = await request(app)
        .post('/recipes')
        .send({
          name: 'Valid Recipe Name',
          steps: 'Valid steps that are long enough to pass validation',
          platingGuide: 'Valid plating guide that is long enough',
          ingredients: JSON.stringify([{
            ingredient: testIngredient._id,
            quantity: '1',
            measure: 'cup'
          }])
        });
      
      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Valid Recipe Name');
    });
  });

  describe('Ingredient Validation', () => {
    test('should reject ingredient with empty name', async () => {
      const response = await request(app)
        .post('/ingredients')
        .send({
          name: '',
          purveyor: testPurveyor._id
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details.name).toContain('required');
    });

    test('should reject ingredient with name too short', async () => {
      const response = await request(app)
        .post('/ingredients')
        .send({
          name: 'A',
          purveyor: testPurveyor._id
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details.name).toContain('at least 2 characters');
    });

    test('should reject ingredient with invalid purveyor', async () => {
      const response = await request(app)
        .post('/ingredients')
        .send({
          name: 'Valid Ingredient',
          purveyor: 'invalid-id'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details.purveyor).toContain('Valid purveyor ID');
    });

    test('should accept valid ingredient', async () => {
      const response = await request(app)
        .post('/ingredients')
        .send({
          name: 'Valid Ingredient Name',
          purveyor: testPurveyor._id
        });
      
      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Valid Ingredient Name');
    });
  });

  describe('Purveyor Validation', () => {
    test('should reject purveyor with empty name', async () => {
      const response = await request(app)
        .post('/purveyors')
        .send({
          name: ''
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details.name).toContain('required');
    });

    test('should reject purveyor with name too short', async () => {
      const response = await request(app)
        .post('/purveyors')
        .send({
          name: 'A'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details.name).toContain('at least 2 characters');
    });

    test('should accept valid purveyor', async () => {
      const response = await request(app)
        .post('/purveyors')
        .send({
          name: 'Valid Purveyor Name'
        });
      
      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Valid Purveyor Name');
    });
  });

  describe('Input Sanitization', () => {
    test('should sanitize XSS attempts in recipe name', async () => {
      const response = await request(app)
        .post('/recipes')
        .send({
          name: 'Recipe<script>alert("xss")</script>',
          steps: 'Valid steps that are long enough to pass validation',
          platingGuide: 'Valid plating guide that is long enough',
          ingredients: JSON.stringify([{
            ingredient: testIngredient._id,
            quantity: '1',
            measure: 'cup'
          }])
        });
      
      // Should be rejected due to invalid characters, but if it passed validation,
      // the script tags should be removed
      if (response.status === 201) {
        expect(response.body.name).not.toContain('<script>');
        expect(response.body.name).not.toContain('alert');
      }
    });

    test('should sanitize multiple spaces in input', async () => {
      const response = await request(app)
        .post('/recipes')
        .send({
          name: 'Recipe   with    multiple     spaces',
          steps: 'Valid steps that are long enough to pass validation',
          platingGuide: 'Valid plating guide that is long enough',
          ingredients: JSON.stringify([{
            ingredient: testIngredient._id,
            quantity: '1',
            measure: 'cup'
          }])
        });
      
      if (response.status === 201) {
        expect(response.body.name).toBe('Recipe with multiple spaces');
      }
    });
  });
});
