import React, { useState } from 'react';
import { generate } from '@pdfme/generator';
import axios from 'axios';

const RecipeFormPDF = ({ recipe }) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      // Fetch template from backend (recipe-specific or fallback to default)
      const { data: templateDoc } = await axios.get(`/templates/${recipe._id}`);
      const template = templateDoc?.json;

      if (!template) {
        alert('No template found. Please create or edit a PDF template first.');
        setLoading(false);
        return;
      }

      // Fill recipe data into template
      const inputs = [{
        'Recipe Name': recipe.name,
        'Ingredients': recipe.ingredients
          .map(i => `${i.name} - ${i.quantity} ${i.unit}`)
          .join('\n'),
        'Steps': recipe.steps,
      }];

      // Generate PDF
      const pdfBuffer = await generate({ template, inputs });
      const blob = new Blob([pdfBuffer.buffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <button
        onClick={handleGenerate}
        className="btn btn-success"
        disabled={loading}
      >
        {loading ? 'Generating…' : 'Generate Recipe PDF'}
      </button>

      {pdfUrl && (
        <iframe
          src={pdfUrl}
          style={{
            width: '100%',
            height: '600px',
            border: '1px solid #ddd',
            marginTop: '1rem',
          }}
          title="Recipe PDF Preview"
        />
      )}
    </div>
  );
};

export default RecipeFormPDF;

