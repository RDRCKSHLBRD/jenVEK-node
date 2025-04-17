// public/js/main.js

// ----- MODULE IMPORTS -----
// Import utility functions (if needed directly, otherwise imported by other modules)
// import { createSVGElement, SVG_NS } from './modules/utils.js';

// Import shared state
import { state } from './modules/state.js';

// Import DOM caching function and cached elements object
import { cacheDOMElements, dom } from './modules/dom.js';

// Import color utility functions
import { populateColorSelectors } from './modules/colorUtils.js';

// Import UI update functions
import { updateUIFromState } from './modules/ui.js';

// --- Placeholder Imports (for functions called by event listeners) ---
// You will need to create these modules and functions later!
// import { generateSVG, stopAnimation } from './modules/generator.js';
// import { downloadSVG, downloadJSON } from './modules/download.js';
// import { handleViewportChange, captureX, captureY, captureV, updateCursorInfo } from './modules/ui.js';


// ====================== Global Constants (if any needed here) ======================
// const SVG_NS = "http://www.w3.org/2000/svg"; // No longer needed here, it's exported from utils.js


// ====================== Initialization Function ======================

/**
 * Initializes the application: caches DOM elements, fetches colors,
 * populates selectors, sets up event listeners, and updates the initial UI state.
 */
async function initApp() {
    console.log("Initializing jenVek SVG Generator v2...");

    // 1. Cache DOM elements - Must happen before accessing elements via `dom` object
    // Ensure cacheDOMElements itself doesn't rely on things that need fetching first.
    cacheDOMElements();

    // 2. Fetch Color Data
    try {
        console.log(">>> Attempting to fetch color data...");
        const response = await fetch('/api/colors'); // Fetch from the API endpoint
        console.log(">>> Fetch response received:", response.status);

        if (!response.ok) {
            // Throw an error if the fetch was not successful
            throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
        }
        const colorData = await response.json(); // Parse the JSON response
        // Ensure the fetched data is an object before assigning
        if (typeof colorData === 'object' && colorData !== null) {
             state.allColors = colorData; // Assign fetched data to the shared state object
             console.log(">>> Color data loaded successfully into state.");
        } else {
            throw new Error("Fetched color data is not a valid object.");
        }

    } catch (error) {
        console.error(">>> Failed to load color data:", error);
        // Define a minimal fallback palette in state if fetch fails
        state.allColors = {
             fallback_colors: [
                 { name: "Fallback Red", hex: "#E63946" },
                 { name: "Fallback Green", hex: "#52B788" },
                 { name: "Fallback Blue", hex: "#457B9D" },
                 { name: "Fallback Grey", hex: "#ADB5BD" },
             ]
        };
        // Inform the user about the fallback
        alert(`Could not load color palettes from the server: ${error.message}. Using fallback colors.`);
        // Attempt to populate selectors even with fallback data
        // Ensure populateColorSelectors can handle the fallback structure
        populateColorSelectors();
    }

    // 3. Populate Color Selectors (Now that color data is in state, or fallback is set)
    // This was potentially called in the catch block, ensure it runs if fetch succeeded
    if (state.allColors && Object.keys(state.allColors).length > 0 && !dom.colorCategory.disabled) {
         populateColorSelectors();
    }


    // 4. Attach Event Listeners
    // Ensure the DOM elements exist before adding listeners
    if (dom.generateBtn) dom.generateBtn.addEventListener('click', generateSVG); // generateSVG needs to be imported/defined
    if (dom.stopAnimationBtn) dom.stopAnimationBtn.addEventListener('click', stopAnimation); // stopAnimation needs to be imported/defined
    if (dom.downloadSvgBtn) dom.downloadSvgBtn.addEventListener('click', downloadSVG); // downloadSVG needs to be imported/defined
    if (dom.downloadJsonBtn) dom.downloadJsonBtn.addEventListener('click', downloadJSON); // downloadJSON needs to be imported/defined

    // Viewport listeners
    if (dom.viewportPreset) dom.viewportPreset.addEventListener('change', handleViewportChange); // handleViewportChange needs to be imported/defined
    if (dom.customWidth) dom.customWidth.addEventListener('change', handleViewportChange); // handleViewportChange needs to be imported/defined
    if (dom.customHeight) dom.customHeight.addEventListener('change', handleViewportChange); // handleViewportChange needs to be imported/defined

    // Capture buttons
    if (dom.captureXBtn) dom.captureXBtn.addEventListener('click', captureX); // captureX needs to be imported/defined
    if (dom.captureYBtn) dom.captureYBtn.addEventListener('click', captureY); // captureY needs to be imported/defined
    if (dom.captureVBtn) dom.captureVBtn.addEventListener('click', captureV); // captureV needs to be imported/defined

    // Sidebar toggles
    if (dom.toggleLeftBtn && dom.leftSidebar) {
        dom.toggleLeftBtn.addEventListener('click', () => dom.leftSidebar.classList.toggle('collapsed'));
    }
    if (dom.toggleRightBtn && dom.rightSidebar) {
        dom.toggleRightBtn.addEventListener('click', () => dom.rightSidebar.classList.toggle('collapsed'));
    }

    // Mouse movement tracking (relative to SVG)
    if (dom.svg) {
        dom.svg.addEventListener('mousemove', updateCursorInfo); // updateCursorInfo needs to be imported/defined
        // Add touch support for coordinate capture
        dom.svg.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                // updateCursorInfo needs to be imported/defined and handle touch events
                updateCursorInfo(e.touches[0]); // Use first touch point
            }
            // Prevent page scrolling while interacting with the SVG canvas
            e.preventDefault();
        }, { passive: false }); // Use passive: false to allow preventDefault
    }

    // Window resize listener
    window.addEventListener('resize', () => {
        // Simpler resize handling: just update viewport state/inputs, user can regenerate manually
        // handleViewportChange needs to be imported/defined
        if (typeof handleViewportChange === 'function') {
            handleViewportChange();
        } else {
            console.warn("handleViewportChange function not available for resize event.");
        }
    });

    // 5. Initial UI Update (Set initial values based on state)
    updateUIFromState();

    console.log("App Initialized.");
}


// ====================== Global Helper Functions (if any remain) ======================
// Ideally, move all functions into modules. These are placeholders for now.
// They will throw errors until implemented and imported from modules.
function generateSVG() { console.error("generateSVG function not implemented/imported yet!"); }
function stopAnimation() { console.error("stopAnimation function not implemented/imported yet!"); }
function downloadSVG() { console.error("downloadSVG function not implemented/imported yet!"); }
function downloadJSON() { console.error("downloadJSON function not implemented/imported yet!"); }
function handleViewportChange() { console.error("handleViewportChange function not implemented/imported yet!"); }
function captureX() { console.error("captureX function not implemented/imported yet!"); }
function captureY() { console.error("captureY function not implemented/imported yet!"); }
function captureV() { console.error("captureV function not implemented/imported yet!"); }
function updateCursorInfo() { /* console.warn("updateCursorInfo function not implemented/imported yet!"); */ } // Avoid error spam for mousemove


// ====================== Start Application ======================
// Wait for the DOM to be fully loaded before initializing the application
document.addEventListener('DOMContentLoaded', initApp);
