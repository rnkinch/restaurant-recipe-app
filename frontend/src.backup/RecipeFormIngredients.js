import React from 'react';
import { Form, Button, Card, Row, Col } from 'react-bootstrap';

const RecipeFormIngredients = ({ formData, setFormData, ingredientsList, removeIngredient, showAddIngredientModal, setShowAddIngredientModal }) => {
  const measures = ['tsp', 'tbsp', 'cup', 'oz', 'fl oz', 'lb', 'g', 'kg', 'ml', 'l', 'pinch', 'dash', 'each', 'slice', 'whole'];

  const handleIngredientChange = (index, field, value) => {
    setFormData(prev => {
      const newIngredients = [...prev.ingredients];
      newIngredients[index] = { ...newIngredients[index], [field]: value };
      return { ...prev, ingredients: newIngredients };
    });
  };

  return (
    <>
      {formData.ingredients.map((ing, index) => (
        <Card key={index} className="mb-1" style={{ height: '40px', padding: '2px', display: 'flex', alignItems: 'center' }}>
          <Card.Body style={{ padding: '2px', display: 'flex', alignItems: 'center', width: '100%' }}>
            <Row className="w-100 align-items-center">
              <Col xs={5}>
                <Form.Control
                  type="text"
                  placeholder="Ingredient Name"
                  value={ing.ingredient}
                  onChange={(e) => handleIngredientChange(index, 'ingredient', e.target.value)}
                  style={{ height: '34px', fontSize: '12px' }}
                />
              </Col>
              <Col xs={2}>
                <Form.Control
                  type="text"
                  placeholder="Quantity"
                  value={ing.quantity}
                  onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                  style={{ height: '34px', fontSize: '12px' }}
                />
              </Col>
              <Col xs={2}>
                <Form.Select
                  size="sm"
                  value={ing.measure}
                  onChange={(e) => handleIngredientChange(index, 'measure', e.target.value)}
                  style={{ height: '34px', fontSize: '12px' }}
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
                  onClick={() => removeIngredient(index)}
                  style={{ height: '34px', padding: '0 8px', fontSize: '12px' }}
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
      >
        Add Ingredient
      </Button>
    </>
  );
};

export default RecipeFormIngredients;