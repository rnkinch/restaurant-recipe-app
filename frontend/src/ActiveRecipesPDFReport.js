import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Document, Page, Text, View, Image, StyleSheet, PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import { Container, Alert, ProgressBar } from 'react-bootstrap';
import { getRecipes, getPdfTemplate, getConfig } from './api';

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
    width: '878px', // 842px + 18px left border + 18px right border
    height: '631px', // 595px + 18px top border + 18px bottom border
    border: '18px solid #000', // 1/4" border (18px at 72 DPI)
    boxSizing: 'border-box',
    marginTop: '1rem',
  },
  downloadButton: {
    display: 'inline-block',
    marginRight: '10px',
  },
  progressBar: {
    marginBottom: '1rem',
  },
});

const ActiveRecipesPDFReport = () => {
  const [recipes, setRecipes] = useState([]);
  const [template, setTemplate] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageDataUrls, setImageDataUrls] = useState({});
  const [imageAspectRatios, setImageAspectRatios] = useState({});
  const [imageErrors, setImageErrors] = useState({});
  const [appName, setAppName] = useState('XYZCompany_Recipe_and_Plating_Guide');
  const [progress, setProgress] = useState(0);
  const apiUrl = process.env.REACT_APP_API_URL || 'http://192.168.68.129:5000';
  const frontendUrl = process.env.REACT_APP_FRONTEND_URL || 'http://192.168.68.129:3000';
  const currentFetchRef = useRef(null);

  // Generate date-time stamp (e.g., 20250923_192345)
  const getDateTimeStamp = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
  };

  // Memoized validateImage function
  const validateImage = useCallback(async (url, key) => {
    console.log('Validating image:', url, key);
    try {
      // Use direct URL to avoid fetch issues
      setImageDataUrls((prev) => ({ ...prev, [key]: url }));
      setImageAspectRatios((prev) => ({ ...prev, [key]: 1 }));
      console.log('Using direct URL for image:', url, key);
    } catch (err) {
      console.error('Image validation failed:', url, err.message);
      setImageErrors((prev) => ({ ...prev, [key]: `Failed to load image: ${url} - ${err.message}` }));
      // Fallback to direct URL
      setImageDataUrls((prev) => ({ ...prev, [key]: url }));
      setImageAspectRatios((prev) => ({ ...prev, [key]: 1 }));
    }
  }, []);

  useEffect(() => {
    console.log('useEffect triggered at:', new Date().toISOString());
    const fetchActiveRecipesAndTemplate = async () => {
      const fetchId = Date.now();
      currentFetchRef.current = fetchId;
      setIsLoading(true);
      setError(null);
      setImageDataUrls({});
      setImageAspectRatios({});
      setImageErrors({});
      setProgress(0);

      try {
        // Fetch appName from config
        console.log('Fetching config from:', `${apiUrl}/config`);
        const configData = await getConfig();
        if (currentFetchRef.current !== fetchId) return;
        console.log('Fetched config:', JSON.stringify(configData, null, 2));
        if (configData && configData.appName) {
          setAppName(configData.appName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, ''));
        }
        setProgress(25);
        console.log('Progress updated to 25%');

        // Fetch PDF template
        console.log('Fetching PDF template from:', `${apiUrl}/templates/default`);
        const templateData = await getPdfTemplate();
        if (currentFetchRef.current !== fetchId) return;
        console.log('Fetched template:', JSON.stringify(templateData, null, 2));
        if (!templateData || !Array.isArray(templateData)) {
          console.warn('No valid template found, using default fields.');
          setTemplate([]);
        } else {
          setTemplate(templateData);
        }
        setProgress(50);
        console.log('Progress updated to 50%');

        // Fetch active recipes
        console.log('Fetching active recipes from:', `${apiUrl}/recipes?all=true`);
        const recipesData = await getRecipes(true);
        if (currentFetchRef.current !== fetchId) return;
        console.log('Fetched recipes:', recipesData.length, 'recipes');
        const activeRecipes = recipesData.filter(
          (recipe) => recipe.active === true || recipe.active === 'true'
        );
        console.log('Filtered active recipes:', activeRecipes.length, JSON.stringify(activeRecipes.map(r => ({ _id: r._id, name: r.name, active: r.active, image: r.image })), null, 2));
        if (activeRecipes.length === 0) {
          setError('No active recipes found. Please ensure active recipes exist in the database.');
        }
        setRecipes(activeRecipes);
        setProgress(75);
        console.log('Progress updated to 75%');

        // Validate images for all recipes and watermark
        const imageValidations = [];
        activeRecipes.forEach((recipe) => {
          const recipeImageUrl = recipe.image && typeof recipe.image === 'string'
            ? `${apiUrl}/Uploads/${recipe.image.split('/').pop()}`
            : `${frontendUrl}/default_image.png`;
          console.log('Validating image:', recipeImageUrl, `recipeImage_${recipe._id}`);
          imageValidations.push(validateImage(recipeImageUrl, `recipeImage_${recipe._id}`));
        });
        console.log('Validating watermark:', `${apiUrl}/Uploads/logo.png`);
        imageValidations.push(validateImage(`${apiUrl}/Uploads/logo.png`, 'watermark'));
        await Promise.all(imageValidations);
        setProgress(100);
        console.log('Progress updated to 100%');

        setIsLoading(false);
        console.log('Loading complete, rendering PDFViewer');
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(`Failed to load data: ${err.message}`);
        setIsLoading(false);
      }
    };

    fetchActiveRecipesAndTemplate();
    return () => {
      currentFetchRef.current = null;
      console.log('useEffect cleanup at:', new Date().toISOString());
    };
  }, [apiUrl, frontendUrl, validateImage]);

  const getFieldContent = (field, recipe) => {
    switch (field.id) {
      case 'title':
        return recipe.name || 'Recipe Title';
      case 'ingredients':
        return Array.isArray(recipe.ingredients)
          ? recipe.ingredients.map((i) => `${i.quantity || ''} ${i.measure || ''} ${i.ingredient?.name || ''}`).join('\n')
          : 'No ingredients';
      case 'steps':
        return recipe.steps ? recipe.steps.split('\n').filter((step) => step.trim()).join('\n') : 'No steps provided';
      case 'platingGuide':
        return recipe.platingGuide ? recipe.platingGuide.split('\n').filter((guide) => guide.trim()).join('\n') : 'No plating guide provided';
      case 'allergens':
        return Array.isArray(recipe.allergens) && recipe.allergens.length > 0 ? recipe.allergens.join(', ') : 'No allergens';
      case 'serviceTypes':
        return Array.isArray(recipe.serviceTypes) && recipe.serviceTypes.length > 0 ? recipe.serviceTypes.join(', ') : 'No service types';
      case 'image':
        return imageDataUrls[`recipeImage_${recipe._id}`] || `${frontendUrl}/default_image.png`;
      case 'watermark':
        return imageDataUrls['watermark'] || `${apiUrl}/Uploads/logo.png`;
      default:
        return field.content || '';
    }
  };

  // Memoize MyDocument to prevent unnecessary re-renders
  const MyDocument = useMemo(() => () => (
    <Document>
      {recipes.map((recipe) => (
        <Page key={recipe._id} size={[792, 612]} style={styles.page}>
          {(template || [
            { id: 'watermark', content: imageDataUrls['watermark'] || `${apiUrl}/Uploads/logo.png`, x: 421, y: 297.5, width: 200, height: 200 / (imageAspectRatios['watermark'] || 1), isImage: true, zIndex: 5, opacity: 0.2, aspectRatio: imageAspectRatios['watermark'] || 1 },
            { id: 'titleLabel', content: 'Recipe Title:', x: 20, y: 10, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
            { id: 'title', content: recipe.name || 'Recipe Title', x: 20, y: 30, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
            { id: 'ingredientsLabel', content: 'Ingredients:', x: 20, y: 60, fontSize: 12, isBold: false, width: 400, zIndex: 10 },
            {
              id: 'ingredients',
              content: Array.isArray(recipe.ingredients)
                ? recipe.ingredients.map((i) => `${i.quantity || ''} ${i.measure || ''} ${i.ingredient?.name || ''}`).join('\n')
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
              content: recipe.steps ? recipe.steps.split('\n').filter((step) => step.trim()).join('\n') : 'No steps provided',
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
              content: recipe.platingGuide ? recipe.platingGuide.split('\n').filter((guide) => guide.trim()).join('\n') : 'No plating guide provided',
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
              content: Array.isArray(recipe.allergens) && recipe.allergens.length > 0 ? recipe.allergens.join(', ') : 'No allergens',
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
              content: Array.isArray(recipe.serviceTypes) && recipe.serviceTypes.length > 0 ? recipe.serviceTypes.join(', ') : 'No service types',
              x: 450,
              y: 80,
              fontSize: 12,
              isBold: false,
              width: 400,
              zIndex: 10,
            },
            {
              id: 'image',
              content: imageDataUrls[`recipeImage_${recipe._id}`] || `${frontendUrl}/default_image.png`,
              x: 450,
              y: 110,
              width: 100,
              height: 100 / (imageAspectRatios[`recipeImage_${recipe._id}`] || 1),
              isImage: true,
              aspectRatio: imageAspectRatios[`recipeImage_${recipe._id}`] || 1,
              zIndex: 10,
            },
          ]).map((field) => (
            <View
              key={field.id}
              style={{
                ...(field.isImage
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
                  : {
                      ...styles.field,
                      left: field.x,
                      top: field.y,
                      width: field.width || 400,
                    }),
                zIndex: field.zIndex || (field.id === 'watermark' ? 5 : 10),
              }}
            >
              {field.isImage && !imageErrors[field.id] && !imageErrors[`recipeImage_${recipe._id}`] ? (
                <Image
                  src={getFieldContent(field, recipe)}
                  style={{
                    width: field.width || 100,
                    height: (field.width || 100) / (field.aspectRatio || 1),
                    objectFit: 'contain',
                  }}
                />
              ) : field.isLine ? null : (
                <Text
                  style={{
                    fontSize: field.fontSize || 12,
                    fontWeight: field.isBold ? 'bold' : 'normal',
                  }}
                >
                  {getFieldContent(field, recipe)}
                </Text>
              )}
            </View>
          ))}
        </Page>
      ))}
    </Document>
  ), [recipes, template, imageDataUrls, imageAspectRatios, imageErrors, apiUrl, frontendUrl]);

  const pdfFileName = `${appName}_${getDateTimeStamp()}.pdf`;

  if (isLoading) {
    console.log('Rendering loading state with progress:', progress);
    return (
      <Container className="py-3">
        <h2>Active Recipes PDF Report</h2>
        <ProgressBar
          now={progress}
          label={`${progress}%`}
          variant="info"
          style={styles.progressBar}
        />
        <p>Loading...</p>
      </Container>
    );
  }

  if (error) {
    console.log('Rendering error state:', error);
    return (
      <Container className="py-3">
        <h2>Active Recipes PDF Report</h2>
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (Object.keys(imageErrors).length > 0) {
    console.log('Rendering image errors:', imageErrors);
    return (
      <Container className="py-3">
        <h2>Active Recipes PDF Report</h2>
        {Object.values(imageErrors).map((err, index) => (
          <Alert key={index} variant="warning" dismissible onClose={() => setImageErrors({})}>
            {err}
          </Alert>
        ))}
        <div className="mb-3">
          <PDFDownloadLink
            document={<MyDocument />}
            fileName={pdfFileName}
            style={styles.downloadButton}
          >
            {({ loading }) => (loading ? 'Generating PDF...' : 'Download PDF')}
          </PDFDownloadLink>
        </div>
        <div style={styles.viewerContainer}>
          <PDFViewer style={{ width: '842px', height: '595px' }} className="pdf-viewer">
            <MyDocument />
          </PDFViewer>
        </div>
      </Container>
    );
  }

  console.log('Rendering final state with recipes:', recipes.length);
  return (
    <Container className="py-3">
      <h2>Active Recipes PDF Report</h2>
      <div className="mb-3">
        <PDFDownloadLink
          document={<MyDocument />}
          fileName={pdfFileName}
          style={styles.downloadButton}
        >
          {({ loading }) => (loading ? 'Generating PDF...' : 'Download PDF')}
        </PDFDownloadLink>
      </div>
      {recipes.length === 0 ? (
        <p>No active recipes found.</p>
      ) : (
        <div style={styles.viewerContainer}>
          <PDFViewer style={{ width: '842px', height: '595px' }} className="pdf-viewer">
            <MyDocument />
          </PDFViewer>
        </div>
      )}
    </Container>
  );
};

export default ActiveRecipesPDFReport;