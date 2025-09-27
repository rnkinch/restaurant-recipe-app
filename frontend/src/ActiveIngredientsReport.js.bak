import React, { useState, useEffect } from 'react';
import { Container, Alert, Table, Button } from 'react-bootstrap';
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

        // Validate and filter active recipes
        const activeRecipes = recipesData.filter(
          recipe => recipe.active && recipe._id && Array.isArray(recipe.ingredients)
        );

        // Create a set of ingredient IDs used in active recipes
        const activeIngredientIds = new Set(
          activeRecipes
            .flatMap(recipe => recipe.ingredients)
            .filter(ing => ing.ingredient?._id)
            .map(ing => ing.ingredient._id.toString())
        );

        // Map ingredients, including only those used in active recipes
        const activeIngredients = ingredientsData
          .filter(ing => ing._id && activeIngredientIds.has(ing._id.toString()))
          .map(ing => ({
            _id: ing._id,
            name: ing.name || 'Unknown',
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

  const handlePrintPreview = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Active Ingredients Report - Print Preview</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid black; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <h2>Active Ingredients Report</h2>
          <table>
            <thead>
              <tr>
                <th>Ingredient Name</th>
                <th>Purveyor</th>
                <th>Quantity</th>
                <th>Measure</th>
              </tr>
            </thead>
            <tbody>
              ${ingredients.length === 0 ? '<tr><td colspan="4">No active ingredients found.</td></tr>' : 
                ingredients.map(ingredient => `
                  <tr>
                    <td>${ingredient.name}</td>
                    <td>${ingredient.purveyorName}</td>
                    <td>${ingredient.quantities.map(q => q.quantity).join(', ')}</td>
                    <td>${ingredient.quantities.map(q => q.measure || 'N/A').join(', ')}</td>
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
    const headers = ['Ingredient Name', 'Purveyor', 'Quantity', 'Measure'];
    const rows = ingredients.map(ingredient => [
      `"${ingredient.name.replace(/"/g, '""')}"`,
      `"${ingredient.purveyorName.replace(/"/g, '""')}"`,
      `"${ingredient.quantities.map(q => q.quantity).join('; ')}"`,
      `"${ingredient.quantities.map(q => q.measure || 'N/A').join('; ')}"`
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'active_ingredients_report.csv');
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
      <h2>Active Ingredients Report</h2>
      <div className="mb-3">
        <Button variant="outline-primary" size="sm" onClick={handlePrintPreview} className="me-2">
          Print Preview
        </Button>
        <Button variant="outline-primary" size="sm" onClick={handleExportCSV}>
          Download CSV
        </Button>
      </div>
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