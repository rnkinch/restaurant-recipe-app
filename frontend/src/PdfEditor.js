import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { DndProvider, useDrag } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Button, Form, Row, Col } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useNotification } from './NotificationContext';

const styles = {
  field: {
    position: 'absolute',
    color: '#0f172a', // Elegant Culinary dark text
  },
  image: {
    position: 'absolute',
  },
  line: {
    position: 'absolute',
    backgroundColor: '#8B1538', // Elegant Culinary burgundy
  },
  grid: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundImage: `
      linear-gradient(to right, rgba(139, 21, 56, 0.2) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(139, 21, 56, 0.2) 1px, transparent 1px)
    `,
    backgroundSize: '10px 10px',
    pointerEvents: 'none',
    opacity: 0.3,
    zIndex: 5,
  },
  buttonContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  canvas: {
    position: 'relative',
    width: '792px', // Full landscape width (11 inches at 72 DPI)
    height: '612px', // Full landscape height (8.5 inches at 72 DPI)
    border: '8px solid #8B1538', // Elegant Culinary burgundy border
    boxSizing: 'border-box',
    background: '#fefefe', // Elegant Culinary background
    marginBottom: '1rem',
    overflow: 'hidden',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(139, 21, 56, 0.1)',
  },
  printableArea: {
    position: 'absolute',
    top: '18px', // 1/4" margin (18px at 72 DPI)
    left: '18px', // 1/4" margin (18px at 72 DPI)
    width: '756px', // 792px - 36px (18px margins on both sides)
    height: '576px', // 612px - 36px (18px margins on top and bottom)
    backgroundColor: '#fefefe', // White printable area
    zIndex: 1,
  },
  marginArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '792px',
    height: '612px',
    backgroundColor: '#e5e7eb', // Light grey for non-printable margin area
    zIndex: 0,
  },
};

const Field = ({ field, index, setFields, selectedField, setSelectedField, selectedFields, setSelectedFields, snapToGrid, saveToHistory }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'field',
    item: { id: field.id, index, x: field.x, y: field.y },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      const delta = monitor.getDifferenceFromInitialOffset();
      if (delta && item.id === field.id) {
        setFields((prev) => {
          const newFields = [...prev];
          const fieldsToMove = selectedFields.has(field.id) ? Array.from(selectedFields) : [field.id];
          
          fieldsToMove.forEach(fieldId => {
            const fieldIndex = newFields.findIndex(f => f.id === fieldId);
            if (fieldIndex !== -1) {
              const fieldToMove = newFields[fieldIndex];
              const maxWidth = fieldToMove.isImage ? (fieldToMove.width || 100) : fieldToMove.isLine ? (fieldToMove.orientation === 'horizontal' ? (fieldToMove.length || 100) : 1) : (fieldToMove.width || 400);
              const maxHeight = fieldToMove.isImage ? (fieldToMove.height || 100) : fieldToMove.isLine ? (fieldToMove.orientation === 'vertical' ? (fieldToMove.length || 100) : 1) : 20;
              let newX = Math.max(18, Math.min(756 - maxWidth, fieldToMove.x + delta.x)); // 18px margin from left, printable area width
              let newY = Math.max(18, Math.min(576 - maxHeight, fieldToMove.y + delta.y)); // 18px margin from top, printable area height
              
              // Apply snap to grid if enabled
              if (snapToGrid) {
                newX = Math.round(newX / 10) * 10;
                newY = Math.round(newY / 10) * 10;
              }
              
              newFields[fieldIndex] = {
                ...newFields[fieldIndex],
                x: newX,
                y: newY,
              };
            }
          });
          console.log('Fields moved:', fieldsToMove);
          // Save to history after drag operation
          setTimeout(() => saveToHistory(newFields), 100);
          return newFields;
        });
      }
    },
  });

  return (
    <div
      ref={drag}
      style={{
        ...styles.field,
        left: field.x,
        top: field.y,
        opacity: field.id === 'watermark' ? 0.2 : isDragging ? 0.5 : 1,
        border: selectedFields.has(field.id) ? '2px solid blue' : field.isLine ? 'none' : '1px dashed #ccc',
        padding: field.isLine ? 0 : 5,
        background: field.isLine ? '#000' : '#fff',
        cursor: 'move',
        width: field.isImage ? (field.width || 100) : field.isLine ? (field.orientation === 'horizontal' ? (field.length || 100) : 1) : (field.width || 300),
        height: field.isLine ? (field.orientation === 'vertical' ? (field.length || 100) : 1) : field.id === 'watermark' ? (field.height || 100) : undefined,
        minWidth: field.isLine ? (selectedField === field.id ? 10 : 1) : undefined,
        minHeight: field.isLine ? (selectedField === field.id ? 10 : 1) : undefined,
        zIndex: field.zIndex || (field.id === 'watermark' ? 5 : 10),
        fontSize: field.isLine || field.isImage ? undefined : (field.fontSize || 12),
        fontWeight: field.isLine || field.isImage ? undefined : (field.isBold ? 'bold' : 'normal'),
        fontFamily: field.isLine || field.isImage ? undefined : (field.fontFamily || 'Helvetica'),
        color: field.isLine || field.isImage ? undefined : (field.textColor || '#000000'),
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (e.ctrlKey || e.metaKey) {
          // Multi-select mode
          setSelectedFields(prev => {
            const newSet = new Set(prev);
            if (newSet.has(field.id)) {
              newSet.delete(field.id);
            } else {
              newSet.add(field.id);
            }
            return newSet;
          });
          setSelectedField(field.id);
        } else {
          // Single select mode
          setSelectedFields(new Set([field.id]));
          setSelectedField(field.id);
        }
        console.log('Selected field:', field.id);
      }}
    >
      {field.isImage ? (
        <img
          src={field.content}
          alt={field.id === 'watermark' ? 'Watermark' : 'Recipe'}
          style={{ ...styles.image, width: field.width || 100, height: field.height || 100, objectFit: 'contain' }}
          onError={(e) => console.error('Image load error:', field.content)}
        />
      ) : field.isLine ? null : (
        field.content
      )}
    </div>
  );
};

const PdfEditor = ({ recipe }) => {
  const { showSuccess, showError } = useNotification();
  const apiUrl = process.env.REACT_APP_API_URL || 'http://172.30.184.138:8080';
  const frontendUrl = process.env.REACT_APP_FRONTEND_URL || 'http://172.30.184.138:3000';
  const [fields, setFields] = useState([]);
  const [selectedField, setSelectedField] = useState(null);
  const [selectedFields, setSelectedFields] = useState(new Set());
  const [newTextId, setNewTextId] = useState(1);
  const [newLineId, setNewLineId] = useState(1);
  const [imageError, setImageError] = useState(null);
  const [templateError, setTemplateError] = useState(null);
  const [showGrid, setShowGrid] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [fieldHistory, setFieldHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [imageAspectRatios, setImageAspectRatios] = useState({});
  const [imageDataUrls, setImageDataUrls] = useState({});
  const navigate = useNavigate();
  const canvasKey = useMemo(() => Date.now(), [fields]);

  // Save state to history - defined early so it can be used in drag operations
  const saveToHistory = useCallback((newFields) => {
    const newHistory = fieldHistory.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newFields)));
    if (newHistory.length > 50) { // Limit history to 50 states
      newHistory.shift();
    }
    setFieldHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [fieldHistory, historyIndex]);

  // Auto-save functionality will be added after handleSave is defined

  // Memoize recipe to prevent unnecessary re-renders
  const memoizedRecipe = useMemo(() => recipe, [recipe?._id]);

  useEffect(() => {
    if (!memoizedRecipe?._id) {
      console.log('No recipe ID, skipping useEffect');
      return;
    }
    console.log('useEffect triggered for recipe ID:', memoizedRecipe._id);
    const imageUrl = memoizedRecipe?.image
      ? `${apiUrl}/Uploads/${memoizedRecipe.image.split('/').pop()}`
      : `${frontendUrl}/logo.png`;
    const watermarkUrl = `${apiUrl}/Uploads/logo.png`;
    console.log('Image URL:', imageUrl);
    console.log('Watermark URL:', watermarkUrl);

    const validateImage = async (url, key) => {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }
        const blob = await response.blob();
        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
        const img = document.createElement('img');
        img.src = dataUrl;
        await new Promise((resolve, reject) => {
          img.onload = () => {
            const aspectRatio = img.naturalWidth / img.naturalHeight;
            setImageAspectRatios((prev) => ({ ...prev, [key]: aspectRatio }));
            setImageDataUrls((prev) => ({ ...prev, [key]: dataUrl }));
            console.log('Image validated:', key, aspectRatio);
            resolve();
          };
          img.onerror = () => {
            console.error('Image load error:', url);
            setImageError(`Image not found: ${url}`);
            resolve(); // Continue to allow rendering
          };
        });
      } catch (err) {
        console.error('Image validation failed:', url, err.message);
        setImageError(`Image not found: ${url}`);
      }
    };

    const loadImagesAndTemplate = async () => {
      await Promise.all([
        validateImage(imageUrl, 'recipeImage'),
        validateImage(watermarkUrl, 'watermark'),
      ]);

      const defaultFields = [
        { id: 'titleLabel', content: 'Recipe Title:', x: 20, y: 10, fontSize: 12, isBold: false, width: 300, zIndex: 10 },
        { id: 'title', content: memoizedRecipe?.name || 'Recipe Title', x: 20, y: 30, fontSize: 12, isBold: false, width: 300, zIndex: 10 },
        { id: 'ingredientsLabel', content: 'Ingredients:', x: 20, y: 60, fontSize: 12, isBold: false, width: 300, zIndex: 10 },
        {
          id: 'ingredients',
          content: Array.isArray(memoizedRecipe?.ingredients) && memoizedRecipe.ingredients.length > 0
            ? memoizedRecipe.ingredients.map((i) => `${i.quantity || ''} ${i.measure || ''} ${i.ingredient?.name || ''}`).join('\n')
            : 'No ingredients',
          x: 20,
          y: 80,
          fontSize: 12,
          isBold: false,
          width: 300,
          zIndex: 10,
        },
        { id: 'stepsLabel', content: 'Steps:', x: 20, y: 190, fontSize: 12, isBold: false, width: 300, zIndex: 10 },
        {
          id: 'steps',
          content: memoizedRecipe?.steps || 'No steps',
          x: 20,
          y: 210,
          fontSize: 12,
          isBold: false,
          width: 300,
          zIndex: 10,
        },
        { id: 'platingGuideLabel', content: 'Plating Guide:', x: 20, y: 320, fontSize: 12, isBold: false, width: 300, zIndex: 10 },
        {
          id: 'platingGuide',
          content: memoizedRecipe?.platingGuide || 'No plating guide',
          x: 20,
          y: 340,
          fontSize: 12,
          isBold: false,
          width: 300,
          zIndex: 10,
        },
        { id: 'allergensLabel', content: 'Allergens:', x: 350, y: 10, fontSize: 12, isBold: false, width: 300, zIndex: 10 },
        {
          id: 'allergens',
          content: Array.isArray(memoizedRecipe?.allergens) && memoizedRecipe.allergens.length > 0 ? memoizedRecipe.allergens.join(', ') : 'No allergens',
          x: 350,
          y: 30,
          fontSize: 12,
          isBold: false,
          width: 300,
          zIndex: 10,
        },
        { id: 'serviceTypesLabel', content: 'Service Types:', x: 350, y: 60, fontSize: 12, isBold: false, width: 300, zIndex: 10 },
        {
          id: 'serviceTypes',
          content: Array.isArray(memoizedRecipe?.serviceTypes) && memoizedRecipe.serviceTypes.length > 0 ? memoizedRecipe.serviceTypes.join(', ') : 'No service types',
          x: 350,
          y: 80,
          fontSize: 12,
          isBold: false,
          width: 300,
          zIndex: 10,
        },
        {
          id: 'image',
          content: imageUrl,
          x: 350,
          y: 110,
          width: 100,
          height: 100 / (imageAspectRatios['recipeImage'] || 1),
          isImage: true,
          aspectRatio: imageAspectRatios['recipeImage'] || 1,
          zIndex: 10,
        },
        {
          id: 'watermark',
          content: watermarkUrl,
          x: 350,
          y: 280,
          width: 100,
          height: 100 / (imageAspectRatios['watermark'] || 1),
          isImage: true,
          aspectRatio: imageAspectRatios['watermark'] || 1,
          zIndex: 5,
        },
      ];

      const fetchTemplate = async () => {
        try {
          const timestamp = Date.now();
          console.log('Fetching template:', `${apiUrl}/templates/default?t=${timestamp}`);
          const res = await fetch(`${apiUrl}/templates/default?t=${timestamp}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
            },
          });
          if (res.ok) {
            const templateData = await res.json();
            console.log('Template fetched successfully');
            if (templateData?.template?.fields) {
              const updatedFields = templateData.template.fields.map((field) => {
                if (field.isImage && field.id === 'image') {
                  return { ...field, content: imageUrl, aspectRatio: imageAspectRatios['recipeImage'] || 1, height: (field.width || 100) / (imageAspectRatios['recipeImage'] || 1) };
                }
                if (field.isImage && field.id === 'watermark') {
                  return { ...field, content: watermarkUrl, aspectRatio: imageAspectRatios['watermark'] || 1, height: (field.width || 100) / (imageAspectRatios['watermark'] || 1) };
                }
                return field;
              });
              setFields(updatedFields);
              console.log('Loaded saved fields:', updatedFields.length);
            } else {
              console.warn('No template fields found, using default fields');
              setFields(defaultFields);
            }
          } else {
            const errorText = await res.text();
            console.error('Template fetch failed:', res.status, errorText);
            setTemplateError(`Failed to load template: ${res.status} - ${errorText}`);
            setFields(defaultFields);
          }
        } catch (err) {
          console.error('Template fetch error:', err.message);
          setTemplateError(`Failed to load template: ${err.message}`);
          setFields(defaultFields);
        }
      };

      fetchTemplate();
    };

    loadImagesAndTemplate();
  }, [memoizedRecipe, apiUrl, frontendUrl]);

  const addCustomTextField = useCallback(() => {
    const newField = {
      id: `customText-${newTextId}-${Date.now()}`,
      content: 'New Text',
      x: 20,
      y: 20 + newTextId * 20,
      fontSize: 12,
      isBold: false,
      width: 300,
      zIndex: 10,
    };
    setFields((prev) => {
      const newFields = [...prev, newField];
      console.log('Added text field:', newField.id);
      return newFields;
    });
    setNewTextId((prev) => prev + 1);
  }, [newTextId]);

  const addLine = useCallback(() => {
    const newField = {
      id: `line-${newLineId}-${Date.now()}`,
      isLine: true,
      orientation: 'horizontal',
      x: 20,
      y: 20 + newLineId * 10,
      length: 100,
      zIndex: 10,
    };
    setFields((prev) => {
      const newFields = [...prev, newField];
      console.log('Added line:', newField.id, newField.orientation);
      return newFields;
    });
    setNewLineId((prev) => prev + 1);
  }, [newLineId]);


  const handleFieldChange = useCallback((fieldId, key, value) => {
    setFields((prev) => {
      const newFields = prev.map((field) =>
        field.id === fieldId
          ? {
              ...field,
              [key]: key === 'width' || key === 'fontSize' || key === 'zIndex' || key === 'length' ? Number(value) : value,
              ...(key === 'width' && field.isImage && field.aspectRatio
                ? { height: Number(value) / field.aspectRatio }
                : {}),
            }
          : field
      );
      console.log('Field updated:', { fieldId, key, value });
      // Save to history after a short delay to avoid too many history entries
      setTimeout(() => saveToHistory(newFields), 100);
      return newFields;
    });
  }, [saveToHistory]);

  // Undo function
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setFields(JSON.parse(JSON.stringify(fieldHistory[newIndex])));
      setSelectedFields(new Set());
      setSelectedField(null);
    }
  }, [historyIndex, fieldHistory]);

  // Redo function
  const redo = useCallback(() => {
    if (historyIndex < fieldHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setFields(JSON.parse(JSON.stringify(fieldHistory[newIndex])));
      setSelectedFields(new Set());
      setSelectedField(null);
    }
  }, [historyIndex, fieldHistory]);

  const handleSave = useCallback(async () => {
    try {
      // Remove base64 data URLs from fields to reduce payload size
      const sanitizedFields = fields.map((field) => {
        if (field.isImage && field.id === 'image') {
          return { ...field, content: memoizedRecipe?.image ? `${apiUrl}/Uploads/${memoizedRecipe.image.split('/').pop()}` : `${frontendUrl}/logo.png` };
        }
        if (field.isImage && field.id === 'watermark') {
          return { ...field, content: `${apiUrl}/Uploads/logo.png` };
        }
        return field;
      });
      const response = await fetch(`${apiUrl}/templates/default/save?t=${Date.now()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        body: JSON.stringify({ template: { fields: sanitizedFields } }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
      const saveData = await response.json();
      console.log('Template saved:', saveData);
      showSuccess('Template saved successfully!');
    } catch (err) {
      console.error('Save failed:', err.message);
      showError(`Save failed: ${err.message}`);
    }
  }, [fields, apiUrl, memoizedRecipe, frontendUrl]);

  const handleResetToDefault = useCallback(async () => {
    try {
      const imageUrl = memoizedRecipe?.image
        ? `${apiUrl}/Uploads/${memoizedRecipe.image.split('/').pop()}`
        : `${frontendUrl}/logo.png`;
      const watermarkUrl = `${apiUrl}/Uploads/logo.png`;
      const defaultFields = [
        { id: 'titleLabel', content: 'Recipe Title:', x: 20, y: 10, fontSize: 12, isBold: false, width: 300, zIndex: 10 },
        { id: 'title', content: memoizedRecipe?.name || 'Recipe Title', x: 20, y: 30, fontSize: 12, isBold: false, width: 300, zIndex: 10 },
        { id: 'ingredientsLabel', content: 'Ingredients:', x: 20, y: 60, fontSize: 12, isBold: false, width: 300, zIndex: 10 },
        {
          id: 'ingredients',
          content: Array.isArray(memoizedRecipe?.ingredients) && memoizedRecipe.ingredients.length > 0
            ? memoizedRecipe.ingredients.map((i) => `${i.quantity || ''} ${i.measure || ''} ${i.ingredient?.name || ''}`).join('\n')
            : 'No ingredients',
          x: 20,
          y: 80,
          fontSize: 12,
          isBold: false,
          width: 300,
          zIndex: 10,
        },
        { id: 'stepsLabel', content: 'Steps:', x: 20, y: 190, fontSize: 12, isBold: false, width: 300, zIndex: 10 },
        {
          id: 'steps',
          content: memoizedRecipe?.steps || 'No steps',
          x: 20,
          y: 210,
          fontSize: 12,
          isBold: false,
          width: 300,
          zIndex: 10,
        },
        { id: 'platingGuideLabel', content: 'Plating Guide:', x: 20, y: 320, fontSize: 12, isBold: false, width: 300, zIndex: 10 },
        {
          id: 'platingGuide',
          content: memoizedRecipe?.platingGuide || 'No plating guide',
          x: 20,
          y: 340,
          fontSize: 12,
          isBold: false,
          width: 300,
          zIndex: 10,
        },
        { id: 'allergensLabel', content: 'Allergens:', x: 350, y: 10, fontSize: 12, isBold: false, width: 300, zIndex: 10 },
        {
          id: 'allergens',
          content: Array.isArray(memoizedRecipe?.allergens) && memoizedRecipe.allergens.length > 0 ? memoizedRecipe.allergens.join(', ') : 'No allergens',
          x: 350,
          y: 30,
          fontSize: 12,
          isBold: false,
          width: 300,
          zIndex: 10,
        },
        { id: 'serviceTypesLabel', content: 'Service Types:', x: 350, y: 60, fontSize: 12, isBold: false, width: 300, zIndex: 10 },
        {
          id: 'serviceTypes',
          content: Array.isArray(memoizedRecipe?.serviceTypes) && memoizedRecipe.serviceTypes.length > 0 ? memoizedRecipe.serviceTypes.join(', ') : 'No service types',
          x: 350,
          y: 80,
          fontSize: 12,
          isBold: false,
          width: 300,
          zIndex: 10,
        },
        {
          id: 'image',
          content: imageUrl,
          x: 350,
          y: 110,
          width: 100,
          height: 100 / (imageAspectRatios['recipeImage'] || 1),
          isImage: true,
          aspectRatio: imageAspectRatios['recipeImage'] || 1,
          zIndex: 10,
        },
        {
          id: 'watermark',
          content: watermarkUrl,
          x: 350,
          y: 280,
          width: 100,
          height: 100 / (imageAspectRatios['watermark'] || 1),
          isImage: true,
          aspectRatio: imageAspectRatios['watermark'] || 1,
          zIndex: 5,
        },
      ];
      setFields(defaultFields);
      console.log('Reset to default fields');
      const response = await fetch(`${apiUrl}/templates/default/save?t=${Date.now()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        body: JSON.stringify({ template: { fields: defaultFields } }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
      const saveData = await response.json();
      console.log('Default template reset:', saveData);
      showSuccess('Template reset to default!');
    } catch (err) {
      console.error('Reset failed:', err.message);
      showError(`Reset failed: ${err.message}`);
    }
  }, [memoizedRecipe, apiUrl, frontendUrl, imageAspectRatios]);

  // Auto-save functionality
  useEffect(() => {
    if (fields.length > 0) {
      const autoSaveInterval = setInterval(() => {
        handleSave().catch(err => console.error('Auto-save failed:', err));
      }, 30000); // Auto-save every 30 seconds

      return () => clearInterval(autoSaveInterval);
    }
  }, [fields, handleSave]);

  const isRecipeField = (fieldId) => {
    return ['title', 'ingredients', 'steps', 'platingGuide', 'allergens', 'serviceTypes'].includes(fieldId);
  };

  const toggleGrid = () => {
    setShowGrid((prev) => !prev);
    console.log('Grid toggled:', !showGrid);
  };

  return (
    <div style={{ padding: '1rem', maxWidth: '1400px', margin: '0 auto' }}>
      <h2>Edit PDF Template</h2>
      <div style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '0.25rem' }}>
        <small>
          <strong>Multi-select:</strong> Hold Ctrl/Cmd and click to select multiple fields. 
          Selected fields can be moved together and have their properties changed simultaneously.
        </small>
      </div>
      {imageError && (
        <div style={{ color: 'red', marginBottom: '1rem' }}>
          {imageError}
        </div>
      )}
      {templateError && (
        <div style={{ color: 'red', marginBottom: '1rem' }}>
          {templateError}
        </div>
      )}
      <Row style={{ height: '650px' }}>
        <Col md={9} style={{ height: '100%', overflow: 'hidden' }}>
          <DndProvider backend={HTML5Backend}>
            <div
              key={canvasKey}
              style={styles.canvas}
              onClick={() => {
                setSelectedField(null);
                setSelectedFields(new Set());
                console.log('Canvas clicked, deselected fields');
              }}
            >
              {/* Margin area (grey background) */}
              <div style={styles.marginArea} />
              
              {/* Printable area (white background) */}
              <div style={styles.printableArea} />
              
              {showGrid && <div style={styles.grid} />}
              {fields.map((field, index) => (
                <Field
                  key={field.id}
                  field={field}
                  index={index}
                  setFields={setFields}
                  selectedField={selectedField}
                  setSelectedField={setSelectedField}
                  selectedFields={selectedFields}
                  setSelectedFields={setSelectedFields}
                  snapToGrid={snapToGrid}
                  saveToHistory={saveToHistory}
                />
              ))}
            </div>
          </DndProvider>
        </Col>
        <Col md={3} style={{ height: '100%', overflow: 'hidden', paddingLeft: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Tools Section */}
            <div style={{ marginBottom: '0.5rem' }}>
              <h6 style={{ marginBottom: '0.25rem', fontSize: '0.9rem' }}>Tools</h6>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem', marginBottom: '0.25rem' }}>
                <Button onClick={addCustomTextField} variant="secondary" size="sm" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                  Add Text
                </Button>
                <Button onClick={addLine} variant="secondary" size="sm" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                  Add Line
                </Button>
                <Button onClick={toggleGrid} variant="outline-secondary" size="sm" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                  {showGrid ? 'Grid' : 'Grid'}
                </Button>
                <Button 
                  onClick={() => setSnapToGrid(!snapToGrid)} 
                  variant={snapToGrid ? "info" : "outline-info"} 
                  size="sm"
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                >
                  {snapToGrid ? 'Snap' : 'Snap'}
                </Button>
                <Button 
                  onClick={undo} 
                  variant="outline-secondary" 
                  size="sm"
                  disabled={historyIndex <= 0}
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                >
                  Undo
                </Button>
                <Button 
                  onClick={redo} 
                  variant="outline-secondary" 
                  size="sm"
                  disabled={historyIndex >= fieldHistory.length - 1}
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                >
                  Redo
                </Button>
              </div>
            </div>
            {/* Selection Controls */}
            {selectedFields.size > 0 && (
              <div style={{ marginBottom: '0.5rem' }}>
                <h6 style={{ marginBottom: '0.25rem', fontSize: '0.9rem' }}>Selection ({selectedFields.size})</h6>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem', marginBottom: '0.25rem' }}>
                  <Button 
                    onClick={() => setSelectedFields(new Set())} 
                    variant="outline-warning" 
                    size="sm"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                  >
                    Clear
                  </Button>
                  <Button 
                    onClick={() => {
                      setFields(prev => prev.filter(field => !selectedFields.has(field.id)));
                      setSelectedFields(new Set());
                      setSelectedField(null);
                    }} 
                    variant="danger" 
                    size="sm"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                  >
                    Delete
                  </Button>
                </div>
                {selectedFields.size > 1 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                    <Button 
                      onClick={() => {
                        const selectedFieldsArray = Array.from(selectedFields);
                        const leftMost = Math.min(...selectedFieldsArray.map(id => 
                          fields.find(f => f.id === id)?.x || 0
                        ));
                        setFields(prev => prev.map(field => 
                          selectedFields.has(field.id) 
                            ? { ...field, x: leftMost }
                            : field
                        ));
                      }}
                      variant="outline-info" 
                      size="sm"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                    >
                      Align L
                    </Button>
                    <Button 
                      onClick={() => {
                        const selectedFieldsArray = Array.from(selectedFields);
                        const topMost = Math.min(...selectedFieldsArray.map(id => 
                          fields.find(f => f.id === id)?.y || 0
                        ));
                        setFields(prev => prev.map(field => 
                          selectedFields.has(field.id) 
                            ? { ...field, y: topMost }
                            : field
                        ));
                      }}
                      variant="outline-info" 
                      size="sm"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                    >
                      Align T
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {/* Actions */}
            <div style={{ marginBottom: '0.5rem' }}>
              <h6 style={{ marginBottom: '0.25rem', fontSize: '0.9rem' }}>Actions</h6>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                <Button onClick={handleSave} variant="primary" size="sm" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                  Save
                </Button>
                <Button onClick={handleResetToDefault} variant="outline-secondary" size="sm" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                  Reset
                </Button>
                <Button
                  as={Link}
                  to={`/recipes/${memoizedRecipe?._id}/preview-pdf`}
                  variant="info"
                  size="sm"
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                  onClick={(e) => {
                    e.preventDefault();
                    setTimeout(() => navigate(`/recipes/${memoizedRecipe?._id}/preview-pdf`), 500);
                  }}
                >
                  Preview
                </Button>
              </div>
            </div>
            {/* Multi-Select Editing */}
            {selectedFields.size > 1 && (
              <div style={{ marginBottom: '0.5rem', padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '0.25rem' }}>
                <h6 style={{ marginBottom: '0.25rem', fontSize: '0.9rem' }}>Edit Multiple ({selectedFields.size})</h6>
                <Row>
                  <Col xs={6}>
                    <Form.Group className="mb-1">
                      <Form.Label style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Font</Form.Label>
                      <Form.Select
                        size="sm"
                        style={{ fontSize: '0.75rem', padding: '0.25rem' }}
                        onChange={(e) => {
                          setFields(prev => prev.map(field => 
                            selectedFields.has(field.id) && !field.isImage && !field.isLine
                              ? { ...field, fontFamily: e.target.value }
                              : field
                          ));
                        }}
                      >
                        <option value="">Set all</option>
                        <option value="Helvetica">Helvetica</option>
                        <option value="Times-Roman">Times</option>
                        <option value="Courier">Courier</option>
                        <option value="Arial">Arial</option>
                        <option value="Georgia">Georgia</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col xs={6}>
                    <Form.Group className="mb-1">
                      <Form.Label style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Size</Form.Label>
                      <Form.Control
                        type="number"
                        size="sm"
                        style={{ fontSize: '0.75rem', padding: '0.25rem' }}
                        placeholder="Set all"
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          if (!isNaN(value)) {
                            setFields(prev => prev.map(field => 
                              selectedFields.has(field.id) && !field.isImage && !field.isLine
                                ? { ...field, fontSize: value }
                                : field
                            ));
                          }
                        }}
                        min="8"
                        max="24"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col xs={6}>
                    <Form.Group className="mb-1">
                      <Form.Label style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Color</Form.Label>
                      <Form.Select
                        size="sm"
                        style={{ fontSize: '0.75rem', padding: '0.25rem' }}
                        onChange={(e) => {
                          setFields(prev => prev.map(field => 
                            selectedFields.has(field.id) && !field.isImage && !field.isLine
                              ? { ...field, textColor: e.target.value }
                              : field
                          ));
                        }}
                      >
                        <option value="">Set all</option>
                        <option value="#000000">Black</option>
                        <option value="#8B1538">Burgundy</option>
                        <option value="#D4AF37">Gold</option>
                        <option value="#333333">Dark Gray</option>
                        <option value="#666666">Gray</option>
                        <option value="#FFFFFF">White</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col xs={6}>
                    <Form.Group className="mb-1">
                      <Form.Label style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Z-Index</Form.Label>
                      <Form.Control
                        type="number"
                        size="sm"
                        style={{ fontSize: '0.75rem', padding: '0.25rem' }}
                        placeholder="Set all"
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          if (!isNaN(value)) {
                            setFields(prev => prev.map(field => 
                              selectedFields.has(field.id)
                                ? { ...field, zIndex: value }
                                : field
                            ));
                          }
                        }}
                        min="1"
                        max="100"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-1">
                  <Form.Check
                    type="checkbox"
                    size="sm"
                    style={{ fontSize: '0.75rem' }}
                    label="Bold"
                    onChange={(e) => {
                      setFields(prev => prev.map(field => 
                        selectedFields.has(field.id) && !field.isImage && !field.isLine
                          ? { ...field, isBold: e.target.checked }
                          : field
                      ));
                    }}
                  />
                </Form.Group>
              </div>
            )}
            {/* Single Field Editing */}
            {selectedField && selectedFields.size <= 1 && (
              <div style={{ marginBottom: '0.5rem', padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '0.25rem' }}>
                <h6 style={{ marginBottom: '0.25rem', fontSize: '0.9rem' }}>Edit: {fields.find((f) => f.id === selectedField)?.id || 'Field'}</h6>
              {fields.find((f) => f.id === selectedField)?.isImage ? (
                <>
                  <Form.Group className="mb-2">
                    <Form.Label>Width (px)</Form.Label>
                    <Form.Control
                      type="number"
                      value={fields.find((f) => f.id === selectedField)?.width || 100}
                      onChange={(e) => handleFieldChange(selectedField, 'width', e.target.value)}
                      min="50"
                      max="600"
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Height (px, auto-adjusted)</Form.Label>
                    <Form.Control
                      type="number"
                      value={fields.find((f) => f.id === selectedField)?.height || 100}
                      disabled
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Z-Index</Form.Label>
                    <Form.Control
                      type="number"
                      value={fields.find((f) => f.id === selectedField)?.zIndex || 10}
                      onChange={(e) => handleFieldChange(selectedField, 'zIndex', e.target.value)}
                      min="1"
                      max="100"
                    />
                  </Form.Group>
                </>
              ) : fields.find((f) => f.id === selectedField)?.isLine ? (
                <>
                  <Form.Group className="mb-2">
                    <Form.Label>Length (px)</Form.Label>
                    <Form.Control
                      type="number"
                      value={fields.find((f) => f.id === selectedField)?.length || 100}
                      onChange={(e) => handleFieldChange(selectedField, 'length', e.target.value)}
                      min="10"
                      max="600"
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Orientation</Form.Label>
                    <Form.Select
                      value={fields.find((f) => f.id === selectedField)?.orientation || 'horizontal'}
                      onChange={(e) => handleFieldChange(selectedField, 'orientation', e.target.value)}
                    >
                      <option value="horizontal">Horizontal</option>
                      <option value="vertical">Vertical</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Z-Index</Form.Label>
                    <Form.Control
                      type="number"
                      value={fields.find((f) => f.id === selectedField)?.zIndex || 10}
                      onChange={(e) => handleFieldChange(selectedField, 'zIndex', e.target.value)}
                      min="1"
                      max="100"
                    />
                  </Form.Group>
                </>
              ) : (
                <>
                  <Form.Group className="mb-1">
                    <Form.Label style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Content</Form.Label>
                    <Form.Control
                      type="text"
                      size="sm"
                      style={{ fontSize: '0.75rem', padding: '0.25rem' }}
                      value={fields.find((f) => f.id === selectedField)?.content || ''}
                      onChange={(e) => handleFieldChange(selectedField, 'content', e.target.value)}
                      readOnly={isRecipeField(selectedField)}
                      disabled={isRecipeField(selectedField)}
                      title={isRecipeField(selectedField) ? 'Recipe fields cannot be edited here; use the recipe form.' : ''}
                    />
                  </Form.Group>
                  <Row>
                    <Col xs={6}>
                      <Form.Group className="mb-1">
                        <Form.Label style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Font</Form.Label>
                        <Form.Select
                          size="sm"
                          style={{ fontSize: '0.75rem', padding: '0.25rem' }}
                          value={fields.find((f) => f.id === selectedField)?.fontFamily || 'Helvetica'}
                          onChange={(e) => handleFieldChange(selectedField, 'fontFamily', e.target.value)}
                        >
                          <option value="Helvetica">Helvetica</option>
                          <option value="Times-Roman">Times</option>
                          <option value="Courier">Courier</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col xs={6}>
                      <Form.Group className="mb-1">
                        <Form.Label style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Size</Form.Label>
                        <Form.Control
                          type="number"
                          size="sm"
                          style={{ fontSize: '0.75rem', padding: '0.25rem' }}
                          value={fields.find((f) => f.id === selectedField)?.fontSize || 12}
                          onChange={(e) => handleFieldChange(selectedField, 'fontSize', e.target.value)}
                          min="8"
                          max="24"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col xs={6}>
                      <Form.Group className="mb-1">
                        <Form.Label style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Color</Form.Label>
                        <Form.Select
                          size="sm"
                          style={{ fontSize: '0.75rem', padding: '0.25rem' }}
                          value={fields.find((f) => f.id === selectedField)?.textColor || '#000000'}
                          onChange={(e) => handleFieldChange(selectedField, 'textColor', e.target.value)}
                        >
                          <option value="#000000">Black</option>
                          <option value="#8B1538">Burgundy</option>
                          <option value="#D4AF37">Gold</option>
                          <option value="#333333">Dark Gray</option>
                          <option value="#666666">Gray</option>
                          <option value="#FFFFFF">White</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col xs={6}>
                      <Form.Group className="mb-1">
                        <Form.Label style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Width</Form.Label>
                        <Form.Control
                          type="number"
                          size="sm"
                          style={{ fontSize: '0.75rem', padding: '0.25rem' }}
                          value={fields.find((f) => f.id === selectedField)?.width || 400}
                          onChange={(e) => handleFieldChange(selectedField, 'width', e.target.value)}
                          min="50"
                          max="600"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col xs={6}>
                      <Form.Group className="mb-1">
                        <Form.Label style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Z-Index</Form.Label>
                        <Form.Control
                          type="number"
                          size="sm"
                          style={{ fontSize: '0.75rem', padding: '0.25rem' }}
                          value={fields.find((f) => f.id === selectedField)?.zIndex || 10}
                          onChange={(e) => handleFieldChange(selectedField, 'zIndex', e.target.value)}
                          min="1"
                          max="100"
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={6}>
                      <Form.Group className="mb-1">
                        <Form.Check
                          type="checkbox"
                          size="sm"
                          style={{ fontSize: '0.75rem', marginTop: '1.25rem' }}
                          label="Bold"
                          checked={fields.find((f) => f.id === selectedField)?.isBold || false}
                          onChange={(e) => handleFieldChange(selectedField, 'isBold', e.target.checked)}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </>
              )}
              </div>
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default PdfEditor;