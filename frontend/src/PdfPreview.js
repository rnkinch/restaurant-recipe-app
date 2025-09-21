import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, Text, View, Image, StyleSheet, PDFViewer } from '@react-pdf/renderer';
import { Button } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';

const styles = StyleSheet.create({
  page: {
    padding: 20,
    position: 'relative',
  },
  field: {
    position: 'absolute',
  },
  image: {
    position: 'absolute',
  },
  watermark: {
    position: 'absolute',
    opacity: 0.2,
    width: 200,
    height: 200,
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
  },
});

export const PdfPreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL || 'http://192.168.68.129:5000';
  const frontendUrl = 'http://192.168.68.129:3000';
  const [fields, setFields] = useState([]);
  const [recipe, setRecipe] = useState(null);
  const [imageError, setImageError] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const currentIdRef = useRef(null);

  useEffect(() => {
    console.log('useEffect triggered for recipe ID:', id);
    currentIdRef.current = id; // Track the latest ID
    const fetchRecipeAndTemplate = async () => {
      if (currentIdRef.current !== id) return; // Prevent race condition
      setIsLoading(true);
      setFields([]);
      setRecipe(null);
      setImageError(null);
      setFetchError(null);
      console.log('Fetching recipe and default template for ID:', id);

      try {
        // Fetch recipe with cache-busting
        const timestamp = Date.now();
        const recipeRes = await fetch(`${apiUrl}/recipes/${id}?t=${timestamp}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        });
        if (!recipeRes.ok) {
          throw new Error(`Recipe fetch failed: ${recipeRes.status} - ${recipeRes.statusText}`);
        }
        const recipeData = await recipeRes.json();
        console.log('Fetched recipe:', JSON.stringify(recipeData, null, 2));
        if (currentIdRef.current !== id) return; // Prevent setting stale state
        if (!recipeData || !recipeData._id || recipeData._id !== id) {
          throw new Error('Invalid recipe data received or ID mismatch');
        }
        setRecipe(recipeData);

        // Set image URL
        let imageUrl = recipeData.image
          ? `${apiUrl}/Uploads/${recipeData.image.split('/').pop()}`
          : `${frontendUrl}/logo.png`; // Use /logo.png for default
        console.log('Trying image URL:', imageUrl);
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

        // Fetch default template with cache-busting
        const templateRes = await fetch(`${apiUrl}/templates/default?t=${timestamp}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        });
        if (templateRes.ok) {
          const templateData = await templateRes.json();
          console.log('Fetched default template:', JSON.stringify(templateData, null, 2));
          if (currentIdRef.current !== id) return; // Prevent setting stale state
          if (templateData?.template?.fields) {
            const updatedFields = templateData.template.fields.map((field) => {
              if (field.isImage && field.id === 'image') {
                return { ...field, content: imageUrl };
              }
              if (field.id === 'title') {
                return { ...field, content: recipeData?.name || 'Recipe Title' };
              }
              if (field.id === 'ingredients') {
                return {
                  ...field,
                  content: Array.isArray(recipeData?.ingredients)
                    ? recipeData.ingredients.map((i) => `${i.quantity || ''} ${i.measure || ''} ${i.ingredient?.name || ''}`).join('\n')
                    : 'No ingredients',
                };
              }
              if (field.id === 'steps') {
                return { ...field, content: recipeData?.steps || 'No steps' };
              }
              if (field.id === 'platingGuide') {
                return { ...field, content: recipeData?.platingGuide || 'No plating guide' };
              }
              if (field.id === 'allergens') {
                return { ...field, content: Array.isArray(recipeData?.allergens) ? recipeData.allergens.join(', ') : 'No allergens' };
              }
              if (field.id === 'serviceTypes') {
                return { ...field, content: Array.isArray(recipeData?.serviceTypes) ? recipeData.serviceTypes.join(', ') : 'No service types' };
              }
              return field;
            });
            setFields(updatedFields);
          } else {
            console.warn('No template fields found, using default fields');
            setFields([
              { id: 'titleLabel', content: 'Recipe Title:', x: 20, y: 10, fontSize: 12, isBold: false },
              { id: 'title', content: recipeData?.name || 'Recipe Title', x: 20, y: 30, fontSize: 12, isBold: false },
              { id: 'ingredientsLabel', content: 'Ingredients:', x: 20, y: 60, fontSize: 12, isBold: false },
              {
                id: 'ingredients',
                content: Array.isArray(recipeData?.ingredients)
                  ? recipeData.ingredients.map((i) => `${i.quantity || ''} ${i.measure || ''} ${i.ingredient?.name || ''}`).join('\n')
                  : 'No ingredients',
                x: 20,
                y: 80,
                fontSize: 12,
                isBold: false,
              },
              { id: 'stepsLabel', content: 'Steps:', x: 20, y: 190, fontSize: 12, isBold: false },
              { id: 'steps', content: recipeData?.steps || 'No steps', x: 20, y: 210, fontSize: 12, isBold: false },
              { id: 'platingGuideLabel', content: 'Plating Guide:', x: 20, y: 320, fontSize: 12, isBold: false },
              {
                id: 'platingGuide',
                content: recipeData?.platingGuide || 'No plating guide',
                x: 20,
                y: 340,
                fontSize: 12,
                isBold: false,
              },
              { id: 'allergensLabel', content: 'Allergens:', x: 450, y: 10, fontSize: 12, isBold: false },
              {
                id: 'allergens',
                content: Array.isArray(recipeData?.allergens) ? recipeData.allergens.join(', ') : 'No allergens',
                x: 450,
                y: 30,
                fontSize: 12,
                isBold: false,
              },
              { id: 'serviceTypesLabel', content: 'Service Types:', x: 450, y: 60, fontSize: 12, isBold: false },
              {
                id: 'serviceTypes',
                content: Array.isArray(recipeData?.serviceTypes) ? recipeData.serviceTypes.join(', ') : 'No service types',
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
            ]);
          }
        } else {
          console.error('Default template fetch failed:', templateRes.status, templateRes.statusText);
          setFields([
            { id: 'titleLabel', content: 'Recipe Title:', x: 20, y: 10, fontSize: 12, isBold: false },
            { id: 'title', content: recipeData?.name || 'Recipe Title', x: 20, y: 30, fontSize: 12, isBold: false },
            { id: 'ingredientsLabel', content: 'Ingredients:', x: 20, y: 60, fontSize: 12, isBold: false },
            {
              id: 'ingredients',
              content: Array.isArray(recipeData?.ingredients)
                ? recipeData.ingredients.map((i) => `${i.quantity || ''} ${i.measure || ''} ${i.ingredient?.name || ''}`).join('\n')
                : 'No ingredients',
              x: 20,
              y: 80,
              fontSize: 12,
              isBold: false,
            },
            { id: 'stepsLabel', content: 'Steps:', x: 20, y: 190, fontSize: 12, isBold: false },
            { id: 'steps', content: recipeData?.steps || 'No steps', x: 20, y: 210, fontSize: 12, isBold: false },
            { id: 'platingGuideLabel', content: 'Plating Guide:', x: 20, y: 320, fontSize: 12, isBold: false },
            {
              id: 'platingGuide',
              content: recipeData?.platingGuide || 'No plating guide',
              x: 20,
              y: 340,
              fontSize: 12,
              isBold: false,
            },
            { id: 'allergensLabel', content: 'Allergens:', x: 450, y: 10, fontSize: 12, isBold: false },
            {
              id: 'allergens',
              content: Array.isArray(recipeData?.allergens) ? recipeData.allergens.join(', ') : 'No allergens',
              x: 450,
              y: 30,
              fontSize: 12,
              isBold: false,
            },
            { id: 'serviceTypesLabel', content: 'Service Types:', x: 450, y: 60, fontSize: 12, isBold: false },
            {
              id: 'serviceTypes',
              content: Array.isArray(recipeData?.serviceTypes) ? recipeData.serviceTypes.join(', ') : 'No service types',
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
          ]);
        }
      } catch (err) {
        console.error('Fetch failed:', err.message);
        setFetchError(`Failed to load recipe or template: ${err.message}`);
        setFields([
          { id: 'titleLabel', content: 'Recipe Title:', x: 20, y: 10, fontSize: 12, isBold: false },
          { id: 'title', content: 'Recipe Title', x: 20, y: 30, fontSize: 12, isBold: false },
          { id: 'ingredientsLabel', content: 'Ingredients:', x: 20, y: 60, fontSize: 12, isBold: false },
          { id: 'ingredients', content: 'No ingredients', x: 20, y: 80, fontSize: 12, isBold: false },
          { id: 'stepsLabel', content: 'Steps:', x: 20, y: 190, fontSize: 12, isBold: false },
          { id: 'steps', content: 'No steps', x: 20, y: 210, fontSize: 12, isBold: false },
          { id: 'platingGuideLabel', content: 'Plating Guide:', x: 20, y: 320, fontSize: 12, isBold: false },
          { id: 'platingGuide', content: 'No plating guide', x: 20, y: 340, fontSize: 12, isBold: false },
          { id: 'allergensLabel', content: 'Allergens:', x: 450, y: 10, fontSize: 12, isBold: false },
          { id: 'allergens', content: 'No allergens', x: 450, y: 30, fontSize: 12, isBold: false },
          { id: 'serviceTypesLabel', content: 'Service Types:', x: 450, y: 60, fontSize: 12, isBold: false },
          { id: 'serviceTypes', content: 'No service types', x: 450, y: 80, fontSize: 12, isBold: false },
          { id: 'image', content: `${frontendUrl}/logo.png`, x: 450, y: 110, width: 100, height: 100, isImage: true },
        ]);
      } finally {
        if (currentIdRef.current === id) {
          setIsLoading(false);
        }
      }
    };

    // Delay fetch to ensure route transition completes
    const timer = setTimeout(() => {
      fetchRecipeAndTemplate();
    }, 500);

    // Cleanup on unmount
    return () => {
      clearTimeout(timer);
      setFields([]);
      setRecipe(null);
      setImageError(null);
      setFetchError(null);
      setIsLoading(true);
      console.log('Cleaned up state for recipe ID:', id);
    };
  }, [id, apiUrl, frontendUrl]);

  if (isLoading) {
    return (
      <div style={{ padding: '1rem' }}>
        <h2>PDF Preview</h2>
        <div>Loading...</div>
      </div>
    );
  }

  if (!recipe || !recipe._id || recipe._id !== id) {
    return (
      <div style={{ padding: '1rem' }}>
        <h2>PDF Preview</h2>
        <div style={{ color: 'red', marginBottom: '1rem' }}>
          {fetchError || 'Error: No valid recipe selected or ID mismatch. Please go back and select a recipe.'}
        </div>
        <Button onClick={() => navigate(`/recipe/${id}`)} variant="outline-secondary" size="sm">
          Back to Recipe
        </Button>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem' }}>
      <h2>PDF Preview for {recipe.name}</h2>
      {imageError && (
        <div style={{ color: 'red', marginBottom: '1rem' }}>
          {imageError}
        </div>
      )}
      <PDFViewer key={recipe._id} style={{ width: '842px', height: '595px', marginTop: '1rem' }}>
        <Document>
          <Page size={{ width: 842, height: 595 }} style={styles.page}>
            <Image src={`${frontendUrl}/logo.png`} style={styles.watermark} onError={(e) => console.error('Watermark load error:', `${frontendUrl}/logo.png`)} />
            {fields.map((field) => (
              <View key={field.id} style={field.isImage ? { ...styles.image, left: field.x, top: field.y, width: field.width, height: field.height } : { ...styles.field, left: field.x, top: field.y }}>
                {field.isImage ? (
                  <Image
                    src={field.content}
                    onError={(e) => console.error('PDF Image load error:', field.content)}
                  />
                ) : (
                  <Text style={{ fontSize: field.fontSize || 12, fontWeight: field.isBold ? 'bold' : 'normal' }}>{field.content}</Text>
                )}
              </View>
            ))}
          </Page>
        </Document>
      </PDFViewer>
      <Button onClick={() => navigate(`/recipe/${id}`)} variant="outline-secondary" size="sm" style={{ marginTop: '1rem' }}>
        Back to Recipe
      </Button>
    </div>
  );
};

export default PdfPreview;