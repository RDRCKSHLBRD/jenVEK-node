// dom.js

// public/js/modules/dom.js
import { SVG_NS } from './utils.js'; // Import SVG_NS if needed, or define locally

/**
 * Object to hold cached references to DOM elements for performance.
 */
export const dom = {};

/**
 * Finds and caches references to frequently used DOM elements.
 * Populates the `dom` object.
 */
export function cacheDOMElements() {
    console.log("Caching DOM elements..."); // Add log for debugging

    // --- Core SVG Elements ---
    dom.svg = document.getElementById('svg-canvas');
    if (!dom.svg) console.error("SVG Canvas element not found!");

    // Ensure defs exists or create it if SVG might be empty initially
    let defs = dom.svg?.querySelector('defs'); // Use optional chaining
    if (dom.svg && !defs) {
        console.log("Defs not found, creating...");
        defs = document.createElementNS("http://www.w3.org/2000/svg", 'defs'); // Use SVG_NS constant if imported
        dom.svg.appendChild(defs);
    }
    dom.defs = defs;
    if (!dom.defs) console.error("SVG Defs element could not be found or created!");


    // --- Generator Controls (Left Sidebar) ---
    dom.patternType = document.getElementById('pattern-type');
    dom.complexity = document.getElementById('complexity');
    dom.density = document.getElementById('density');
    dom.maxRecursion = document.getElementById('max-recursion');
    dom.strokeWeight = document.getElementById('stroke-weight');
    dom.scale = document.getElementById('scale');
    dom.layerCount = document.getElementById('layer-count');
    dom.repetition = document.getElementById('repetition');
    dom.viewportPreset = document.getElementById('viewport-preset');
    dom.customWidth = document.getElementById('custom-width');
    dom.customHeight = document.getElementById('custom-height');
    dom.useCursor = document.getElementById('use-cursor');
    dom.useTime = document.getElementById('use-time');

    // --- Color & Style Controls (Right Sidebar) ---
    dom.colorCategory = document.getElementById('color-category');
    dom.colorPalette = document.getElementById('color-palette');
    dom.palettePreview = document.getElementById('palette-preview');
    dom.bgColor = document.getElementById('bg-color');
    dom.strokeColor = document.getElementById('stroke-color');
    dom.fillType = document.getElementById('fill-type');
    dom.opacity = document.getElementById('opacity');
    dom.animation = document.getElementById('animation');
    dom.animationType = document.getElementById('animation-type');

    // --- Header Buttons ---
    dom.generateBtn = document.getElementById('generate-btn');
    dom.stopAnimationBtn = document.getElementById('stop-animation-btn');
    dom.downloadSvgBtn = document.getElementById('download-btn');
    dom.downloadJsonBtn = document.getElementById('download-json-btn');
    dom.toggleLeftBtn = document.getElementById('toggle-left');
    dom.toggleRightBtn = document.getElementById('toggle-right');

    // --- Sidebars ---
    dom.leftSidebar = document.querySelector('.left-sidebar');
    dom.rightSidebar = document.querySelector('.right-sidebar');

    // --- Canvas Area Elements ---
    dom.cursorInfo = document.getElementById('cursor-info');
    dom.captureXBtn = document.getElementById('capture-x');
    dom.captureYBtn = document.getElementById('capture-y');
    dom.captureVBtn = document.getElementById('capture-v');
    dom.capturedCoords = document.getElementById('captured-coords');

    // --- Output/Info Displays ---
    dom.mathOutput = document.getElementById('math-output');
    dom.svgStats = document.getElementById('svg-stats');

    // --- Add value displays for ranges ---
    // Cache the display spans associated with range inputs for easy updates
    document.querySelectorAll('input[type="range"]').forEach(input => {
        const display = input.parentElement?.querySelector('.value-display'); // Use optional chaining
        if (display) {
            // Store display element reference in the dom object using the input's ID
            dom[input.id + 'Display'] = display;
            // Set initial display text based on the input's current value
            display.textContent = input.value;
             // Add listener to update display when the range input changes
            input.addEventListener('input', () => {
                 display.textContent = input.value;
            });
        } else {
            console.warn(`Value display span not found for range input: #${input.id}`);
        }
    });

    console.log("DOM elements cached:", Object.keys(dom).length); // Log how many elements were cached
}
