import React, { useEffect } from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const RecipeFormPDF = ({ formData, ingredientsList, defaultImage, apiUrl, onGeneratePDF }) => {
  const stepsList = formData.steps?.split('\n').filter(step => step.trim()).map((step, index) => (
    <li key={index}>{step}</li>
  )) || [];

  const platingGuideList = formData.platingGuide?.split('\n').filter(guide => guide.trim()).map((guide, index) => (
    <li key={index}>{guide}</li>
  )) || [];

  const ingredientsDisplay = formData.ingredients.map((item, index) => {
    const selectedIng = ingredientsList.find(ing => ing._id === item.ingredient);
    return (
      <li key={index}>
        {selectedIng ? selectedIng.name : 'Unknown'} ({item.quantity || ''} {item.measure || ''})
      </li>
    );
  }) || [];

  const allServiceTypes = [...new Set([...(formData.serviceTypes || []), 'brunch', 'bar', 'catering'])];

  useEffect(() => {
    const handleGenerate = (e) => {
      if (e.type === 'generatePDF') {
        const element = document.querySelector('div[role="pdf-content"]');
        if (!element) {
          onGeneratePDF(new Error('PDF content not found'));
          return;
        }

        html2canvas(element, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          width: 1200,
        }).then(canvas => {
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
          });
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          const margin = 12.7;
          const contentWidth = pdfWidth - 2 * margin;
          const contentHeight = (canvas.height * contentWidth) / canvas.width;

          pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, contentHeight);

          pdf.setFontSize(8);
          pdf.setTextColor(138, 90, 68);
          pdf.text('Generated for Restaurant Recipe Management', margin, pdfHeight - 5);

          const pdfBlob = pdf.output('blob');
          const pdfUrl = URL.createObjectURL(pdfBlob);
          const previewWindow = window.open(pdfUrl, '_blank', 'width=800,height=600');
          if (!previewWindow) {
            onGeneratePDF(new Error('Failed to open preview window'));
          } else {
            previewWindow.focus();
          }
          URL.revokeObjectURL(pdfUrl);
        }).catch(err => {
          onGeneratePDF(err);
        });
      }
    };

    const pdfContent = document.querySelector('div[role="pdf-content"]');
    if (pdfContent) {
      pdfContent.addEventListener('generatePDF', handleGenerate);
    }

    return () => {
      if (pdfContent) {
        pdfContent.removeEventListener('generatePDF', handleGenerate);
      }
    };
  }, [onGeneratePDF, formData.name]);

  return (
    <div role="pdf-content" style={{ fontFamily: 'Helvetica, serif', color: '#8a5a44', maxWidth: '271.6mm', margin: '12.7mm' }}>
      <Row>
        <Col md={8}>
          <h1 style={{ fontSize: '40px', marginBottom: '15px' }}>
            {formData.name}
          </h1>
          <div className="mb-3">
            <h3 style={{ fontSize: '18px' }}>Ingredients</h3>
            <ul style={{ fontSize: '16px', lineHeight: '1.6', paddingLeft: '20px' }}>
              {ingredientsDisplay}
            </ul>
          </div>
          <div className="mb-3">
            <h3 style={{ fontSize: '18px' }}>Plating Guide</h3>
            <ul style={{ fontSize: '16px', lineHeight: '1.6', paddingLeft: '20px' }}>
              {platingGuideList.length > 0 ? platingGuideList : <li>No plating guide provided</li>}
            </ul>
          </div>
        </Col>
        <Col md={4} className="text-center">
          {formData.image && (
            <Card style={{ maxWidth: '500px', margin: '0 auto' }}>
              <Card.Img 
                src={formData.image instanceof File ? URL.createObjectURL(formData.image) : `${apiUrl}${formData.image}`} 
                alt={formData.name} 
                style={{ width: '500px', height: '500px', objectFit: 'cover' }} 
                onError={(e) => { e.target.src = defaultImage; }}
              />
            </Card>
          )}
          {!formData.image && (
            <Card style={{ maxWidth: '500px', margin: '0 auto' }}>
              <Card.Img 
                src={defaultImage} 
                alt="Default" 
                style={{ width: '500px', height: '500px', objectFit: 'cover' }} 
                onError={(e) => { e.target.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=='; }}
              />
            </Card>
          )}
          <div style={{ fontSize: '16px', lineHeight: '1.6', marginTop: '10px', textAlign: 'left' }}>
            <p><strong>Allergens:</strong> {formData.allergens?.join(', ') || 'None'}</p>
            <p><strong>Service Types:</strong> {allServiceTypes.join(', ') || 'brunch, bar, catering'}</p>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default RecipeFormPDF;