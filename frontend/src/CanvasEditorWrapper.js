import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import CanvasEditor from './CanvasEditor';
import { getRecipes, getRecipeById } from './api';
import { useNotification } from './NotificationContext';
import { useRole } from './RoleContext';

const CanvasEditorWrapper = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess, showError } = useNotification();
  const { isAdmin, isReadOnly } = useRole();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        // Check if we have a specific recipeId from navigation state
        const recipeId = location.state?.recipeId;
        
        if (recipeId) {
          // Load specific recipe
          const recipeData = await getRecipeById(recipeId);
          setRecipe(recipeData);
        } else {
          // Load sample recipe (first available recipe)
          const data = await getRecipes();
          if (data && Array.isArray(data) && data.length > 0) {
            setRecipe(data[0]); // Use the first recipe as a sample
          } else {
            setRecipe({
              _id: 'sample',
              name: 'Sample Recipe',
              ingredients: [],
              steps: 'No steps',
              platingGuide: 'No plating guide',
              allergens: [],
              serviceTypes: [],
            });
          }
        }
        setLoading(false);
      } catch (err) {
        console.error('Fetch failed:', err.message);
        showError(`Failed to load recipe: ${err.message}`);
        setRecipe({
          _id: 'sample',
          name: 'Sample Recipe',
          ingredients: [],
          steps: 'No steps',
          platingGuide: 'No plating guide',
          allergens: [],
          serviceTypes: [],
        });
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [location.state?.recipeId, showError]);

  const handleSave = () => {
    showSuccess('Canvas saved successfully!');
  };

  const handleExport = () => {
    showSuccess('PDF exported successfully!');
  };

  const handleBack = () => {
    navigate('/');
  };

  // Check if user has admin access
  useEffect(() => {
    if (isReadOnly) {
      showError('Access denied. PDF Template Editor is only available to administrators.');
      navigate('/');
      return;
    }
  }, [isReadOnly, navigate, showError]);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div>Loading recipes...</div>
      </div>
    );
  }

  // Show access denied message for read-only users
  if (isReadOnly) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="alert alert-danger">
          <h4>🔒 Access Denied</h4>
          <p>PDF Template Editor is only available to administrators.</p>
          <button onClick={handleBack} className="btn btn-primary">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div>No recipe data available</div>
        <button onClick={handleBack} className="btn btn-secondary mt-2">
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ padding: '1rem', borderBottom: '1px solid #dee2e6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4>PDF Template Editor</h4>
          <button onClick={handleBack} className="btn btn-outline-secondary">
            Back to Home
          </button>
        </div>
      </div>
      <CanvasEditor 
        recipe={recipe} 
        onSave={handleSave}
        onExport={handleExport}
      />
    </div>
  );
};

export default CanvasEditorWrapper;
