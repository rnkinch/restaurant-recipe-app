// RecipeFormModal.js (Unmodified)
import React, { useEffect, useRef } from 'react';
import { Modal, Form, Button, Alert } from 'react-bootstrap';

const RecipeFormModal = ({
  show,
  setShow,
  ingredientSearch,
  setIngredientSearch,
  ingredientsList,
  purveyors,
  newIngredient,
  setNewIngredient,
  handleAddIngredient,
  handleNewIngredientSubmit,
  error,
  setError
}) => {
  const filteredIngredients = ingredientSearch
    ? ingredientsList.filter(ing => ing.name.toLowerCase().includes(ingredientSearch.toLowerCase()))
    : ingredientsList;

  const nameInputRef = useRef(null);

  useEffect(() => {
    if (show && newIngredient.name === '' && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [show, newIngredient.name]);

  const handleAddNewClick = () => {
    setNewIngredient({ name: ingredientSearch || '', purveyor: '' });
    setIngredientSearch('');
    setError(null);
  };

  const handleSubmitNewIngredient = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('handleSubmitNewIngredient triggered'); // Debug submission
    if (!newIngredient.name.trim() || !newIngredient.purveyor) {
      setError('Ingredient name and purveyor are required');
      return;
    }
    try {
      const newIng = await handleNewIngredientSubmit(newIngredient);
      console.log('Calling handleAddIngredient for new ingredient:', newIng); // Debug add
      handleAddIngredient(newIng);
      setNewIngredient({ name: '', purveyor: '' });
      setIngredientSearch('');
      setShow(false);
      setError(null);
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message;
      setError(errorMessage);
    }
  };

  return (
    <Modal show={show} onHide={() => { setShow(false); setIngredientSearch(''); setNewIngredient({ name: '', purveyor: '' }); setError(null); }}>
      <Modal.Header closeButton>
        <Modal.Title>Add Ingredient</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-2">
          <Form.Label>Search Ingredient</Form.Label>
          <Form.Control
            type="text"
            placeholder="Search ingredient..."
            value={ingredientSearch}
            onChange={(e) => setIngredientSearch(e.target.value)}
            onFocus={() => setIngredientSearch('')}
            className="editable-field"
          />
          {ingredientSearch && (
            <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #ccc', background: '#fff', zIndex: 1000, marginTop: '5px' }}>
              {filteredIngredients.length > 0 ? (
                filteredIngredients.map(ing => {
                  const purveyorName = purveyors.find(p => p._id === (ing.purveyor?._id?.toString() || ing.purveyor))?.name || 'Unknown';
                  return (
                    <div
                      key={ing._id}
                      className="p-2 border-bottom"
                      style={{ cursor: 'pointer', textAlign: 'left' }}
                      onClick={() => {
                        console.log('Selected ingredient:', ing);
                        handleAddIngredient(ing);
                        setIngredientSearch('');
                        setShow(false);
                      }}
                    >
                      {ing.name} ({purveyorName})
                    </div>
                  );
                })
              ) : (
                <div className="p-2 text-muted">
                  No ingredients found.{' '}
                  <span
                    style={{ cursor: 'pointer', color: 'blue' }}
                    onClick={handleAddNewClick}
                  >
                    Add new?
                  </span>
                </div>
              )}
            </div>
          )}
        </Form.Group>
        {!ingredientSearch && newIngredient.name !== '' && (
          <form onSubmit={handleSubmitNewIngredient}>
            <Form.Group className="mt-3">
              <Form.Label>New Ingredient Name</Form.Label>
              <Form.Control
                type="text"
                value={newIngredient.name}
                onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
                placeholder="Enter ingredient name"
                ref={nameInputRef}
                className="editable-field"
              />
              <Form.Label className="mt-2">Purveyor</Form.Label>
              <Form.Select
                value={newIngredient.purveyor}
                onChange={(e) => setNewIngredient({ ...newIngredient, purveyor: e.target.value })}
                className="editable-field"
              >
                <option value="">Select Purveyor</option>
                {purveyors.map(purveyor => (
                  <option key={purveyor._id} value={purveyor._id}>
                    {purveyor.name}
                  </option>
                ))}
              </Form.Select>
              <Button
                type="submit"
                variant="primary"
                className="mt-2"
                disabled={!newIngredient.name.trim() || !newIngredient.purveyor}
              >
                Add New Ingredient
              </Button>
              {error && <Alert variant="danger" className="mt-2">{error}</Alert>}
            </Form.Group>
          </form>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => {
          setShow(false);
          setIngredientSearch('');
          setNewIngredient({ name: '', purveyor: '' });
          setError(null);
        }}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default RecipeFormModal;