import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Form, InputGroup, Row, Col, Container } from 'react-bootstrap';
import Papa from 'papaparse';
import { deleteRecipe, getRecipes } from './api';

const RecipeList = ({ recipes, setRecipes, onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const apiUrl = process.env.REACT_APP_API_URL || 'http://192.168.68.129:5000';
  const defaultImage = '/logo.png';
  const fallbackImage = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=='; // 1x1 transparent pixel
  let validDefaultImage = defaultImage;

  useEffect(() => {
    const checkImage = (src) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(src);
        img.onerror = () => resolve(fallbackImage);
        img.src = src;
      });
    };

    (async () => {
      validDefaultImage = await checkImage(defaultImage);
    })();
  }, []);

  const getImageSrc = (recipe) => {
    if (!recipe) return validDefaultImage;
    const imgPath = recipe.image || validDefaultImage;
    const resolvedPath = imgPath.startsWith('/uploads/') ? `${apiUrl}${imgPath}` : imgPath;
    return resolvedPath;
  };

  const handleImageError = (e, recipeId) => {
    console.error(`Failed to load image for recipe ${recipeId}:`, e.target.src);
    e.target.src = validDefaultImage;
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  const toggleActiveFilter = () => {
    setShowActiveOnly(!showActiveOnly);
    const filtered = showActiveOnly
      ? recipes
      : recipes.filter(recipe => recipe.active);
    setRecipes(filtered);
  };

  const refreshRecipeList = async () => {
    try {
      const updatedRecipes = await getRecipes();
      setRecipes(updatedRecipes);
    } catch (err) {
      console.error('Error refreshing recipe list:', err.message);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      console.log('Attempting to delete recipe with ID:', id);
      console.log('Full recipe object:', recipes.find(r => r._id === id));
      const requestUrl = `${apiUrl}/recipes/${id}`;
      console.log('Sending DELETE request to:', requestUrl);
      deleteRecipe(id)
        .then(response => {
          console.log('Delete response:', response);
          refreshRecipeList(); // Refresh the recipe list after deletion
        })
        .catch(err => {
          console.error('Error deleting recipe:', err.message, 'Status:', err.response?.status, 'Response data:', err.response?.data, 'Request URL:', requestUrl);
          alert('Failed to delete recipe: ' + err.message);
        });
    }
  };

  const handleExportCSV = () => {
    const csvData = recipes.map(recipe => ({
      Name: recipe.name,
      Ingredients: recipe.ingredients
        .map(ing => `${ing.name} (${ing.quantity} ${ing.measure}${ing.purveyor ? `, ${ing.purveyor.name}` : ''})`)
        .join('; '),
      Steps: recipe.steps,
      PlatingGuide: recipe.platingGuide,
      Allergens: recipe.allergens.join(', '),
      ServiceTypes: recipe.serviceTypes.join(', '),
      Active: recipe.active ? 'Yes' : 'No'
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'recipes.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRecipes = showActiveOnly
    ? recipes.filter(recipe => recipe.active)
    : recipes;

  const imageStyle = {
    width: '300px',
    height: '200px',
    objectFit: 'cover'
  };

  return (
    <Container className="py-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>Recipes</h1>
        <div>
          <Button variant="primary" size="sm" as={Link} to="/add" className="me-2">
            Add New Recipe
          </Button>
          <Button variant="secondary" size="sm" onClick={handleExportCSV}>
            Export to CSV
          </Button>
        </div>
      </div>
      <div className="mb-3">
        <InputGroup>
          <Form.Control
            type="text"
            placeholder="Search recipes..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <Button
            variant={showActiveOnly ? 'success' : 'outline-primary'}
            size="sm"
            onClick={toggleActiveFilter}
          >
            {showActiveOnly ? 'Show Active' : 'Show Active Only'}
          </Button>
        </InputGroup>
      </div>
      <Row>
        {filteredRecipes.length > 0 ? (
          filteredRecipes.map(recipe => (
            <Col key={recipe._id} className="mb-3">
              <div className="d-flex justify-content-center">
                <Card style={{ width: '300px' }}>
                  <Card.Img 
                    variant="top" 
                    src={getImageSrc(recipe)} 
                    alt={recipe.name || 'No Image'} 
                    onError={(e) => handleImageError(e, recipe._id)}
                    className="d-block mx-auto"
                    style={imageStyle}
                  />
                  <Card.Body>
                    <Card.Title>{recipe.name}</Card.Title>
                    <Card.Text>
                      <strong>Status:</strong> {recipe.active ? 'Active' : 'Inactive'}
                    </Card.Text>
                    <div className="d-flex justify-content-end">
                      <Button
                        variant="primary"
                        size="sm"
                        as={Link}
                        to={`/recipe/${recipe._id}`}
                        className="me-2"
                      >
                        View
                      </Button>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        as={Link}
                        to={`/edit/${recipe._id}`}
                        className="me-2"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        as={Link}
                        to={`/copy/${recipe._id}`}
                        className="me-2"
                      >
                        Copy
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(recipe._id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </Col>
          ))
        ) : (
          <Col>
            <p>No recipes found.</p>
          </Col>
        )}
      </Row>
    </Container>
  );
};

export default RecipeList;