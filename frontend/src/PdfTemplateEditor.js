import React, { useEffect, useRef } from 'react';
import { Designer } from '@pdfme/ui';
import { generate } from '@pdfme/generator';
import { text, image } from '@pdfme/schemas';
import blankPdf from './blank-landscape.pdf';

const PdfTemplateEditor = ({ recipe, onBack }) => {
  const designerRef = useRef(null);
  const containerRef = useRef(null);

  // Hardcoded fallback template
  const fallbackTemplate = {
    basePdf: blankPdf,
    schemas: [[
      { type: 'text', name: 'titleLabel', content: 'Recipe Title:', position: { x: 50, y: 20 }, width: 200, height: 20 },
      { type: 'text', name: 'title', position: { x: 50, y: 40 }, width: 400, height: 40 },
      { type: 'text', name: 'ingredientsLabel', content: 'Ingredients:', position: { x: 50, y: 80 }, width: 200, height: 20 },
      { type: 'text', name: 'ingredients', position: { x: 50, y: 100 }, width: 400, height: 120 },
      { type: 'text', name: 'stepsLabel', content: 'Steps:', position: { x: 50, y: 220 }, width: 200, height: 20 },
      { type: 'text', name: 'steps', position: { x: 50, y: 240 }, width: 400, height: 180 },
      { type: 'text', name: 'platingGuideLabel', content: 'Plating Guide:', position: { x: 50, y: 430 }, width: 200, height: 20 },
      { type: 'text', name: 'platingGuide', position: { x: 50, y: 450 }, width: 400, height: 100 },
      { type: 'text', name: 'photoLabel', content: 'Image:', position: { x: 500, y: 20 }, width: 100, height: 20 },
      { type: 'image', name: 'photo', position: { x: 500, y: 40 }, width: 280, height: 180 },
      { type: 'text', name: 'allergensLabel', content: 'Allergens:', position: { x: 500, y: 230 }, width: 200, height: 20 },
      { type: 'text', name: 'allergens', position: { x: 500, y: 250 }, width: 280, height: 50 },
      { type: 'text', name: 'serviceTypesLabel', content: 'Service Types:', position: { x: 500, y: 310 }, width: 200, height: 20 },
      { type: 'text', name: 'serviceTypes', position: { x: 500, y: 330 }, width: 280, height: 50 },
    ]],
  };

  // Load template from backend or fallback
  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const res = await fetch(`http://192.168.68.129:5000/templates/${recipe._id}`);
        if (res.ok) {
          const data = await res.json();
          const tpl = data?.template || fallbackTemplate;

          const designer = new Designer({
            domContainer: containerRef.current,
            template: tpl,
            plugins: { text, image },
          });
          designerRef.current = designer;
          return;
        }
      } catch (err) {
        console.error('Template load failed, using fallback:', err);
      }

      // fallback
      const designer = new Designer({
        domContainer: containerRef.current,
        template: fallbackTemplate,
        plugins: { text, image },
      });
      designerRef.current = designer;
    };

    if (containerRef.current) {
      fetchTemplate();
    }
  }, [recipe]);

  // Preview PDF
  const handlePreview = async () => {
    try {
      const tpl = designerRef.current.getTemplate();

      const inputs = [{
        title: recipe?.name || 'Untitled Recipe',
        ingredients: Array.isArray(recipe?.ingredients)
          ? recipe.ingredients.map(i => `${i.quantity || ''} ${i.unit || ''} ${i.name}`).join('\n')
          : (recipe?.ingredients || ''),
        steps: Array.isArray(recipe?.steps)
          ? recipe.steps.join('\n')
          : (recipe?.steps || ''),
        platingGuide: recipe?.platingGuide || '',
        allergens: Array.isArray(recipe?.allergens)
          ? recipe.allergens.join(', ')
          : (recipe?.allergens || ''),
        serviceTypes: Array.isArray(recipe?.serviceTypes)
          ? recipe.serviceTypes.join(', ')
          : (recipe?.serviceTypes || ''),
        photo: recipe?.photoPath
          ? `http://192.168.68.129:5000/uploads/${recipe.photoPath}`
          : 'https://placehold.co/200x200.png',
      }];

      const pdf = await generate({
        template: tpl,
        inputs,
        plugins: { text, image },
      });

      const blob = new Blob([pdf.buffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      console.error('Preview failed:', err);
      alert(`Preview failed: ${err.message}`);
    }
  };

  // Save custom template for this recipe
  const handleSave = async () => {
    try {
      const tpl = designerRef.current.getTemplate();
      const response = await fetch(`http://192.168.68.129:5000/templates/${recipe._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: tpl }),
      });
      if (!response.ok) throw new Error('Save failed');
      alert('Template saved successfully for this recipe!');
    } catch (err) {
      console.error('Save failed:', err);
      alert(`Save failed: ${err.message}`);
    }
  };

  // Save as default template
  const handleSaveDefault = async () => {
    try {
      const tpl = designerRef.current.getTemplate();
      const response = await fetch(`http://192.168.68.129:5000/templates/default/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: tpl }),
      });
      if (!response.ok) throw new Error('Save default failed');
      alert('Default template updated!');
    } catch (err) {
      console.error('Save default failed:', err);
      alert(`Save default failed: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Edit PDF Template</h2>
      <div
        ref={containerRef}
        style={{
          border: '1px solid #ccc',
          height: '600px',
          marginBottom: '1rem',
        }}
      />
      <button onClick={handlePreview}>Preview PDF</button>
      <button onClick={handleSave} style={{ marginLeft: '0.5rem' }}>Save Template</button>
      <button onClick={handleSaveDefault} style={{ marginLeft: '0.5rem' }}>Save as Default</button>
      {onBack && (
        <button onClick={onBack} style={{ marginLeft: '0.5rem' }}>
          Back to Recipe
        </button>
      )}
    </div>
  );
};

export default PdfTemplateEditor;
