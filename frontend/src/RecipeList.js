import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Form, InputGroup, Row, Col, Container } from 'react-bootstrap';
import { deleteRecipe, getRecipes } from './api';
import { useNotification } from './NotificationContext';
import { useRole } from './RoleContext';

const RecipeList = ({ recipes, setRecipes, onSearch }) => {
  const { showError, confirm } = useNotification();
  const { canEdit } = useRole();
  const [searchQuery, setSearchQuery] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
  const defaultImage = '/default_image.png';
  const fallbackImage = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
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
    
    if (!recipe.image) return validDefaultImage;
    
    // Handle different image path formats from old vs new uploads
    const imgPath = recipe.image;
    let finalUrl;
    
    // If it already starts with /uploads/, just prepend API URL
    if (imgPath.startsWith('/uploads/')) {
      finalUrl = `${apiUrl}${imgPath}`;
    }
    // If it's just a filename, add the uploads path
    else if (!imgPath.startsWith('/') && !imgPath.startsWith('http')) {
      finalUrl = `${apiUrl}/uploads/${imgPath}`;
    }
    // If it's already a full URL, use as-is
    else if (imgPath.startsWith('http')) {
      finalUrl = imgPath;
    }
    // Default case
    else {
      finalUrl = `${apiUrl}${imgPath}`;
    }
    
    // Add cache-busting parameter to prevent browser caching issues
    const cacheBuster = `?t=${Date.now()}`;
    finalUrl += cacheBuster;
    
    console.log(`Recipe ${recipe._id}: original="${imgPath}" -> final="${finalUrl}"`);
    return finalUrl;
  };

  const handleImageError = (e, recipeId) => {
    console.error(`Failed to load image for recipe ${recipeId}:`, e.target.src);
    
    // For old images that don't exist, just show the default image
    console.log(`Image not found for recipe ${recipeId}, showing default image`);
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
    if (confirm('Are you sure you want to delete this recipe?')) {
      console.log('Attempting to delete recipe with ID:', id);
      console.log('Full recipe object:', recipes.find(r => r._id === id));
      const requestUrl = `${apiUrl}/recipes/${id}`;
      console.log('Sending DELETE request to:', requestUrl);
      deleteRecipe(id)
        .then(response => {
          console.log('Delete response:', response);
          refreshRecipeList();
        })
        .catch(err => {
          console.error('Error deleting recipe:', err.message, 'Status:', err.response?.status, 'Response data:', err.response?.data, 'Request URL:', requestUrl);
          showError('Failed to delete recipe: ' + err.message);
        });
    }
  };

  const filteredRecipes = showActiveOnly
    ? recipes.filter(recipe => recipe.active)
    : recipes;

  const imageStyle = {
    width: '300px',
    height: '200px',
    objectFit: 'cover'
  };

  // Calculate stats
  const totalRecipes = recipes.length;
  const activeRecipes = recipes.filter(recipe => recipe.active).length;
  const inactiveRecipes = recipes.filter(recipe => !recipe.active).length;
  const recipesWithImages = recipes.filter(recipe => recipe.image).length;
  const recipesWithoutImages = recipes.filter(recipe => !recipe.image).length;

  return (
    <Container className="py-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>Recipes</h1>
        {canEdit && (
          <div>
            <Button variant="primary" size="sm" as={Link} to="/add" className="me-2">
              Add New Recipe
            </Button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-2">
          <div className="card text-center bg-primary text-white">
            <div className="card-body">
              <h4 className="card-title" style={{ fontSize: '1.5rem' }}>{totalRecipes}</h4>
              <p className="card-text" style={{ fontSize: '0.9rem' }}>Total Recipes</p>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card text-center bg-success text-white">
            <div className="card-body">
              <h4 className="card-title" style={{ fontSize: '1.5rem' }}>{activeRecipes}</h4>
              <p className="card-text" style={{ fontSize: '0.9rem' }}>Active Recipes</p>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card text-center bg-danger text-white">
            <div className="card-body">
              <h4 className="card-title" style={{ fontSize: '1.5rem' }}>{inactiveRecipes}</h4>
              <p className="card-text" style={{ fontSize: '0.9rem' }}>Inactive Recipes</p>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card text-center bg-info text-white">
            <div className="card-body">
              <h4 className="card-title" style={{ fontSize: '1.5rem' }}>{recipesWithImages}</h4>
              <p className="card-text" style={{ fontSize: '0.9rem' }}>With Images</p>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card text-center bg-warning text-white">
            <div className="card-body">
              <h4 className="card-title" style={{ fontSize: '1.5rem' }}>{recipesWithoutImages}</h4>
              <p className="card-text" style={{ fontSize: '0.9rem' }}>Without Images</p>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card text-center bg-secondary text-white">
            <div className="card-body">
              <h4 className="card-title" style={{ fontSize: '1.5rem' }}>{Math.round((activeRecipes / totalRecipes) * 100) || 0}%</h4>
              <p className="card-text" style={{ fontSize: '0.9rem' }}>Active Rate</p>
            </div>
          </div>
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
            {showActiveOnly ? 'Show All' : 'Show Active Only'}
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
                      {canEdit && (
                        <>
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
                        </>
                      )}
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