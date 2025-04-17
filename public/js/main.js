// public/js/main.js

// ----- MODULE IMPORTS -----
import { state } from './modules/state.js';
import { cacheDOMElements, dom } from './modules/dom.js';
import { populateColorSelectors } from './modules/colorUtils.js';
// Import ALL UI functions now
import {
    updateUIFromState, handleViewportChange, captureX, captureY, captureV, updateCursorInfo
} from './modules/ui.js';
import { generateSVG, stopAnimation } from './modules/generator.js';
import { downloadSVG, downloadJSON } from './modules/download.js';


// ====================== Initialization Function ======================
async function initApp() {
    console.log("Initializing jenVek SVG Generator v2...");
    cacheDOMElements();

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
        populateColorSelectors();
    }

    // Populate Color Selectors
    if (state.allColors && Object.keys(state.allColors).length > 0 && dom.colorCategory && !dom.colorCategory.disabled) {
         populateColorSelectors();
    }

    // Attach Event Listeners (using imported functions)
    if (dom.generateBtn) dom.generateBtn.addEventListener('click', generateSVG);
    if (dom.stopAnimationBtn) dom.stopAnimationBtn.addEventListener('click', stopAnimation);
    if (dom.downloadSvgBtn) dom.downloadSvgBtn.addEventListener('click', downloadSVG);
    if (dom.downloadJsonBtn) dom.downloadJsonBtn.addEventListener('click', downloadJSON);

    // Viewport listeners
    if (dom.viewportPreset) dom.viewportPreset.addEventListener('change', handleViewportChange); // Use imported function
    if (dom.customWidth) dom.customWidth.addEventListener('change', handleViewportChange); // Use imported function
    if (dom.customHeight) dom.customHeight.addEventListener('change', handleViewportChange); // Use imported function

    // Capture buttons
    if (dom.captureXBtn) dom.captureXBtn.addEventListener('click', captureX); // Use imported function
    if (dom.captureYBtn) dom.captureYBtn.addEventListener('click', captureY); // Use imported function
    if (dom.captureVBtn) dom.captureVBtn.addEventListener('click', captureV); // Use imported function

    // Sidebar toggles
    if (dom.toggleLeftBtn && dom.leftSidebar) {
        dom.toggleLeftBtn.addEventListener('click', () => dom.leftSidebar.classList.toggle('collapsed'));
    }
    if (dom.toggleRightBtn && dom.rightSidebar) {
        dom.toggleRightBtn.addEventListener('click', () => dom.rightSidebar.classList.toggle('collapsed'));
    }

    // Mouse movement tracking
    if (dom.svg) {
        dom.svg.addEventListener('mousemove', updateCursorInfo); // Use imported function
        dom.svg.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) updateCursorInfo(e.touches[0]); // Use imported function
            e.preventDefault();
        }, { passive: false });
    }

    // Window resize listener
    window.addEventListener('resize', () => {
        // Use imported function directly now
        handleViewportChange();
    });

    // Initial UI Update
    updateUIFromState();

    console.log("App Initialized.");
}

// ====================== Placeholder Functions (None remain!) ======================
// All functions previously here should now be imported from modules.

// ====================== Start Application ======================
document.addEventListener('DOMContentLoaded', initApp);
