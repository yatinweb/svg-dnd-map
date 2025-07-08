# SVG Drag & Drop Sensor Map

This Angular-based application allows users to upload a custom SVG layout (such as a building floor plan), search and drag various IoT sensor icons from a list, and drop them into valid room areas defined inside the SVG. Each sensor can display metadata, zoom/pan with the SVG, and persist its state.

---

## 🔧 Features

- 📤 Upload custom SVG floor plans
- 🔍 Search and drag real IoT sensor types (e.g. Temperature, Smoke Detector)
- 🧲 Snap sensors inside defined SVG room areas (`<g data-room="...">`)
- 🧭 Zoom & pan support via `svg-pan-zoom`
- 💾 Save sensor positions in `localStorage`
- ℹ️ Tooltip on hover, Material Dialog on sensor click (view details & delete)
- 🎨 Built with Angular + Angular Material + Interact.js

---

## 🧪 Demo

> (Add a screenshot or GitHub Pages/Netlify/Vercel demo link here)

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 16
- Angular CLI

### Installation

```bash
git clone https://github.com/yatinweb/svg-dnd-map.git
cd svg-dnd-map
npm install
ng serve
```

## 🗂️ Folder Structure
```bash
src/
├── app/
│   ├── app.ts           # Main logic for drag, drop, tooltip
│   ├── app.html         # UI layout
│   ├── app.scss         # Styling
│   └── sensor-detail-dialog/
│       └── sensor-detail-dialog.component.ts
```

## 🧩 How It Works
 - SVG elements with data-room attributes define valid drop zones.
 - Sensors are only droppable inside those areas and scale with them.
 - Sensor metadata is managed using Material Dialogs.
 - Positions are saved using localStorage.

## 📦 Dependencies
 - Angular
 - Angular Material
 - Interact.js
 - svg-pan-zoom

## 🛠️ TODO
 - Sync with backend API
 - Export final SVG layout with sensors
 - Role-based access (Admin vs Viewer)