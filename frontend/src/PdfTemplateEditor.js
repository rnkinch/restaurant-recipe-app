// PdfTemplateEditor.js (Updated with stable Designer mount & JSON save)
import React, { useState, useEffect, useRef } from 'react';
import { Designer } from '@pdfme/ui';
import { Button, Modal } from 'react-bootstrap';

// Default PDF template if none provided
const defaultTemplate = {
  basePdf: { width: 792, height: 612 }, // Landscape letter at 72dpi
  schemas: [
    {
      name: 'image',
      type: 'image',
      position: { x: 396, y: 50 },
      width: 396,
      height: 512,
    },
    {
      name: 'name',
      type: 'text',
      position: { x: 50, y: 50 },
      width: 300,
      height: 20,
      fontSize: 18,
    },
    {
      name: 'ingredientsLabel',
      type: 'text',
      position: { x: 50, y: 80 },
      width: 300,
      height: 15,
      fontSize: 12,
      content: 'Ingredients:',
    },
    {
      name: 'watermark',
      type: 'image',
      position: { x: 200, y: 200 },
      width: 300,
      height: 300,
      opacity: 0.1,
      content: '/logo.png', // default watermark
    },
  ],
};

const PdfTemplateEditor = ({ show, onClose, initialTemplate, onSave }) => {
  const [template, setTemplate] = useState(initialTemplate || defaultTemplate);
  const containerRef = useRef(null);
  const designerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current && show) {
      // Initialize Designer only once
      designerRef.current = new Designer({
        domContainer: containerRef.current,
        template,
        onChangeTemplate: (newTemplate) => {
          setTemplate(newTemplate);
        },
      });
    }
    return () => {
      // Clean up designer instance on close
      designerRef.current = null;
    };
  }, [show]);

  const handleSave = () => {
    console.log("Saving template:", template);
    // Pass back JSON object (not stringified)
    onSave(template);
    onClose();
  };

  return (
    <Modal show={show} onHide={onClose} size="xl">
      <Modal.Header closeButton>
        <Modal.Title>Edit PDF Template</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div
          ref={containerRef}
          style={{ height: '500px', border: '1px solid #ccc' }}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave}>
          Save Template
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PdfTemplateEditor;
