// RecipeForm.js (With fix for issue c: send ingredients as JSON string)
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Form, Button, Row, Col, Alert, Container, Spinner } from 'react-bootstrap';
import RecipeFormFields from './RecipeFormFields';
import RecipeFormIngredients from './RecipeFormIngredients';
import RecipeFormModal from './RecipeFormModal';
import { getRecipeById, getPurveyors, getIngredients, createIngredient, createRecipe, updateRecipe, deleteRecipe } from './api';
import { useNotification } from './NotificationContext';
import { validateRecipe, validateIngredient, validateFileUpload, sanitizeInput } from './utils/validation';

const RecipeForm = ({ refreshRecipes }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { confirm } = useNotification();
  const apiUrl = process.env.REACT_APP_API_URL || 'http://172.30.184.138:8080';
  const [formData, setFormData] = useState({
    name: '',
    ingredients: [],
    steps: '',
    platingGuide: '',
    allergens: [],
    serviceTypes: [],
    image: null,
    active: true,
    removeImage: false
  });
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
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
        img.onload = () => resolve(`http://172.30.184.138:3000${defaultImage}`);
        img.onerror = () => resolve(fallbackImage);
        img.src = `http://172.30.184.138:3000${defaultImage}`;
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
    const { name, value } = e.target;
    const sanitizedValue = sanitizeInput(value);
    
    setFormData({ ...formData, [name]: sanitizedValue });
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
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
      const file = e.target.files[0];
      const fileValidation = validateFileUpload(file);
      
      if (!fileValidation.isValid) {
        setError(fileValidation.errors.join(', '));
        return;
      }
      
      setFormData({ ...formData, image: file, removeImage: false });
      setPreviewImage(URL.createObjectURL(file));
      setError(null);
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
    // Validate ingredient data
    const validation = validateIngredient(newIngredient);
    if (!validation.isValid) {
      throw new Error(Object.values(validation.errors).join(', '));
    }
    
    try {
      const sanitizedIngredient = {
        name: sanitizeInput(newIngredient.name),
        purveyor: newIngredient.purveyor
      };
      
      const createdIngredient = await createIngredient(sanitizedIngredient.name, sanitizedIngredient.purveyor);
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
    setValidationErrors({});
    setLoading(true);

    try {
      // Comprehensive validation
      const validation = validateRecipe(formData);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        setError('Please fix the validation errors below.');
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
      const processedIngredients = formData.ingredients.map(ing => ({
        ingredient: ing.ingredient || null,
        quantity: ing.quantity || '',
        measure: ing.measure || ''
      }));
      
      formDataToSend.append('ingredients', JSON.stringify(processedIngredients));

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
      console.error('Submit error:', err);
      console.error('Error response:', err.response?.data);
      
      // Extract validation errors if available
      if (err.response?.data?.details) {
        setValidationErrors(err.response.data.details);
        setError('Please fix the validation errors below.');
      } else {
        const errorMessage = err.response?.data?.error || err.message;
        setError(`Failed to save recipe: ${errorMessage}`);
      }
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
                validationErrors={validationErrors}
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
              validationErrors={validationErrors}
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