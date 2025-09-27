// Purveyors.js (With fix for issue a: search includes ingredients)
import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Container, Alert, Form, Modal, Spinner, Row, Col } from 'react-bootstrap';
import { getPurveyors, createPurveyor, updatePurveyor, deletePurveyor, createIngredient, deleteIngredient, checkIngredientUsage, getIngredients, updateIngredient } from './api';
import { useNotification } from './NotificationContext';
import { useRole } from './RoleContext';

const Purveyors = () => {
  const { showError, showSuccess, confirm } = useNotification();
  const { canEdit } = useRole();
  const [purveyors, setPurveyors] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddPurveyorModal, setShowAddPurveyorModal] = useState(false);
  const [showEditPurveyorModal, setShowEditPurveyorModal] = useState(false);
  const [showAddIngredientModal, setShowAddIngredientModal] = useState(false);
  const [showEditIngredientModal, setShowEditIngredientModal] = useState(false);
  const [newPurveyor, setNewPurveyor] = useState({ name: '' });
  const [editPurveyor, setEditPurveyor] = useState({ id: '', name: '' });
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
        showError('Failed to load data: ' + err.message);
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
        showError('Purveyor name is required');
        return;
      }
      const purveyor = await createPurveyor(newPurveyor);
      setPurveyors([...purveyors, { ...purveyor, ingredients: [] }]);
      setNewPurveyor({ name: '' });
      setShowAddPurveyorModal(false);
      setError(null);
      showSuccess('Purveyor added successfully!');
    } catch (err) {
      showError('Failed to add purveyor: ' + err.message);
    }
  };

  const handleEditPurveyor = async (e) => {
    e.preventDefault();
    try {
      if (!editPurveyor.name.trim()) {
        showError('Purveyor name is required');
        return;
      }
      const updatedPurveyor = await updatePurveyor(editPurveyor.id, editPurveyor.name);
      setPurveyors(purveyors.map(p => p._id === editPurveyor.id ? { ...p, name: updatedPurveyor.name } : p));
      setEditPurveyor({ id: '', name: '' });
      setShowEditPurveyorModal(false);
      setError(null);
      showSuccess('Purveyor updated successfully!');
    } catch (err) {
      showError('Failed to update purveyor: ' + err.message);
    }
  };

  const handleDeletePurveyor = async (id) => {
    try {
      // Check if any ingredients are associated with the purveyor
      const ingredientsForPurveyor = ingredients.filter(i => i.purveyor?._id?.toString() === id);
      if (ingredientsForPurveyor.length > 0) {
        showError('Cannot delete purveyor because it is associated with one or more ingredients.');
        return;
      }
      await deletePurveyor(id);
      setPurveyors(purveyors.filter(p => p._id !== id));
      setError(null);
      showSuccess('Purveyor deleted successfully!');
    } catch (err) {
      console.error('Delete purveyor error:', err.message);
      showError(err.response?.data?.error || 'Failed to delete purveyor: ' + err.message);
    }
  };

  const handleAddIngredient = async (e) => {
    e.preventDefault();
    try {
      if (!newIngredient.name.trim() || !newIngredient.purveyorId) {
        showError('Ingredient name and purveyor are required');
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
      showSuccess('Ingredient added successfully!');
    } catch (err) {
      console.error('Add ingredient error:', err.message);
      showError('Failed to add ingredient: ' + err.message);
    }
  };

  const handleEditIngredient = async (e) => {
    e.preventDefault();
    try {
      if (!editIngredient.name.trim() || !editIngredient.purveyorId) {
        showError('Ingredient name and purveyor are required');
        return;
      }
      const updatedIngredient = await updateIngredient(editIngredient.id, editIngredient.name, editIngredient.purveyorId);
      setIngredients(ingredients.map(i => i._id === editIngredient.id ? { ...updatedIngredient, purveyor: { _id: editIngredient.purveyorId } } : i));
      setPurveyors(purveyors.map(p => ({
        ...p,
        ingredients: p.ingredients.map(i => i._id === editIngredient.id ? updatedIngredient : i)
      })));
      setEditIngredient({ id: '', name: '', purveyorId: '' });
      setShowEditIngredientModal(false);
      setError(null);
      showSuccess('Ingredient updated successfully!');
    } catch (err) {
      console.error('Edit ingredient error:', err.message);
      showError('Failed to edit ingredient: ' + err.message);
    }
  };

  const handleDeleteIngredient = async (id) => {
    try {
      // Check if the ingredient is used in any active recipes
      const isUsed = await checkIngredientUsage(id);
      if (isUsed) {
        showError('Cannot delete ingredient because it is used in one or more active recipes.');
        return;
      }
      await deleteIngredient(id);
      setIngredients(ingredients.filter(i => i._id !== id));
      setPurveyors(purveyors.map(p => ({
        ...p,
        ingredients: p.ingredients.filter(i => i._id !== id)
      })));
      setError(null);
      showSuccess('Ingredient deleted successfully!');
    } catch (err) {
      console.error('Delete ingredient error:', err.message);
      showError('Failed to delete ingredient: ' + err.message);
    }
  };

  const filteredPurveyors = searchQuery
    ? purveyors.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.ingredients.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : purveyors;

  if (loading) return <Spinner animation="border" />;

  // Calculate stats
  const totalPurveyors = purveyors.length;
  const totalIngredients = ingredients.length;
  const purveyorsWithIngredients = purveyors.filter(p => p.ingredients && p.ingredients.length > 0).length;
  const purveyorsWithoutIngredients = purveyors.filter(p => !p.ingredients || p.ingredients.length === 0).length;
  const avgIngredientsPerPurveyor = totalPurveyors > 0 ? Math.round(totalIngredients / totalPurveyors) : 0;

  return (
    <Container className="py-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>Purveyors</h1>
        {canEdit && (
          <Button variant="primary" size="sm" onClick={() => setShowAddPurveyorModal(true)}>
            Add Purveyor
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-2">
          <div className="card text-center bg-primary text-white">
            <div className="card-body">
              <h4 className="card-title" style={{ fontSize: '1.5rem' }}>{totalPurveyors}</h4>
              <p className="card-text" style={{ fontSize: '0.9rem' }}>Total Purveyors</p>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card text-center bg-success text-white">
            <div className="card-body">
              <h4 className="card-title" style={{ fontSize: '1.5rem' }}>{totalIngredients}</h4>
              <p className="card-text" style={{ fontSize: '0.9rem' }}>Total Ingredients</p>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card text-center bg-info text-white">
            <div className="card-body">
              <h4 className="card-title" style={{ fontSize: '1.5rem' }}>{purveyorsWithIngredients}</h4>
              <p className="card-text" style={{ fontSize: '0.9rem' }}>With Ingredients</p>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card text-center bg-warning text-white">
            <div className="card-body">
              <h4 className="card-title" style={{ fontSize: '1.5rem' }}>{purveyorsWithoutIngredients}</h4>
              <p className="card-text" style={{ fontSize: '0.9rem' }}>Without Ingredients</p>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card text-center bg-secondary text-white">
            <div className="card-body">
              <h4 className="card-title" style={{ fontSize: '1.5rem' }}>{avgIngredientsPerPurveyor}</h4>
              <p className="card-text" style={{ fontSize: '0.9rem' }}>Avg Ingredients</p>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card text-center bg-dark text-white">
            <div className="card-body">
              <h4 className="card-title" style={{ fontSize: '1.5rem' }}>{Math.round((purveyorsWithIngredients / totalPurveyors) * 100) || 0}%</h4>
              <p className="card-text" style={{ fontSize: '0.9rem' }}>Utilization</p>
            </div>
          </div>
        </div>
      </div>
      <Form.Group className="mb-3">
        <Form.Control
          type="text"
          placeholder="Search purveyors or ingredients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          ref={searchInputRef}
        />
      </Form.Group>
      <Row>
        {filteredPurveyors.map(purveyor => (
          <Col md={6} key={purveyor._id} className="mb-3">
            <Card>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <Card.Title>{purveyor.name}</Card.Title>
                  {canEdit && (
                    <div>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => {
                          setEditPurveyor({ id: purveyor._id, name: purveyor.name });
                          setShowEditPurveyorModal(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeletePurveyor(purveyor._id)}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
                <hr />
                <h6>Ingredients</h6>
                {purveyor.ingredients && purveyor.ingredients.length > 0 ? (
                  <ul>
                    {purveyor.ingredients.map(ingredient => (
                      <li key={ingredient._id} className="d-flex justify-content-between align-items-center">
                        {ingredient.name}
                        {canEdit && (
                          <div>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="me-2"
                              onClick={() => {
                                setEditIngredient({
                                  id: ingredient._id,
                                  name: ingredient.name,
                                  purveyorId: ingredient.purveyor?._id || ''
                                });
                                setShowEditIngredientModal(true);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDeleteIngredient(ingredient._id)}
                            >
                              Delete
                            </Button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No ingredients</p>
                )}
                {canEdit && (
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
                )}
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Modal show={showAddPurveyorModal} onHide={() => {
        setShowAddPurveyorModal(false);
        setNewPurveyor({ name: '' });
      }}>
        <Modal.Header closeButton>
          <Modal.Title>Add Purveyor</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddPurveyor}>
            <Form.Group className="mb-3">
              <Form.Label>Purveyor Name</Form.Label>
              <Form.Control
                type="text"
                value={newPurveyor.name}
                onChange={(e) => setNewPurveyor({ ...newPurveyor, name: e.target.value })}
                placeholder="Enter purveyor name"
                required
              />
            </Form.Group>
            <Button
              type="submit"
              variant="primary"
              disabled={!newPurveyor.name.trim()}
              style={{ fontSize: '12px', height: '30px', padding: '0 6px' }}
            >
              Add Purveyor
            </Button>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowAddPurveyorModal(false);
              setNewPurveyor({ name: '' });
            }}
            style={{ fontSize: '12px', height: '30px', padding: '0 6px' }}
          >
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showEditPurveyorModal} onHide={() => {
        setShowEditPurveyorModal(false);
        setEditPurveyor({ id: '', name: '' });
      }}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Purveyor</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleEditPurveyor}>
            <Form.Group className="mb-3">
              <Form.Label>Purveyor Name</Form.Label>
              <Form.Control
                type="text"
                value={editPurveyor.name}
                onChange={(e) => setEditPurveyor({ ...editPurveyor, name: e.target.value })}
                placeholder="Enter purveyor name"
                required
              />
            </Form.Group>
            <Button
              type="submit"
              variant="primary"
              disabled={!editPurveyor.name.trim()}
              style={{ fontSize: '12px', height: '30px', padding: '0 6px' }}
            >
              Save Changes
            </Button>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowEditPurveyorModal(false);
              setEditPurveyor({ id: '', name: '' });
            }}
            style={{ fontSize: '12px', height: '30px', padding: '0 6px' }}
          >
            Cancel
          </Button>
        </Modal.Footer>
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
              style={{ fontSize: '12px', height: '30px', padding: '0 6px' }}
            >
              Add Ingredient
            </Button>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowAddIngredientModal(false);
              setNewIngredient({ name: '', purveyorId: selectedPurveyorId || '' });
            }}
            style={{ fontSize: '12px', height: '30px', padding: '0 6px' }}
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
              style={{ fontSize: '12px', height: '30px', padding: '0 6px' }}
            >
              Save Changes
            </Button>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowEditIngredientModal(false);
              setEditIngredient({ id: '', name: '', purveyorId: '' });
            }}
            style={{ fontSize: '12px', height: '30px', padding: '0 6px' }}
          >
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Purveyors;