import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button, Row, Col, Alert, Card, Container, Spinner } from 'react-bootstrap';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { getRecipeById, deleteRecipe } from './api';

const RecipeDetail = ({ refreshRecipes }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const pdfContentRef = useRef();
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

  const preloadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = src;
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    });
  };

  const handleGeneratePDF = async () => {
    const element = pdfContentRef.current;
    if (!element) {
      setError('Preview content not found');
      return;
    }

    try {
      const imageSrc = recipe.image?.startsWith('/uploads/') ? `${apiUrl}${recipe.image}` : recipe.image || validDefaultImage;
      await preloadImage(imageSrc);

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        width: 1200,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 12.7;
      const contentWidth = pdfWidth - 2 * margin;
      const contentHeight = (canvas.height * contentWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, contentHeight);

      pdf.setFontSize(8);
      pdf.setTextColor(138, 90, 68);
      pdf.text('Generated for Restaurant Recipe Management', margin, pdfHeight - 5);

      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const previewWindow = window.open(pdfUrl, '_blank', 'width=800,height=600');
      if (!previewWindow) {
        setError('Failed to open preview window');
      } else {
        previewWindow.focus();
      }
      URL.revokeObjectURL(pdfUrl);
    } catch (err) {
      console.error('PDF generation error:', err.message);
      setError(`Failed to generate PDF: ${err.message}`);
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

  const handleImageError = (e) => {
    console.error('Image load failed:', e.target.src);
    e.target.src = validDefaultImage;
  };

  if (loading) return <Container className="py-3"><Spinner animation="border" /></Container>;
  if (error) return (
    <Container className="py-3">
      <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>
    </Container>
  );
  if (!recipe) return null;

  const imageStyle = { width: '300px', height: '200px', objectFit: 'cover' };
  const marginStyle = { margin: '12.7mm' };
  const baseFontSize = '16px';
  const titleFontSize = '40px';
  const headerFontSize = '18px';

  const imageSrc = recipe.image?.startsWith('/uploads/') ? `${apiUrl}${recipe.image}` : recipe.image || validDefaultImage;
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
      <div ref={pdfContentRef} style={{ position: 'absolute', left: '-9999px', fontFamily: 'Helvetica, serif', color: '#8a5a44', maxWidth: '271.6mm', ...marginStyle }}>
        <div role="pdf-content">
          <h1 style={{ fontSize: titleFontSize, textAlign: 'center' }}>{recipe.name}</h1>
          <h2 style={{ fontSize: headerFontSize, marginTop: '20px' }}>Ingredients</h2>
          <ul style={{ fontSize: baseFontSize, marginBottom: '20px' }}>
            {ingredientsList}
          </ul>
          <h2 style={{ fontSize: headerFontSize }}>Preparation Steps</h2>
          <ul style={{ fontSize: baseFontSize, marginBottom: '20px' }}>
            {stepsList}
          </ul>
          <h2 style={{ fontSize: headerFontSize }}>Plating Guide</h2>
          <ul style={{ fontSize: baseFontSize, marginBottom: '20px' }}>
            {platingGuideList}
          </ul>
          <h2 style={{ fontSize: headerFontSize }}>Image</h2>
          {recipe.image ? (
            <img
              src={imageSrc}
              alt={recipe.name}
              style={{ width: '100%', maxWidth: '271.6mm', height: 'auto', marginBottom: '20px' }}
              onError={handleImageError}
            />
          ) : (
            <p style={{ fontSize: baseFontSize }}>No image</p>
          )}
          <div style={{ fontSize: baseFontSize, lineHeight: '1.6', marginTop: '10px', textAlign: 'left' }}>
            <p><strong>Allergens:</strong> {Array.isArray(recipe.allergens) ? recipe.allergens.join(', ') : 'None'}</p>
            <p><strong>Service Types:</strong> {allServiceTypes.join(', ')}</p>
          </div>
        </div>
      </div>

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
              onError={handleImageError}
              style={imageStyle}
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
        <Button variant="primary" size="sm" onClick={handleGeneratePDF} className="me-2">
          Generate PDF
        </Button>
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