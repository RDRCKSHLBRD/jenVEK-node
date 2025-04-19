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
    dom.strokeWeight = document.getElementById('stroke-weight');
    dom.scale = document.getElementById('scale');
    dom.opacity = document.getElementById('opacity');
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
    // Ensure this runs *after* all range inputs are potentially cached above
    document.querySelectorAll('input[type="range"]').forEach(input => {
        const display = input.parentElement?.querySelector('.value-display');
        if (display) {
            // Use input.id which should be unique
            const displayKey = input.id + 'Display';
            dom[displayKey] = display; // e.g., dom.lineSpacingDisplay, dom.lineWaveAmplitudeDisplay etc.
            display.textContent = input.value;
            // Add listener to update display when range value changes
            input.addEventListener('input', () => {
                 // Check if the corresponding display element exists in dom before updating
                 if (dom[displayKey]) {
                     dom[displayKey].textContent = input.value;
                 }
            });
        } else {
            // Only warn if the input itself was successfully cached
            if (dom[input.id]) {
                 console.warn(`Value display span not found for range input: #${input.id}`);
            }
        }
    });

    // Check for any missing elements after trying to cache all (Optional strict check)
    // const requiredIDs = [ /* List all expected IDs here */ ];
    // requiredIDs.forEach(id => {
    //     if (!dom[id]) {
    //         console.error(`Post-cache check: DOM element #${id} is missing!`);
    //     }
    // });


    console.log("DOM elements cached:", Object.keys(dom).length);
}

