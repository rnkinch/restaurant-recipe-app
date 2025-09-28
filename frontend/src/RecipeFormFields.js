import React from 'react';
import { Form, Card, Button, Row, Col } from 'react-bootstrap';

const RecipeFormFields = ({
  formData,
  setFormData,
  handleInputChange,
  handleCheckboxChange,
  handleImageChange,
  handleRemoveImage,
  previewImage,
  imageStyle,
  defaultImage = '/default_image.png',
  apiUrl,
  excludeName = false,
  headerStyle,
  hrStyle,
  isRightColumn = false,
  validationErrors = {}
}) => {
  const allergensOptions = ['Gluten', 'Dairy', 'Nuts', 'Shellfish', 'Eggs', 'Soy', 'Fish'];
  const serviceTypesOptions = ['Brunch', 'Bar', 'Catering', 'Lunch', 'Dinner', 'Special'];

  return (
    <>
      {!isRightColumn && !excludeName && (
        <>
          <Form.Group className="mb-3">
            <Form.Label style={headerStyle}>Name</Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              isInvalid={!!validationErrors.name}
              required
            />
            {validationErrors.name && (
              <Form.Control.Feedback type="invalid">
                {validationErrors.name}
              </Form.Control.Feedback>
            )}
          </Form.Group>
          <hr style={hrStyle} />
        </>
      )}
      {!isRightColumn && (
        <>
          <Form.Group className="mb-3">
            <Form.Label style={headerStyle}>Preparation Steps</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              name="steps"
              value={formData.steps}
              onChange={handleInputChange}
              isInvalid={!!validationErrors.steps}
              required
            />
            {validationErrors.steps && (
              <Form.Control.Feedback type="invalid">
                {validationErrors.steps}
              </Form.Control.Feedback>
            )}
          </Form.Group>
          <hr style={hrStyle} />
          <Form.Group className="mb-3">
            <Form.Label style={headerStyle}>Plating Guide</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              name="platingGuide"
              value={formData.platingGuide}
              onChange={handleInputChange}
              isInvalid={!!validationErrors.platingGuide}
              required
            />
            {validationErrors.platingGuide && (
              <Form.Control.Feedback type="invalid">
                {validationErrors.platingGuide}
              </Form.Control.Feedback>
            )}
          </Form.Group>
          <hr style={hrStyle} />
        </>
      )}
      {isRightColumn && (
        <>
          <hr style={hrStyle} />
          <Form.Group className="mb-3">
            <Form.Label style={headerStyle}>Image</Form.Label>
            {previewImage && (
              <Card className="mb-3" style={{ maxWidth: '300px' }}>
                <Card.Img
                  variant="top"
                  src={previewImage.startsWith('/uploads/') ? `${apiUrl}${previewImage}` : previewImage}
                  alt="Preview"
                  style={imageStyle}
                  onError={(e) => { e.target.src = defaultImage; }}
                />
              </Card>
            )}
            <Form.Control
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleImageChange}
              className="mb-2"
            />
            {previewImage !== defaultImage && (
              <Button variant="outline-danger" size="sm" onClick={handleRemoveImage}>
                Remove Image
              </Button>
            )}
          </Form.Group>
          <hr style={hrStyle} />
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label style={headerStyle}>Allergens</Form.Label>
                {allergensOptions.map(option => (
                  <Form.Check
                    key={option}
                    type="checkbox"
                    label={option}
                    value={option}
                    checked={formData.allergens.includes(option)}
                    onChange={(e) => handleCheckboxChange(e, 'allergens')}
                  />
                ))}
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label style={headerStyle}>Service Types</Form.Label>
                {serviceTypesOptions.map(option => (
                  <Form.Check
                    key={option}
                    type="checkbox"
                    label={option}
                    value={option}
                    checked={formData.serviceTypes.includes(option)}
                    onChange={(e) => handleCheckboxChange(e, 'serviceTypes')}
                  />
                ))}
              </Form.Group>
            </Col>
          </Row>
        </>
      )}
    </>
  );
};

export default RecipeFormFields;