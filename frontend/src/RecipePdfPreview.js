import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Stage, Layer, Rect, Circle, Line, Text, Image as KonvaImage } from 'react-konva';
import { Container, Alert } from 'react-bootstrap';
import useImage from 'use-image';
import { getRecipeById } from './api';
import { useNotification } from './NotificationContext';

const RecipePdfPreview = () => {
  const { id } = useParams();
  const stageRef = useRef(null);
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shapes, setShapes] = useState([]);
  const [error, setError] = useState(null);
  const { showError } = useNotification();

  // Canvas dimensions (792x612 for landscape PDF)
  const CANVAS_WIDTH = 792;
  const CANVAS_HEIGHT = 612;

  // Load recipe image with crossOrigin to avoid tainted canvas (same as CanvasEditor)
  const [image] = useImage(
    recipe?.image 
      ? `${process.env.REACT_APP_API_URL}/Uploads/${recipe.image.split('/').pop()}`
      : `${process.env.REACT_APP_FRONTEND_URL}/default_image.png`,
    'anonymous'
  );

  // Load watermark image with crossOrigin to avoid tainted canvas
  const [watermarkImage] = useImage(
    `${process.env.REACT_APP_API_URL}/Uploads/logo.png`,
    'anonymous'
  );

  // Debug logging for image loading
  useEffect(() => {
    console.log('RecipePdfPreview - Image states:', {
      recipe: recipe?.name,
      recipeImage: recipe?.image,
      imageLoaded: image !== null,
      watermarkLoaded: watermarkImage !== null
    });
  }, [recipe, image, watermarkImage]);

  // Load recipe data
  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const recipeData = await getRecipeById(id);
        setRecipe(recipeData);
      } catch (error) {
        console.error('Failed to load recipe:', error);
        showError(`Failed to load recipe: ${error.message}`);
      }
    };

    if (id) {
      fetchRecipe();
    }
  }, [id, showError]);

  // Load saved template and populate with recipe data
  const populateWithRecipeData = useCallback(async () => {
    if (!recipe) return;

    try {
      // Try to load saved template first
      const apiUrl = process.env.REACT_APP_API_URL || 'http://172.30.184.138:8080';
      const response = await fetch(`${apiUrl}/templates/canvas/default`);
      
      if (response.ok) {
        const templateData = await response.json();
        if (templateData?.template?.fields && templateData.template.fields.length > 0) {
          // Use saved template layout
          const savedShapes = templateData.template.fields.map(field => {
            const shape = {
              id: field.id,
              type: field.type,
              x: field.x,
              y: field.y,
              ...field
            };
            
            // Update recipe-specific content
            if (field.id === 'recipe-title') {
              shape.text = recipe.name || 'Recipe Title';
            } else if (field.id === 'ingredients-content') {
              shape.text = recipe.ingredients && Array.isArray(recipe.ingredients) 
                ? recipe.ingredients.map(ing => 
                    `${ing.quantity || ''} ${ing.measure || ''} ${ing.ingredient?.name || ing.ingredient || ''}`
                  ).join('\n')
                : 'No ingredients listed';
            } else if (field.id === 'steps-content') {
              shape.text = recipe.steps || 'No instructions provided';
            } else if (field.id === 'plating-guide-content') {
              shape.text = recipe.platingGuide || 'No plating guide provided';
            } else if (field.id === 'allergens-content') {
              shape.text = recipe.allergens && Array.isArray(recipe.allergens) 
                ? recipe.allergens.join(', ')
                : 'None listed';
            } else if (field.id === 'service-types-content') {
              shape.text = recipe.serviceTypes && Array.isArray(recipe.serviceTypes) 
                ? recipe.serviceTypes.join(', ')
                : 'Not specified';
            } else if (field.id === 'recipe-image') {
              shape.image = image;
            } else if (field.id === 'watermark') {
              shape.image = watermarkImage;
            }
            
            return shape;
          });
          
          setShapes(savedShapes);
          return;
        }
      }
    } catch (error) {
      console.log('Could not load saved template, using default layout:', error);
    }

    // Fallback to default layout if no saved template
    const recipeShapes = [
      // Recipe Title
      {
        id: 'recipe-title',
        type: 'text',
        x: 50,
        y: 30,
        text: recipe.name || 'Recipe Title',
        fontSize: 24,
        fill: '#000000',
        fontFamily: 'Arial',
        isBold: true
      },
      // Title line
      {
        id: 'title-line',
        type: 'line',
        points: [50, 60, 400, 60],
        stroke: '#8B1538',
        strokeWidth: 2
      },
      // Ingredients Label
      {
        id: 'ingredients-label',
        type: 'text',
        x: 50,
        y: 80,
        text: 'INGREDIENTS:',
        fontSize: 14,
        fill: '#000000',
        fontFamily: 'Arial',
        isBold: true
      },
      // Ingredients Content
      {
        id: 'ingredients-content',
        type: 'text',
        x: 50,
        y: 100,
        text: recipe.ingredients && Array.isArray(recipe.ingredients) 
          ? recipe.ingredients.map(ing => 
              `${ing.quantity || ''} ${ing.measure || ''} ${ing.ingredient?.name || ing.ingredient || ''}`
            ).join('\n')
          : 'No ingredients listed',
        fontSize: 12,
        fill: '#000000',
        fontFamily: 'Arial',
        width: 300
      },
      // Steps Label
      {
        id: 'steps-label',
        type: 'text',
        x: 50,
        y: 200,
        text: 'INSTRUCTIONS:',
        fontSize: 14,
        fill: '#000000',
        fontFamily: 'Arial',
        isBold: true
      },
      // Steps Content
      {
        id: 'steps-content',
        type: 'text',
        x: 50,
        y: 220,
        text: recipe.steps || 'No instructions provided',
        fontSize: 12,
        fill: '#000000',
        fontFamily: 'Arial',
        width: 300
      },
      // Plating Guide Label
      {
        id: 'plating-guide-label',
        type: 'text',
        x: 50,
        y: 320,
        text: 'PLATING GUIDE:',
        fontSize: 14,
        fill: '#000000',
        fontFamily: 'Arial',
        isBold: true
      },
      // Plating Guide Content
      {
        id: 'plating-guide-content',
        type: 'text',
        x: 50,
        y: 340,
        text: recipe.platingGuide || 'No plating guide provided',
        fontSize: 12,
        fill: '#000000',
        fontFamily: 'Arial',
        width: 300
      },
      // Allergens Label
      {
        id: 'allergens-label',
        type: 'text',
        x: 50,
        y: 440,
        text: 'ALLERGENS:',
        fontSize: 14,
        fill: '#000000',
        fontFamily: 'Arial',
        isBold: true
      },
      // Allergens Content
      {
        id: 'allergens-content',
        type: 'text',
        x: 50,
        y: 460,
        text: recipe.allergens && Array.isArray(recipe.allergens) 
          ? recipe.allergens.join(', ')
          : 'None listed',
        fontSize: 12,
        fill: '#000000',
        fontFamily: 'Arial'
      },
      // Service Types Label
      {
        id: 'service-types-label',
        type: 'text',
        x: 50,
        y: 480,
        text: 'SERVICE TYPES:',
        fontSize: 14,
        fill: '#000000',
        fontFamily: 'Arial',
        isBold: true
      },
      // Service Types Content
      {
        id: 'service-types-content',
        type: 'text',
        x: 50,
        y: 500,
        text: recipe.serviceTypes && Array.isArray(recipe.serviceTypes) 
          ? recipe.serviceTypes.join(', ')
          : 'Not specified',
        fontSize: 12,
        fill: '#000000',
        fontFamily: 'Arial'
      },
      // Recipe Image (only if image exists)
      ...(image ? [{
        id: 'recipe-image',
        type: 'image',
        x: 450,
        y: 200,
        width: 150,
        height: 150,
        image: image
      }] : []),
      // Watermark
      {
        id: 'watermark',
        type: 'image',
        x: 50,
        y: 400,
        width: 100,
        height: 100,
        image: watermarkImage,
        opacity: 0.3
      }
    ];

    setShapes(recipeShapes);
  }, [recipe, image, watermarkImage]);

  // Populate canvas when recipe and images are loaded (same as CanvasEditor)
  useEffect(() => {
    if (!recipe) return;
    
    populateWithRecipeData().then(() => {
      setLoading(false);
    });
  }, [recipe, image, watermarkImage, populateWithRecipeData]);

  // Render shape
  const renderShape = (shape) => {
    const commonProps = {
      key: shape.id,
      id: shape.id,
      x: shape.x,
      y: shape.y,
      listening: false
    };

    switch (shape.type) {
      case 'rect':
        return (
          <Rect
            {...commonProps}
            width={shape.width}
            height={shape.height}
            fill={shape.fill}
            stroke={shape.stroke}
            strokeWidth={shape.strokeWidth}
            opacity={shape.opacity}
          />
        );
      case 'circle':
        return (
          <Circle
            {...commonProps}
            radius={shape.radius}
            fill={shape.fill}
            stroke={shape.stroke}
            strokeWidth={shape.strokeWidth}
            opacity={shape.opacity}
          />
        );
      case 'line':
        return (
          <Line
            {...commonProps}
            points={shape.points}
            stroke={shape.stroke}
            strokeWidth={shape.strokeWidth}
            opacity={shape.opacity}
          />
        );
      case 'text':
        return (
          <Text
            {...commonProps}
            text={shape.text}
            fontSize={shape.fontSize}
            fill={shape.fill}
            fontFamily={shape.fontFamily}
            fontStyle={shape.isBold ? 'bold' : 'normal'}
            width={shape.width || 300}
            wrap="word"
          />
        );
      case 'image':
        return (
          <KonvaImage
            {...commonProps}
            width={shape.width || 150}
            height={shape.height || 150}
            image={shape.image}
            opacity={shape.opacity || 1}
          />
        );
      default:
        return null;
    }
  };

  // Export to PDF
  const handleExportToPDF = useCallback(async () => {
    if (!stageRef.current) {
      console.error('Stage ref not available');
      return;
    }

    try {
      console.log('Starting PDF export...');
      
      // Wait a moment to ensure canvas is fully rendered
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Get canvas data URL
      const dataURL = stageRef.current.toDataURL({
        mimeType: 'image/png',
        quality: 1,
        pixelRatio: 1
      });

      if (!dataURL.startsWith('data:image/png;base64,')) {
        throw new Error('Invalid PNG data generated');
      }

      // Create PDF
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ 
        orientation: 'landscape', 
        unit: 'px', 
        format: [CANVAS_WIDTH, CANVAS_HEIGHT] 
      });

      pdf.addImage(dataURL, 'PNG', 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // Create PDF preview
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Open PDF in new window/tab for preview
      const previewWindow = window.open(pdfUrl, '_blank');
      if (!previewWindow) {
        // Fallback if popup is blocked
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `recipe-${recipe?._id || 'preview'}.pdf`;
        link.click();
      }
      
      // Clean up the blob URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 10000);

      console.log('PDF preview opened successfully');
    } catch (error) {
      console.error('Export failed:', error);
      showError(`PDF export failed: ${error.message}`);
    }
  }, [recipe, showError]);

  // Generate PDF and auto-open in new window (original working approach)
  const handleGeneratePDFForPreview = useCallback(async () => {
    if (!stageRef.current) {
      console.error('Stage ref not available');
      setError('Canvas not ready');
      return;
    }

    try {
      console.log('Starting PDF generation...');
      
      // Wait a moment to ensure canvas is fully rendered
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Get canvas data URL
      const dataURL = stageRef.current.toDataURL({
        mimeType: 'image/png',
        quality: 1,
        pixelRatio: 1
      });

      if (!dataURL.startsWith('data:image/png;base64,')) {
        throw new Error('Invalid PNG data generated');
      }

      // Create PDF
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ 
        orientation: 'landscape', 
        unit: 'px', 
        format: [CANVAS_WIDTH, CANVAS_HEIGHT] 
      });

      pdf.addImage(dataURL, 'PNG', 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // Create PDF preview (auto-open in new window)
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Open PDF in new window/tab for preview
      const previewWindow = window.open(pdfUrl, '_blank');
      if (!previewWindow) {
        // Fallback if popup is blocked
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `recipe-${recipe?._id || 'preview'}.pdf`;
        link.click();
      }
      
      // Clean up the blob URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 10000);

      console.log('PDF preview opened successfully');
    } catch (error) {
      console.error('PDF generation failed:', error);
      setError(`PDF generation failed: ${error.message}`);
    }
  }, [recipe]);

  // Generate PDF when component loads
  useEffect(() => {
    if (!loading && shapes.length > 0) {
      // Wait a bit for everything to render, then generate PDF for preview
      const timer = setTimeout(() => {
        handleGeneratePDFForPreview();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [loading, shapes.length]);

  if (loading) {
    return (
      <Container className="py-3">
        <div className="text-center">
          <h4>Loading recipe and generating PDF preview...</h4>
        </div>
      </Container>
    );
  }

  if (!recipe) {
    return (
      <Container className="py-3">
        <Alert variant="danger">
          Recipe not found
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-3">
      <h4>PDF Preview: {recipe.name}</h4>
      
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <div className="text-center mb-3">
        <p>PDF will open automatically in a new window...</p>
      </div>
      
      {/* Hidden canvas for PDF generation */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <Stage
          ref={stageRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          style={{ backgroundColor: '#fefefe' }}
        >
          <Layer>
            {shapes.map(renderShape)}
          </Layer>
        </Stage>
      </div>
    </Container>
  );
};

export default RecipePdfPreview;
