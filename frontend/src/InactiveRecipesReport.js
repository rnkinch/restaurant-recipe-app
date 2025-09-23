import React, { useState, useEffect } from 'react';
import { Container, Alert, Table, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { getRecipes } from './api';

const InactiveRecipesReport = () => {
  const [recipes, setRecipes] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInactiveRecipes = async () => {
      setLoading(true);
      setError(null);
      try {
        const recipesData = await getRecipes(true);
        const inactiveRecipes = recipesData
          .filter(recipe => !recipe.active && recipe._id && recipe.name)
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
        setRecipes(inactiveRecipes);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching inactive recipes:', err);
        setError(`Failed to load inactive recipes: ${err.message}`);
        setLoading(false);
      }
    };
    fetchInactiveRecipes();
  }, []);

  const handlePrintPreview = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Inactive Recipes Report - Print Preview</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid black; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <h2>Inactive Recipes Report</h2>
          <table>
            <thead>
              <tr>
                <th>Recipe Name</th>
                <th>Ingredients</th>
                <th>Allergens</th>
                <th>Service Types</th>
              </tr>
            </thead>
            <tbody>
              ${recipes.length === 0 ? '<tr><td colspan="4">No inactive recipes found.</td></tr>' : 
                recipes.map(recipe => `
                  <tr>
                    <td>${recipe.name}</td>
                    <td>${recipe.ingredients.length > 0 ? recipe.ingredients.map(ing => `${ing.name} (${ing.quantity} ${ing.measure})`).join(', ') : 'No ingredients'}</td>
                    <td>${recipe.allergens.length > 0 ? recipe.allergens.join(', ') : 'None'}</td>
                    <td>${recipe.serviceTypes.length > 0 ? recipe.serviceTypes.join(', ') : 'None'}</td>
                  </tr>
                `).join('')}
            </tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleExportCSV = () => {
    const headers = ['Recipe Name', 'Ingredients', 'Allergens', 'Service Types'];
    const rows = recipes.map(recipe => [
      `"${recipe.name.replace(/"/g, '""')}"`,
      `"${recipe.ingredients.length > 0 ? recipe.ingredients.map(ing => `${ing.name} (${ing.quantity} ${ing.measure})`).join('; ') : 'No ingredients'}"`,
      `"${recipe.allergens.length > 0 ? recipe.allergens.join('; ') : 'None'}"`,
      `"${recipe.serviceTypes.length > 0 ? recipe.serviceTypes.join('; ') : 'None'}"`
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'inactive_recipes_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

  return (
    <Container className="py-3">
      <h2>Inactive Recipes Report</h2>
      <div className="mb-3">
        <Button variant="outline-primary" size="sm" onClick={handlePrintPreview} className="me-2">
          Print Preview
        </Button>
        <Button variant="outline-primary" size="sm" onClick={handleExportCSV}>
          Download CSV
        </Button>
      </div>
      {recipes.length === 0 ? (
        <p>No inactive recipes found.</p>
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

export default InactiveRecipesReport;