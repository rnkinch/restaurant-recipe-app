import React from 'react';
import { Row, Col, Form, Button } from 'react-bootstrap';

const PropertiesPanel = ({ selectedShape, selectedShapes, onPropertyChange, onClose }) => {
  if (!selectedShape && (!selectedShapes || selectedShapes.length === 0)) {
    return (
      <div style={{ 
        marginTop: '1rem', 
        padding: '1rem', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '0.25rem',
        textAlign: 'center',
        color: '#666'
      }}>
        Select a shape to edit its properties
      </div>
    );
  }

  // Handle multi-select
  if (selectedShapes && selectedShapes.length > 1) {
    return (
      <div style={{ 
        marginTop: '1rem', 
        padding: '0.5rem', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '0.25rem',
        border: '2px solid #007bff',
        fontSize: '0.8rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h6 style={{ margin: 0 }}>Multi-Select: {selectedShapes.length} items</h6>
          <Button variant="outline-secondary" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        {/* Bulk editing controls */}
        <div className="mb-3">
          <h6 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Bulk Edit Properties</h6>
          
          {/* Font Size for text elements */}
          {selectedShapes.some(shape => shape.type === 'text') && (
            <div className="mb-2">
              <Form.Label style={{ fontSize: '0.75rem' }}>Font Size</Form.Label>
              <Form.Control
                type="number"
                min="8"
                max="72"
                placeholder="Font size"
                onChange={(e) => {
                  const fontSize = parseInt(e.target.value);
                  selectedShapes.forEach(shape => {
                    if (shape.type === 'text') {
                      onPropertyChange(shape.id, 'fontSize', fontSize);
                    }
                  });
                }}
              />
            </div>
          )}

          {/* Bold toggle for text elements */}
          {selectedShapes.some(shape => shape.type === 'text') && (
            <div className="mb-2">
              <Form.Check
                type="checkbox"
                label="Bold Text"
                style={{ fontSize: '0.75rem' }}
                onChange={(e) => {
                  selectedShapes.forEach(shape => {
                    if (shape.type === 'text') {
                      onPropertyChange(shape.id, 'isBold', e.target.checked);
                    }
                  });
                }}
              />
            </div>
          )}

          {/* Fill Color for shapes */}
          {selectedShapes.some(shape => shape.type !== 'image') && (
            <div className="mb-2">
              <Form.Label style={{ fontSize: '0.75rem' }}>Fill Color</Form.Label>
              <Form.Control
                type="color"
                onChange={(e) => {
                  selectedShapes.forEach(shape => {
                    if (shape.type !== 'image') {
                      onPropertyChange(shape.id, 'fill', e.target.value);
                    }
                  });
                }}
              />
            </div>
          )}

          {/* Stroke Color for shapes */}
          {selectedShapes.some(shape => shape.type !== 'image') && (
            <div className="mb-2">
              <Form.Label style={{ fontSize: '0.75rem' }}>Stroke Color</Form.Label>
              <Form.Control
                type="color"
                onChange={(e) => {
                  selectedShapes.forEach(shape => {
                    if (shape.type !== 'image') {
                      onPropertyChange(shape.id, 'stroke', e.target.value);
                    }
                  });
                }}
              />
            </div>
          )}

          {/* Opacity for all elements */}
          <div className="mb-2">
            <Form.Label style={{ fontSize: '0.75rem' }}>Opacity</Form.Label>
            <Form.Control
              type="range"
              min="0"
              max="1"
              step="0.1"
              defaultValue="1"
              onChange={(e) => {
                selectedShapes.forEach(shape => {
                  onPropertyChange(shape.id, 'opacity', parseFloat(e.target.value));
                });
              }}
            />
          </div>
        </div>

        {/* List of selected items */}
        <div>
          <h6 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Selected Items:</h6>
          <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
            {selectedShapes.map(shape => (
              <div key={shape.id} style={{ 
                fontSize: '0.7rem', 
                padding: '0.25rem', 
                margin: '0.25rem 0',
                backgroundColor: '#e9ecef',
                borderRadius: '0.25rem'
              }}>
                <strong>{shape.type}</strong> - {shape.id}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const handlePropertyChange = (property, value) => {
    onPropertyChange(selectedShape.id, property, value);
  };

  const renderShapeSpecificProperties = () => {
    switch (selectedShape.type) {
      case 'rectangle':
        return (
          <>
            <Col md={6}>
              <Form.Group>
                <Form.Label style={{ fontSize: '0.75rem' }}>Width</Form.Label>
                <Form.Control
                  type="number"
                  value={selectedShape.width || 0}
                  onChange={(e) => handlePropertyChange('width', parseFloat(e.target.value))}
                  min="1"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label style={{ fontSize: '0.75rem' }}>Height</Form.Label>
                <Form.Control
                  type="number"
                  value={selectedShape.height || 0}
                  onChange={(e) => handlePropertyChange('height', parseFloat(e.target.value))}
                  min="1"
                />
              </Form.Group>
            </Col>
          </>
        );

      case 'circle':
        return (
          <Col md={6}>
            <Form.Group>
              <Form.Label>Radius</Form.Label>
              <Form.Control
                type="number"
                value={selectedShape.radius || 0}
                onChange={(e) => handlePropertyChange('radius', parseFloat(e.target.value))}
                min="1"
              />
            </Form.Group>
          </Col>
        );

      case 'line':
        return (
          <>
            <Col md={6}>
              <Form.Group>
                <Form.Label>X2</Form.Label>
                <Form.Control
                  type="number"
                  value={selectedShape.points?.[2] || 0}
                  onChange={(e) => {
                    const newPoints = [...selectedShape.points];
                    newPoints[2] = parseFloat(e.target.value);
                    handlePropertyChange('points', newPoints);
                  }}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Y2</Form.Label>
                <Form.Control
                  type="number"
                  value={selectedShape.points?.[3] || 0}
                  onChange={(e) => {
                    const newPoints = [...selectedShape.points];
                    newPoints[3] = parseFloat(e.target.value);
                    handlePropertyChange('points', newPoints);
                  }}
                />
              </Form.Group>
            </Col>
          </>
        );

      case 'text':
        // Check if this is a recipe field that shouldn't be editable
        const isRecipeField = ['recipe-title', 'ingredients-content', 'steps-content', 'plating-guide-content', 'allergens-content', 'service-types-content'].includes(selectedShape.id);
        
        return (
          <>
            <Col md={12}>
              <Form.Group>
                <Form.Label>Text Content {isRecipeField && <small className="text-muted">(Recipe Data)</small>}</Form.Label>
                <Form.Control
                  type="text"
                  value={selectedShape.text || ''}
                  onChange={(e) => handlePropertyChange('text', e.target.value)}
                  readOnly={isRecipeField}
                  disabled={isRecipeField}
                  title={isRecipeField ? 'Recipe data cannot be edited here. Use the recipe form to modify.' : ''}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label style={{ fontSize: '0.75rem' }}>Font Size</Form.Label>
                <Form.Control
                  type="number"
                  value={selectedShape.fontSize || 16}
                  onChange={(e) => handlePropertyChange('fontSize', parseInt(e.target.value))}
                  min="8"
                  max="72"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label style={{ fontSize: '0.75rem' }}>Width</Form.Label>
                <Form.Control
                  type="number"
                  value={selectedShape.width || 300}
                  onChange={(e) => handlePropertyChange('width', parseFloat(e.target.value))}
                  min="50"
                  max="600"
                />
              </Form.Group>
            </Col>
          </>
        );

      case 'image':
        return (
          <>
            <Col md={6}>
              <Form.Group>
                <Form.Label style={{ fontSize: '0.75rem' }}>Width</Form.Label>
                <Form.Control
                  type="number"
                  value={selectedShape.width || 100}
                  onChange={(e) => handlePropertyChange('width', parseFloat(e.target.value))}
                  min="50"
                  max="600"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label style={{ fontSize: '0.75rem' }}>Height</Form.Label>
                <Form.Control
                  type="number"
                  value={selectedShape.height || 100}
                  onChange={(e) => handlePropertyChange('height', parseFloat(e.target.value))}
                  min="50"
                  max="600"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label style={{ fontSize: '0.75rem' }}>Opacity</Form.Label>
                <Form.Control
                  type="number"
                  value={selectedShape.opacity || 1}
                  onChange={(e) => handlePropertyChange('opacity', parseFloat(e.target.value))}
                  min="0"
                  max="1"
                  step="0.1"
                />
              </Form.Group>
            </Col>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ 
      marginTop: '1rem', 
      padding: '0.5rem', 
      backgroundColor: '#f8f9fa', 
      borderRadius: '0.25rem',
      border: '2px solid #007bff',
      fontSize: '0.8rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h6 style={{ margin: 0 }}>Properties: {selectedShape.type}</h6>
        <Button variant="outline-secondary" size="sm" onClick={onClose}>
          ✕
        </Button>
      </div>

      <Row>
        {/* Common Properties */}
        <Col md={6}>
          <Form.Group>
                <Form.Label style={{ fontSize: '0.75rem' }}>X Position</Form.Label>
            <Form.Control
              type="number"
              value={selectedShape.x || 0}
              onChange={(e) => handlePropertyChange('x', parseFloat(e.target.value))}
              step="0.1"
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group>
                <Form.Label style={{ fontSize: '0.75rem' }}>Y Position</Form.Label>
            <Form.Control
              type="number"
              value={selectedShape.y || 0}
              onChange={(e) => handlePropertyChange('y', parseFloat(e.target.value))}
              step="0.1"
            />
          </Form.Group>
        </Col>

        {/* Fill Color */}
        <Col md={6}>
          <Form.Group>
                <Form.Label style={{ fontSize: '0.75rem' }}>Fill Color</Form.Label>
            <Form.Control
              type="color"
              value={selectedShape.fill || '#ffffff'}
              onChange={(e) => handlePropertyChange('fill', e.target.value)}
            />
          </Form.Group>
        </Col>

        {/* Stroke Color */}
        <Col md={6}>
          <Form.Group>
                <Form.Label style={{ fontSize: '0.75rem' }}>Stroke Color</Form.Label>
            <Form.Control
              type="color"
              value={selectedShape.stroke || '#000000'}
              onChange={(e) => handlePropertyChange('stroke', e.target.value)}
            />
          </Form.Group>
        </Col>

        {/* Stroke Width */}
        <Col md={6}>
          <Form.Group>
                <Form.Label style={{ fontSize: '0.75rem' }}>Stroke Width</Form.Label>
            <Form.Control
              type="number"
              value={selectedShape.strokeWidth || 1}
              onChange={(e) => handlePropertyChange('strokeWidth', parseFloat(e.target.value))}
              min="0"
              max="10"
              step="0.1"
            />
          </Form.Group>
        </Col>

        {/* Shape-specific properties */}
        {renderShapeSpecificProperties()}
      </Row>

      {/* Shape Info */}
      <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: '#e9ecef', borderRadius: '0.25rem' }}>
        <small style={{ color: '#666' }}>
          <strong>ID:</strong> {selectedShape.id} | 
          <strong> Type:</strong> {selectedShape.type} | 
          <strong> Layer:</strong> {selectedShape.zIndex || 1}
        </small>
      </div>
    </div>
  );
};

export default PropertiesPanel;
