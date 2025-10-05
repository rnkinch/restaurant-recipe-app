import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Stage, Layer, Rect, Circle, Line, Text, Image as KonvaImage } from 'react-konva';
import { Container, Button, ProgressBar, Alert } from 'react-bootstrap';
import useImage from 'use-image';
import { getRecipes, getConfig } from './api';

const BatchPdfGenerator = () => {
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipes, setSelectedRecipes] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [appName, setAppName] = useState('Recipe_Batch');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  
  // Canvas dimensions (792x612 for landscape PDF)
  const CANVAS_WIDTH = 792;
  const CANVAS_HEIGHT = 612;

  // Load recipes on component mount
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const recipesData = await getRecipes(true);
        setRecipes(recipesData);
        // Auto-select all active recipes by default
        const activeRecipes = recipesData.filter(recipe => recipe.active === true || recipe.active === 'true');
        setSelectedRecipes(activeRecipes);
      } catch (err) {
        setError(`Failed to load recipes: ${err.message}`);
      }
    };

    const fetchConfig = async () => {
      try {
        const configData = await getConfig();
        if (configData && configData.appName) {
          setAppName(configData.appName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, ''));
        }
      } catch (err) {
        console.log('Could not load config, using default name');
      }
    };

    fetchRecipes();
    fetchConfig();
  }, []);

  // Generate date-time stamp
  const getDateTimeStamp = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
  };

  // Generate batch PDF with preview
  const handleGenerateBatchPDF = useCallback(async () => {
    if (selectedRecipes.length === 0) {
      setError('Please select at least one recipe');
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setError(null);
    setSuccess(null);

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://172.30.184.138:8080';
      
      // Get batch PDF data from backend
      const response = await fetch(`${apiUrl}/templates/canvas/batch-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          recipeIds: selectedRecipes.map(recipe => recipe._id) 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      }

      const batchData = await response.json();
      setProgress(25);

      // Create PDF using jsPDF
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ 
        orientation: 'landscape', 
        unit: 'px', 
        format: [CANVAS_WIDTH, CANVAS_HEIGHT] 
      });

      setProgress(50);

      // Process each recipe
      for (let i = 0; i < batchData.recipes.length; i++) {
        const recipeData = batchData.recipes[i];
        
        // Add new page for each recipe (except the first one)
        if (i > 0) {
          pdf.addPage();
        }

        // Create canvas data for this recipe using React Konva
        const canvasData = await generateRecipeCanvas(recipeData, apiUrl);

        // Add to PDF
        pdf.addImage(canvasData.dataURL, 'PNG', 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Update progress
        setProgress(50 + (i + 1) / batchData.recipes.length * 40);
      }

      setProgress(95);

      // Generate PDF and auto-open in new window
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Open PDF in new window/tab for preview
      const previewWindow = window.open(pdfUrl, '_blank');
      if (!previewWindow) {
        // Fallback if popup is blocked - download directly
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `${appName}_Batch_${getDateTimeStamp()}.pdf`;
        link.click();
      }
      
      // Clean up the blob URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 10000);

      setProgress(100);
      setSuccess(`Successfully generated PDF with ${batchData.recipes.length} recipes! PDF opened in new window.`);

    } catch (error) {
      console.error('Batch PDF generation failed:', error);
      setError(`Failed to generate batch PDF: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  }, [selectedRecipes, appName]);

  // Generate canvas for a single recipe
  const generateRecipeCanvas = useCallback(async (recipeData, apiUrl) => {
    return new Promise((resolve) => {
      // Create a temporary div to hold the Konva stage
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      document.body.appendChild(tempDiv);

      // Recipe and watermark image URLs
      const recipeImageUrl = recipeData.recipe.image 
        ? `${apiUrl}/Uploads/${recipeData.recipe.image.split('/').pop()}`
        : `${process.env.REACT_APP_FRONTEND_URL}/default_image.png`;
      const watermarkImageUrl = `${apiUrl}/Uploads/logo.png`;

      // Load images first
      let recipeImage = null;
      let watermarkImage = null;
      let imagesLoaded = 0;

      const onImageLoad = () => {
        imagesLoaded++;
        if (imagesLoaded === 2) {
          // Create Konva stage
          const stage = new window.Konva.Stage({
            container: tempDiv,
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT
          });

          const layer = new window.Konva.Layer();
          stage.add(layer);

          // Render all shapes
          recipeData.shapes.forEach(shape => {
            let konvaShape;
            
            switch (shape.type) {
              case 'rect':
                konvaShape = new window.Konva.Rect({
                  x: shape.x,
                  y: shape.y,
                  width: shape.width,
                  height: shape.height,
                  fill: shape.fill || '#ffffff',
                  stroke: shape.stroke,
                  strokeWidth: shape.strokeWidth || 1,
                  opacity: shape.opacity || 1
                });
                break;
              case 'circle':
                konvaShape = new window.Konva.Circle({
                  x: shape.x,
                  y: shape.y,
                  radius: shape.radius,
                  fill: shape.fill || '#ffffff',
                  stroke: shape.stroke,
                  strokeWidth: shape.strokeWidth || 1,
                  opacity: shape.opacity || 1
                });
                break;
              case 'line':
                konvaShape = new window.Konva.Line({
                  x: shape.x,
                  y: shape.y,
                  points: shape.points,
                  stroke: shape.stroke || '#000000',
                  strokeWidth: shape.strokeWidth || 1,
                  opacity: shape.opacity || 1
                });
                break;
              case 'text':
                konvaShape = new window.Konva.Text({
                  x: shape.x,
                  y: shape.y,
                  text: shape.text || '',
                  fontSize: shape.fontSize || 12,
                  fill: shape.fill || '#000000',
                  fontFamily: shape.fontFamily || 'Arial',
                  fontStyle: shape.isBold ? 'bold' : 'normal',
                  width: shape.width || 300,
                  wrap: 'word'
                });
                break;
              case 'image':
                let imageToUse = null;
                if (shape.id === 'recipe-image') {
                  imageToUse = recipeImage;
                } else if (shape.id === 'watermark') {
                  imageToUse = watermarkImage;
                }
                
                if (imageToUse) {
                  konvaShape = new window.Konva.Image({
                    x: shape.x,
                    y: shape.y,
                    width: shape.width || 150,
                    height: shape.height || 150,
                    image: imageToUse,
                    opacity: shape.opacity || 1
                  });
                }
                break;
              default:
                return;
            }
            
            if (konvaShape) {
              layer.add(konvaShape);
            }
          });
          
          layer.draw();

          // Convert to data URL
          const dataURL = stage.toDataURL({
            mimeType: 'image/png',
            quality: 1,
            pixelRatio: 1
          });

          // Clean up
          stage.destroy();
          document.body.removeChild(tempDiv);

          resolve({
            recipe: recipeData.recipe,
            dataURL: dataURL
          });
        }
      };

      // Load recipe image
      const recipeImg = new Image();
      recipeImg.crossOrigin = 'anonymous';
      recipeImg.onload = () => {
        recipeImage = recipeImg;
        onImageLoad();
      };
      recipeImg.onerror = () => {
        recipeImage = null;
        onImageLoad();
      };
      recipeImg.src = recipeImageUrl;

      // Load watermark image
      const watermarkImg = new Image();
      watermarkImg.crossOrigin = 'anonymous';
      watermarkImg.onload = () => {
        watermarkImage = watermarkImg;
        onImageLoad();
      };
      watermarkImg.onerror = () => {
        watermarkImage = null;
        onImageLoad();
      };
      watermarkImg.src = watermarkImageUrl;
    });
  }, [CANVAS_WIDTH, CANVAS_HEIGHT]);

  const handleRecipeToggle = (recipe) => {
    setSelectedRecipes(prev => {
      const isSelected = prev.some(r => r._id === recipe._id);
      if (isSelected) {
        return prev.filter(r => r._id !== recipe._id);
      } else {
        return [...prev, recipe];
      }
    });
  };

  const handleSelectAll = () => {
    const filteredRecipes = showActiveOnly 
      ? recipes.filter(recipe => recipe.active === true || recipe.active === 'true')
      : recipes;
    setSelectedRecipes(filteredRecipes);
  };

  const handleSelectNone = () => {
    setSelectedRecipes([]);
  };

  // Filter recipes based on active/inactive selection
  const filteredRecipes = showActiveOnly 
    ? recipes.filter(recipe => recipe.active === true || recipe.active === 'true')
    : recipes;


  return (
    <Container className="py-3">
      <h2>Batch PDF Generator</h2>
      
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <div className="mb-3">
        <h5>Select Recipes ({selectedRecipes.length} selected)</h5>
        
        {/* Active/Inactive Filter */}
        <div className="mb-2">
          <div className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="radio"
              name="recipeFilter"
              id="activeOnly"
              checked={showActiveOnly}
              onChange={() => setShowActiveOnly(true)}
            />
            <label className="form-check-label" htmlFor="activeOnly">
              Active Only ({recipes.filter(r => r.active === true || r.active === 'true').length})
            </label>
          </div>
          <div className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="radio"
              name="recipeFilter"
              id="allRecipes"
              checked={!showActiveOnly}
              onChange={() => setShowActiveOnly(false)}
            />
            <label className="form-check-label" htmlFor="allRecipes">
              All Recipes ({recipes.length})
            </label>
          </div>
        </div>
        
        <div className="mb-2">
          <Button 
            variant="outline-primary" 
            size="sm" 
            onClick={handleSelectAll}
            className="me-2"
          >
            Select All {showActiveOnly ? '(Active)' : '(All)'}
          </Button>
          <Button 
            variant="outline-secondary" 
            size="sm" 
            onClick={handleSelectNone}
          >
            Select None
          </Button>
        </div>
        
        <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #dee2e6', padding: '1rem' }}>
          {filteredRecipes.map(recipe => (
            <div key={recipe._id} className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id={`recipe-${recipe._id}`}
                checked={selectedRecipes.some(r => r._id === recipe._id)}
                onChange={() => handleRecipeToggle(recipe)}
              />
              <label className="form-check-label" htmlFor={`recipe-${recipe._id}`}>
                {recipe.name}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <Button
          variant="primary"
          onClick={handleGenerateBatchPDF}
          disabled={isGenerating || selectedRecipes.length === 0}
        >
          {isGenerating ? 'Generating PDF...' : `Generate Batch PDF (${selectedRecipes.length} recipes)`}
        </Button>
      </div>

      {isGenerating && (
        <div className="mb-3">
          <ProgressBar
            now={progress}
            label={`${Math.round(progress)}%`}
            variant="info"
          />
          <small className="text-muted">Generating PDF with {selectedRecipes.length} recipes...</small>
        </div>
      )}

    </Container>
  );
};

export default BatchPdfGenerator;
