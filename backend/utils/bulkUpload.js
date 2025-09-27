const csv = require('csv-parser');
const XLSX = require('xlsx');
const fs = require('fs');
const { google } = require('googleapis');
const Recipe = require('../models/Recipe');

class BulkUploadUtility {
  constructor() {
    this.supportedFormats = ['csv', 'xlsx', 'xls'];
    this.requiredFields = ['name', 'description', 'steps'];
    this.optionalFields = ['active', 'platingGuide', 'allergens', 'serviceTypes', 'ingredients'];
  }

  /**
   * Parse uploaded file based on format
   */
  async parseFile(filePath, format) {
    try {
      switch (format.toLowerCase()) {
        case 'csv':
          return await this.parseCSV(filePath);
        case 'xlsx':
        case 'xls':
          return await this.parseExcel(filePath);
        default:
          throw new Error(`Unsupported file format: ${format}`);
      }
    } catch (error) {
      console.error('File parsing error:', error);
      throw new Error(`Failed to parse file: ${error.message}`);
    }
  }

  /**
   * Parse CSV file
   */
  async parseCSV(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }

  /**
   * Parse Excel file (XLSX/XLS)
   */
  async parseExcel(filePath) {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      return jsonData;
    } catch (error) {
      throw new Error(`Excel parsing failed: ${error.message}`);
    }
  }

  /**
   * Parse Google Sheets data
   */
  async parseGoogleSheets(sheetId, credentials) {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
      });

      const sheets = google.sheets({ version: 'v4', auth });
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'A:Z', // Read all columns
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        throw new Error('No data found in Google Sheet');
      }

      // Convert to object format (first row as headers)
      const headers = rows[0];
      const data = rows.slice(1).map(row => {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index] || '';
        });
        return obj;
      });

      return data;
    } catch (error) {
      throw new Error(`Google Sheets parsing failed: ${error.message}`);
    }
  }

  /**
   * Validate recipe data
   */
  validateRecipeData(recipeData) {
    const errors = [];
    
    // Check required fields
    this.requiredFields.forEach(field => {
      if (!recipeData[field] || recipeData[field].toString().trim() === '') {
        errors.push(`Missing required field: ${field}`);
      }
    });

    // Validate active field if present
    if (recipeData.active !== undefined) {
      const activeValue = recipeData.active.toString().toLowerCase();
      if (!['true', 'false', '1', '0', 'yes', 'no'].includes(activeValue)) {
        errors.push('Invalid active field value. Use true/false, 1/0, or yes/no');
      }
    }

    // Validate ingredients if present
    if (recipeData.ingredients) {
      try {
        const ingredients = typeof recipeData.ingredients === 'string' 
          ? JSON.parse(recipeData.ingredients) 
          : recipeData.ingredients;
        
        if (!Array.isArray(ingredients)) {
          errors.push('Ingredients must be an array');
        }
      } catch (e) {
        errors.push('Invalid ingredients format. Expected JSON array');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Process ingredients string into proper format
   */
  async processIngredients(ingredientsString) {
    if (!ingredientsString) return [];

    try {
      let ingredients;
      if (typeof ingredientsString === 'string') {
        // Try to parse as JSON first
        try {
          ingredients = JSON.parse(ingredientsString);
        } catch {
          // If not JSON, split by common delimiters
          ingredients = ingredientsString.split(/[,\n;]/).map(ing => ing.trim()).filter(ing => ing);
        }
      } else {
        ingredients = ingredientsString;
      }

      if (!Array.isArray(ingredients)) return [];

      const processedIngredients = [];
      for (const ingredient of ingredients) {
        if (typeof ingredient === 'string') {
          // Parse string format: "quantity measure ingredient" or just "ingredient"
          const parts = ingredient.trim().split(/\s+/);
          if (parts.length >= 3) {
            processedIngredients.push({
              quantity: parts[0],
              measure: parts[1],
              ingredient: parts.slice(2).join(' ')
            });
          } else {
            processedIngredients.push({
              quantity: '',
              measure: '',
              ingredient: ingredient
            });
          }
        } else if (typeof ingredient === 'object') {
          processedIngredients.push(ingredient);
        }
      }

      return processedIngredients;
    } catch (error) {
      console.error('Error processing ingredients:', error);
      return [];
    }
  }

  /**
   * Process allergens string
   */
  processAllergens(allergensString) {
    if (!allergensString) return [];
    
    if (typeof allergensString === 'string') {
      return allergensString.split(/[,\n;]/).map(allergen => allergen.trim()).filter(allergen => allergen);
    }
    
    return Array.isArray(allergensString) ? allergensString : [];
  }

  /**
   * Process service types string
   */
  processServiceTypes(serviceTypesString) {
    if (!serviceTypesString) return [];
    
    if (typeof serviceTypesString === 'string') {
      return serviceTypesString.split(/[,\n;]/).map(type => type.trim()).filter(type => type);
    }
    
    return Array.isArray(serviceTypesString) ? serviceTypesString : [];
  }

  /**
   * Convert recipe data to proper format
   */
  async convertToRecipe(recipeData) {
    const recipe = {
      name: recipeData.name?.toString().trim() || '',
      description: recipeData.description?.toString().trim() || '',
      steps: recipeData.steps?.toString().trim() || '',
      platingGuide: recipeData.platingGuide?.toString().trim() || '',
      active: this.parseBoolean(recipeData.active, true),
      ingredients: await this.processIngredients(recipeData.ingredients),
      allergens: this.processAllergens(recipeData.allergens),
      serviceTypes: this.processServiceTypes(recipeData.serviceTypes),
      image: recipeData.image?.toString().trim() || null
    };

    return recipe;
  }

  /**
   * Parse boolean values from various formats
   */
  parseBoolean(value, defaultValue = false) {
    if (value === undefined || value === null) return defaultValue;
    
    const stringValue = value.toString().toLowerCase().trim();
    return ['true', '1', 'yes', 'on'].includes(stringValue);
  }

  /**
   * Upload recipes in bulk
   */
  async uploadRecipes(recipesData, options = {}) {
    const results = {
      total: recipesData.length,
      successful: 0,
      failed: 0,
      errors: [],
      created: [],
      skipped: []
    };

    for (let i = 0; i < recipesData.length; i++) {
      const recipeData = recipesData[i];
      const rowNumber = i + 1;

      try {
        // Validate recipe data
        const validation = this.validateRecipeData(recipeData);
        if (!validation.isValid) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            recipe: recipeData.name || 'Unknown',
            errors: validation.errors
          });
          continue;
        }

        // Convert to proper recipe format
        const recipe = await this.convertToRecipe(recipeData);

        // Check if recipe already exists (if skipDuplicates is true)
        if (options.skipDuplicates) {
          const existingRecipe = await Recipe.findOne({ name: recipe.name });
          if (existingRecipe) {
            results.skipped.push({
              row: rowNumber,
              recipe: recipe.name,
              reason: 'Recipe already exists'
            });
            continue;
          }
        }

        // Create recipe
        const newRecipe = new Recipe(recipe);
        const savedRecipe = await newRecipe.save();
        
        results.successful++;
        results.created.push({
          row: rowNumber,
          recipe: savedRecipe.name,
          id: savedRecipe._id
        });

      } catch (error) {
        results.failed++;
        results.errors.push({
          row: rowNumber,
          recipe: recipeData.name || 'Unknown',
          errors: [error.message]
        });
      }
    }

    return results;
  }

  /**
   * Get template for bulk upload
   */
  getTemplate() {
    return {
      headers: [
        'name',
        'description', 
        'steps',
        'platingGuide',
        'active',
        'ingredients',
        'allergens',
        'serviceTypes',
        'image'
      ],
      sample: {
        name: 'Sample Recipe',
        description: 'A sample recipe description',
        steps: '1. Step one\n2. Step two\n3. Step three',
        platingGuide: 'Plate with garnish and sauce',
        active: 'true',
        ingredients: '[{"quantity":"1","measure":"cup","ingredient":"flour"},{"quantity":"2","measure":"tbsp","ingredient":"sugar"}]',
        allergens: 'gluten,dairy',
        serviceTypes: 'dinner,lunch',
        image: 'optional-image-url.jpg'
      },
      instructions: {
        required: ['name', 'description', 'steps'],
        optional: ['platingGuide', 'active', 'ingredients', 'allergens', 'serviceTypes', 'image'],
        formats: {
          active: 'true/false, 1/0, yes/no',
          ingredients: 'JSON array or comma-separated strings',
          allergens: 'Comma-separated list',
          serviceTypes: 'Comma-separated list'
        }
      }
    };
  }
}

module.exports = BulkUploadUtility;
