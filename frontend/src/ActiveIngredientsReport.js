import React, { useState, useEffect } from 'react';
import { Container, Alert, Table } from 'react-bootstrap';
import { getRecipes, getIngredients } from './api';

const ActiveIngredientsReport = () => {
  const [ingredients, setIngredients] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveIngredients = async () => {
      setLoading(true);
      setError(null);
      try {
        const [recipesData, ingredientsData] = await Promise.all([
          getRecipes(true),
          getIngredients()
        ]);

        const activeRecipes = recipesData.filter(recipe => recipe.active && Array.isArray(recipe.ingredients));
        const activeIngredientIds = new Set(
          activeRecipes
            .flatMap(recipe => recipe.ingredients)
            .filter(ing => ing.ingredient?._id)
            .map(ing => ing.ingredient._id.toString())
        );

        const activeIngredients = ingredientsData
          .filter(ing => ing._id && activeIngredientIds.has(ing._id.toString()))
          .map(ing => ({
            ...ing,
            purveyorName: ing.purveyor?.name || 'Unknown',
            quantities: activeRecipes
              .filter(recipe => 
                recipe.ingredients.some(recipeIng => recipeIng.ingredient?._id?.toString() === ing._id.toString())
              )
              .map(recipe => ({
                quantity: recipe.ingredients.find(recipeIng => recipeIng.ingredient?._id?.toString() === ing._id.toString())?.quantity || 'N/A',
                measure: recipe.ingredients.find(recipeIng => recipeIng.ingredient?._id?.toString() === ing._id.toString())?.measure || 'N/A'
              }))
          }));

        setIngredients(activeIngredients);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching active ingredients:', err);
        setError(`Failed to load active ingredients: ${err.message}`);
        setLoading(false);
      }
    };
    fetchActiveIngredients();
  }, []);

  if (loading) {
    return <Container className="py-3"><p>Loading...</p></Container>;
  }

  if (error) {
    return (
      <Container className="py-3">
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-3">
      <h2>Active Ingredients Report</h2>
      {ingredients.length === 0 ? (
        <p>No active ingredients found.</p>
      ) : (
        <Table striped bordered hover size="sm">
          <thead>
            <tr>
              <th>Ingredient Name</th>
              <th>Purveyor</th>
              <th>Quantity</th>
              <th>Measure</th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map(ingredient => (
              <tr key={ingredient._id}>
                <td>{ingredient.name}</td>
                <td>{ingredient.purveyorName}</td>
                <td>
                  {ingredient.quantities.map(q => q.quantity).join(', ')}
                </td>
                <td>
                  {ingredient.quantities.map(q => q.measure || 'N/A').join(', ')}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
};

export default ActiveIngredientsReport;