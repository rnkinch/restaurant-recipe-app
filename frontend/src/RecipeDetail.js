// RecipeDetail.js (Unmodified)
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button, Row, Col, Alert, Card, Container, Spinner } from 'react-bootstrap';
import { getRecipeById, deleteRecipe } from './api';

const RecipeDetail = ({ refreshRecipes }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const apiUrl = process.env.REACT_APP_API_URL || 'http://192.168.68.129:5000';
  const defaultImage = '/logo.png';

  useEffect(() => {
    if (!id) {
      setError('Invalid recipe ID');
      setLoading(false);
      return;
    }
    getRecipeById(id)
      .then(data => {
        if (!data || !data._id) {
          setError('Recipe not found');
          setRecipe(null);
          setLoading(false);
        } else {
          setRecipe(data);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Error fetching recipe:', err.message);
        setError(`Failed to load recipe: ${err.message}`);
        setLoading(false);
      });
  }, [id]);

  const handleDelete = async () => {
    if (id && window.confirm('Are you sure you want to delete this recipe?')) {
      try {
        await deleteRecipe(id);
        if (refreshRecipes) refreshRecipes();
        navigate('/');
      } catch (err) {
        setError(`Failed to delete recipe: ${err.message}`);
      }
    }
  };

  if (loading) return <Container className="py-3"><Spinner animation="border" /></Container>;
  if (error) return (
    <Container className="py-3">
      <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>
    </Container>
  );
  if (!recipe) return null;

  const imageStyle = { width: '300px', height: '200px', objectFit: 'cover' };
  const imageSrc = recipe.image?.startsWith('/uploads/') ? `${apiUrl}${recipe.image}` : `http://localhost:3000${defaultImage}`;
  const allServiceTypes = Array.isArray(recipe.serviceTypes) && recipe.serviceTypes.length > 0 ? recipe.serviceTypes : ['None'];
  const ingredientsList = recipe.ingredients && recipe.ingredients.length > 0 ? (
    recipe.ingredients.map((item, index) => (
      <li key={`${item.ingredient?._id || index}`}>
        {(item.ingredient?.name || item.ingredient || 'Unknown')} - {item.quantity} {item.measure}
      </li>
    ))
  ) : (
    <li>No ingredients</li>
  );
  const stepsList = recipe.steps ? (
    recipe.steps.split('\n').map((step, index) => (
      step.trim() && <li key={index}>{step}</li>
    )).filter(Boolean)
  ) : (
    <li>No steps provided</li>
  );
  const platingGuideList = recipe.platingGuide ? (
    recipe.platingGuide.split('\n').map((guide, index) => (
      guide.trim() && <li key={index}>{guide}</li>
    )).filter(Boolean)
  ) : (
    <li>No plating guide provided</li>
  );

  return (
    <Container className="py-3">
      <div className="mb-3">
        <h1>{recipe.name}</h1>
      </div>
      <Row>
        <Col md={6}>
          <p><strong>Ingredients:</strong></p>
          <ul>
            {ingredientsList}
          </ul>
          <p><strong>Preparation Steps:</strong></p>
          <ul>
            {stepsList}
          </ul>
          <p><strong>Plating Guide:</strong></p>
          <ul>
            {platingGuideList}
          </ul>
        </Col>
        <Col md={6}>
          <Card className="mb-3" style={{ maxWidth: '300px' }}>
            <Card.Img 
              variant="top" 
              src={imageSrc} 
              alt={recipe.name || 'No Image'}
              style={imageStyle}
              onError={(e) => { e.target.src = `http://localhost:3000${defaultImage}`; }}
            />
          </Card>
          <p><strong>Allergens:</strong></p>
          <p>{Array.isArray(recipe.allergens) ? recipe.allergens.join(', ') : 'None'}</p>
          <p><strong>Service Types:</strong></p>
          <p>{allServiceTypes.join(', ')}</p>
          <p><strong>Status:</strong></p>
          <p>{recipe.active ? 'Active' : 'Inactive'}</p>
        </Col>
      </Row>
      <div className="d-flex justify-content-start mt-3">
        <Button variant="outline-primary" size="sm" as={Link} to={`/edit/${id}`} className="me-2">
          Edit
        </Button>
        <Button variant="outline-primary" size="sm" as={Link} to={`/copy/${id}`} className="me-2">
          Copy
        </Button>
        <Button variant="outline-danger" size="sm" onClick={handleDelete}>
          Delete
        </Button>
      </div>
    </Container>
  );
};

export default RecipeDetail;