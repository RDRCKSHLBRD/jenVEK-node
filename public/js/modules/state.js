// state.js


// ====================== Global State ======================
export const state = {
  mouseX: 0,
  mouseY: 0,
  capturedX: null,
  capturedY: null,
  capturedV: { x: null, y: null },
  lastUpdate: Date.now(),
  generationCount: 0,
  svgData: null,
  mathInfo: {},
  isAnimating: false,
  animationFrame: null,
  recursionCount: 0,
  maxAllowedRecursion: 8, // Safety limit
  currentPalette: [],
  allColors: {}, // Populated from colours.js global variable
  currentOptions: {},
  currentLayer: 0, // For multi-layer generation
  viewportWidth: 800,
  viewportHeight: 600,
};

// You could add functions here to modify the state if needed, e.g.:
// export function updateMousePosition(x, y) {
//   state.mouseX = x;
//   state.mouseY = y;
// }