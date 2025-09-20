import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Alert, Table } from 'react-bootstrap'; // Corrected import
import { getIngredients, getRecipes } from './api';

const Reports = () => {
  const { type } = useParams();
  const [ingredients, setIngredients] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (type === 'active-ingredients') {
      fetchActiveIngredients();
    }
  }, [type]);

  const fetchActiveIngredients = async () => {
    setLoading(true);
    setError(null);
    try {
      const [recipesData, ingredientsData] = await Promise.all([
        getRecipes(true),
        getIngredients()
      ]);

      // Filter active recipes
      const activeRecipes = recipesData.filter(recipe => recipe.active);

      // Collect ingredient IDs from active recipes
      const activeIngredientIds = new Set();
      activeRecipes.forEach(recipe => {
        if (Array.isArray(recipe.ingredients)) {
          recipe.ingredients.forEach(ing => {
            if (ing.ingredient?._id) {
              activeIngredientIds.add(ing.ingredient._id.toString());
            }
          });
        }
      });

      // Filter ingredients that are used in active recipes
      const activeIngredients = ingredientsData
        .filter(ing => activeIngredientIds.has(ing._id.toString()))
        .map(ing => ({
          ...ing,
          recipes: activeRecipes
            .filter(recipe => recipe.ingredients.some(recipeIng => recipeIng.ingredient._id.toString() === ing._id.toString()))
            .map(recipe => ({
              name: recipe.name,
              quantity: recipe.ingredients.find(recipeIng => recipeIng.ingredient._id.toString() === ing._id.toString()).quantity,
              measure: recipe.ingredients.find(recipeIng => recipeIng.ingredient._id.toString() === ing._id.toString()).measure
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

  if (type !== 'active-ingredients') {
    return (
      <Container className="py-3">
        <h2>Reports</h2>
        <p>Invalid report type or report not implemented.</p>
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
              <th>Recipes Using This Ingredient</th>
              <th>Quantity</th>
              <th>Measure</th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map(ingredient => (
              <tr key={ingredient._id}>
                <td>{ingredient.name}</td>
                <td>{ingredient.purveyor?.name || 'Unknown'}</td>
                <td>
                  {ingredient.recipes.map(recipe => recipe.name).join(', ')}
                </td>
                <td>
                  {ingredient.recipes.map(recipe => recipe.quantity).join(', ')}
                </td>
                <td>
                  {ingredient.recipes.map(recipe => recipe.measure || 'N/A').join(', ')}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
};

export default Reports;