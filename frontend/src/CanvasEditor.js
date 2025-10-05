import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Stage, Layer, Rect, Circle, Line, Text, Image as KonvaImage } from 'react-konva';
import { Button, Row, Col, Form } from 'react-bootstrap';
import useImage from 'use-image';
import ToolPanel from './components/ToolPanel';
import PropertiesPanel from './components/PropertiesPanel';

const CanvasEditor = ({ recipe, onSave, onExport }) => {
  const stageRef = useRef(null);
  const [selectedIds, setSelectedIds] = useState([]); // Changed to array for multi-select
  const [shapes, setShapes] = useState([]);
  const [currentTool, setCurrentTool] = useState('select');
  const [selectionBox, setSelectionBox] = useState(null); // For drag selection
  const [showGrid, setShowGrid] = useState(true); // Grid visibility
  const [gridSize, setGridSize] = useState(20); // Grid size in pixels
  const [snapToGrid, setSnapToGrid] = useState(true); // Snap to grid enabled
  const [isDrawing, setIsDrawing] = useState(false);
  const [newShape, setNewShape] = useState(null);
  const [recipeImage, setRecipeImage] = useState(null);

  // Canvas dimensions (792x612 for landscape PDF)
  const CANVAS_WIDTH = 792;
  const CANVAS_HEIGHT = 612;

  // Load recipe image with crossOrigin to avoid tainted canvas (same as watermark)
  const [image] = useImage(
    recipe?.image 
      ? `${process.env.REACT_APP_API_URL}/Uploads/${recipe.image.split('/').pop()}`
      : `${process.env.REACT_APP_FRONTEND_URL}/default_image.png`,
    'anonymous' // Enable crossOrigin to avoid tainted canvas
  );

  // Load watermark image with crossOrigin to avoid tainted canvas
  const [watermarkImage] = useImage(
    `${process.env.REACT_APP_API_URL}/Uploads/logo.png`,
    'anonymous' // Enable crossOrigin to avoid tainted canvas
  );

  // Tool types
  const TOOLS = {
    SELECT: 'select',
    RECTANGLE: 'rectangle',
    CIRCLE: 'circle',
    LINE: 'line',
    TEXT: 'text'
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedIds([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load saved canvas template
  const loadSavedTemplate = useCallback(async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://172.30.184.138:8080';
      const response = await fetch(`${apiUrl}/templates/canvas/default`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });

      if (response.ok) {
        const templateData = await response.json();
        console.log('Template data received:', templateData);
        if (templateData?.template?.fields && templateData.template.fields.length > 0) {
          // Convert saved template fields to shapes
          const savedShapes = templateData.template.fields.map(field => {
            const shape = {
              id: field.id,
              type: field.type,
              x: field.x || 0,
              y: field.y || 0,
              ...field
            };
            
            // For image shapes, we need to restore the image object
            if (field.type === 'image') {
              if (field.id === 'recipe-image' && image) {
                shape.image = image;
              } else if (field.id === 'watermark' && watermarkImage) {
                shape.image = watermarkImage;
              }
            }
            
            return shape;
          });
          
          setShapes(savedShapes);
          console.log('Loaded saved template with', savedShapes.length, 'shapes');
          return true; // Indicate we loaded a saved template
        }
      }
    } catch (error) {
      console.error('Failed to load saved template:', error);
    }
    return false; // No saved template found
  }, [image, watermarkImage]);

  // Populate canvas with recipe data or saved template
  useEffect(() => {
    if (!recipe) return;

    // Try to load saved template first
    loadSavedTemplate().then(savedTemplateExists => {
      if (!savedTemplateExists) {
        // If no saved template, populate with recipe data
        populateWithRecipeData();
      }
    });
  }, [recipe, image, watermarkImage, loadSavedTemplate]);

  const populateWithRecipeData = useCallback(() => {
    const recipeShapes = [
      // Recipe Title
      {
        id: 'recipe-title',
        type: 'text',
        x: 50,
        y: 30,
        text: recipe.name || 'Recipe Title',
        fontSize: 24,
        fill: '#8B1538',
        fontFamily: 'Arial',
        isBold: true
      },
      
      // Ingredients Section
      {
        id: 'ingredients-label',
        type: 'text',
        x: 50,
        y: 80,
        text: 'Ingredients:',
        fontSize: 16,
        fill: '#000000',
        fontFamily: 'Arial',
        isBold: true
      },
      {
        id: 'ingredients-content',
        type: 'text',
        x: 50,
        y: 100,
        text: Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0
          ? recipe.ingredients.map((i) => `${i.quantity || ''} ${i.measure || ''} ${i.ingredient?.name || ''}`).join('\n')
          : 'No ingredients listed',
          fontSize: 12,
          fill: '#333333',
          fontFamily: 'Arial',
          width: 350
      },
      
      // Steps Section
      {
        id: 'steps-label',
        type: 'text',
        x: 50,
        y: 200,
        text: 'Steps:',
        fontSize: 16,
        fill: '#000000',
        fontFamily: 'Arial',
        isBold: true
      },
      {
        id: 'steps-content',
        type: 'text',
        x: 50,
        y: 220,
        text: recipe.steps || 'No steps provided',
          fontSize: 12,
          fill: '#333333',
          fontFamily: 'Arial',
          width: 350
      },
      
      // Allergens Section
      {
        id: 'allergens-label',
        type: 'text',
        x: 450,
        y: 80,
        text: 'Allergens:',
        fontSize: 14,
        fill: '#8B1538',
        fontFamily: 'Arial',
        isBold: true
      },
      {
        id: 'allergens-content',
        type: 'text',
        x: 450,
        y: 100,
        text: Array.isArray(recipe.allergens) && recipe.allergens.length > 0 
          ? recipe.allergens.join(', ') 
          : 'No allergens listed',
          fontSize: 12,
          fill: '#333333',
          fontFamily: 'Arial',
          width: 350
      },
      
      // Service Types Section
      {
        id: 'service-types-label',
        type: 'text',
        x: 450,
        y: 140,
        text: 'Service Types:',
        fontSize: 14,
        fill: '#8B1538',
        fontFamily: 'Arial',
        isBold: true
      },
      {
        id: 'service-types-content',
        type: 'text',
        x: 450,
        y: 160,
        text: Array.isArray(recipe.serviceTypes) && recipe.serviceTypes.length > 0 
          ? recipe.serviceTypes.join(', ') 
          : 'No service types listed',
          fontSize: 12,
          fill: '#333333',
          fontFamily: 'Arial',
          width: 350,
        width: 300
      },
      
      // Plating Guide Section
      {
        id: 'plating-guide-label',
        type: 'text',
        x: 50,
        y: 320,
        text: 'Plating Guide:',
        fontSize: 16,
        fill: '#000000',
        fontFamily: 'Arial',
        isBold: true
      },
      {
        id: 'plating-guide-content',
        type: 'text',
        x: 50,
        y: 340,
        text: recipe.platingGuide || 'No plating guide provided',
          fontSize: 12,
          fill: '#333333',
          fontFamily: 'Arial',
          width: 350,
        width: 350
      }
    ];

    // Add recipe image if available
    if (image) {
      recipeShapes.push({
        id: 'recipe-image',
        type: 'image',
        x: 450,
        y: 200,
        width: 150,
        height: 150,
        image: image
      });
    }

    // Add decorative elements
    recipeShapes.push(
      // Decorative line under title
      {
        id: 'title-line',
        type: 'line',
        points: [50, 60, 350, 60],
        stroke: '#8B1538',
        strokeWidth: 2
      }
    );

    // Add watermark if available
    if (watermarkImage) {
      recipeShapes.push({
        id: 'watermark',
        type: 'image',
        x: 50,
        y: 400,
        width: 100,
        height: 100,
        image: watermarkImage,
        opacity: 0.3
      });
    }

    setShapes(recipeShapes);
  }, [recipe, image, watermarkImage]);

  // Handle stage click for creating new shapes
  const handleStageClick = useCallback((e) => {
    console.log('Stage click - target:', e.target.name(), 'stage:', e.target.getStage());
    
    // If clicking on empty stage area, deselect all
    if (e.target === e.target.getStage()) {
      console.log('Clicking on empty stage - deselecting all');
      setSelectedIds([]);
      if (currentTool === TOOLS.SELECT) return;
    }

    if (currentTool === TOOLS.SELECT) return;

    const pos = snapToGridPosition(e.target.getStage().getPointerPosition());
    
    if (currentTool === TOOLS.RECTANGLE) {
      const newRect = {
        id: `rect-${Date.now()}`,
        type: 'rectangle',
        x: pos.x,
        y: pos.y,
        width: 100,
        height: 50,
        fill: '#8B1538',
        stroke: '#000',
        strokeWidth: 1
      };
      setShapes(prev => [...prev, newRect]);
    } else if (currentTool === TOOLS.CIRCLE) {
      const newCircle = {
        id: `circle-${Date.now()}`,
        type: 'circle',
        x: pos.x,
        y: pos.y,
        radius: 30,
        fill: '#8B1538',
        stroke: '#000',
        strokeWidth: 1
      };
      setShapes(prev => [...prev, newCircle]);
    } else if (currentTool === TOOLS.LINE) {
      const newLine = {
        id: `line-${Date.now()}`,
        type: 'line',
        points: [pos.x, pos.y, pos.x + 100, pos.y],
        stroke: '#000',
        strokeWidth: 2
      };
      setShapes(prev => [...prev, newLine]);
    } else if (currentTool === TOOLS.TEXT) {
      const newText = {
        id: `text-${Date.now()}`,
        type: 'text',
        x: pos.x,
        y: pos.y,
        text: 'New Text',
        fontSize: 16,
        fill: '#000'
      };
      setShapes(prev => [...prev, newText]);
    }
  }, [currentTool]);

  // Snap position to grid
  const snapToGridPosition = useCallback((pos) => {
    if (!snapToGrid) return pos;
    
    return {
      x: Math.round(pos.x / gridSize) * gridSize,
      y: Math.round(pos.y / gridSize) * gridSize
    };
  }, [snapToGrid, gridSize]);

  // Handle shape selection
  // Handle shape click for multi-select
  const handleShapeClick = useCallback((e) => {
    e.cancelBubble = true;
    const shapeId = e.target.id();
    
    console.log('Shape clicked:', shapeId, 'Ctrl/Cmd:', e.evt.ctrlKey || e.evt.metaKey);
    
    if (e.evt.ctrlKey || e.evt.metaKey) {
      // Multi-select with Ctrl/Cmd key
      setSelectedIds(prev => {
        if (prev.includes(shapeId)) {
          return prev.filter(id => id !== shapeId);
        } else {
          return [...prev, shapeId];
        }
      });
    } else {
      // Single select
      setSelectedIds([shapeId]);
    }
  }, []);

  // Handle shape drag start
  const handleShapeDragStart = useCallback((e) => {
    const id = e.target.id();
    // Initialize position tracking for group dragging
    e.target.attrs.lastX = e.target.x();
    e.target.attrs.lastY = e.target.y();
  }, []);

  // Handle shape drag
  const handleShapeDrag = useCallback((e) => {
    const id = e.target.id();
    const newAttrs = { ...e.target.attrs };
    
    // Don't snap during drag - keep it smooth
    const dx = newAttrs.x - (e.target.attrs.lastX || 0);
    const dy = newAttrs.y - (e.target.attrs.lastY || 0);

    setShapes(prev => prev.map(shape => {
      if (shape.id === id) {
        // Update the dragged shape
        return { ...shape, ...newAttrs };
      } else if (selectedIds.includes(shape.id)) {
        // Move all other selected shapes by the same amount
        return {
          ...shape,
          x: (shape.x || 0) + dx,
          y: (shape.y || 0) + dy
        };
      }
      return shape;
    }));

    // Store current position for next drag calculation
    e.target.attrs.lastX = newAttrs.x;
    e.target.attrs.lastY = newAttrs.y;
  }, [selectedIds]);

  // Handle shape drag end
  const handleShapeDragEnd = useCallback((e) => {
    const id = e.target.id();
    
    // Apply snapping when drag ends
    if (snapToGrid) {
      const snappedPos = snapToGridPosition({ x: e.target.x(), y: e.target.y() });
      const dx = snappedPos.x - (e.target.attrs.lastX || 0);
      const dy = snappedPos.y - (e.target.attrs.lastY || 0);

      setShapes(prev => prev.map(shape => {
        if (shape.id === id) {
          // Snap the dragged shape
          return { ...shape, x: snappedPos.x, y: snappedPos.y };
        } else if (selectedIds.includes(shape.id)) {
          // Snap all other selected shapes by the same amount
          return {
            ...shape,
            x: (shape.x || 0) + dx,
            y: (shape.y || 0) + dy
          };
        }
        return shape;
      }));
    }

    // Clean up position tracking
    delete e.target.attrs.lastX;
    delete e.target.attrs.lastY;
  }, [selectedIds, snapToGrid, snapToGridPosition]);

  // Delete selected shapes
  const handleDelete = useCallback(() => {
    if (selectedIds.length > 0) {
      setShapes(prev => prev.filter(shape => !selectedIds.includes(shape.id)));
      setSelectedIds([]);
    }
  }, [selectedIds]);

  // Clear all shapes
  const handleClear = useCallback(() => {
    setShapes([]);
    setSelectedIds([]);
  }, []);

  // Deselect all shapes
  const handleDeselect = useCallback(() => {
    setSelectedIds([]);
  }, []);

  // Handle property changes
  const handlePropertyChange = useCallback((shapeId, property, value) => {
    setShapes(prev => prev.map(shape => {
      if (shape.id === shapeId) {
        const updatedShape = { ...shape, [property]: value };
        return updatedShape;
      }
      return shape;
    }));
  }, []);

  // Get selected shapes for properties panel
  const selectedShapes = shapes.filter(shape => selectedIds.includes(shape.id));
  const selectedShape = selectedShapes.length === 1 ? selectedShapes[0] : null;

  // Reset to original recipe layout
  const handleReset = useCallback(() => {
    if (!recipe) return;
    
    // Clear current shapes and repopulate with recipe data
    setShapes([]);
    setSelectedIds([]);
    populateWithRecipeData();
  }, [recipe, populateWithRecipeData]);

  // Old reset logic - keeping for reference but not used
  const oldHandleReset = useCallback(() => {
    if (!recipe) return;
    
    // Clear current shapes and repopulate with recipe data
    setShapes([]);
    setSelectedIds([]);
    
    // Repopulate with recipe data (same logic as useEffect)
    const recipeShapes = [
      // Recipe Title
      {
        id: 'recipe-title',
        type: 'text',
        x: 50,
        y: 30,
        text: recipe.name || 'Recipe Title',
        fontSize: 24,
        fill: '#8B1538',
        fontFamily: 'Arial',
        isBold: true
      },
      
      // Ingredients Section
      {
        id: 'ingredients-label',
        type: 'text',
        x: 50,
        y: 80,
        text: 'Ingredients:',
        fontSize: 16,
        fill: '#000000',
        fontFamily: 'Arial',
        isBold: true
      },
      {
        id: 'ingredients-content',
        type: 'text',
        x: 50,
        y: 100,
        text: Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0
          ? recipe.ingredients.map((i) => `${i.quantity || ''} ${i.measure || ''} ${i.ingredient?.name || ''}`).join('\n')
          : 'No ingredients listed',
          fontSize: 12,
          fill: '#333333',
          fontFamily: 'Arial',
          width: 350
      },
      
      // Steps Section
      {
        id: 'steps-label',
        type: 'text',
        x: 50,
        y: 200,
        text: 'Steps:',
        fontSize: 16,
        fill: '#000000',
        fontFamily: 'Arial',
        isBold: true
      },
      {
        id: 'steps-content',
        type: 'text',
        x: 50,
        y: 220,
        text: recipe.steps || 'No steps provided',
          fontSize: 12,
          fill: '#333333',
          fontFamily: 'Arial',
          width: 350
      },
      
      // Allergens Section
      {
        id: 'allergens-label',
        type: 'text',
        x: 450,
        y: 80,
        text: 'Allergens:',
        fontSize: 14,
        fill: '#8B1538',
        fontFamily: 'Arial',
        isBold: true
      },
      {
        id: 'allergens-content',
        type: 'text',
        x: 450,
        y: 100,
        text: Array.isArray(recipe.allergens) && recipe.allergens.length > 0 
          ? recipe.allergens.join(', ') 
          : 'No allergens listed',
          fontSize: 12,
          fill: '#333333',
          fontFamily: 'Arial',
          width: 350
      },
      
      // Service Types Section
      {
        id: 'service-types-label',
        type: 'text',
        x: 450,
        y: 140,
        text: 'Service Types:',
        fontSize: 14,
        fill: '#8B1538',
        fontFamily: 'Arial',
        isBold: true
      },
      {
        id: 'service-types-content',
        type: 'text',
        x: 450,
        y: 160,
        text: Array.isArray(recipe.serviceTypes) && recipe.serviceTypes.length > 0 
          ? recipe.serviceTypes.join(', ') 
          : 'No service types listed',
          fontSize: 12,
          fill: '#333333',
          fontFamily: 'Arial',
          width: 350,
        width: 300
      },
      
      // Plating Guide Section
      {
        id: 'plating-guide-label',
        type: 'text',
        x: 50,
        y: 320,
        text: 'Plating Guide:',
        fontSize: 16,
        fill: '#000000',
        fontFamily: 'Arial',
        isBold: true
      },
      {
        id: 'plating-guide-content',
        type: 'text',
        x: 50,
        y: 340,
        text: recipe.platingGuide || 'No plating guide provided',
          fontSize: 12,
          fill: '#333333',
          fontFamily: 'Arial',
          width: 350,
        width: 350
      }
    ];

    // Add recipe image if available
    if (image) {
      recipeShapes.push({
        id: 'recipe-image',
        type: 'image',
        x: 450,
        y: 200,
        width: 150,
        height: 150,
        image: image
      });
    }

    // Add decorative elements
    recipeShapes.push(
      // Decorative line under title
      {
        id: 'title-line',
        type: 'line',
        points: [50, 60, 350, 60],
        stroke: '#8B1538',
        strokeWidth: 2
      }
    );

    // Add watermark if available
    if (watermarkImage) {
      recipeShapes.push({
        id: 'watermark',
        type: 'image',
        x: 50,
        y: 400,
        width: 100,
        height: 100,
        image: watermarkImage,
        opacity: 0.3
      });
    }

    setShapes(recipeShapes);
  }, [recipe, image, watermarkImage]);


  // Save template
  const handleSave = useCallback(async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://172.30.184.138:8080';
      
      
      // Create a completely isolated, serializable copy of shapes
      const createSerializableShapes = (shapesArray) => {
        const serializableShapes = [];
        
        for (let i = 0; i < shapesArray.length; i++) {
          const shape = shapesArray[i];
          
          try {
            // Create a completely new object with only primitive values
            const cleanShape = {};
            
            // Required properties
            cleanShape.id = String(shape.id || `shape-${i}`);
            cleanShape.type = String(shape.type || 'unknown');
            cleanShape.x = Number(shape.x) || 0;
            cleanShape.y = Number(shape.y) || 0;
            
            // Optional properties - only add if they exist and are primitive
            if (shape.width !== undefined && shape.width !== null && !isNaN(Number(shape.width))) {
              cleanShape.width = Number(shape.width);
            }
            if (shape.height !== undefined && shape.height !== null && !isNaN(Number(shape.height))) {
              cleanShape.height = Number(shape.height);
            }
            if (shape.radius !== undefined && shape.radius !== null && !isNaN(Number(shape.radius))) {
              cleanShape.radius = Number(shape.radius);
            }
            if (shape.fontSize !== undefined && shape.fontSize !== null && !isNaN(Number(shape.fontSize))) {
              cleanShape.fontSize = Number(shape.fontSize);
            }
            if (shape.strokeWidth !== undefined && shape.strokeWidth !== null && !isNaN(Number(shape.strokeWidth))) {
              cleanShape.strokeWidth = Number(shape.strokeWidth);
            }
            if (shape.opacity !== undefined && shape.opacity !== null && !isNaN(Number(shape.opacity))) {
              cleanShape.opacity = Number(shape.opacity);
            }
            
            // String properties
            if (typeof shape.text === 'string' && shape.text.length > 0) {
              cleanShape.text = shape.text;
            }
            if (typeof shape.content === 'string' && shape.content.length > 0) {
              cleanShape.content = shape.content;
            }
            if (typeof shape.fill === 'string' && shape.fill.length > 0) {
              cleanShape.fill = shape.fill;
            }
            if (typeof shape.stroke === 'string' && shape.stroke.length > 0) {
              cleanShape.stroke = shape.stroke;
            }
            if (typeof shape.fontFamily === 'string' && shape.fontFamily.length > 0) {
              cleanShape.fontFamily = shape.fontFamily;
            }
            
            // Boolean properties
            if (typeof shape.isBold === 'boolean') {
              cleanShape.isBold = shape.isBold;
            }
            
            // Array properties (points for lines)
            if (Array.isArray(shape.points) && shape.points.length > 0) {
              const cleanPoints = [];
              for (const point of shape.points) {
                if (!isNaN(Number(point))) {
                  cleanPoints.push(Number(point));
                }
              }
              if (cleanPoints.length > 0) {
                cleanShape.points = cleanPoints;
              }
            }
            
            // Special flag for images
            if (shape.type === 'image') {
              cleanShape.isImage = true;
            }
            
            serializableShapes.push(cleanShape);
            
          } catch (error) {
            console.warn(`Failed to process shape ${i}:`, error);
            // Add minimal safe shape
            serializableShapes.push({
              id: `shape-${i}`,
              type: 'unknown',
              x: 0,
              y: 0
            });
          }
        }
        
        return serializableShapes;
      };
      
      // Convert shapes to template format using completely isolated data
      const templateData = {
        template: {
          fields: createSerializableShapes(shapes)
        }
      };
      
      console.log('Saving template data:', templateData);

      // Debug: Log the template data structure before sending
      console.log('Template data to save:', templateData);
      
      let requestBody;
      try {
        requestBody = JSON.stringify(templateData);
      } catch (jsonError) {
        console.error('JSON serialization error:', jsonError);
        console.error('Template data that failed to serialize:', templateData);
        throw new Error(`Failed to serialize template data: ${jsonError.message}`);
      }

      const response = await fetch(`${apiUrl}/templates/canvas/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        body: JSON.stringify({ templateName: 'default', template: templateData.template }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Canvas template saved successfully:', result);
      alert('Template saved successfully!');
      if (onSave) onSave();
    } catch (error) {
      console.error('Save failed:', error);
      alert(`Save failed: ${error.message}`);
    }
  }, [shapes]);

  // Export to PDF
  const handleExportToPDF = useCallback(async () => {
    if (!stageRef.current) {
      console.error('Stage ref not available');
      return;
    }

    // Temporarily hide grid for PDF export
    const originalShowGrid = showGrid;
    setShowGrid(false);

    try {
      console.log('Starting PDF export...');
      
      // Wait a moment to ensure canvas is fully rendered without grid
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Check for tainted canvas by trying to get image data first
      let dataURL;
      try {
        // Get canvas data URL with proper settings
        dataURL = stageRef.current.toDataURL({
          mimeType: 'image/png',
          quality: 1,
          pixelRatio: 1 // Reduce pixel ratio to avoid issues
        });
      } catch (canvasError) {
        console.error('Canvas export error:', canvasError);
        if (canvasError.message.includes('tainted')) {
          throw new Error('Canvas is tainted - images may be from different domains. Please ensure all images are from the same origin or have proper CORS headers.');
        }
        throw new Error(`Canvas export failed: ${canvasError.message}`);
      }

      console.log('Canvas data URL generated, length:', dataURL.length);
      
      // Validate the data URL
      if (!dataURL.startsWith('data:image/png;base64,')) {
        console.error('Invalid data URL format:', dataURL.substring(0, 100));
        throw new Error('Invalid PNG data generated - canvas may be tainted or empty');
      }

      // Create PDF using jsPDF
      const { jsPDF } = await import('jspdf');
      console.log('jsPDF imported successfully');
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [CANVAS_WIDTH, CANVAS_HEIGHT]
      });

      console.log('PDF created, adding image...');
      pdf.addImage(dataURL, 'PNG', 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // Create PDF preview instead of downloading
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Open PDF in new window/tab for preview
      const previewWindow = window.open(pdfUrl, '_blank');
      if (!previewWindow) {
        // Fallback if popup is blocked
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `recipe-${recipe?._id || 'template'}.pdf`;
        link.click();
      }
      
      // Clean up the blob URL after a delay to avoid memory leaks
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 10000); // Clean up after 10 seconds

      console.log('PDF preview opened successfully');
      if (onExport) onExport();
    } catch (error) {
      console.error('Export failed:', error);
      alert(`PDF export failed: ${error.message}`);
    } finally {
      // Restore original grid state
      setShowGrid(originalShowGrid);
    }
  }, [recipe, onExport, showGrid]);

  // Render grid
  const renderGrid = () => {
    if (!showGrid) return null;

    const gridLines = [];
    
    // Vertical lines
    for (let x = 0; x <= CANVAS_WIDTH; x += gridSize) {
      gridLines.push(
        <Line
          key={`v-${x}`}
          points={[x, 0, x, CANVAS_HEIGHT]}
          stroke="#e0e0e0"
          strokeWidth={1}
          listening={false}
        />
      );
    }
    
    // Horizontal lines
    for (let y = 0; y <= CANVAS_HEIGHT; y += gridSize) {
      gridLines.push(
        <Line
          key={`h-${y}`}
          points={[0, y, CANVAS_WIDTH, y]}
          stroke="#e0e0e0"
          strokeWidth={1}
          listening={false}
        />
      );
    }
    
    return gridLines;
  };

  // Render shape based on type
  const renderShape = (shape) => {
    const isSelected = selectedIds.includes(shape.id);
    
    const commonProps = {
      key: shape.id,
      id: shape.id,
      draggable: currentTool === TOOLS.SELECT,
      onClick: handleShapeClick,
      onDragStart: handleShapeDragStart,
      onDragMove: handleShapeDrag,
      onDragEnd: handleShapeDragEnd,
      stroke: isSelected ? '#007bff' : shape.stroke,
      strokeWidth: isSelected ? 3 : (shape.strokeWidth || 1)
    };

    // For text elements, don't use stroke for selection - use background instead
    const textProps = {
      ...commonProps,
      stroke: undefined, // Don't override text stroke
      strokeWidth: undefined // Don't override text stroke width
    };

    switch (shape.type) {
      case 'rectangle':
        return (
          <Rect
            {...commonProps}
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            fill={shape.fill}
          />
        );
      
      case 'circle':
        return (
          <Circle
            {...commonProps}
            x={shape.x}
            y={shape.y}
            radius={shape.radius}
            fill={shape.fill}
          />
        );
      
      case 'line':
        return (
          <Line
            {...commonProps}
            points={shape.points}
            stroke={shape.stroke}
            strokeWidth={isSelected ? 8 : (shape.strokeWidth || 2)}
            hitStrokeWidth={20}
          />
        );
      
      case 'text':
        return (
          <>
            {/* Selection background for text */}
            {isSelected && (
              <Rect
                x={shape.x - 2}
                y={shape.y - 2}
                width={(shape.width || 300) + 4}
                height={(shape.fontSize || 12) * 1.2 + 4}
                fill="rgba(0, 123, 255, 0.1)"
                stroke="#007bff"
                strokeWidth={1}
                listening={false}
              />
            )}
            <Text
              {...textProps}
              x={shape.x}
              y={shape.y}
              text={shape.text}
              fontSize={shape.fontSize}
              fill={shape.fill}
              fontFamily={shape.fontFamily}
              fontStyle={shape.isBold ? 'bold' : 'normal'}
              width={shape.width || 300}
              wrap="word"
            />
          </>
        );
      
      case 'image':
        return (
          <KonvaImage
            {...commonProps}
            x={shape.x}
            y={shape.y}
            width={shape.width || 150}
            height={shape.height || 150}
            image={shape.image}
            opacity={shape.opacity || 1}
            draggable={currentTool === TOOLS.SELECT}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div style={{ padding: '1rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Toolbar */}
      <ToolPanel
        currentTool={currentTool}
        onToolChange={setCurrentTool}
        onDelete={handleDelete}
        onClear={handleClear}
        onReset={handleReset}
        onExport={handleExportToPDF}
        onDeselect={handleDeselect}
        selectedIds={selectedIds}
        shapeCount={shapes.length}
        onSave={handleSave}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
        gridSize={gridSize}
        onGridSizeChange={setGridSize}
        snapToGrid={snapToGrid}
        onToggleSnap={() => setSnapToGrid(!snapToGrid)}
      />

      {/* Main Content Area */}
      <div style={{ display: 'flex', flex: 1, gap: '1rem', overflow: 'auto' }}>
        {/* Canvas Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Canvas */}
          <div style={{ border: '2px solid #8B1538', borderRadius: '0.5rem', display: 'inline-block', alignSelf: 'flex-start' }}>
            <Stage
              ref={stageRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              onClick={handleStageClick}
              style={{ backgroundColor: '#fefefe' }}
            >
            <Layer>
              {renderGrid()}
              {shapes.map(renderShape)}
            </Layer>
            </Stage>
          </div>

        </div>

        {/* Properties Sidebar */}
        <div style={{ width: '250px', overflow: 'auto', border: '1px solid #dee2e6', borderRadius: '0.25rem', padding: '0.75rem', backgroundColor: '#f8f9fa' }}>
          <PropertiesPanel
            selectedShape={selectedShape}
            selectedShapes={selectedShapes}
            onPropertyChange={handlePropertyChange}
            onClose={() => setSelectedIds([])}
          />
        </div>
      </div>

      {/* Template Manager Modal */}
    </div>
  );
};

export default CanvasEditor;
