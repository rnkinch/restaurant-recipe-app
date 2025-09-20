import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Container, Alert, Form, Modal, Spinner, Row, Col } from 'react-bootstrap';
import { getPurveyors, createPurveyor, deletePurveyor, createIngredient, deleteIngredient, checkIngredientUsage, getIngredients, updateIngredient } from './api';

const Purveyors = () => {
  const [purveyors, setPurveyors] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddPurveyorModal, setShowAddPurveyorModal] = useState(false);
  const [showAddIngredientModal, setShowAddIngredientModal] = useState(false);
  const [showEditIngredientModal, setShowEditIngredientModal] = useState(false);
  const [newPurveyor, setNewPurveyor] = useState({ name: '' });
  const [newIngredient, setNewIngredient] = useState({ name: '', purveyorId: '' });
  const [editIngredient, setEditIngredient] = useState({ id: '', name: '', purveyorId: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPurveyorId, setSelectedPurveyorId] = useState(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [purveyorsData, ingredientsData] = await Promise.all([
          getPurveyors(),
          getIngredients()
        ]);
        console.log('Loaded purveyors:', purveyorsData);
        console.log('Loaded ingredients:', ingredientsData);
        const validPurveyors = purveyorsData.filter(p => p._id && typeof p._id === 'string' && p.name && typeof p.name === 'string');
        const purveyorsWithIngredients = validPurveyors.map(p => ({
          ...p,
          ingredients: ingredientsData.filter(i => i.purveyor?._id?.toString() === p._id.toString())
        }));
        setPurveyors(purveyorsWithIngredients);
        setIngredients(ingredientsData);
        setLoading(false);
        if (purveyorsData.length !== validPurveyors.length) {
          console.warn('Some purveyors were filtered out due to missing or invalid _id/name:', purveyorsData);
        }
      } catch (err) {
        setError('Failed to load data: ' + err.message);
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const handleAddPurveyor = async (e) => {
    e.preventDefault();
    try {
      if (!newPurveyor.name.trim()) {
        setError('Purveyor name is required');
        return;
      }
      const purveyor = await createPurveyor(newPurveyor);
      setPurveyors([...purveyors, { ...purveyor, ingredients: [] }]);
      setNewPurveyor({ name: '' });
      setShowAddPurveyorModal(false);
      setError(null);
    } catch (err) {
      setError('Failed to add purveyor: ' + err.message);
    }
  };

  const handleDeletePurveyor = async (id) => {
    try {
      await deletePurveyor(id);
      setPurveyors(purveyors.filter(p => p._id !== id));
      setError(null);
    } catch (err) {
      console.error('Delete purveyor error:', err.message);
      setError(err.response?.data?.error || 'Failed to delete purveyor: ' + err.message);
    }
  };

  const handleAddIngredient = async (e) => {
    e.preventDefault();
    try {
      if (!newIngredient.name.trim() || !newIngredient.purveyorId) {
        setError('Ingredient name and purveyor are required');
        return;
      }
      console.log('Adding ingredient:', newIngredient);
      const ingredient = await createIngredient(newIngredient.name, newIngredient.purveyorId);
      console.log('Created ingredient:', ingredient);
      setIngredients([...ingredients, ingredient]);
      setPurveyors(purveyors.map(p => {
        if (p._id === newIngredient.purveyorId) {
          return { ...p, ingredients: [...(p.ingredients || []), ingredient] };
        }
        return p;
      }));
      setNewIngredient({ name: '', purveyorId: '' });
      setShowAddIngredientModal(false);
      setError(null);
    } catch (err) {
      console.error('Add ingredient error:', err.message);
      setError('Failed to add ingredient: ' + err.message);
    }
  };

  const handleEditIngredient = async (e) => {
    e.preventDefault();
    try {
      if (!editIngredient.name.trim() || !editIngredient.purveyorId) {
        setError('Ingredient name and purveyor are required');
        return;
      }
      console.log('Editing ingredient:', editIngredient);
      const updatedIngredient = await updateIngredient(editIngredient.id, editIngredient.name, editIngredient.purveyorId);
      console.log('Updated ingredient:', updatedIngredient);
      setIngredients(ingredients.map(i => 
        i._id === editIngredient.id ? { ...i, name: editIngredient.name, purveyor: { _id: editIngredient.purveyorId, name: purveyors.find(p => p._id === editIngredient.purveyorId)?.name || 'Unknown' } } : i
      ));
      setPurveyors(purveyors.map(p => {
        if (p.ingredients.some(i => i._id === editIngredient.id)) {
          return {
            ...p,
            ingredients: p.ingredients.filter(i => i._id !== editIngredient.id)
          };
        }
        if (p._id === editIngredient.purveyorId) {
          return {
            ...p,
            ingredients: [...p.ingredients, { _id: editIngredient.id, name: editIngredient.name, purveyor: { _id: editIngredient.purveyorId } }]
          };
        }
        return p;
      }));
      setEditIngredient({ id: '', name: '', purveyorId: '' });
      setShowEditIngredientModal(false);
      setError(null);
    } catch (err) {
      console.error('Edit ingredient error:', err.message);
      setError('Failed to edit ingredient: ' + err.message);
    }
  };

  const handleDeleteIngredient = async (purveyorId, ingredientId) => {
    try {
      const isInUse = await checkIngredientUsage(ingredientId);
      if (isInUse) {
        setError('Cannot delete ingredient: it is used in active recipes');
        return;
      }
      await deleteIngredient(ingredientId);
      setIngredients(ingredients.filter(i => i._id !== ingredientId));
      setPurveyors(purveyors.map(p => {
        if (p._id === purveyorId) {
          return { ...p, ingredients: p.ingredients.filter(i => i._id !== ingredientId) };
        }
        return p;
      }));
      setError(null);
    } catch (err) {
      console.error('Delete ingredient error:', err.message);
      setError(err.response?.data?.error || 'Failed to delete ingredient: ' + err.message);
    }
  };

  const filteredIngredients = searchQuery
    ? ingredients.filter(ing => ing.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  if (loading) return <Container className="py-3"><Spinner animation="border" /></Container>;
  if (error) return (
    <Container className="py-3">
      <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>
    </Container>
  );

  const headerStyle = { fontWeight: 'bold', fontSize: '16px' };
  const hrStyle = { borderTop: '2px solid #8a5a44', margin: '10px 0' };
  const baseFontSize = '16px';

  return (
    <Container className="py-3">
      <div className="mb-3">
        <h1>Purveyors</h1>
      </div>
      <Form.Group className="mb-3">
        <Form.Control
          type="text"
          placeholder="Search ingredients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          ref={searchInputRef}
        />
      </Form.Group>
      {searchQuery && filteredIngredients.length > 0 && (
        <Card className="mb-3">
          <Card.Body>
            <h2 style={headerStyle}>Search Results</h2>
            <hr style={hrStyle} />
            <ul style={{ fontSize: baseFontSize }}>
              {filteredIngredients.map(ingredient => {
                const purveyorName = purveyors.find(p => p._id === ingredient.purveyor?._id?.toString())?.name || 'Unknown';
                return (
                  <li key={ingredient._id}>
                    {ingredient.name} ({purveyorName})
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="ms-2"
                      onClick={() => {
                        setEditIngredient({ id: ingredient._id, name: ingredient.name, purveyorId: ingredient.purveyor?._id?.toString() });
                        setShowEditIngredientModal(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      className="ms-2"
                      onClick={() => handleDeleteIngredient(ingredient.purveyor?._id?.toString(), ingredient._id)}
                    >
                      Delete
                    </Button>
                  </li>
                );
              })}
            </ul>
          </Card.Body>
        </Card>
      )}
      <Button
        variant="primary"
        size="sm"
        className="mb-3"
        onClick={() => setShowAddPurveyorModal(true)}
      >
        Add Purveyor
      </Button>
      <Row>
        {purveyors.map(purveyor => (
          <Col key={purveyor._id} md={6}>
            <Card className="mb-3">
              <Card.Body>
                <h2 style={headerStyle}>{purveyor.name}</h2>
                <hr style={hrStyle} />
                <h3 style={headerStyle}>Ingredients</h3>
                <ul style={{ fontSize: baseFontSize }}>
                  {purveyor.ingredients && purveyor.ingredients.length > 0 ? (
                    purveyor.ingredients.map(ingredient => (
                      <li key={ingredient._id}>
                        {ingredient.name}
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="ms-2"
                          onClick={() => {
                            setEditIngredient({ id: ingredient._id, name: ingredient.name, purveyorId: purveyor._id });
                            setShowEditIngredientModal(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="ms-2"
                          onClick={() => handleDeleteIngredient(purveyor._id, ingredient._id)}
                        >
                          Delete
                        </Button>
                      </li>
                    ))
                  ) : (
                    <li>No ingredients</li>
                  )}
                </ul>
                <hr style={hrStyle} />
                <div className="d-flex justify-content-start">
                  <Button
                    variant="outline-danger"
                    size="sm"
                    className="me-2"
                    onClick={() => handleDeletePurveyor(purveyor._id)}
                  >
                    Delete Purveyor
                  </Button>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => {
                      setSelectedPurveyorId(purveyor._id);
                      setNewIngredient({ name: '', purveyorId: purveyor._id });
                      setShowAddIngredientModal(true);
                    }}
                  >
                    Add Ingredient
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Modal show={showAddPurveyorModal} onHide={() => setShowAddPurveyorModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Purveyor</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddPurveyor}>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={newPurveyor.name}
                onChange={(e) => setNewPurveyor({ name: e.target.value })}
                required
                placeholder="Enter purveyor name"
              />
            </Form.Group>
            <Button type="submit" variant="primary">Add Purveyor</Button>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal show={showAddIngredientModal} onHide={() => {
        setShowAddIngredientModal(false);
        setNewIngredient({ name: '', purveyorId: selectedPurveyorId || '' });
      }}>
        <Modal.Header closeButton>
          <Modal.Title>Add Ingredient</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddIngredient}>
            <Form.Group className="mb-3">
              <Form.Label>Ingredient Name</Form.Label>
              <Form.Control
                type="text"
                value={newIngredient.name}
                onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
                placeholder="Enter ingredient name"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Purveyor</Form.Label>
              <Form.Select
                value={newIngredient.purveyorId}
                onChange={(e) => setNewIngredient({ ...newIngredient, purveyorId: e.target.value })}
                required
              >
                <option value="">Select Purveyor</option>
                {purveyors.map(purveyor => (
                  <option key={purveyor._id} value={purveyor._id}>
                    {purveyor.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Button
              type="submit"
              variant="primary"
              disabled={!newIngredient.name.trim() || !newIngredient.purveyorId}
            >
              Add Ingredient
            </Button>
            {error && <Alert variant="danger" className="mt-2">{error}</Alert>}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowAddIngredientModal(false);
              setNewIngredient({ name: '', purveyorId: selectedPurveyorId || '' });
            }}
          >
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showEditIngredientModal} onHide={() => {
        setShowEditIngredientModal(false);
        setEditIngredient({ id: '', name: '', purveyorId: '' });
      }}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Ingredient</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleEditIngredient}>
            <Form.Group className="mb-3">
              <Form.Label>Ingredient Name</Form.Label>
              <Form.Control
                type="text"
                value={editIngredient.name}
                onChange={(e) => setEditIngredient({ ...editIngredient, name: e.target.value })}
                placeholder="Enter ingredient name"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Purveyor</Form.Label>
              <Form.Select
                value={editIngredient.purveyorId}
                onChange={(e) => setEditIngredient({ ...editIngredient, purveyorId: e.target.value })}
                required
              >
                <option value="">Select Purveyor</option>
                {purveyors.map(purveyor => (
                  <option key={purveyor._id} value={purveyor._id}>
                    {purveyor.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Button
              type="submit"
              variant="primary"
              disabled={!editIngredient.name.trim() || !editIngredient.purveyorId}
            >
              Save Changes
            </Button>
            {error && <Alert variant="danger" className="mt-2">{error}</Alert>}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowEditIngredientModal(false);
              setEditIngredient({ id: '', name: '', purveyorId: '' });
            }}
          >
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Purveyors;