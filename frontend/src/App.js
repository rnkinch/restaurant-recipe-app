// App.js
import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { Navbar, Container, Alert, NavDropdown, Row, Col, Nav } from 'react-bootstrap';
import RecipeList from './RecipeList';
import RecipeDetail from './RecipeDetail';
import RecipeForm from './RecipeForm';
import Reports from './Reports';
import Purveyors from './Purveyors';
import PdfEditorWrapper from './PdfEditorWrapper';
import { PdfPreview } from './PdfPreview';
import { getRecipes } from './api';

function App() {
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshRecipes = useCallback(async (all = true) => {
    setLoading(true);
    setError(null);
    console.log('Refreshing recipes');
    try {
      const data = await getRecipes(all);
      console.log('Recipes fetched:', data);
      if (!data || !Array.isArray(data)) {
        setError('No recipes found');
        setRecipes([]);
        setFilteredRecipes([]);
      } else {
        const sortedRecipes = [...data].sort((a, b) => a.name.localeCompare(b.name));
        setRecipes(sortedRecipes);
        setFilteredRecipes(sortedRecipes);
      }
      setLoading(false);
    } catch (err) {
      console.error('Fetch Error:', err.message);
      setError(`Failed to fetch recipes: ${err.message}`);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!process.env.REACT_APP_API_URL) {
      setError('REACT_APP_API_URL environment variable is not set.');
      setLoading(false);
    } else {
      refreshRecipes(true);
    }
  }, [refreshRecipes]);

  const handleSearch = useCallback((query) => {
    console.log('Search triggered with query:', query);
    if (!query) {
      setFilteredRecipes(recipes);
      console.log('No query, setting filteredRecipes to:', recipes);
      return;
    }
    const lowerQuery = query.toLowerCase();
    const filtered = recipes.filter(recipe =>
      (recipe.name && recipe.name.toLowerCase().includes(lowerQuery)) ||
      ((recipe.ingredients && Array.isArray(recipe.ingredients)) &&
        recipe.ingredients.some(ingredient =>
          (ingredient.ingredient && ingredient.ingredient.name && ingredient.ingredient.name.toLowerCase().includes(lowerQuery)) ||
          (ingredient.measure && ingredient.measure.toLowerCase().includes(lowerQuery)) ||
          (ingredient.ingredient && ingredient.ingredient.purveyor && ingredient.ingredient.purveyor.name && ingredient.ingredient.purveyor.name.toLowerCase().includes(lowerQuery))
        )) ||
      ((recipe.allergens && Array.isArray(recipe.allergens)) &&
        recipe.allergens.some(allergen => allergen.toLowerCase().includes(lowerQuery))) ||
      ((recipe.serviceTypes && Array.isArray(recipe.serviceTypes)) &&
        recipe.serviceTypes.some(type => type.toLowerCase().includes(lowerQuery)))
    );
    console.log('Filtered recipes:', filtered);
    setFilteredRecipes(filtered);
  }, [recipes]);

  return (
    <Router>
      <Navbar bg="light" expand="lg" className="mb-3 shadow-sm">
        <Container fluid>
          <Navbar.Brand as={Link} to="/">Darby's Recipe and Plating Guide</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <Nav.Link as={Link} to="/">Recipes</Nav.Link>
              <NavDropdown title="Purveyors" id="purveyors-dropdown">
                <NavDropdown.Item as={Link} to="/purveyors">Manage Purveyors</NavDropdown.Item>
              </NavDropdown>
              <NavDropdown title="Reports" id="reports-dropdown">
                <NavDropdown.Item as={Link} to="/reports/active-ingredients">Active Ingredients</NavDropdown.Item>
              </NavDropdown>
              <NavDropdown title="Setups" id="setups-dropdown">
                <NavDropdown.Item as={Link} to="/edit-pdf-template">Edit PDF Template</NavDropdown.Item>
              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Container fluid>
        <Row>
          <Col md={2} className="bg-light p-0" style={{ minHeight: 'calc(100vh - 56px)', overflowY: 'auto' }}>
            <h4>Recipe List</h4>
            <Nav className="flex-column recipe-nav" style={{ fontSize: '0.84375rem' }}>
              {recipes.map(recipe => (
                <Nav.Link
                  key={recipe._id}
                  as={Link}
                  to={`/recipe/${recipe._id}`}
                  className="d-flex align-items-center py-0 mb-1"
                >
                  <span className={recipe.active ? 'text-success' : 'text-danger'} style={{ marginRight: '5px' }}>
                    ●
                  </span>
                  {recipe.name}
                </Nav.Link>
              ))}
            </Nav>
          </Col>
          <Col md={10}>
            <Container className="py-3">
              {loading && <p>Loading...</p>}
              {error && (
                <Alert variant="danger" dismissible onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}
              <Routes>
                <Route path="/" element={<RecipeList recipes={filteredRecipes} setRecipes={setRecipes} onSearch={handleSearch} />} />
                <Route path="/add" element={<RecipeForm refreshRecipes={refreshRecipes} />} />
                <Route path="/edit/:id" element={<RecipeForm refreshRecipes={refreshRecipes} />} />
                <Route path="/copy/:id" element={<RecipeForm refreshRecipes={refreshRecipes} />} />
                <Route path="/edit-pdf-template" element={<PdfEditorWrapper />} />
                <Route path="/recipes/:id/preview-pdf" element={<PdfPreview />} />
                <Route path="/recipe/:id" element={<RecipeDetail refreshRecipes={refreshRecipes} />} />
                <Route path="/reports/:type" element={<Reports />} />
                <Route path="/purveyors" element={<Purveyors />} />
              </Routes>
            </Container>
          </Col>
        </Row>
      </Container>
    </Router>
  );
}

export default App;