# PDF 2.0 Implementation Plan

## Current System Assessment
- **Current Library**: `@react-pdf/renderer` with basic drag-and-drop
- **Limitations**: Limited image manipulation, no gradients, basic layout tools, single-document focus
- **Strengths**: Working template system, auto-save, multi-select capabilities

## Recommended New System: Konva.js + React-Konva

### Key Technical Changes

**New Dependencies:**
```json
{
  "konva": "^9.2.0",
  "react-konva": "^18.2.10", 
  "use-image": "^1.1.1"
}
```

**Keep Existing Dependencies:**
- `html2canvas` - For canvas to image conversion
- `jsPDF` - For PDF generation
- `react-dnd` - Can be removed (Konva handles drag-and-drop)

### Core Features to Implement

**1. Enhanced Visual Editor:**
- Canvas-based rendering with Konva.js
- Image filters and effects
- Gradient overlays
- Advanced shape tools
- Layer management system

**2. Precision Tools:**
- Grid systems (linear, radial)
- Snap-to-grid and alignment
- Numeric positioning inputs
- Measurement tools
- Object transformation controls

**3. Template System:**
- Multiple template support
- Template preview gallery
- Custom template creation
- Template categorization

**4. Dual Export System:**
- Single recipe PDF export
- Batch recipe PDF export (all recipes in one PDF)
- High-resolution output
- Multiple format support

**5. Real-time Preview:**
- Zoom and pan capabilities
- Live preview alongside editor
- Print preview with accurate sizing

### Implementation Approach

**Fresh Start:**
- No template migration needed
- Build new editor from scratch
- Keep existing API endpoints
- Maintain current data structure

**Export Pipeline:**
- Konva Stage → HTML Canvas
- `html2canvas` → High-res image
- `jsPDF` → PDF output

### File Structure Changes

**New Components:**
- `CanvasEditor.js` - Main Konva stage
- `ToolPanel.js` - Editing tools
- `LayerPanel.js` - Layer management
- `PropertiesPanel.js` - Object properties
- `TemplatePanel.js` - Template selection
- `BatchExport.js` - Multi-recipe export

**Replace Existing:**
- `PdfEditor.js` → New Konva-based editor
- `PdfPreview.js` → Enhanced preview with zoom/pan
- `PdfEditorWrapper.js` → Updated wrapper

### Development Phases

1. **Phase 1**: Basic Konva.js integration with simple shapes ✅ COMPLETED
2. **Phase 2**: Image manipulation and gradient features
3. **Phase 3**: Multiple template system
4. **Phase 4**: Advanced layout tools and precision controls
5. **Phase 5**: Batch export functionality
6. **Phase 6**: Enhanced preview and mobile support

## Phase 1: Basic Konva.js Integration

### Goals
- Set up Konva.js canvas with basic shape tools
- Implement drag-and-drop functionality
- Create basic toolbar with essential tools
- Establish foundation for advanced features

### Implementation Steps

1. **Install Dependencies**
   ```bash
   npm install konva react-konva use-image
   ```

2. **Create Basic Canvas Editor**
   - Set up Konva Stage and Layer
   - Implement basic shape tools (rectangle, circle, line)
   - Add drag-and-drop for objects
   - Create simple toolbar

3. **Basic Object Management**
   - Object selection and highlighting
   - Basic properties panel (position, size, color)
   - Simple undo/redo functionality

4. **Foundation for Export**
   - Canvas to image conversion setup
   - Basic PDF export functionality

### Success Criteria
- Working Konva.js canvas with basic shapes ✅
- Drag-and-drop functionality ✅
- Basic object selection and manipulation ✅
- Simple PDF export working ✅
- Foundation ready for Phase 2 features ✅

### Phase 1 Completed Features

**Core Components Created:**
- `CanvasEditor.js` - Main Konva.js canvas editor
- `CanvasEditorWrapper.js` - Wrapper component with recipe integration
- `ToolPanel.js` - Toolbar with shape creation tools
- `PropertiesPanel.js` - Object property editing panel

**Functionality Implemented:**
- Basic shape tools (Rectangle, Circle, Line, Text)
- Drag-and-drop for object manipulation
- Object selection and highlighting
- Real-time property editing
- PDF export using jsPDF
- Tool switching and visual feedback
- Object deletion and clearing
- **Automatic recipe data population** ✅
- **Recipe image loading and display** ✅
- **Reset to original recipe layout** ✅
- Responsive UI with status information

**Integration:**
- Added route `/canvas-editor` to App.js
- Added navigation link in admin menu
- Integrated with existing notification system
- Compatible with existing recipe data structure

**Next Steps for Phase 2:**
- Image loading and manipulation
- Gradient effects and filters
- Advanced shape tools
- Layer management system

---

*This document will be updated as implementation progresses.*
