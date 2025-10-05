import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Stage, Layer, Rect, Circle, Line, Text, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import { getRecipeById } from './api';

const InlinePdfPreview = ({ recipeId, show, onHide }) => {
  const stageRef = useRef(null);
  const [recipe, setRecipe] = useState(null);
  const [shapes, setShapes] = useState([]);

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

  // Load recipe data and generate PDF when show becomes true
  useEffect(() => {
    if (show && recipeId) {
      const generatePDF = async () => {
        try {
          // Load recipe
          const recipeData = await getRecipeById(recipeId);
          setRecipe(recipeData);

          // Load saved template and populate with recipe data (images will trigger re-population)
          await populateWithRecipeData(recipeData);

          // Generate PDF after canvas is populated
          setTimeout(() => {
            handleGeneratePDF();
            onHide(); // Close the component
          }, 1000);

        } catch (error) {
          console.error('Failed to generate PDF:', error);
          onHide(); // Close the component even on error
        }
      };

      generatePDF();
    }
  }, [show, recipeId, onHide]);

  // Load saved template and populate with recipe data
  const populateWithRecipeData = useCallback(async (recipeData) => {
    if (!recipeData) return;

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
              shape.text = recipeData.name || 'Recipe Title';
            } else if (field.id === 'ingredients-content') {
              shape.text = recipeData.ingredients && Array.isArray(recipeData.ingredients) 
                ? recipeData.ingredients.map(ing => 
                    `${ing.measure || ''} ${ing.ingredient?.name || ing.ingredient || ''}`
                  ).join('\n')
                : 'No ingredients listed';
            } else if (field.id === 'steps-content') {
              shape.text = recipeData.steps || 'No instructions provided';
            } else if (field.id === 'plating-guide-content') {
              shape.text = recipeData.platingGuide || 'No plating guide provided';
            } else if (field.id === 'allergens-content') {
              shape.text = recipeData.allergens && Array.isArray(recipeData.allergens) 
                ? recipeData.allergens.join(', ')
                : 'None listed';
            } else if (field.id === 'service-types-content') {
              shape.text = recipeData.serviceTypes && Array.isArray(recipeData.serviceTypes) 
                ? recipeData.serviceTypes.join(', ')
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
        text: recipeData.name || 'Recipe Title',
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
        text: recipeData.ingredients && Array.isArray(recipeData.ingredients) 
          ? recipeData.ingredients.map(ing => 
              `${ing.measure || ''} ${ing.ingredient?.name || ing.ingredient || ''}`
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
        text: recipeData.steps || 'No instructions provided',
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
        text: recipeData.platingGuide || 'No plating guide provided',
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
        text: recipeData.allergens && Array.isArray(recipeData.allergens) 
          ? recipeData.allergens.join(', ')
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
        text: recipeData.serviceTypes && Array.isArray(recipeData.serviceTypes) 
          ? recipeData.serviceTypes.join(', ')
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

  // Re-populate when images load (same as CanvasEditor)
  useEffect(() => {
    if (recipe && shapes.length > 0) {
      populateWithRecipeData(recipe);
    }
  }, [image, watermarkImage, populateWithRecipeData]);

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

  // Generate PDF and auto-open in new window
  const handleGeneratePDF = useCallback(async () => {
    if (!stageRef.current) {
      console.error('Stage ref not available');
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
    }
  }, [recipe]);

  // Return hidden canvas for PDF generation
  return (
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
  );
};

export default InlinePdfPreview;