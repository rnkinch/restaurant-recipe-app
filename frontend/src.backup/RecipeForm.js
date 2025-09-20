import React, { useState, useEffect, useRef, useReducer } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Form, Button, Row, Col, Alert, Container, Spinner } from 'react-bootstrap';
import RecipeFormFields from './RecipeFormFields';
import RecipeFormIngredients from './RecipeFormIngredients';
import RecipeFormModal from './RecipeFormModal';
import RecipeFormPDF from './RecipeFormPDF';
import { getRecipeById, getPurveyors, getIngredients, createIngredient, createRecipe, updateRecipe, deleteRecipe } from './api';

const RecipeForm = ({ refreshRecipes }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL || 'http://192.168.68.129:5000';
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
  const pdfContentRef = useRef();
  const defaultImage = '/logo.png';
  const fallbackImage = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=='; // 1x1 transparent pixel
  let validDefaultImage = defaultImage;

  const [, forceUpdate] = useReducer(x => x + 1, 0);

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
          const loadedIngredients = Array.isArray(recipeData.ingredients)
            ? recipeData.ingredients.map(ing => ({
                ingredient: (ing.ingredient?.name || ing.ingredient || '').toString(),
                quantity: ing.quantity?.toString() || '',
                measure: ing.measure?.toString() || '',
                purveyor: ing.purveyor ? ing.purveyor._id.toString() : null
              }))
            : [{ ingredient: '', quantity: '', measure: '', purveyor: null }];
          setFormData({
            name: newName,
            ingredients: loadedIngredients,
            steps: typeof recipeData.steps === 'string' ? recipeData.steps : '',
            platingGuide: typeof recipeData.platingGuide === 'string' ? recipeData.platingGuide : '',
            allergens: Array.isArray(recipeData.allergens) ? recipeData.allergens : [],
            serviceTypes: Array.isArray(recipeData.serviceTypes) ? recipeData.serviceTypes : ['brunch', 'bar', 'catering'],
            image: null,
            active: recipeData.active ?? true,
            removeImage: false
          });
          const imgPath = recipeData.image || validDefaultImage;
          const resolvedPath = imgPath.startsWith('/uploads/') ? `${apiUrl}${imgPath}` : imgPath;
          setPreviewImage(resolvedPath);
          setLoading(false);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching data:', err.message);
        setError(`Failed to load data: ${err.message}`);
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckboxChange = (e, field) => {
    const { value, checked } = e.target;
    setFormData(prev => {
      const current = prev[field] || [];
      if (checked) {
        return { ...prev, [field]: [...current, value] };
      } else {
        return { ...prev, [field]: current.filter(item => item !== value) };
      }
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, image: null, removeImage: true });
    setPreviewImage(validDefaultImage);
    console.log('Image removed, formData updated:', formData); // Debug log
  };

  const removeIngredient = (index) => {
    if (formData.ingredients.length > 1) {
      setFormData(prev => {
        const newIngredients = prev.ingredients.filter((_, i) => i !== index);
        return { ...prev, ingredients: newIngredients };
      });
    }
  };

  const handleAddIngredient = (ingredient) => {
    console.log('handleAddIngredient called with:', ingredient);
    setFormData(prev => {
      console.log('Current prev.ingredients:', prev.ingredients);
      if (prev.ingredients.some(ing => ing.ingredient === ingredient.name)) {
        console.log('Ingredient already exists, skipping:', ingredient.name);
        return prev;
      }
      const newIngredients = JSON.parse(JSON.stringify(prev.ingredients));
      newIngredients.push({
        ingredient: ingredient.name,
        quantity: '',
        measure: '',
        purveyor: ingredient.purveyor?._id?.toString() || ingredient.purveyor || null
      });
      console.log('New ingredients after add:', newIngredients);
      const newFormData = { ...prev, ingredients: newIngredients };
      console.log('Updated formData:', newFormData);
      return newFormData;
    });
    setShowAddIngredientModal(false);
    setIngredientSearch('');
    setNewIngredient({ name: '', purveyor: '' });
  };

  const handleNewIngredientSubmit = async (ingredientData) => {
    console.log('handleNewIngredientSubmit called with:', ingredientData);
    try {
      const newIng = await createIngredient(ingredientData.name, ingredientData.purveyor);
      const processedNewIng = {
        ...newIng,
        _id: newIng._id.toString(),
        name: newIng.name,
        purveyor: { _id: newIng.purveyor?._id?.toString() || ingredientData.purveyor }
      };
      console.log('New ingredient created:', processedNewIng);
      setIngredientsList(prev => [...prev, processedNewIng]);
      handleAddIngredient(processedNewIng);
      return processedNewIng;
    } catch (err) {
      console.error('Error creating new ingredient:', err);
      setError(`Failed to add ingredient: ${err.message}`);
      setLoading(false);
      throw err;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      console.log('Submitting form with ingredients:', formData.ingredients);
      if (!formData.name.trim()) {
        setError('Recipe name is required');
        setLoading(false);
        return;
      }
      if (!formData.steps.trim()) {
        setError('Preparation steps are required');
        setLoading(false);
        return;
      }
      if (!formData.platingGuide.trim()) {
        setError('Plating guide is required');
        setLoading(false);
        return;
      }
      if (formData.ingredients.some(ing => !ing.ingredient.trim())) {
        setError('All ingredients must have a valid name');
        setLoading(false);
        return;
      }
      const invalidIngredients = formData.ingredients.filter(ing => {
        const quantityValid = typeof ing.quantity === 'string' && ing.quantity.trim();
        const measureValid = typeof ing.measure === 'string' && ing.measure.trim();
        if (!quantityValid || !measureValid) {
          console.log('Invalid ingredient:', ing);
          return true;
        }
        return false;
      });
      if (invalidIngredients.length > 0) {
        setError('Enter a quantity and measure for all ingredients');
        setLoading(false);
        return;
      }

      // Map ingredient names to IDs
      const mappedIngredients = formData.ingredients.map(ing => {
        const matchingIngredient = ingredientsList.find(i => i.name.toLowerCase() === ing.ingredient.toLowerCase());
        if (!matchingIngredient) {
          throw new Error(`Ingredient "${ing.ingredient}" not found in ingredients list`);
        }
        return {
          ingredient: matchingIngredient._id,
          quantity: ing.quantity,
          measure: ing.measure
        };
      });

      const data = new FormData();
      data.append('name', formData.name);
      data.append('ingredients', JSON.stringify(mappedIngredients));
      data.append('steps', formData.steps);
      data.append('platingGuide', formData.platingGuide);
      data.append('allergens', JSON.stringify(formData.allergens));
      data.append('serviceTypes', JSON.stringify(formData.serviceTypes));
      data.append('active', formData.active);
      if (formData.removeImage) {
        console.log('Removing image, setting removeImage to true'); // Debug log
        data.append('removeImage', 'true');
      }
      if (formData.image) {
        console.log('Uploading new image:', formData.image.name); // Debug log
        data.append('image', formData.image);
      }

      let result;
      if (id) {
        console.log('Updating recipe with ID:', id, 'Data:', Object.fromEntries(data)); // Debug log
        result = await updateRecipe(id, data);
      } else {
        result = await createRecipe(data);
      }
      if (refreshRecipes) refreshRecipes();
      navigate(`/recipe/${result._id}`);
    } catch (err) {
      console.error('Submit error:', err.message);
      setError(`Save failed: ${err.response?.data?.error || err.message}`);
      setLoading(false);
    }
  };

  const handleGeneratePDF = () => {
    const pdfContent = pdfContentRef.current.querySelector('div[role="pdf-content"]');
    if (pdfContent) {
      pdfContent.dispatchEvent(new Event('generatePDF'));
    } else {
      setError('PDF content not found');
    }
  };

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

  const imageStyle = { width: '300px', height: '200px', objectFit: 'cover' };
  const marginStyle = { margin: '12.7mm' };
  const headerStyle = { fontWeight: 'bold', fontSize: '16px' };
  const hrStyle = { borderTop: '2px solid #8a5a44', margin: '10px 0' };

  return (
    <Container className="py-3">
      <div ref={pdfContentRef} style={{ position: 'absolute', left: '-9999px', fontFamily: 'Helvetica, serif', color: '#8a5a44', maxWidth: '271.6mm', ...marginStyle }}>
        <RecipeFormPDF
          formData={formData}
          ingredientsList={ingredientsList}
          defaultImage={defaultImage}
          apiUrl={apiUrl}
          onGeneratePDF={(err) => { if (err) setError(err.message); }}
        />
      </div>
      <h1>{id ? (window.location.pathname.includes('/copy') ? 'Copy Recipe' : 'Edit Recipe') : 'Add Recipe'}</h1>
      <Form onSubmit={handleSubmit}>
        <Row>
          <Col md={9}>
            <hr style={hrStyle} />
            <Form.Group className="mb-3">
              <Form.Label style={headerStyle}>Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="mb-2"
              />
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
            <RecipeFormFields
              formData={formData}
              setFormData={setFormData}
              handleInputChange={handleInputChange}
              handleImageChange={handleImageChange}
              handleRemoveImage={handleRemoveImage}
              previewImage={previewImage}
              imageStyle={imageStyle}
              defaultImage={defaultImage}
              apiUrl={apiUrl}
              excludeName={true}
              headerStyle={headerStyle}
              hrStyle={hrStyle}
            />
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
            <div className="mt-3">
              <Button type="submit" variant="primary" size="sm" className="me-2" disabled={loading}>
                {loading ? <Spinner animation="border" size="sm" /> : 'Save'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="me-2"
                onClick={handleGeneratePDF}
                disabled={!formData.name || loading}
              >
                Generate PDF
              </Button>
              {id && (
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={handleDelete}
                  className="me-2"
                >
                  Delete
                </Button>
              )}
              <Link to="/" className="btn btn-outline-secondary btn-sm">
                Cancel
              </Link>
            </div>
          </Col>
          <Col md={3}>
            <RecipeFormFields
              formData={formData}
              setFormData={setFormData}
              handleCheckboxChange={handleCheckboxChange}
              isRightColumn={true}
              defaultImage={defaultImage}
            />
          </Col>
        </Row>
      </Form>
    </Container>
  );
};

export default RecipeForm;