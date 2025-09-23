import React, { useState, useEffect } from 'react';
import { Container, Alert, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { getRecipes } from './api';

const ActiveRecipesReport = () => {
  const [recipes, setRecipes] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveRecipes = async () => {
      setLoading(true);
      setError(null);
      try {
        const recipesData = await getRecipes(true);
        const activeRecipes = recipesData
          .filter(recipe => recipe.active && recipe._id && recipe.name)
          .map(recipe => ({
            ...recipe,
            ingredients: Array.isArray(recipe.ingredients)
              ? recipe.ingredients.map(ing => ({
                  name: ing.ingredient?.name || 'Unknown',
                  quantity: ing.quantity || 'N/A',
                  measure: ing.measure || 'N/A'
                }))
              : [],
            allergens: Array.isArray(recipe.allergens) ? recipe.allergens : [],
            serviceTypes: Array.isArray(recipe.serviceTypes) ? recipe.serviceTypes : []
          }));
        setRecipes(activeRecipes);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching active recipes:', err);
        setError(`Failed to load active recipes: ${err.message}`);
        setLoading(false);
      }
    };
    fetchActiveRecipes();
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
      <h2>Active Recipes Report</h2>
      {recipes.length === 0 ? (
        <p>No active recipes found.</p>
      ) : (
        <Table striped bordered hover size="sm">
          <thead>
            <tr>
              <th>Recipe Name</th>
              <th>Ingredients</th>
              <th>Allergens</th>
              <th>Service Types</th>
            </tr>
          </thead>
          <tbody>
            {recipes.map(recipe => (
              <tr key={recipe._id}>
                <td>
                  <Link to={`/recipe/${recipe._id}`}>{recipe.name}</Link>
                </td>
                <td>
                  {recipe.ingredients.length > 0
                    ? recipe.ingredients
                        .map(ing => `${ing.name} (${ing.quantity} ${ing.measure})`)
                        .join(', ')
                    : 'No ingredients'}
                </td>
                <td>{recipe.allergens.length > 0 ? recipe.allergens.join(', ') : 'None'}</td>
                <td>{recipe.serviceTypes.length > 0 ? recipe.serviceTypes.join(', ') : 'None'}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
};

export default ActiveRecipesReport;