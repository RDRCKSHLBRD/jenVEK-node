// public/js/main.js

// ----- MODULE IMPORTS -----
import { state } from './modules/state.js';
import { cacheDOMElements, dom } from './modules/dom.js';
import { populateColorSelectors } from './modules/colorUtils.js';
// Import ALL UI functions now
import {
    updateUIFromState, handleViewportChange, captureX, captureY, captureV, updateCursorInfo
} from './modules/ui.js'; // captureX, captureY, captureV are needed
import { generateSVG, stopAnimation } from './modules/generator.js';
import { downloadSVG, downloadJSON } from './modules/download.js';


// ====================== Event Handlers ======================

/**
 * Handles keydown events for capturing coordinates.
 * @param {KeyboardEvent} event - The keyboard event object.
 */
function handleKeyDown(event) {
    // Ignore key presses if focus is inside an input field
    if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT' || document.activeElement.tagName === 'TEXTAREA')) {
        return;
    }

    // Check which key was pressed (case-insensitive)
    switch (event.key.toLowerCase()) {
        case 'x':
            captureX(); // Call the imported capture function
            event.preventDefault(); // Prevent typing 'x' if not in an input
            break;
        case 'y':
            captureY(); // Call the imported capture function
            event.preventDefault(); // Prevent typing 'y' if not in an input
            break;
        case 'v':
            captureV(); // Call the imported capture function
            event.preventDefault(); // Prevent typing 'v' if not in an input
            break;
        // Add more keyboard shortcuts here if needed
    }
}


// ====================== Initialization Function ======================
async function initApp() {
    console.log("Initializing jenVek SVG Generator v2...");
    cacheDOMElements(); // Cache DOM elements first

    // Fetch Color Data
    try {
        console.log(">>> Attempting to fetch color data...");
        const response = await fetch('/api/colors');
        console.log(">>> Fetch response received:", response.status);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
        const colorData = await response.json();
        if (typeof colorData === 'object' && colorData !== null) {
             state.allColors = colorData;
             console.log(">>> Color data loaded successfully into state.");
        } else {
            throw new Error("Fetched color data is not a valid object.");
        }
    } catch (error) {
        console.error(">>> Failed to load color data:", error);
        state.allColors = { /* fallback */
             fallback_colors: [
                 { name: "Fallback Red", hex: "#E63946" }, { name: "Fallback Green", hex: "#52B788" },
                 { name: "Fallback Blue", hex: "#457B9D" }, { name: "Fallback Grey", hex: "#ADB5BD" },
             ]
        };
        alert(`Could not load color palettes: ${error.message}. Using fallback colors.`);
    } finally {
         if (state.allColors && Object.keys(state.allColors).length > 0 && dom.colorCategory && dom.colorPalette) {
              populateColorSelectors();
         } else {
             console.warn("Could not populate color selectors - missing data or DOM elements.");
         }
    }


    // Attach Event Listeners
    if (dom.generateBtn) dom.generateBtn.addEventListener('click', generateSVG);
    if (dom.stopAnimationBtn) dom.stopAnimationBtn.addEventListener('click', stopAnimation);
    if (dom.downloadSvgBtn) dom.downloadSvgBtn.addEventListener('click', downloadSVG);
    if (dom.downloadJsonBtn) dom.downloadJsonBtn.addEventListener('click', downloadJSON);

    // Viewport listeners
    if (dom.viewportPreset) dom.viewportPreset.addEventListener('change', handleViewportChange);
    if (dom.customWidth) dom.customWidth.addEventListener('change', handleViewportChange);
    if (dom.customHeight) dom.customHeight.addEventListener('change', handleViewportChange);

    // Capture buttons (keep click listeners as well)
    if (dom.captureXBtn) dom.captureXBtn.addEventListener('click', captureX);
    if (dom.captureYBtn) dom.captureYBtn.addEventListener('click', captureY);
    if (dom.captureVBtn) dom.captureVBtn.addEventListener('click', captureV);

    // Sidebar toggles
    if (dom.toggleLeftBtn && dom.leftSidebar) {
        dom.toggleLeftBtn.addEventListener('click', () => dom.leftSidebar.classList.toggle('collapsed'));
    } else {
         console.warn("Left toggle button or left sidebar not found/cached.");
    }
    if (dom.toggleRightBtn && dom.rightSidebar) {
        dom.toggleRightBtn.addEventListener('click', () => dom.rightSidebar.classList.toggle('collapsed'));
    } else {
         console.warn("Right toggle button or right sidebar not found/cached.");
    }
    if (dom.toggleMathBtn && dom.mathSidebar) {
        dom.toggleMathBtn.addEventListener('click', () => {
            dom.mathSidebar.classList.toggle('collapsed');
        });
    } else {
        console.warn("Math toggle button or math sidebar not found/cached.");
    }


    // Mouse movement tracking
    if (dom.svg) {
        dom.svg.addEventListener('mousemove', updateCursorInfo);
        dom.svg.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) updateCursorInfo(e.touches[0]);
            e.preventDefault();
        }, { passive: false });
    }

    // Window resize listener
    window.addEventListener('resize', handleViewportChange);

    // *** ADD Keyboard Listener ***
    window.addEventListener('keydown', handleKeyDown);


    // Initial UI Update (Run after caching and event listeners are set up)
    updateUIFromState();

    console.log("App Initialized.");
}

// ====================== Start Application ======================
document.addEventListener('DOMContentLoaded', initApp);
