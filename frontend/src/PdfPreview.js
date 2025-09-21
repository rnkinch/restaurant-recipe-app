import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, Text, View, Image, StyleSheet, PDFViewer } from '@react-pdf/renderer';
import { Button } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { getRecipeById } from './api';

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
  line: {
    position: 'absolute',
    backgroundColor: '#000',
  },
});

export const PdfPreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL || 'http://192.168.68.129:5000';
  const frontendUrl = process.env.REACT_APP_FRONTEND_URL || 'http://192.168.68.129:3000';
  const [fields, setFields] = useState([]);
  const [recipe, setRecipe] = useState(null);
  const [imageError, setImageError] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [watermarkError, setWatermarkError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const currentIdRef = useRef(null);

  useEffect(() => {
    console.log('useEffect triggered for recipe ID:', id);
    currentIdRef.current = id;
    const fetchRecipeAndTemplate = async () => {
      if (currentIdRef.current !== id) return;
      setIsLoading(true);
      setFields([]);
      setRecipe(null);
      setImageError(null);
      setFetchError(null);
      setWatermarkError(null);
      console.log('Fetching recipe and template');

      try {
        const recipeData = await getRecipeById(id);
        console.log('Fetched recipe ID:', recipeData?._id);
        if (currentIdRef.current !== id) return;
        if (!recipeData || !recipeData._id || recipeData._id !== id) {
          throw new Error('Invalid recipe data or ID mismatch');
        }
        setRecipe(recipeData);

        const imageUrl = recipeData.image
          ? `${apiUrl}/Uploads/${recipeData.image.split('/').pop()}`
          : `${frontendUrl}/logo.png`;
        console.log('Image URL:', imageUrl);

        const timestamp = Date.now();
        console.log('Fetching template');
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
          console.log('Template fetched');
          if (currentIdRef.current !== id) return;
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
            console.warn('No template fields found');
            const defaultImageUrl = `${frontendUrl}/logo.png`;
            setFields([
              { id: 'titleLabel', content: 'Recipe Title:', x: 20, y: 10, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
              { id: 'title', content: recipeData?.name || 'Recipe Title', x: 20, y: 30, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
              { id: 'ingredientsLabel', content: 'Ingredients:', x: 20, y: 60, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
              {
                id: 'ingredients',
                content: Array.isArray(recipeData?.ingredients)
                  ? recipeData.ingredients.map((i) => `${i.quantity || ''} ${i.measure || ''} ${i.ingredient?.name || ''}`).join('\n')
                  : 'No ingredients',
                x: 20,
                y: 80,
                fontSize: 12,
                isBold: false,
                width: 500,
                zIndex: 10,
              },
              { id: 'stepsLabel', content: 'Steps:', x: 20, y: 190, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
              {
                id: 'steps',
                content: recipeData?.steps || 'No steps',
                x: 20,
                y: 210,
                fontSize: 12,
                isBold: false,
                width: 500,
                zIndex: 10,
              },
              { id: 'platingGuideLabel', content: 'Plating Guide:', x: 20, y: 320, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
              {
                id: 'platingGuide',
                content: recipeData?.platingGuide || 'No plating guide',
                x: 20,
                y: 340,
                fontSize: 12,
                isBold: false,
                width: 500,
                zIndex: 10,
              },
              { id: 'allergensLabel', content: 'Allergens:', x: 450, y: 10, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
              {
                id: 'allergens',
                content: Array.isArray(recipeData?.allergens) ? recipeData.allergens.join(', ') : 'No allergens',
                x: 450,
                y: 30,
                fontSize: 12,
                isBold: false,
                width: 400,
                zIndex: 10,
              },
              { id: 'serviceTypesLabel', content: 'Service Types:', x: 450, y: 60, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
              {
                id: 'serviceTypes',
                content: Array.isArray(recipeData?.serviceTypes) ? recipeData.serviceTypes.join(', ') : 'No service types',
                x: 450,
                y: 80,
                fontSize: 12,
                isBold: false,
                width: 400,
                zIndex: 10,
              },
              {
                id: 'image',
                content: recipeData?.image ? `${apiUrl}/Uploads/${recipeData.image.split('/').pop()}` : defaultImageUrl,
                x: 450,
                y: 110,
                width: 100,
                height: 100,
                isImage: true,
                aspectRatio: 1,
                zIndex: 10,
              },
              {
                id: 'watermark',
                content: `${frontendUrl}/logo.png`,
                x: 421,
                y: 297.5,
                width: 200,
                height: 200,
                isImage: true,
                aspectRatio: 1,
                zIndex: 5,
              },
            ]);
          }
        } else {
          const errorText = await templateRes.text();
          console.error('Template fetch failed:', templateRes.status, errorText);
          setFetchError(`Failed to load template: ${templateRes.status} - ${errorText}`);
          const defaultImageUrl = `${frontendUrl}/logo.png`;
          setFields([
            { id: 'titleLabel', content: 'Recipe Title:', x: 20, y: 10, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
            { id: 'title', content: recipeData?.name || 'Recipe Title', x: 20, y: 30, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
            { id: 'ingredientsLabel', content: 'Ingredients:', x: 20, y: 60, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
            {
              id: 'ingredients',
              content: Array.isArray(recipeData?.ingredients)
                ? recipeData.ingredients.map((i) => `${i.quantity || ''} ${i.measure || ''} ${i.ingredient?.name || ''}`).join('\n')
                : 'No ingredients',
              x: 20,
              y: 80,
              fontSize: 12,
              isBold: false,
              width: 500,
              zIndex: 10,
            },
            { id: 'stepsLabel', content: 'Steps:', x: 20, y: 190, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
            {
              id: 'steps',
              content: recipeData?.steps || 'No steps',
              x: 20,
              y: 210,
              fontSize: 12,
              isBold: false,
              width: 500,
              zIndex: 10,
            },
            { id: 'platingGuideLabel', content: 'Plating Guide:', x: 20, y: 320, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
            {
              id: 'platingGuide',
              content: recipeData?.platingGuide || 'No plating guide',
              x: 20,
              y: 340,
              fontSize: 12,
              isBold: false,
              width: 500,
              zIndex: 10,
            },
            { id: 'allergensLabel', content: 'Allergens:', x: 450, y: 10, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
            {
              id: 'allergens',
              content: Array.isArray(recipeData?.allergens) ? recipeData.allergens.join(', ') : 'No allergens',
              x: 450,
              y: 30,
              fontSize: 12,
              isBold: false,
              width: 400,
              zIndex: 10,
            },
            { id: 'serviceTypesLabel', content: 'Service Types:', x: 450, y: 60, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
            {
              id: 'serviceTypes',
              content: Array.isArray(recipeData?.serviceTypes) ? recipeData.serviceTypes.join(', ') : 'No service types',
              x: 450,
              y: 80,
              fontSize: 12,
              isBold: false,
              width: 400,
              zIndex: 10,
            },
            {
              id: 'image',
              content: recipeData?.image ? `${apiUrl}/Uploads/${recipeData.image.split('/').pop()}` : defaultImageUrl,
              x: 450,
              y: 110,
              width: 100,
              height: 100,
              isImage: true,
              aspectRatio: 1,
              zIndex: 10,
            },
            {
              id: 'watermark',
              content: `${frontendUrl}/logo.png`,
              x: 421,
              y: 297.5,
              width: 200,
              height: 200,
              isImage: true,
              aspectRatio: 1,
              zIndex: 5,
            },
          ]);
        }
      } catch (err) {
        console.error('Fetch failed:', err.message);
        setFetchError(`Failed to load recipe or template: ${err.message}`);
        const defaultImageUrl = `${frontendUrl}/logo.png`;
        setFields([
          { id: 'titleLabel', content: 'Recipe Title:', x: 20, y: 10, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
          { id: 'title', content: 'Recipe Title', x: 20, y: 30, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
          { id: 'ingredientsLabel', content: 'Ingredients:', x: 20, y: 60, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
          {
            id: 'ingredients',
            content: 'No ingredients',
            x: 20,
            y: 80,
            fontSize: 12,
            isBold: false,
            width: 500,
            zIndex: 10,
          },
          { id: 'stepsLabel', content: 'Steps:', x: 20, y: 190, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
          {
            id: 'steps',
            content: 'No steps',
            x: 20,
            y: 210,
            fontSize: 12,
            isBold: false,
            width: 500,
            zIndex: 10,
          },
          { id: 'platingGuideLabel', content: 'Plating Guide:', x: 20, y: 320, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
          {
            id: 'platingGuide',
            content: 'No plating guide',
            x: 20,
            y: 340,
            fontSize: 12,
            isBold: false,
            width: 500,
            zIndex: 10,
          },
          { id: 'allergensLabel', content: 'Allergens:', x: 450, y: 10, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
          {
            id: 'allergens',
            content: 'No allergens',
            x: 450,
            y: 30,
            fontSize: 12,
            isBold: false,
            width: 400,
            zIndex: 10,
          },
          { id: 'serviceTypesLabel', content: 'Service Types:', x: 450, y: 60, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
          {
            id: 'serviceTypes',
            content: 'No service types',
            x: 450,
            y: 80,
            fontSize: 12,
            isBold: false,
            width: 400,
            zIndex: 10,
          },
          {
            id: 'image',
            content: defaultImageUrl,
            x: 450,
            y: 110,
            width: 100,
            height: 100,
            isImage: true,
            aspectRatio: 1,
            zIndex: 10,
          },
          {
            id: 'watermark',
            content: `${frontendUrl}/logo.png`,
            x: 421,
            y: 297.5,
            width: 200,
            height: 200,
            isImage: true,
            aspectRatio: 1,
            zIndex: 5,
          },
        ]);
      } finally {
        if (currentIdRef.current === id) {
          setIsLoading(false);
        }
      }
    };

    const timer = setTimeout(() => {
      fetchRecipeAndTemplate();
    }, 500);

    return () => {
      clearTimeout(timer);
      setFields([]);
      setRecipe(null);
      setImageError(null);
      setFetchError(null);
      setWatermarkError(null);
      console.log('Cleaned up state');
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
          {fetchError || 'Error: No valid recipe selected or ID mismatch.'}
        </div>
        <Button onClick={() => navigate(`/recipe/${id}`)} variant="outline-secondary" size="sm">
          Back to Recipe
        </Button>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem' }}>
      <Button onClick={() => navigate(`/recipe/${id}`)} variant="outline-secondary" size="sm" style={{ marginBottom: '1rem' }}>
        Back to Recipe
      </Button>
      <h2>PDF Preview for {recipe.name}</h2>
      {imageError && (
        <div style={{ color: 'red', marginBottom: '1rem' }}>
          {imageError}
        </div>
      )}
      {fetchError && (
        <div style={{ color: 'red', marginBottom: '1rem' }}>
          {fetchError}
        </div>
      )}
      {watermarkError && (
        <div style={{ color: 'red', marginBottom: '1rem' }}>
          {watermarkError}
        </div>
      )}
      <PDFViewer key={recipe._id} style={{ width: '842px', height: '595px', marginTop: '1rem' }}>
        <Document>
          <Page size={{ width: 842, height: 595 }} style={styles.page}>
            {fields.map((field) => (
              <View
                key={field.id}
                style={{
                  ...(
                    field.isImage
                      ? {
                          ...styles.image,
                          left: field.x,
                          top: field.y,
                          width: field.width || 100,
                          height: field.height || (field.width || 100) / (field.aspectRatio || 1),
                          opacity: field.id === 'watermark' ? 0.2 : 1,
                        }
                      : field.isLine
                      ? {
                          ...styles.line,
                          left: field.x,
                          top: field.y,
                          width: field.orientation === 'horizontal' ? (field.length || 100) : 1,
                          height: field.orientation === 'vertical' ? (field.length || 100) : 1,
                          backgroundColor: '#000',
                        }
                      : { ...styles.field, left: field.x, top: field.y, width: field.width || 400 }
                  ),
                  zIndex: field.zIndex || (field.id === 'watermark' ? 5 : 10),
                }}
              >
                {field.isImage ? (
                  <Image
                    src={field.content}
                    style={{
                      width: field.width || 100,
                      height: field.height || (field.width || 100) / (field.aspectRatio || 1),
                    }}
                    onError={() => {
                      console.error('PDF Image load error:', field.content);
                      setImageError(`Image not found: ${field.content}`);
                    }}
                  />
                ) : field.isLine ? null : (
                  <Text style={{ fontSize: field.fontSize || 12, fontWeight: field.isBold ? 'bold' : 'normal' }}>
                    {field.content}
                  </Text>
                )}
              </View>
            ))}
          </Page>
        </Document>
      </PDFViewer>
    </div>
  );
};

export default PdfPreview;