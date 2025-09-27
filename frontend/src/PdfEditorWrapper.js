import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PdfEditor from './PdfEditor';
import { getRecipes } from './api';

const PdfEditorWrapper = () => {
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);

  useEffect(() => {
    const fetchSampleRecipe = async () => {
      try {
        const data = await getRecipes();
        console.log('Fetched recipes:', JSON.stringify(data, null, 2));
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
      } catch (err) {
        console.error('Fetch failed:', err.message);
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
    };

    fetchSampleRecipe();
  }, []);

  const handleBack = () => {
    navigate('/');
  };

  if (!recipe) {
    return <div>Loading...</div>;
  }

  return <PdfEditor recipe={recipe} onBack={handleBack} />;
};

export default PdfEditorWrapper;