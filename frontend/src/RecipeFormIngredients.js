// RecipeFormIngredients.js (With fix for issue b: removed feedback text, kept red border)
import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Row, Col, Alert } from 'react-bootstrap';

const RecipeFormIngredients = ({ formData, setFormData, ingredientsList, removeIngredient, showAddIngredientModal, setShowAddIngredientModal, validationErrors = {} }) => {
  const measures = ['tsp', 'tbsp', 'cup', 'oz', 'fl oz', 'lb', 'g', 'kg', 'ml', 'l', 'pinch', 'dash', 'each', 'slice', 'whole'];
  const [localValidationErrors, setLocalValidationErrors] = useState(
    formData.ingredients.map(() => ({ quantity: '', measure: '' }))
  );

  useEffect(() => {
    console.log('formData.ingredients:', formData.ingredients);
    console.log('validationErrors:', validationErrors);
    setLocalValidationErrors(prev =>
      formData.ingredients.map((ing, index) => ({
        quantity: typeof ing.quantity !== 'string' || !ing.quantity.trim() ? 'Quantity is required' : '',
        measure: typeof ing.measure !== 'string' || !ing.measure.trim() ? 'Measure is required' : ''
      }))
    );
  }, [formData.ingredients]);

  const handleIngredientChange = (index, field, value) => {
    const safeValue = value || '';
    setFormData(prev => {
      const newIngredients = [...prev.ingredients];
      newIngredients[index] = { ...newIngredients[index], [field]: safeValue };
      return { ...prev, ingredients: newIngredients };
    });

    setLocalValidationErrors(prev => {
      const newErrors = [...prev];
      newErrors[index] = {
        ...newErrors[index],
        [field]: typeof safeValue !== 'string' || !safeValue.trim() ? `${field.charAt(0).toUpperCase() + field.slice(1)} is required` : ''
      };
      return newErrors;
    });
  };

  const getIngredientName = (ingredientId) => {
    if (!ingredientId) return '';
    const ingredient = ingredientsList.find(ing => ing._id === ingredientId);
    return ingredient ? ingredient.name : 'Unknown Ingredient';
  };

  return (
    <>
      {validationErrors.ingredients && typeof validationErrors.ingredients === 'string' && (
        <Alert variant="danger" className="mb-3">
          {validationErrors.ingredients}
        </Alert>
      )}
      {formData.ingredients.map((ing, index) => (
        <Card key={index} className="mb-1" style={{ minHeight: '40px', padding: '4px', display: 'flex', alignItems: 'center' }}>
          <Card.Body style={{ padding: '4px', width: '100%' }}>
            <Row className="w-100 align-items-center">
              <Col xs={5}>
                <Form.Control
                  type="text"
                  placeholder="Ingredient Name"
                  value={getIngredientName(ing.ingredient)}
                  readOnly
                  style={{ height: '34px', fontSize: '14px' }}
                />
              </Col>
              <Col xs={2}>
                <Form.Control
                  type="text"
                  placeholder="Quantity"
                  value={ing.quantity || ''}
                  onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                  isInvalid={!!(localValidationErrors[index]?.quantity || validationErrors.ingredients?.[index]?.quantity)}
                  style={{ height: '34px', fontSize: '14px' }}
                />
              </Col>
              <Col xs={2}>
                <Form.Select
                  size="sm"
                  value={ing.measure || ''}
                  onChange={(e) => handleIngredientChange(index, 'measure', e.target.value)}
                  isInvalid={!!(localValidationErrors[index]?.measure || validationErrors.ingredients?.[index]?.measure)}
                  style={{ height: '34px', fontSize: '14px' }}
                >
                  <option value="">Select Measure</option>
                  {measures.map(measure => (
                    <option key={measure} value={measure}>{measure}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col xs={2}>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => {
                    removeIngredient(index);
                    setLocalValidationErrors(prev => prev.filter((_, i) => i !== index));
                  }}
                  style={{ height: '34px', padding: '0 8px', fontSize: '14px' }}
                >
                  Remove
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      ))}
      <Button
        variant="outline-primary"
        size="sm"
        className="mt-2"
        onClick={() => setShowAddIngredientModal(true)}
        style={{ fontSize: '14px' }}
      >
        Add Ingredient
      </Button>
    </>
  );
};

export default RecipeFormIngredients;