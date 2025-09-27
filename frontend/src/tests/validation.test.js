// validation.test.js - Frontend validation tests
import { validateRecipe, validateIngredient, validateFileUpload, sanitizeInput } from '../utils/validation';

describe('Frontend Validation Tests', () => {
  describe('Recipe Validation', () => {
    test('should reject recipe with empty name', () => {
      const formData = {
        name: '',
        steps: 'Valid steps that are long enough to pass validation',
        platingGuide: 'Valid plating guide that is long enough',
        ingredients: [{
          ingredient: 'valid-id',
          quantity: '1',
          measure: 'cup'
        }]
      };
      
      const result = validateRecipe(formData);
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toContain('required');
    });

    test('should reject recipe with name too short', () => {
      const formData = {
        name: 'A',
        steps: 'Valid steps that are long enough to pass validation',
        platingGuide: 'Valid plating guide that is long enough',
        ingredients: [{
          ingredient: 'valid-id',
          quantity: '1',
          measure: 'cup'
        }]
      };
      
      const result = validateRecipe(formData);
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toContain('at least 2 characters');
    });

    test('should reject recipe with name too long', () => {
      const formData = {
        name: 'A'.repeat(101),
        steps: 'Valid steps that are long enough to pass validation',
        platingGuide: 'Valid plating guide that is long enough',
        ingredients: [{
          ingredient: 'valid-id',
          quantity: '1',
          measure: 'cup'
        }]
      };
      
      const result = validateRecipe(formData);
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toContain('100 characters');
    });

    test('should reject recipe with invalid characters in name', () => {
      const formData = {
        name: 'Recipe<script>alert("xss")</script>',
        steps: 'Valid steps that are long enough to pass validation',
        platingGuide: 'Valid plating guide that is long enough',
        ingredients: [{
          ingredient: 'valid-id',
          quantity: '1',
          measure: 'cup'
        }]
      };
      
      const result = validateRecipe(formData);
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toContain('invalid characters');
    });

    test('should reject recipe with steps too short', () => {
      const formData = {
        name: 'Valid Recipe Name',
        steps: 'Short',
        platingGuide: 'Valid plating guide that is long enough',
        ingredients: [{
          ingredient: 'valid-id',
          quantity: '1',
          measure: 'cup'
        }]
      };
      
      const result = validateRecipe(formData);
      expect(result.isValid).toBe(false);
      expect(result.errors.steps).toContain('at least 10 characters');
    });

    test('should reject recipe with no ingredients', () => {
      const formData = {
        name: 'Valid Recipe Name',
        steps: 'Valid steps that are long enough to pass validation',
        platingGuide: 'Valid plating guide that is long enough',
        ingredients: []
      };
      
      const result = validateRecipe(formData);
      expect(result.isValid).toBe(false);
      expect(result.errors.ingredients).toContain('at least one ingredient');
    });

    test('should reject recipe with invalid ingredient quantity', () => {
      const formData = {
        name: 'Valid Recipe Name',
        steps: 'Valid steps that are long enough to pass validation',
        platingGuide: 'Valid plating guide that is long enough',
        ingredients: [{
          ingredient: 'valid-id',
          quantity: 'abc',
          measure: 'cup'
        }]
      };
      
      const result = validateRecipe(formData);
      expect(result.isValid).toBe(false);
      expect(result.errors.ingredients[0].quantity).toContain('valid number');
    });

    test('should reject recipe with invalid ingredient measure', () => {
      const formData = {
        name: 'Valid Recipe Name',
        steps: 'Valid steps that are long enough to pass validation',
        platingGuide: 'Valid plating guide that is long enough',
        ingredients: [{
          ingredient: 'valid-id',
          quantity: '1',
          measure: '123'
        }]
      };
      
      const result = validateRecipe(formData);
      expect(result.isValid).toBe(false);
      expect(result.errors.ingredients[0].measure).toContain('letters and spaces');
    });

    test('should accept valid recipe', () => {
      const formData = {
        name: 'Valid Recipe Name',
        steps: 'Valid steps that are long enough to pass validation',
        platingGuide: 'Valid plating guide that is long enough',
        ingredients: [{
          ingredient: 'valid-id',
          quantity: '1',
          measure: 'cup'
        }]
      };
      
      const result = validateRecipe(formData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });
  });

  describe('Ingredient Validation', () => {
    test('should reject ingredient with empty name', () => {
      const ingredientData = {
        name: '',
        purveyor: 'valid-purveyor-id'
      };
      
      const result = validateIngredient(ingredientData);
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toContain('required');
    });

    test('should reject ingredient with name too short', () => {
      const ingredientData = {
        name: 'A',
        purveyor: 'valid-purveyor-id'
      };
      
      const result = validateIngredient(ingredientData);
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toContain('at least 2 characters');
    });

    test('should reject ingredient without purveyor', () => {
      const ingredientData = {
        name: 'Valid Ingredient',
        purveyor: ''
      };
      
      const result = validateIngredient(ingredientData);
      expect(result.isValid).toBe(false);
      expect(result.errors.purveyor).toContain('select a purveyor');
    });

    test('should accept valid ingredient', () => {
      const ingredientData = {
        name: 'Valid Ingredient Name',
        purveyor: 'valid-purveyor-id'
      };
      
      const result = validateIngredient(ingredientData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });
  });

  describe('File Upload Validation', () => {
    test('should reject file that is too large', () => {
      const largeFile = {
        size: 6 * 1024 * 1024, // 6MB
        type: 'image/jpeg',
        name: 'large-image.jpg'
      };
      
      const result = validateFileUpload(largeFile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File size must be less than 5MB');
    });

    test('should reject file with invalid type', () => {
      const invalidFile = {
        size: 1024 * 1024, // 1MB
        type: 'text/plain',
        name: 'document.txt'
      };
      
      const result = validateFileUpload(invalidFile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Only JPEG and PNG images are allowed');
    });

    test('should reject file with invalid extension', () => {
      const invalidFile = {
        size: 1024 * 1024, // 1MB
        type: 'image/gif',
        name: 'image.gif'
      };
      
      const result = validateFileUpload(invalidFile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File must have .jpg, .jpeg, or .png extension');
    });

    test('should accept valid image file', () => {
      const validFile = {
        size: 1024 * 1024, // 1MB
        type: 'image/jpeg',
        name: 'image.jpg'
      };
      
      const result = validateFileUpload(validFile);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe('Input Sanitization', () => {
    test('should remove script tags from input', () => {
      const input = 'Recipe<script>alert("xss")</script> Name';
      const sanitized = sanitizeInput(input);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
    });

    test('should normalize multiple spaces', () => {
      const input = 'Recipe   with    multiple     spaces';
      const sanitized = sanitizeInput(input);
      expect(sanitized).toBe('Recipe with multiple spaces');
    });

    test('should trim whitespace', () => {
      const input = '  Recipe Name  ';
      const sanitized = sanitizeInput(input);
      expect(sanitized).toBe('Recipe Name');
    });

    test('should remove HTML tags', () => {
      const input = 'Recipe <b>Name</b> with <i>tags</i>';
      const sanitized = sanitizeInput(input);
      expect(sanitized).toBe('Recipe Name with tags');
    });
  });
});
