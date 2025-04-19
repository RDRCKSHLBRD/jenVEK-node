// public/js/modules/dom.js
// import { SVG_NS } from './utils.js'; // Only needed if createSVGElement is used here

/**
 * Object to hold cached references to DOM elements for performance.
 */
export const dom = {};

/**
 * Finds and caches references to frequently used DOM elements.
 * Populates the `dom` object.
 */
export function cacheDOMElements() {
    console.log("Caching DOM elements...");

    // --- Core SVG Elements ---
    dom.svg = document.getElementById('svg-canvas');
    if (!dom.svg) { console.error("SVG Canvas element not found!"); }
    else { // Only try to find defs if svg exists
        let defs = dom.svg.querySelector('defs');
        if (!defs) {
            console.log("Defs not found, creating...");
            // Use SVG_NS constant if needed and imported, otherwise use string directly
            defs = document.createElementNS("http://www.w3.org/2000/svg", 'defs');
            dom.svg.appendChild(defs);
        }
        dom.defs = defs;
        if (!dom.defs) { console.error("SVG Defs element could not be found or created!"); }
    }


    // --- Generator Controls (Left Sidebar) ---
    dom.patternType = document.getElementById('pattern-type');
    dom.layerCount = document.getElementById('layer-count');
    dom.offsetX = document.getElementById('offset-x');
    dom.offsetY = document.getElementById('offset-y');
    dom.globalAngle = document.getElementById('global-angle');
    dom.seedOverride = document.getElementById('seed-override');
    dom.useCursor = document.getElementById('use-cursor');
    dom.useTime = document.getElementById('use-time');
    dom.complexity = document.getElementById('complexity');
    dom.density = document.getElementById('density');
    dom.repetition = document.getElementById('repetition');
    dom.maxRecursion = document.getElementById('max-recursion');
    dom.roseNParam = document.getElementById('rose-n-param');
    dom.curveSteps = document.getElementById('curve-steps');
    dom.lineSpacing = document.getElementById('line-spacing');
    dom.lineSpacingRatio = document.getElementById('line-spacing-ratio');
    dom.lineSpacingInvert = document.getElementById('line-spacing-invert');
    dom.lineWaveAmplitude = document.getElementById('line-wave-amplitude');
    dom.lineWaveFrequency = document.getElementById('line-wave-frequency');
    // *** ADDED: Explicitly cache the lineArcAmount input ***
    dom.lineArcAmount = document.getElementById('line-arc-amount');


    dom.strokeWeight = document.getElementById('stroke-weight');
    dom.scale = document.getElementById('scale');
    // dom.opacity = document.getElementById('opacity'); // Assuming primary is in right sidebar

    // --- Viewport Controls (Often in Generator Controls) ---
    dom.viewportPreset = document.getElementById('viewport-preset');
    dom.customWidth = document.getElementById('custom-width');
    dom.customHeight = document.getElementById('custom-height');


    // --- Color & Style Controls (Right Sidebar) ---
    dom.colorCategory = document.getElementById('color-category');
    dom.colorPalette = document.getElementById('color-palette');
    dom.palettePreview = document.getElementById('palette-preview');
    dom.bgColor = document.getElementById('bg-color');
    dom.strokeColor = document.getElementById('stroke-color');
    dom.fillType = document.getElementById('fill-type');
    dom.opacity = document.getElementById('opacity'); // Primary opacity control
    dom.animation = document.getElementById('animation');
    dom.animationType = document.getElementById('animation-type');

    // --- Math Controls (Top Sidebar - NEW) ---
    // Use JS-friendly camelCase names for keys in the dom object
    dom.curvesmoothing = document.getElementById('curve-smoothing'); // Note: ID has hyphen, key does not
    dom.splinetension = document.getElementById('spline-tension');
    dom.lissajousa = document.getElementById('lissajous-a');
    dom.lissajousb = document.getElementById('lissajous-b');
    dom.lissajousdelta = document.getElementById('lissajous-delta');
    dom.spiraltype = document.getElementById('spiral-type');
    dom.spirala = document.getElementById('spiral-a');
    dom.spiralb = document.getElementById('spiral-b');
    // Add more math control IDs here as they are added to index.html

    // --- Header Buttons ---
    dom.generateBtn = document.getElementById('generate-btn');
    dom.stopAnimationBtn = document.getElementById('stop-animation-btn');
    dom.downloadSvgBtn = document.getElementById('download-btn');
    dom.downloadJsonBtn = document.getElementById('download-json-btn');
    dom.toggleLeftBtn = document.getElementById('toggle-left');
    dom.toggleRightBtn = document.getElementById('toggle-right');
    dom.toggleMathBtn = document.getElementById('toggle-math'); // Cache the math toggle button

    // --- Sidebars ---
    // Use getElementById now that we've added IDs in the HTML
    dom.leftSidebar = document.getElementById('left-sidebar');
    dom.rightSidebar = document.getElementById('right-sidebar');
    dom.mathSidebar = document.getElementById('math-sidebar');   // Cache the math sidebar

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
    // Ensure this runs *after* all range inputs are potentially cached above
    document.querySelectorAll('input[type="range"]').forEach(input => {
        const display = input.parentElement?.querySelector('.value-display');
        if (display) {
            // Use input.id which should be unique
            // Convert hyphenated ID to camelCase for the display key
            const displayKey = input.id.replace(/-([a-z])/g, g => g[1].toUpperCase()) + 'Display';
            dom[displayKey] = display; // e.g., dom.splineTensionDisplay, dom.lissajousADisplay etc.
            // Initialize display text content
            if (input.value !== undefined) {
                 display.textContent = input.value;
            }
            // Add listener to update display when range value changes
            input.addEventListener('input', () => {
                 // Check if the corresponding display element exists in dom before updating
                 if (dom[displayKey] && input.value !== undefined) {
                     dom[displayKey].textContent = input.value;
                 }
            });
        } else {
            // Only warn if the input itself was successfully cached
            // Check if the input element itself has been cached in the dom object
            const inputCached = Object.values(dom).includes(input);
            // Also check if the specific ID was explicitly cached (like lineArcAmount)
            const explicitlyCached = dom[input.id.replace(/-([a-z])/g, g => g[1].toUpperCase())] === input;

            // Don't warn if a display span is missing for an explicitly cached input
            // (like lineArcAmount, which might not need one if the value isn't crucial to see constantly)
            if (inputCached && !explicitlyCached) {
                 console.warn(`Value display span not found for range input: #${input.id}`);
            }
        }
    });

     // *** Manually update display for lineArcAmount if its display span exists ***
     // Check if both the input and its specific display span were found
     if (dom.lineArcAmount && dom.lineArcAmountDisplay && dom.lineArcAmount.value !== undefined) {
         dom.lineArcAmountDisplay.textContent = dom.lineArcAmount.value;
     }


    console.log("DOM elements cached:", Object.keys(dom).length);
}