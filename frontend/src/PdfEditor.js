import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
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
};

const Field = ({ field, index, setFields, selectedField, setSelectedField }) => {
  const dragTimeoutRef = useRef(null);
  const dragStateRef = useRef(null);

  const [{ isDragging }, drag] = useDrag({
    type: 'field',
    item: { id: field.id, index, x: field.x, y: field.y },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      const delta = monitor.getDifferenceFromInitialOffset();
      if (delta && item.id === field.id) {
        if (dragTimeoutRef.current) {
          clearTimeout(dragTimeoutRef.current);
        }
        dragTimeoutRef.current = setTimeout(() => {
          setFields((prev) => {
            const newFields = [...prev];
            const maxWidth = field.isImage ? field.width : 400;
            const maxHeight = field.isImage ? field.height : 20;
            newFields[index] = {
              ...newFields[index],
              x: Math.max(0, Math.min(842 - maxWidth, newFields[index].x + delta.x)),
              y: Math.max(0, Math.min(595 - maxHeight, newFields[index].y + delta.y)),
            };
            console.log('Field moved:', JSON.stringify(newFields[index], null, 2));
            dragStateRef.current = null;
            return newFields;
          });
        }, 300);
        dragStateRef.current = { index, x: delta.x, y: delta.y };
      }
    },
  });

  const [, drop] = useDrop({
    accept: 'field',
    hover: (item, monitor) => {
      if (item.index !== index && !monitor.isOver({ shallow: true }) && !dragStateRef.current) {
        if (dragTimeoutRef.current) {
          clearTimeout(dragTimeoutRef.current);
        }
        dragTimeoutRef.current = setTimeout(() => {
          setFields((prev) => {
            const newFields = [...prev];
            [newFields[item.index], newFields[index]] = [newFields[index], newFields[item.index]];
            console.log('Fields reordered:', JSON.stringify(newFields, null, 2));
            return newFields;
          });
          item.index = index;
        }, 300);
      }
    },
  });

  console.log('Rendering field:', JSON.stringify(field, null, 2));

  return (
    <div
      ref={(node) => drag(drop(node))}
      style={{
        position: 'absolute',
        left: field.x,
        top: field.y,
        opacity: isDragging ? 0.5 : 1,
        border: selectedField === field.id ? '2px solid blue' : '1px dashed #ccc',
        padding: 5,
        background: '#fff',
        cursor: 'move',
        maxWidth: field.isImage ? field.width : '400px',
        whiteSpace: field.isImage ? 'normal' : 'pre-wrap',
        fontSize: field.fontSize ? `${field.fontSize}px` : '12px',
        fontWeight: field.isBold ? 'bold' : 'normal',
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
          alt="Recipe"
          style={{ width: field.width, height: field.height }}
          onError={(e) => console.error('Image load error:', field.content)}
        />
      ) : (
        field.content
      )}
    </div>
  );
};

const PdfEditor = ({ recipe }) => {
  const apiUrl = process.env.REACT_APP_API_URL || 'http://192.168.68.129:5000';
  const frontendUrl = 'http://192.168.68.129:3000';
  const [fields, setFields] = useState([]);
  const [selectedField, setSelectedField] = useState(null);
  const [newTextId, setNewTextId] = useState(1);
  const [imageError, setImageError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('useEffect triggered for recipe ID:', recipe?._id);
    console.log('Recipe data:', JSON.stringify(recipe, null, 2));

    let imageUrl = recipe?.image
      ? `${apiUrl}/Uploads/${recipe.image.split('/').pop()}`
      : `${frontendUrl}/logo.png`; // Use /logo.png for default
    console.log('Trying image URL:', imageUrl);

    // Validate image URL
    const validateImage = async () => {
      try {
        const imgRes = await fetch(imageUrl, {
          method: 'HEAD',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!imgRes.ok) {
          throw new Error(`Image fetch failed: ${imgRes.status}`);
        }
      } catch (err) {
        console.error('Image validation failed:', imageUrl, err.message);
        setImageError(`Image not found: ${imageUrl}`);
      }
    };
    validateImage();

    const defaultFields = [
      { id: 'titleLabel', content: 'Recipe Title:', x: 20, y: 10, fontSize: 12, isBold: false },
      { id: 'title', content: 'Recipe Title', x: 20, y: 30, fontSize: 12, isBold: false },
      { id: 'ingredientsLabel', content: 'Ingredients:', x: 20, y: 60, fontSize: 12, isBold: false },
      {
        id: 'ingredients',
        content: 'No ingredients',
        x: 20,
        y: 80,
        fontSize: 12,
        isBold: false,
      },
      { id: 'stepsLabel', content: 'Steps:', x: 20, y: 190, fontSize: 12, isBold: false },
      { id: 'steps', content: 'No steps', x: 20, y: 210, fontSize: 12, isBold: false },
      { id: 'platingGuideLabel', content: 'Plating Guide:', x: 20, y: 320, fontSize: 12, isBold: false },
      {
        id: 'platingGuide',
        content: 'No plating guide',
        x: 20,
        y: 340,
        fontSize: 12,
        isBold: false,
      },
      { id: 'allergensLabel', content: 'Allergens:', x: 450, y: 10, fontSize: 12, isBold: false },
      {
        id: 'allergens',
        content: 'No allergens',
        x: 450,
        y: 30,
        fontSize: 12,
        isBold: false,
      },
      { id: 'serviceTypesLabel', content: 'Service Types:', x: 450, y: 60, fontSize: 12, isBold: false },
      {
        id: 'serviceTypes',
        content: 'No service types',
        x: 450,
        y: 80,
        fontSize: 12,
        isBold: false,
      },
      {
        id: 'image',
        content: imageUrl,
        x: 450,
        y: 110,
        width: 100,
        height: 100,
        isImage: true,
      },
    ];

    const fetchTemplate = async () => {
      try {
        const timestamp = Date.now();
        console.log('Fetching default template from:', `${apiUrl}/templates/default?t=${timestamp}`);
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
          console.log('Fetched default template:', JSON.stringify(templateData, null, 2));
          if (templateData?.template?.fields) {
            const savedFields = templateData.template.fields;
            const updatedFields = defaultFields.map((defaultField) => {
              const savedField = savedFields.find((f) => f.id === defaultField.id);
              if (savedField) {
                return {
                  ...defaultField,
                  x: savedField.x,
                  y: savedField.y,
                  fontSize: savedField.fontSize || defaultField.fontSize,
                  isBold: savedField.isBold || defaultField.isBold,
                  width: savedField.width || defaultField.width,
                  height: savedField.height || defaultField.height,
                  content: savedField.content || defaultField.content,
                };
              }
              return defaultField;
            });
            const customFields = savedFields.filter((f) => !defaultFields.some((df) => df.id === f.id));
            setFields([...updatedFields, ...customFields]);
          } else {
            console.warn('No template fields found, using default fields');
            setFields(defaultFields);
          }
        } else {
          const errorText = await res.text();
          console.error('Default template fetch failed:', res.status, res.statusText, errorText);
          setFields(defaultFields);
        }
      } catch (err) {
        console.error('Failed to load default template:', err.message, err.stack);
        setFields(defaultFields);
      }
    };

    fetchTemplate();
  }, [recipe, apiUrl, frontendUrl]);

  const addTextField = useCallback(() => {
    const newField = {
      id: `customText${newTextId}`,
      content: 'New Text',
      x: 20,
      y: 20,
      fontSize: 12,
      isBold: false,
    };
    setFields((prev) => [...prev, newField]);
    setNewTextId((prev) => prev + 1);
    console.log('Added text field:', newField);
  }, [newTextId]);

  const deleteTextField = useCallback(() => {
    if (selectedField && selectedField.startsWith('customText')) {
      setFields((prev) => prev.filter((field) => field.id !== selectedField));
      setSelectedField(null);
      console.log('Deleted text field:', selectedField);
    }
  }, [selectedField]);

  const handleFieldChange = useCallback((id, key, value) => {
    setFields((prev) => {
      const newFields = prev.map((field) =>
        field.id === id
          ? {
              ...field,
              [key]: key === 'fontSize' ? parseInt(value) || field.fontSize :
                     key === 'width' || key === 'height' ? Math.min(parseInt(value) || field[key], 600) : value,
            }
          : field
      );
      console.log('Fields updated:', JSON.stringify(newFields, null, 2));
      return newFields;
    });
  }, []);

  const handleSave = useCallback(async () => {
    try {
      const templatePayload = { template: { fields } };
      console.log('Saving default template to /templates/default/save:', JSON.stringify(templatePayload, null, 2));
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
        throw new Error(`HTTP error: ${response.status} - ${response.statusText} - ${errorText}`);
      }
      const saveData = await response.json();
      console.log('Save default response:', JSON.stringify(saveData, null, 2));
      alert('Default template saved successfully!');
    } catch (err) {
      console.error('Save default failed:', err.message, err.stack);
      alert(`Save failed: ${err.message}`);
    }
  }, [fields, apiUrl]);

  const handleResetToDefault = useCallback(async () => {
    try {
      const timestamp = Date.now();
      console.log('Fetching default template for reset:', `${apiUrl}/templates/default?t=${timestamp}`);
      const res = await fetch(`${apiUrl}/templates/default?t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      if (!res.ok) {
        console.error('Default template fetch failed:', res.status, res.statusText);
        const defaultFields = [
          { id: 'titleLabel', content: 'Recipe Title:', x: 20, y: 10, fontSize: 12, isBold: false },
          { id: 'title', content: 'Recipe Title', x: 20, y: 30, fontSize: 12, isBold: false },
          { id: 'ingredientsLabel', content: 'Ingredients:', x: 20, y: 60, fontSize: 12, isBold: false },
          {
            id: 'ingredients',
            content: 'No ingredients',
            x: 20,
            y: 80,
            fontSize: 12,
            isBold: false,
          },
          { id: 'stepsLabel', content: 'Steps:', x: 20, y: 190, fontSize: 12, isBold: false },
          { id: 'steps', content: 'No steps', x: 20, y: 210, fontSize: 12, isBold: false },
          { id: 'platingGuideLabel', content: 'Plating Guide:', x: 20, y: 320, fontSize: 12, isBold: false },
          {
            id: 'platingGuide',
            content: 'No plating guide',
            x: 20,
            y: 340,
            fontSize: 12,
            isBold: false,
          },
          { id: 'allergensLabel', content: 'Allergens:', x: 450, y: 10, fontSize: 12, isBold: false },
          {
            id: 'allergens',
            content: 'No allergens',
            x: 450,
            y: 30,
            fontSize: 12,
            isBold: false,
          },
          { id: 'serviceTypesLabel', content: 'Service Types:', x: 450, y: 60, fontSize: 12, isBold: false },
          {
            id: 'serviceTypes',
            content: 'No service types',
            x: 450,
            y: 80,
            fontSize: 12,
            isBold: false,
          },
          {
            id: 'image',
            content: `${frontendUrl}/logo.png`,
            x: 450,
            y: 110,
            width: 100,
            height: 100,
            isImage: true,
          },
        ];
        setFields(defaultFields);
        console.log('Reset to default fields:', JSON.stringify(defaultFields, null, 2));
        const saveResponse = await fetch(`${apiUrl}/templates/default/save?t=${Date.now()}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
          body: JSON.stringify({ template: { fields: defaultFields } }),
        });
        if (!saveResponse.ok) {
          const errorText = await saveResponse.text();
          throw new Error(`HTTP error: ${saveResponse.status} - ${saveResponse.statusText} - ${errorText}`);
        }
        const saveData = await saveResponse.json();
        console.log('Save default response for reset:', JSON.stringify(saveData, null, 2));
        alert('Default template reset to default!');
      } else {
        const templateData = await res.json();
        console.log('Fetched default template for reset:', JSON.stringify(templateData, null, 2));
        const defaultFields = templateData?.template?.fields || [
          { id: 'titleLabel', content: 'Recipe Title:', x: 20, y: 10, fontSize: 12, isBold: false },
          { id: 'title', content: 'Recipe Title', x: 20, y: 30, fontSize: 12, isBold: false },
          { id: 'ingredientsLabel', content: 'Ingredients:', x: 20, y: 60, fontSize: 12, isBold: false },
          {
            id: 'ingredients',
            content: 'No ingredients',
            x: 20,
            y: 80,
            fontSize: 12,
            isBold: false,
          },
          { id: 'stepsLabel', content: 'Steps:', x: 20, y: 190, fontSize: 12, isBold: false },
          { id: 'steps', content: 'No steps', x: 20, y: 210, fontSize: 12, isBold: false },
          { id: 'platingGuideLabel', content: 'Plating Guide:', x: 20, y: 320, fontSize: 12, isBold: false },
          {
            id: 'platingGuide',
            content: 'No plating guide',
            x: 20,
            y: 340,
            fontSize: 12,
            isBold: false,
          },
          { id: 'allergensLabel', content: 'Allergens:', x: 450, y: 10, fontSize: 12, isBold: false },
          {
            id: 'allergens',
            content: 'No allergens',
            x: 450,
            y: 30,
            fontSize: 12,
            isBold: false,
          },
          { id: 'serviceTypesLabel', content: 'Service Types:', x: 450, y: 60, fontSize: 12, isBold: false },
          {
            id: 'serviceTypes',
            content: 'No service types',
            x: 450,
            y: 80,
            fontSize: 12,
            isBold: false,
          },
          {
            id: 'image',
            content: `${frontendUrl}/logo.png`,
            x: 450,
            y: 110,
            width: 100,
            height: 100,
            isImage: true,
          },
        ];
        setFields(defaultFields);
        console.log('Reset to default fields:', JSON.stringify(defaultFields, null, 2));
        const saveResponse = await fetch(`${apiUrl}/templates/default/save?t=${Date.now()}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
          body: JSON.stringify({ template: { fields: defaultFields } }),
        });
        if (!saveResponse.ok) {
          const errorText = await saveResponse.text();
          throw new Error(`HTTP error: ${saveResponse.status} - ${saveResponse.statusText} - ${errorText}`);
        }
        const saveData = await saveResponse.json();
        console.log('Save default response for reset:', JSON.stringify(saveData, null, 2));
        alert('Default template reset to default!');
      }
    } catch (err) {
      console.error('Reset to default failed:', err.message, err.stack);
      alert(`Reset to default failed: ${err.message}`);
    }
  }, [recipe, apiUrl, frontendUrl]);

  const memoizedFields = useMemo(() => fields, [fields]);

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Edit PDF Template</h2>
      {imageError && (
        <div style={{ color: 'red', marginBottom: '1rem' }}>
          {imageError}
        </div>
      )}
      <Row>
        <Col md={9}>
          <DndProvider backend={HTML5Backend}>
            <div
              style={{
                position: 'relative',
                width: '842px', // A4 landscape width
                height: '595px', // A4 landscape height
                border: '1px solid #ccc',
                background: '#fff',
                marginBottom: '1rem',
              }}
              onClick={() => setSelectedField(null)}
            >
              {memoizedFields.map((field, index) => (
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
          <Button onClick={addTextField} variant="secondary" size="sm" style={{ marginBottom: '0.5rem' }}>
            Add Text Field
          </Button>
          {selectedField && selectedField.startsWith('customText') && (
            <Button onClick={deleteTextField} variant="danger" size="sm" style={{ marginBottom: '0.5rem', marginLeft: '0.5rem' }}>
              Delete Text Field
            </Button>
          )}
          {selectedField && (
            <div style={{ marginTop: '50px' }}>
              <h4>Edit {fields.find((f) => f.id === selectedField)?.id}</h4>
              {!fields.find((f) => f.id === selectedField)?.isImage ? (
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
                    <Form.Check
                      type="checkbox"
                      label="Bold"
                      checked={fields.find((f) => f.id === selectedField)?.isBold || false}
                      onChange={(e) => handleFieldChange(selectedField, 'isBold', e.target.checked)}
                    />
                  </Form.Group>
                </>
              ) : (
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
                    <Form.Label>Height (px)</Form.Label>
                    <Form.Control
                      type="number"
                      value={fields.find((f) => f.id === selectedField)?.height || 100}
                      onChange={(e) => handleFieldChange(selectedField, 'height', e.target.value)}
                      min="50"
                      max="600"
                    />
                  </Form.Group>
                </>
              )}
            </div>
          )}
        </Col>
      </Row>
      <div style={{ marginTop: '1rem' }}>
        <Button onClick={handleSave} variant="primary" size="sm">
          Save Template
        </Button>
        <Button onClick={handleResetToDefault} variant="primary" size="sm" style={{ marginLeft: '0.5rem' }}>
          Reset to Default
        </Button>
        <Button
          as={Link}
          to={`/recipes/${recipe._id}/preview-pdf`}
          variant="info"
          size="sm"
          style={{ marginLeft: '0.5rem' }}
          onClick={(e) => {
            e.preventDefault();
            setTimeout(() => navigate(`/recipes/${recipe._id}/preview-pdf`), 500);
          }}
        >
          Preview PDF
        </Button>
      </div>
    </div>
  );
};

export default PdfEditor;