// RecipeForm.js (With fix for issue c: send ingredients as JSON string)
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Form, Button, Row, Col, Alert, Container, Spinner } from 'react-bootstrap';
import RecipeFormFields from './RecipeFormFields';
import RecipeFormIngredients from './RecipeFormIngredients';
import RecipeFormModal from './RecipeFormModal';
import { getRecipeById, getPurveyors, getIngredients, createIngredient, createRecipe, updateRecipe, deleteRecipe } from './api';
import { useNotification } from './NotificationContext';

const RecipeForm = ({ refreshRecipes }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { confirm } = useNotification();
  const apiUrl = process.env.REACT_APP_API_URL || 'http://192.168.68.129:8080';
  const [formData, setFormData] = useState({
    name: '',
    ingredients: [{ ingredient: '', quantity: '', measure: '', purveyor: null }],
    steps: '',
    platingGuide: '',
    allergens: [],
    serviceTypes: [],
    image: null,
    active: true,
    removeImage: false
  });
  const [error, setError] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(!!id);
  const [purveyors, setPurveyors] = useState([]);
  const [ingredientsList, setIngredientsList] = useState([]);
  const [showAddIngredientModal, setShowAddIngredientModal] = useState(false);
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [newIngredient, setNewIngredient] = useState({ name: '', purveyor: '' });
  const isMounted = useRef(false);
  const defaultImage = '/default_image.png';
  const fallbackImage = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
  let validDefaultImage = defaultImage;

  useEffect(() => {
    const checkImage = () => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(`http://192.168.68.129:3000${defaultImage}`);
        img.onerror = () => resolve(fallbackImage);
        img.src = `http://192.168.68.129:3000${defaultImage}`;
      });
    };

    (async () => {
      validDefaultImage = await checkImage();
      setPreviewImage(validDefaultImage);
    })();

    console.log('RecipeForm useEffect triggered for ID:', id);
    const loadData = async () => {
      try {
        const [purveyorsPromise, ingredientsPromise, recipePromise] = await Promise.all([
          getPurveyors().catch(err => { console.error('getPurveyors error:', err); throw err; }),
          getIngredients().catch(err => { console.error('getIngredients error:', err); throw err; }),
          id ? getRecipeById(id).catch(err => { console.error('getRecipeById error:', err); throw err; }) : Promise.resolve(null)
        ]);

        const purveyorsData = Array.isArray(purveyorsPromise) ? purveyorsPromise : [];
        console.log('Raw purveyors data:', purveyorsData);
        const validPurveyors = purveyorsData.map(p => {
          if (!p || typeof p !== 'object' || !p._id || typeof p._id !== 'string') {
            return null;
          }
          return { ...p, _id: p._id.toString() };
        }).filter(p => p !== null);
        console.log('Processed purveyors:', validPurveyors);
        setPurveyors(validPurveyors);

        const ingredientsData = Array.isArray(ingredientsPromise) ? ingredientsPromise.map(i => ({
          ...i,
          _id: i._id ? i._id.toString() : null
        })).filter(i => i._id) : [];
        setIngredientsList(ingredientsData);
        console.log('Processed ingredientsList:', ingredientsData);

        if (id) {
          setLoading(true);
          setError(null);
          const recipeData = recipePromise;
          console.log('Loaded recipe data:', recipeData);
          if (!recipeData || typeof recipeData !== 'object' || !recipeData._id) {
            setError('Recipe not found or invalid response from server');
            setLoading(false);
            return;
          }
          let newName = recipeData.name || '';
          if (window.location.pathname.includes('/copy')) {
            newName += ' (Copy)';
          }
          setFormData({
            name: newName,
            ingredients: recipeData.ingredients?.map(ing => ({
              ingredient: typeof ing.ingredient === 'object' && ing.ingredient?._id ? ing.ingredient._id.toString() : (ing.ingredient?.toString() || ''),
              quantity: String(ing.quantity || ''),
              measure: String(ing.measure || ''),
              purveyor: typeof ing.purveyor === 'object' && ing.purveyor?._id ? ing.purveyor._id.toString() : (ing.purveyor?.toString() || null)
            }))?.filter(ing => ing.ingredient) || [{ ingredient: '', quantity: '', measure: '', purveyor: null }],
            steps: recipeData.steps || '',
            platingGuide: recipeData.platingGuide || '',
            allergens: recipeData.allergens || [],
            serviceTypes: recipeData.serviceTypes || [],
            image: recipeData.image || null,
            active: recipeData.active !== undefined ? recipeData.active : true,
            removeImage: false
          });
          setPreviewImage(recipeData.image ? (recipeData.image.startsWith('/uploads/') ? `${apiUrl}${recipeData.image}` : recipeData.image) : validDefaultImage);
          setLoading(false);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Load data error:', err.message);
        setError(`Failed to load data: ${err.message}`);
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckboxChange = (e, field) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: e.target.checked
        ? [...prev[field], value]
        : prev[field].filter(item => item !== value)
    }));
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setFormData({ ...formData, image: e.target.files[0], removeImage: false });
      setPreviewImage(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, image: null, removeImage: true });
    setPreviewImage(validDefaultImage);
  };

  const removeIngredient = (index) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const handleAddIngredient = (ingredient) => {
    console.log('Adding ingredient to formData:', ingredient);
    setFormData(prev => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        {
          ingredient: ingredient._id.toString(),
          quantity: '',
          measure: '',
          purveyor: ingredient.purveyor?._id?.toString() || null
        }
      ]
    }));
    setShowAddIngredientModal(false);
  };

  const handleNewIngredientSubmit = async (newIngredient) => {
    try {
      const createdIngredient = await createIngredient(newIngredient.name, newIngredient.purveyor);
      setIngredientsList(prev => [...prev, {
        ...createdIngredient,
        _id: createdIngredient._id.toString(),
        purveyor: { _id: newIngredient.purveyor, name: purveyors.find(p => p._id === newIngredient.purveyor)?.name }
      }]);
      return createdIngredient;
    } catch (err) {
      console.error('Error creating new ingredient:', err.message);
      throw err;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate ingredients
      const invalidIngredients = formData.ingredients.some(
        ing => !ing.ingredient || !ing.quantity.trim() || !ing.measure.trim()
      );
      if (invalidIngredients) {
        setError('All ingredients must have a valid ingredient, quantity, and measure.');
        setLoading(false);
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('steps', formData.steps);
      formDataToSend.append('platingGuide', formData.platingGuide);
      formDataToSend.append('allergens', JSON.stringify(formData.allergens));
      formDataToSend.append('serviceTypes', JSON.stringify(formData.serviceTypes));
      formDataToSend.append('active', formData.active.toString());
      if (formData.image && typeof formData.image !== 'string') {
        formDataToSend.append('image', formData.image);
      }
      if (formData.removeImage) {
        formDataToSend.append('removeImage', 'true');
      }

      // Send ingredients as JSON string
      formDataToSend.append('ingredients', JSON.stringify(formData.ingredients.map(ing => ({
        ingredient: ing.ingredient,
        quantity: ing.quantity,
        measure: ing.measure
      }))));

      console.log('Submitting formData:', formData);
      let response;
      if (id && !window.location.pathname.includes('/copy')) {
        response = await updateRecipe(id, formDataToSend);
      } else {
        response = await createRecipe(formDataToSend);
      }
      console.log('Save response:', response);

      if (refreshRecipes) refreshRecipes();
      navigate('/');
    } catch (err) {
      console.error('Submit error:', err.message);
      setError(`Failed to save recipe: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (id && confirm('Are you sure you want to delete this recipe?')) {
      try {
        await deleteRecipe(id);
        if (refreshRecipes) refreshRecipes();
        navigate('/');
      } catch (err) {
        console.error('Delete error:', err.message);
        setError(`Failed to delete recipe: ${err.message}`);
      }
    }
  };

  const imageStyle = {
    maxWidth: '100%',
    height: 'auto',
    objectFit: 'contain'
  };

  const headerStyle = {
    fontWeight: '600',
    color: '#4a2c20'
  };

  const hrStyle = {
    borderColor: '#8a5a44'
  };

  const marginStyle = {
    margin: '12.7mm'
  };

  return (
    <Container className="py-3">
      <h1>{id ? (window.location.pathname.includes('/copy') ? 'Copy Recipe' : 'Edit Recipe') : 'Add Recipe'}</h1>
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <Form onSubmit={handleSubmit}>
        <Row>
          <Col md={7}>
            <hr style={hrStyle} />
            <Form.Group className="mb-3 d-flex align-items-center">
              <div className="flex-grow-1">
                <Form.Label style={headerStyle}>Name</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="mb-2"
                />
              </div>
              <div className="ms-3">
                <Form.Label style={headerStyle}>Active</Form.Label>
                <Form.Check
                  type="switch"
                  id="active-switch"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                />
              </div>
            </Form.Group>
            <hr style={hrStyle} />
            <Form.Group className="mb-3">
              <Form.Label style={headerStyle}>Ingredients</Form.Label>
              <RecipeFormIngredients
                formData={formData}
                setFormData={setFormData}
                ingredientsList={ingredientsList}
                removeIngredient={removeIngredient}
                showAddIngredientModal={showAddIngredientModal}
                setShowAddIngredientModal={setShowAddIngredientModal}
              />
            </Form.Group>
            <hr style={hrStyle} />
            <Form.Group className="mb-3">
              <Form.Label style={headerStyle}>Preparation Steps</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="steps"
                value={formData.steps}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <hr style={hrStyle} />
            <Form.Group className="mb-3">
              <Form.Label style={headerStyle}>Plating Guide</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="platingGuide"
                value={formData.platingGuide}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <hr style={hrStyle} />
            <div className="mt-3">
              <Button type="submit" variant="primary" size="sm" className="me-2" disabled={loading}>
                {loading ? <Spinner animation="border" size="sm" /> : 'Save'}
              </Button>
              {id && (
                <Button
                  variant="outline-danger"
                  size="sm"
                  className="me-2"
                  onClick={handleDelete}
                >
                  Delete
                </Button>
              )}
              <Link to="/" className="btn btn-outline-secondary btn-sm">
                Cancel
              </Link>
            </div>
          </Col>
          <Col md={5}>
            <RecipeFormFields
              formData={formData}
              setFormData={setFormData}
              handleCheckboxChange={handleCheckboxChange}
              handleImageChange={handleImageChange}
              handleRemoveImage={handleRemoveImage}
              previewImage={previewImage}
              imageStyle={imageStyle}
              defaultImage={defaultImage}
              apiUrl={apiUrl}
              isRightColumn={true}
              headerStyle={headerStyle}
              hrStyle={hrStyle}
            />
          </Col>
        </Row>
      </Form>
      <RecipeFormModal
        show={showAddIngredientModal}
        setShow={setShowAddIngredientModal}
        ingredientSearch={ingredientSearch}
        setIngredientSearch={setIngredientSearch}
        ingredientsList={ingredientsList}
        purveyors={purveyors}
        newIngredient={newIngredient}
        setNewIngredient={setNewIngredient}
        handleAddIngredient={handleAddIngredient}
        handleNewIngredientSubmit={handleNewIngredientSubmit}
        error={error}
        setError={setError}
      />
    </Container>
  );
};

export default RecipeForm;