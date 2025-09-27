import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { Navbar, Container, Alert, NavDropdown, Row, Col, Nav, Button } from 'react-bootstrap';
import RecipeList from './RecipeList';
import RecipeDetail from './RecipeDetail';
import RecipeForm from './RecipeForm';
import Purveyors from './Purveyors';
import PdfEditorWrapper from './PdfEditorWrapper';
import { PdfPreview } from './PdfPreview';
import SetupConfig from './SetupConfig';
import ActiveRecipesReport from './ActiveRecipesReport';
import InactiveRecipesReport from './InactiveRecipesReport';
import ActiveIngredientsReport from './ActiveIngredientsReport';
import ActiveRecipesPDFReport from './ActiveRecipesPDFReport';
import Login from './Login';
import ChangeLog from './ChangeLog';
import UserManagement from './UserManagement';
import UserReport from './UserReport';
import { getRecipes, getConfig, isAuthenticated, getCurrentUser, logout } from './api';
import { NotificationProvider } from './NotificationContext';
import { RoleProvider } from './RoleContext';
import Navigation from './Navigation';

function App() {
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [config, setConfig] = useState({ appName: "XYZCompany Recipe and Plating Guide", showLeftNav: true });
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

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

  const refreshConfig = useCallback(async () => {
    try {
      const data = await getConfig();
      setConfig({ appName: data.appName, showLeftNav: data.showLeftNav });
    } catch (err) {
      console.error('Fetch Config Error:', err.message);
      setError(`Failed to fetch config: ${err.message}`);
    }
  }, []);

  // Check authentication on app load
  useEffect(() => {
    const checkAuth = () => {
      if (isAuthenticated()) {
        setAuthenticated(true);
        setUser(getCurrentUser());
        refreshRecipes(true);
        refreshConfig();
      } else {
        setAuthenticated(false);
        setUser(null);
        setLoading(false);
      }
    };
    checkAuth();
  }, [refreshRecipes, refreshConfig]);

  const handleLogin = () => {
    console.log('Login successful, setting authenticated to true');
    setAuthenticated(true);
    setUser(getCurrentUser());
    refreshRecipes(true);
    refreshConfig();
  };

  const handleLogout = () => {
    logout();
    setAuthenticated(false);
    setUser(null);
    setRecipes([]);
    setFilteredRecipes([]);
  };

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

  // Show login if not authenticated
  if (!authenticated) {
    console.log('Not authenticated, showing login page');
    return (
      <NotificationProvider>
        <Login onLogin={handleLogin} />
      </NotificationProvider>
    );
  }

  console.log('Authenticated, showing main app');

  return (
    <NotificationProvider>
      <RoleProvider user={user}>
        <Router>
        <Navigation user={user} onLogout={handleLogout} config={config} />
      <Container fluid>
        <Row>
          {config.showLeftNav && (
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
          )}
          <Col md={config.showLeftNav ? 10 : 12}>
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
                <Route path="/reports/active-ingredients" element={<ActiveIngredientsReport />} />
                <Route path="/reports/active-recipes" element={<ActiveRecipesReport />} />
                <Route path="/reports/inactive-recipes" element={<InactiveRecipesReport />} />
                <Route path="/reports/active-recipes-pdf" element={<ActiveRecipesPDFReport />} />
                <Route path="/reports/users" element={<UserReport />} />
                <Route path="/purveyors" element={<Purveyors />} />
                <Route path="/changelog" element={<ChangeLog />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="/config" element={<SetupConfig refreshConfig={refreshConfig} />} />
              </Routes>
            </Container>
          </Col>
        </Row>
      </Container>
      </Router>
      </RoleProvider>
    </NotificationProvider>
  );
}

export default App;