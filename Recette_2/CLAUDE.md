# Bio-OS SCADA Workflow Interface

## Project Overview
This is a React-based user interface for Bio-OS SCADA, a bioreactor workflow management system. The interface allows users to create, edit, and manage bioreactor recipes through a visual node-based workflow editor.

## Tech Stack
- **Framework**: React 18 + TypeScript
- **Styling**: Tailwind CSS v3
- **Build Tool**: Vite
- **Package Manager**: npm

## Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npx tsc --noEmit

# Lint (if configured)
npm run lint
```

## Project Structure

```
src/
├── main.tsx              # Application entry point
├── App.tsx               # Root component with WorkflowProvider
├── index.css             # Global styles and Tailwind imports
├── context/
│   └── WorkflowContext.tsx    # State management for workflow nodes/connections
└── components/
    ├── layout/
    │   ├── Layout.tsx         # Main layout wrapper
    │   ├── Header.tsx         # Top navigation bar (logo, device selectors, date/time)
    │   └── Sidebar.tsx        # Left icon navigation
    ├── recipe/
    │   └── RecipePanel.tsx    # Recipe list panel (Grow-A, Grow-B, etc.)
    ├── operation/
    │   └── OperationPanel.tsx # Operation phases panel (Preparation, Inoculation, etc.)
    ├── library/
    │   ├── index.ts
    │   └── LibraryPanel.tsx   # Draggable phase types library
    └── workflow/
        ├── index.ts
        ├── WorkflowCanvas.tsx # Main canvas with nodes and connections
        ├── WorkflowNode.tsx   # Draggable workflow node component
        └── WorkflowToolbar.tsx # Bottom floating toolbar
```

## Architecture

### State Management
The workflow state is managed via React Context (`WorkflowContext.tsx`):
- **nodes**: Array of workflow nodes with id, type, label, subtitle, x, y positions
- **connections**: Array of connections between nodes (fromNodeId, toNodeId)
- **selectedNodeId**: Currently selected node
- **connectingFromId**: Node being connected from (during connection mode)

### Node Types
Seven node types are available (`NodeType`):
- `start` - Green play icon
- `parameter` - Blue "P" icon
- `prompt` - Orange dialog icon
- `instrument` - Purple clock/instrument icon
- `wait` - Gray clock icon
- `profile` - Turquoise graph icon
- `end` - Red flag/stop icon

### Drag & Drop
- Nodes can be dragged within the canvas to reposition
- New nodes can be dragged from the Library panel onto the canvas
- Uses native mouse events for node dragging
- Uses HTML5 Drag and Drop API for library-to-canvas drops

### Connections
- Click output connector (right side) to start a connection
- Click input connector (left side) on another node to complete
- Connection lines are SVG bezier curves that update on node movement
- Visual feedback: dashed blue line during connection, green ring on targets

## Custom Colors (Tailwind)
Defined in `tailwind.config.js`:
- `bio-primary`: #0075c9 (main blue)
- `bio-dark`: #4a4f56 (text)
- `bio-gray`: #626262 (secondary text)
- `bio-bg`: #f5f6f8 (background)
- Phase colors: `phase-start`, `phase-param`, `phase-prompt`, `phase-instrument`, `phase-wait`, `phase-profile`, `phase-end`

## Design Reference
Based on Figma design: Bio-OS Scada Demo V2 Dev, node `19859:2256`

## Development Notes
- All icons are inline SVG components for easy customization
- Node dimensions: 82px height, min-width 160px (280px with subtitle)
- French UI labels (e.g., "Aperçu", "Recette", "Glissez-déposez")
- Responsive considerations are minimal - designed for desktop use
