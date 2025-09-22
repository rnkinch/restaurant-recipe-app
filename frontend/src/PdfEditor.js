import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { DndProvider, useDrag } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Button, Form, Row, Col } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';

const styles = {
  field: {
    position: 'absolute',
  },
  image: {
    position: 'absolute',
  },
  line: {
    position: 'absolute',
    backgroundColor: '#000',
  },
  grid: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundImage: `
      linear-gradient(to right, #ccc 1px, transparent 1px),
      linear-gradient(to bottom, #ccc 1px, transparent 1px)
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
    width: '842px',
    height: '595px',
    border: '18px solid #000', // 1/4" border (18px at 72 DPI)
    boxSizing: 'border-box',
    background: '#fff',
    marginBottom: '1rem',
    overflow: 'hidden',
  },
};

const Field = ({ field, index, setFields, selectedField, setSelectedField }) => {
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
          const maxWidth = field.isImage ? (field.width || 100) : field.isLine ? (field.orientation === 'horizontal' ? (field.length || 100) : 1) : (field.width || 400);
          const maxHeight = field.isImage ? (field.height || 100) : field.isLine ? (field.orientation === 'vertical' ? (field.length || 100) : 1) : 20;
          const newX = Math.max(0, Math.min(842 - maxWidth, item.x + delta.x));
          const newY = Math.max(0, Math.min(595 - maxHeight, item.y + delta.y));
          newFields[index] = {
            ...newFields[index],
            x: Math.round(newX / 10) * 10,
            y: Math.round(newY / 10) * 10,
          };
          console.log('Field moved:', { id: field.id, x: newX, y: newY });
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
        border: selectedField === field.id ? '2px solid blue' : field.isLine ? 'none' : '1px dashed #ccc',
        padding: field.isLine ? 0 : 5,
        background: field.isLine ? '#000' : '#fff',
        cursor: 'move',
        width: field.isImage ? (field.width || 100) : field.isLine ? (field.orientation === 'horizontal' ? (field.length || 100) : 1) : (field.width || 400),
        height: field.isLine ? (field.orientation === 'vertical' ? (field.length || 100) : 1) : field.id === 'watermark' ? (field.height || 200) : undefined,
        minWidth: field.isLine ? (selectedField === field.id ? 10 : 1) : undefined,
        minHeight: field.isLine ? (selectedField === field.id ? 10 : 1) : undefined,
        zIndex: field.zIndex || (field.id === 'watermark' ? 5 : 10),
        fontSize: field.isLine || field.isImage ? undefined : (field.fontSize || 12),
        fontWeight: field.isLine || field.isImage ? undefined : (field.isBold ? 'bold' : 'normal'),
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedField(field.id);
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
  const apiUrl = process.env.REACT_APP_API_URL || 'http://192.168.68.129:5000';
  const frontendUrl = process.env.REACT_APP_FRONTEND_URL || 'http://192.168.68.129:3000';
  const [fields, setFields] = useState([]);
  const [selectedField, setSelectedField] = useState(null);
  const [newTextId, setNewTextId] = useState(1);
  const [newLineId, setNewLineId] = useState(1);
  const [imageError, setImageError] = useState(null);
  const [templateError, setTemplateError] = useState(null);
  const [showGrid, setShowGrid] = useState(false);
  const [imageAspectRatios, setImageAspectRatios] = useState({});
  const navigate = useNavigate();
  const canvasKey = useMemo(() => Date.now(), [fields]);

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
    const watermarkUrl = `${frontendUrl}/logo.png`;
    console.log('Image URL:', imageUrl);
    console.log('Watermark URL:', watermarkUrl);

    const validateImage = async (url, key) => {
      try {
        const img = new Image();
        img.src = url;
        await new Promise((resolve, reject) => {
          img.onload = () => {
            const aspectRatio = img.naturalWidth / img.naturalHeight;
            setImageAspectRatios((prev) => ({ ...prev, [key]: aspectRatio }));
            console.log('Image aspect ratio:', key, aspectRatio);
            resolve();
          };
          img.onerror = () => {
            console.error('Image load error:', url);
            setImageError(`Image not found: ${url}`);
            reject();
          };
        });
      } catch (err) {
        console.error('Image validation failed:', url, err.message);
        setImageError(`Image not found: ${url}`);
      }
    };
    validateImage(imageUrl, 'recipeImage');
    validateImage(watermarkUrl, 'watermark');

    const defaultFields = [
      { id: 'titleLabel', content: 'Recipe Title:', x: 20, y: 10, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
      { id: 'title', content: memoizedRecipe?.name || 'Recipe Title', x: 20, y: 30, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
      { id: 'ingredientsLabel', content: 'Ingredients:', x: 20, y: 60, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
      {
        id: 'ingredients',
        content: Array.isArray(memoizedRecipe?.ingredients) && memoizedRecipe.ingredients.length > 0
          ? memoizedRecipe.ingredients.map((i) => `${i.quantity || ''} ${i.measure || ''} ${i.ingredient?.name || ''}`).join('\n')
          : 'No ingredients',
        x: 20,
        y: 80,
        fontSize: 12,
        isBold: false,
        width: 500,
        zIndex: 10,
      },
      { id: 'stepsLabel', content: 'Steps:', x: 20, y: 190, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
      {
        id: 'steps',
        content: memoizedRecipe?.steps || 'No steps',
        x: 20,
        y: 210,
        fontSize: 12,
        isBold: false,
        width: 500,
        zIndex: 10,
      },
      { id: 'platingGuideLabel', content: 'Plating Guide:', x: 20, y: 320, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
      {
        id: 'platingGuide',
        content: memoizedRecipe?.platingGuide || 'No plating guide',
        x: 20,
        y: 340,
        fontSize: 12,
        isBold: false,
        width: 500,
        zIndex: 10,
      },
      { id: 'allergensLabel', content: 'Allergens:', x: 450, y: 10, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
      {
        id: 'allergens',
        content: Array.isArray(memoizedRecipe?.allergens) && memoizedRecipe.allergens.length > 0 ? memoizedRecipe.allergens.join(', ') : 'No allergens',
        x: 450,
        y: 30,
        fontSize: 12,
        isBold: false,
        width: 400,
        zIndex: 10,
      },
      { id: 'serviceTypesLabel', content: 'Service Types:', x: 450, y: 60, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
      {
        id: 'serviceTypes',
        content: Array.isArray(memoizedRecipe?.serviceTypes) && memoizedRecipe.serviceTypes.length > 0 ? memoizedRecipe.serviceTypes.join(', ') : 'No service types',
        x: 450,
        y: 80,
        fontSize: 12,
        isBold: false,
        width: 400,
        zIndex: 10,
      },
      {
        id: 'image',
        content: imageUrl,
        x: 450,
        y: 110,
        width: 100,
        height: 100,
        isImage: true,
        aspectRatio: imageAspectRatios['recipeImage'] || 1,
        zIndex: 10,
      },
      {
        id: 'watermark',
        content: watermarkUrl,
        x: 421,
        y: 297.5,
        width: 200,
        height: 200,
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
            setFields(templateData.template.fields);
            console.log('Loaded saved fields:', templateData.template.fields.length);
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
  }, [memoizedRecipe, apiUrl, frontendUrl]);

  const addTextField = useCallback(() => {
    const newField = {
      id: `customText${newTextId}`,
      content: 'New Text',
      x: 421,
      y: 297.5,
      fontSize: 12,
      isBold: false,
      width: 400,
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
      id: `line${newLineId}`,
      isLine: true,
      orientation: 'horizontal',
      x: 421,
      y: 297.5,
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

  const deleteField = useCallback(() => {
    if (selectedField && (selectedField.startsWith('customText') || selectedField.startsWith('line'))) {
      setFields((prev) => {
        const newFields = prev.filter((field) => field.id !== selectedField);
        console.log('Deleted field:', selectedField);
        return newFields;
      });
      setSelectedField(null);
    }
  }, [selectedField]);

  const handleFieldChange = useCallback((id, key, value) => {
    console.log('handleFieldChange:', { id, key, value });
    setFields((prev) => {
      const newFields = prev.map((field) => {
        if (field.id !== id) return field;
        const updatedField = {
          ...field,
          [key]: key === 'fontSize' ? parseInt(value, 10) || field.fontSize || 12 :
                 key === 'length' ? parseInt(value, 10) || field.length || 100 :
                 key === 'width' && field.isImage ? parseInt(value, 10) || field.width || 100 :
                 key === 'width' && !field.isImage && !field.isLine ? parseInt(value, 10) || field.width || 400 :
                 key === 'zIndex' ? parseInt(value, 10) || field.zIndex || 10 :
                 key === 'isBold' ? Boolean(value) :
                 key === 'orientation' ? value :
                 key === 'content' ? value :
                 field[key],
          ...(key === 'width' && field.isImage ? { height: Math.round((parseInt(value, 10) || field.width || 100) / (field.aspectRatio || 1)) } : {}),
          ...(key === 'height' && field.isImage ? { width: Math.round((parseInt(value, 10) || field.height || 100) * (field.aspectRatio || 1)) } : {}),
        };
        console.log('Updated field:', updatedField);
        return updatedField;
      });
      console.log('Fields updated:', newFields.length);
      return newFields;
    });
  }, []);

  const handleSave = useCallback(async () => {
    try {
      const templatePayload = { template: { fields } };
      console.log('Saving template:', `${apiUrl}/templates/default/save`);
      const response = await fetch(`${apiUrl}/templates/default/save?t=${Date.now()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        body: JSON.stringify(templatePayload),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
      const saveData = await response.json();
      console.log('Template saved:', saveData);
      alert('Template saved successfully!');
    } catch (err) {
      console.error('Save failed:', err.message);
      alert(`Save failed: ${err.message}`);
    }
  }, [fields, apiUrl]);

  const handleResetToDefault = useCallback(async () => {
    try {
      const watermarkUrl = `${frontendUrl}/logo.png`;
      const imageUrl = memoizedRecipe?.image
        ? `${apiUrl}/Uploads/${memoizedRecipe.image.split('/').pop()}`
        : `${frontendUrl}/logo.png`;
      const defaultFields = [
        { id: 'titleLabel', content: 'Recipe Title:', x: 20, y: 10, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
        { id: 'title', content: memoizedRecipe?.name || 'Recipe Title', x: 20, y: 30, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
        { id: 'ingredientsLabel', content: 'Ingredients:', x: 20, y: 60, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
        {
          id: 'ingredients',
          content: Array.isArray(memoizedRecipe?.ingredients) && memoizedRecipe.ingredients.length > 0
            ? memoizedRecipe.ingredients.map((i) => `${i.quantity || ''} ${i.measure || ''} ${i.ingredient?.name || ''}`).join('\n')
            : 'No ingredients',
          x: 20,
          y: 80,
          fontSize: 12,
          isBold: false,
          width: 500,
          zIndex: 10,
        },
        { id: 'stepsLabel', content: 'Steps:', x: 20, y: 190, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
        {
          id: 'steps',
          content: memoizedRecipe?.steps || 'No steps',
          x: 20,
          y: 210,
          fontSize: 12,
          isBold: false,
          width: 500,
          zIndex: 10,
        },
        { id: 'platingGuideLabel', content: 'Plating Guide:', x: 20, y: 320, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
        {
          id: 'platingGuide',
          content: memoizedRecipe?.platingGuide || 'No plating guide',
          x: 20,
          y: 340,
          fontSize: 12,
          isBold: false,
          width: 500,
          zIndex: 10,
        },
        { id: 'allergensLabel', content: 'Allergens:', x: 450, y: 10, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
        {
          id: 'allergens',
          content: Array.isArray(memoizedRecipe?.allergens) && memoizedRecipe.allergens.length > 0 ? memoizedRecipe.allergens.join(', ') : 'No allergens',
          x: 450,
          y: 30,
          fontSize: 12,
          isBold: false,
          width: 400,
          zIndex: 10,
        },
        { id: 'serviceTypesLabel', content: 'Service Types:', x: 450, y: 60, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
        {
          id: 'serviceTypes',
          content: Array.isArray(memoizedRecipe?.serviceTypes) && memoizedRecipe.serviceTypes.length > 0 ? memoizedRecipe.serviceTypes.join(', ') : 'No service types',
          x: 450,
          y: 80,
          fontSize: 12,
          isBold: false,
          width: 400,
          zIndex: 10,
        },
        {
          id: 'image',
          content: imageUrl,
          x: 450,
          y: 110,
          width: 100,
          height: 100,
          isImage: true,
          aspectRatio: imageAspectRatios['recipeImage'] || 1,
          zIndex: 10,
        },
        {
          id: 'watermark',
          content: watermarkUrl,
          x: 421,
          y: 297.5,
          width: 200,
          height: 200,
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
      alert('Template reset to default!');
    } catch (err) {
      console.error('Reset failed:', err.message);
      alert(`Reset failed: ${err.message}`);
    }
  }, [memoizedRecipe, apiUrl, frontendUrl, imageAspectRatios]);

  const toggleGrid = () => {
    setShowGrid((prev) => !prev);
    console.log('Grid toggled:', !showGrid);
  };

  return (
    <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h2>Edit PDF Template</h2>
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
      <Row>
        <Col md={9}>
          <DndProvider backend={HTML5Backend}>
            <div
              key={canvasKey}
              style={styles.canvas}
              onClick={() => {
                setSelectedField(null);
                console.log('Canvas clicked, deselected field');
              }}
            >
              {showGrid && <div style={styles.grid} />}
              {fields.map((field, index) => (
                <Field
                  key={field.id}
                  field={field}
                  index={index}
                  setFields={setFields}
                  selectedField={selectedField}
                  setSelectedField={setSelectedField}
                />
              ))}
            </div>
          </DndProvider>
        </Col>
        <Col md={3}>
          <div style={styles.buttonContainer}>
            <Button onClick={addTextField} variant="secondary" size="sm">
              Add Text Field
            </Button>
            <Button onClick={addLine} variant="secondary" size="sm">
              Add Line
            </Button>
            {selectedField && (selectedField.startsWith('customText') || selectedField.startsWith('line')) && (
              <Button onClick={deleteField} variant="danger" size="sm">
                Delete Field
              </Button>
            )}
            <Button onClick={toggleGrid} variant="outline-secondary" size="sm">
              {showGrid ? 'Hide Grid' : 'Show Grid'}
            </Button>
            <Button onClick={handleSave} variant="primary" size="sm">
              Save Template
            </Button>
            <Button onClick={handleResetToDefault} variant="primary" size="sm">
              Reset to Default
            </Button>
            <Button
              as={Link}
              to={`/recipes/${memoizedRecipe?._id}/preview-pdf`}
              variant="info"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                setTimeout(() => navigate(`/recipes/${memoizedRecipe?._id}/preview-pdf`), 500);
              }}
            >
              Preview PDF
            </Button>
          </div>
          {selectedField && (
            <div style={{ marginTop: '50px' }}>
              <h4>Edit {fields.find((f) => f.id === selectedField)?.id || 'Field'}</h4>
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
                  <Form.Group className="mb-2">
                    <Form.Label>Content</Form.Label>
                    <Form.Control
                      type="text"
                      value={fields.find((f) => f.id === selectedField)?.content || ''}
                      onChange={(e) => handleFieldChange(selectedField, 'content', e.target.value)}
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Font Size (px)</Form.Label>
                    <Form.Control
                      type="number"
                      value={fields.find((f) => f.id === selectedField)?.fontSize || 12}
                      onChange={(e) => handleFieldChange(selectedField, 'fontSize', e.target.value)}
                      min="8"
                      max="24"
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Width (px)</Form.Label>
                    <Form.Control
                      type="number"
                      value={fields.find((f) => f.id === selectedField)?.width || 400}
                      onChange={(e) => handleFieldChange(selectedField, 'width', e.target.value)}
                      min="100"
                      max="600"
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
                  <Form.Group className="mb-2">
                    <Form.Check
                      type="checkbox"
                      label="Bold"
                      checked={fields.find((f) => f.id === selectedField)?.isBold || false}
                      onChange={(e) => handleFieldChange(selectedField, 'isBold', e.target.checked)}
                    />
                  </Form.Group>
                </>
              )}
            </div>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default PdfEditor;