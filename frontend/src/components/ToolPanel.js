import React from 'react';
import { Button, ButtonGroup } from 'react-bootstrap';

const ToolPanel = ({ currentTool, onToolChange, onDelete, onClear, onExport, onReset, onSave, onDeselect, selectedIds, shapeCount, showGrid, onToggleGrid, gridSize, onGridSizeChange, snapToGrid, onToggleSnap }) => {
  const TOOLS = {
    SELECT: 'select',
    RECTANGLE: 'rectangle',
    CIRCLE: 'circle',
    LINE: 'line',
    TEXT: 'text'
  };

  const tools = [
    { key: TOOLS.SELECT, label: 'Select', icon: '↖' },
    { key: TOOLS.RECTANGLE, label: 'Rectangle', icon: '▭' },
    { key: TOOLS.CIRCLE, label: 'Circle', icon: '○' },
    { key: TOOLS.LINE, label: 'Line', icon: '∕' },
    { key: TOOLS.TEXT, label: 'Text', icon: 'T' }
  ];

  return (
    <div style={{ 
      padding: '1rem', 
      backgroundColor: '#f8f9fa', 
      borderRadius: '0.25rem',
      marginBottom: '1rem'
    }}>
      {/* Row 1: Drawing Tools & Object Actions */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem', alignItems: 'flex-start' }}>
        {/* Drawing Tools */}
        <div style={{ flex: 1 }}>
          <h6 style={{ marginBottom: '0.25rem', fontSize: '0.8rem', fontWeight: 'bold', color: '#495057' }}>
            Drawing Tools
          </h6>
          <ButtonGroup>
            {tools.map(tool => (
              <Button
                key={tool.key}
                variant={currentTool === tool.key ? 'primary' : 'outline-secondary'}
                size="sm"
                onClick={() => onToolChange(tool.key)}
                title={`${tool.label} (${tool.icon})`}
                style={{ minWidth: '70px', fontSize: '0.8rem' }}
              >
                <span style={{ marginRight: '0.25rem' }}>{tool.icon}</span>
                {tool.label}
              </Button>
            ))}
          </ButtonGroup>
        </div>

        {/* Object Actions */}
        <div style={{ flex: 1 }}>
          <h6 style={{ marginBottom: '0.25rem', fontSize: '0.8rem', fontWeight: 'bold', color: '#495057' }}>
            Object Actions
          </h6>
          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={onDeselect}
              disabled={selectedIds.length === 0}
              title="Deselect all items (or press Escape)"
              style={{ fontSize: '0.8rem' }}
            >
              ✕ Deselect
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={onDelete}
              disabled={selectedIds.length === 0}
              title="Delete selected shapes"
              style={{ fontSize: '0.8rem' }}
            >
              🗑️ Delete
            </Button>
            <Button
              variant="warning"
              size="sm"
              onClick={onClear}
              disabled={shapeCount === 0}
              title="Clear all shapes"
              style={{ fontSize: '0.8rem' }}
            >
              🧹 Clear All
            </Button>
          </div>
        </div>
      </div>

      {/* Row 2: Template, Export & Grid Controls */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        {/* Template & Export Actions */}
        <div style={{ flex: 1 }}>
          <h6 style={{ marginBottom: '0.25rem', fontSize: '0.8rem', fontWeight: 'bold', color: '#495057' }}>
            Template & Export
          </h6>
          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
            <Button
              variant="info"
              size="sm"
              onClick={onReset}
              title="Reset to original recipe layout"
              style={{ fontSize: '0.8rem' }}
            >
              🔄 Reset
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onSave}
              title="Save current layout"
              style={{ fontSize: '0.8rem' }}
            >
              💾 Save
            </Button>
            <Button
              variant="success"
              size="sm"
              onClick={onExport}
              disabled={shapeCount === 0}
              title="Preview PDF in new window"
              style={{ fontSize: '0.8rem' }}
            >
              👁️ PDF
            </Button>
          </div>
        </div>

        {/* Grid & Alignment */}
        <div style={{ flex: 1 }}>
          <h6 style={{ marginBottom: '0.25rem', fontSize: '0.8rem', fontWeight: 'bold', color: '#495057' }}>
            Grid & Alignment
          </h6>
          <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Button
              variant={showGrid ? "primary" : "outline-secondary"}
              size="sm"
              onClick={onToggleGrid}
              title="Toggle grid visibility"
              style={{ fontSize: '0.8rem' }}
            >
              📏 {showGrid ? "On" : "Off"}
            </Button>
            
            <Button
              variant={snapToGrid ? "primary" : "outline-secondary"}
              size="sm"
              onClick={onToggleSnap}
              title="Toggle snap to grid"
              style={{ fontSize: '0.8rem' }}
            >
              🧲 {snapToGrid ? "On" : "Off"}
            </Button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: '500', color: '#495057' }}>Size:</label>
              <select
                value={gridSize}
                onChange={(e) => onGridSizeChange(parseInt(e.target.value))}
                style={{ 
                  fontSize: '0.7rem', 
                  padding: '0.15rem',
                  border: '1px solid #ced4da',
                  borderRadius: '0.25rem',
                  backgroundColor: '#ffffff'
                }}
                disabled={!showGrid}
              >
                <option value={10}>10px</option>
                <option value={20}>20px</option>
                <option value={25}>25px</option>
                <option value={50}>50px</option>
                <option value={100}>100px</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Status Info */}
      <div style={{ 
        marginTop: '0.5rem', 
        fontSize: '0.8rem', 
        color: '#666',
        display: 'flex',
        gap: '1rem'
      }}>
        <span><strong>Tool:</strong> {currentTool}</span>
        <span><strong>Shapes:</strong> {shapeCount}</span>
        <span><strong>Selected:</strong> {selectedIds.length > 0 ? `${selectedIds.length} items` : 'None'}</span>
      </div>
    </div>
  );
};

export default ToolPanel;
