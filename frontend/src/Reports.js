import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Alert, Table } from 'react-bootstrap';
import { getIngredients, getRecipes } from './api';

const Reports = () => {
  const { type } = useParams();
  const [ingredients, setIngredients] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

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
          recipes: activeRecipes
            .filter(recipe =>
              recipe.ingredients.some(recipeIng => recipeIng.ingredient?._id?.toString() === ing._id.toString())
            )
            .map(recipe => ({
              name: recipe.name || 'Unknown',
              quantity: recipe.ingredients.find(recipeIng => recipeIng.ingredient?._id?.toString() === ing._id.toString())?.quantity || 'N/A',
              measure: recipe.ingredients.find(recipeIng => recipeIng.ingredient?._id?.toString() === ing._id.toString())?.measure || 'N/A'
            })),
          purveyorName: ing.purveyor?.name || 'Unknown'
        }));

      setIngredients(activeIngredients);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching active ingredients:', err);
      setError(`Failed to load active ingredients: ${err.message}`);
      setLoading(false);
    }
  };

  const activeIngredients = useMemo(() => ingredients, [ingredients]);

  useEffect(() => {
    if (type === 'active-ingredients') {
      fetchActiveIngredients();
    }
  }, [type]);

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
      {activeIngredients.length === 0 ? (
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
            {activeIngredients.map(ingredient => (
              <tr key={ingredient._id}>
                <td>{ingredient.name}</td>
                <td>{ingredient.purveyorName}</td>
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