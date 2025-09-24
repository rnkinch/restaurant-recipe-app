import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, Text, View, Image, StyleSheet, PDFViewer } from '@react-pdf/renderer';
import { Button } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { getRecipeById } from './api';

const styles = StyleSheet.create({
  page: {
    width: 792, // 11 inches at 72 DPI (landscape)
    height: 612, // 8.5 inches at 72 DPI
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
  viewerContainer: {
    width: '828px', // 792px + 18px left border + 18px right border
    height: '648px', // 612px + 18px top border + 18px bottom border
    border: '18px solid #000', // 1/4" border (18px at 72 DPI)
    boxSizing: 'border-box',
    marginTop: '1rem',
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
  const [isLoading, setIsLoading] = useState(true);
  const [imageAspectRatios, setImageAspectRatios] = useState({});
  const [imageDataUrls, setImageDataUrls] = useState({});
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
      setImageAspectRatios({});
      setImageDataUrls({});

      const validateImage = async (url, key) => {
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
            },
          });
          if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
          }
          const blob = await response.blob();
          const dataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
          const img = document.createElement('img');
          img.src = dataUrl;
          await new Promise((resolve) => {
            img.onload = () => {
              const aspectRatio = img.naturalWidth / img.naturalHeight;
              setImageAspectRatios((prev) => ({ ...prev, [key]: aspectRatio }));
              setImageDataUrls((prev) => ({ ...prev, [key]: dataUrl }));
              console.log('Image validated:', key, aspectRatio);
              resolve();
            };
            img.onerror = () => {
              console.error('Image load error:', url);
              setImageError(`Image not found: ${url}`);
              resolve(); // Continue to allow rendering
            };
          });
        } catch (err) {
          console.error('Image validation failed:', url, err.message);
          setImageError(`Image not found: ${url}`);
        }
      };

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
          : `${frontendUrl}/default_image.png`;
        const watermarkUrl = `${apiUrl}/Uploads/logo.png`;
        console.log('Image URL:', imageUrl);
        console.log('Watermark URL:', watermarkUrl);

        // Validate both recipe image and watermark
        await Promise.all([
          validateImage(imageUrl, 'recipeImage'),
          validateImage(watermarkUrl, 'watermark'),
        ]);

        const defaultFields = [
          { id: 'titleLabel', content: 'Recipe Title:', x: 18, y: 18, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
          { id: 'title', content: recipeData?.name || 'Recipe Title', x: 18, y: 38, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
          { id: 'ingredientsLabel', content: 'Ingredients:', x: 18, y: 68, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
          {
            id: 'ingredients',
            content: Array.isArray(recipeData?.ingredients)
              ? recipeData.ingredients.map((i) => `${i.quantity || ''} ${i.measure || ''} ${i.ingredient?.name || ''}`).join('\n')
              : 'No ingredients',
            x: 18,
            y: 88,
            fontSize: 12,
            isBold: false,
            width: 500,
            zIndex: 10,
          },
          { id: 'stepsLabel', content: 'Steps:', x: 18, y: 198, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
          {
            id: 'steps',
            content: recipeData?.steps || 'No steps',
            x: 18,
            y: 218,
            fontSize: 12,
            isBold: false,
            width: 500,
            zIndex: 10,
          },
          { id: 'platingGuideLabel', content: 'Plating Guide:', x: 18, y: 328, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
          {
            id: 'platingGuide',
            content: recipeData?.platingGuide || 'No plating guide',
            x: 18,
            y: 348,
            fontSize: 12,
            isBold: false,
            width: 500,
            zIndex: 10,
          },
          { id: 'allergensLabel', content: 'Allergens:', x: 450, y: 18, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
          {
            id: 'allergens',
            content: Array.isArray(recipeData?.allergens) ? recipeData.allergens.join(', ') : 'No allergens',
            x: 450,
            y: 38,
            fontSize: 12,
            isBold: false,
            width: 400,
            zIndex: 10,
          },
          { id: 'serviceTypesLabel', content: 'Service Types:', x: 450, y: 68, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
          {
            id: 'serviceTypes',
            content: Array.isArray(recipeData?.serviceTypes) ? recipeData.serviceTypes.join(', ') : 'No service types',
            x: 450,
            y: 88,
            fontSize: 12,
            isBold: false,
            width: 400,
            zIndex: 10,
          },
          {
            id: 'image',
            content: imageDataUrls['recipeImage'] || imageUrl,
            x: 450,
            y: 118,
            width: 100,
            height: 100 / (imageAspectRatios['recipeImage'] || 1),
            isImage: true,
            aspectRatio: imageAspectRatios['recipeImage'] || 1,
            zIndex: 10,
          },
          {
            id: 'watermark',
            content: imageDataUrls['watermark'] || watermarkUrl,
            x: 421,
            y: 297.5,
            width: 200,
            height: 200 / (imageAspectRatios['watermark'] || 1),
            isImage: true,
            aspectRatio: imageAspectRatios['watermark'] || 1,
            zIndex: 5,
            opacity: 0.2,
          },
        ];

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
              const maxWidth = field.isImage ? (field.width || 100) : field.isLine ? (field.orientation === 'horizontal' ? (field.length || 100) : 1) : (field.width || 400);
              const maxHeight = field.isImage ? ((field.width || 100) / (field.aspectRatio || 1)) : field.isLine ? (field.orientation === 'vertical' ? (field.length || 100) : 1) : 20;
              const constrainedX = Math.max(18, Math.min(792 - 18 - maxWidth, field.x));
              const constrainedY = Math.max(18, Math.min(612 - 18 - maxHeight, field.y));
              if (field.isImage && field.id === 'image') {
                return {
                  ...field,
                  content: imageDataUrls['recipeImage'] || imageUrl,
                  aspectRatio: imageAspectRatios['recipeImage'] || 1,
                  height: (field.width || 100) / (imageAspectRatios['recipeImage'] || 1),
                  x: constrainedX,
                  y: constrainedY,
                };
              }
              if (field.isImage && field.id === 'watermark') {
                return {
                  ...field,
                  content: imageDataUrls['watermark'] || watermarkUrl,
                  aspectRatio: imageAspectRatios['watermark'] || 1,
                  height: (field.width || 200) / (imageAspectRatios['watermark'] || 1),
                  opacity: field.opacity || 0.2,
                  x: constrainedX,
                  y: constrainedY,
                };
              }
              if (field.id === 'title') {
                return { ...field, content: recipeData?.name || 'Recipe Title', x: constrainedX, y: constrainedY };
              }
              if (field.id === 'ingredients') {
                return {
                  ...field,
                  content: Array.isArray(recipeData?.ingredients)
                    ? recipeData.ingredients.map((i) => `${i.quantity || ''} ${i.measure || ''} ${i.ingredient?.name || ''}`).join('\n')
                    : 'No ingredients',
                  x: constrainedX,
                  y: constrainedY,
                };
              }
              if (field.id === 'steps') {
                return { ...field, content: recipeData?.steps || 'No steps', x: constrainedX, y: constrainedY };
              }
              if (field.id === 'platingGuide') {
                return { ...field, content: recipeData?.platingGuide || 'No plating guide', x: constrainedX, y: constrainedY };
              }
              if (field.id === 'allergens') {
                return { ...field, content: Array.isArray(recipeData?.allergens) ? recipeData.allergens.join(', ') : 'No allergens', x: constrainedX, y: constrainedY };
              }
              if (field.id === 'serviceTypes') {
                return { ...field, content: Array.isArray(recipeData?.serviceTypes) ? recipeData.serviceTypes.join(', ') : 'No service types', x: constrainedX, y: constrainedY };
              }
              return { ...field, x: constrainedX, y: constrainedY };
            });
            setFields(updatedFields);
          } else {
            console.warn('No template fields found');
            setFields(defaultFields);
          }
        } else {
          console.warn('Template fetch failed, using default fields');
          setFields(defaultFields);
        }
      } catch (err) {
        console.error('Fetch failed:', err.message);
        setFetchError(`Failed to load recipe or template: ${err.message}`);
        const fallbackFields = [
          { id: 'titleLabel', content: 'Recipe Title:', x: 18, y: 18, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
          { id: 'title', content: 'Recipe Title', x: 18, y: 38, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
          { id: 'ingredientsLabel', content: 'Ingredients:', x: 18, y: 68, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
          {
            id: 'ingredients',
            content: 'No ingredients',
            x: 18,
            y: 88,
            fontSize: 12,
            isBold: false,
            width: 500,
            zIndex: 10,
          },
          { id: 'stepsLabel', content: 'Steps:', x: 18, y: 198, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
          {
            id: 'steps',
            content: 'No steps',
            x: 18,
            y: 218,
            fontSize: 12,
            isBold: false,
            width: 500,
            zIndex: 10,
          },
          { id: 'platingGuideLabel', content: 'Plating Guide:', x: 18, y: 328, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
          {
            id: 'platingGuide',
            content: 'No plating guide',
            x: 18,
            y: 348,
            fontSize: 12,
            isBold: false,
            width: 500,
            zIndex: 10,
          },
          { id: 'allergensLabel', content: 'Allergens:', x: 450, y: 18, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
          {
            id: 'allergens',
            content: 'No allergens',
            x: 450,
            y: 38,
            fontSize: 12,
            isBold: false,
            width: 400,
            zIndex: 10,
          },
          { id: 'serviceTypesLabel', content: 'Service Types:', x: 450, y: 68, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
          {
            id: 'serviceTypes',
            content: 'No service types',
            x: 450,
            y: 88,
            fontSize: 12,
            isBold: false,
            width: 400,
            zIndex: 10,
          },
          {
            id: 'image',
            content: imageDataUrls['recipeImage'] || `${frontendUrl}/default_image.png`,
            x: 450,
            y: 118,
            width: 100,
            height: 100 / (imageAspectRatios['recipeImage'] || 1),
            isImage: true,
            aspectRatio: imageAspectRatios['recipeImage'] || 1,
            zIndex: 10,
          },
          {
            id: 'watermark',
            content: imageDataUrls['watermark'] || `${apiUrl}/Uploads/logo.png`,
            x: 421,
            y: 297.5,
            width: 200,
            height: 200 / (imageAspectRatios['watermark'] || 1),
            isImage: true,
            aspectRatio: imageAspectRatios['watermark'] || 1,
            zIndex: 5,
            opacity: 0.2,
          },
        ];
        setFields(fallbackFields);
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
      setImageAspectRatios({});
      setImageDataUrls({});
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
      <div style={styles.viewerContainer}>
        <PDFViewer key={recipe._id} style={{ width: '792px', height: '612px' }} className="pdf-viewer">
          <Document>
            <Page size={[792, 612]} style={styles.page}>
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
                            height: (field.width || 100) / (field.aspectRatio || 1),
                            opacity: field.id === 'watermark' ? field.opacity || 0.2 : 1,
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
                        height: (field.width || 100) / (field.aspectRatio || 1),
                        objectFit: 'contain', // Ensure aspect ratio is respected
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
    </div>
  );
};

export default PdfPreview;