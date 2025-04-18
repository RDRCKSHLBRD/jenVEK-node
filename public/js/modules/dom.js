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
    if (!dom.svg) console.error("SVG Canvas element not found!");
    let defs = dom.svg?.querySelector('defs');
    if (dom.svg && !defs) {
        console.log("Defs not found, creating...");
        defs = document.createElementNS("http://www.w3.org/2000/svg", 'defs');
        dom.svg.appendChild(defs);
    }
    dom.defs = defs;
    if (!dom.defs) console.error("SVG Defs element could not be found or created!");

    // --- Generator Controls (Left Sidebar) ---
    dom.patternType = document.getElementById('pattern-type');
    dom.layerCount = document.getElementById('layer-count');
    dom.complexity = document.getElementById('complexity');
    dom.density = document.getElementById('density');
    dom.repetition = document.getElementById('repetition');
    dom.maxRecursion = document.getElementById('max-recursion');
    dom.strokeWeight = document.getElementById('stroke-weight');
    dom.scale = document.getElementById('scale');
    dom.opacity = document.getElementById('opacity'); // Moved opacity here
    dom.viewportPreset = document.getElementById('viewport-preset');
    dom.customWidth = document.getElementById('custom-width');
    dom.customHeight = document.getElementById('custom-height');
    dom.useCursor = document.getElementById('use-cursor');
    dom.useTime = document.getElementById('use-time');
    // *** Add Rose Param Slider ***
    dom.roseNParam = document.getElementById('rose-n-param');

    // --- Color & Style Controls (Right Sidebar) ---
    dom.colorCategory = document.getElementById('color-category');
    dom.colorPalette = document.getElementById('color-palette');
    dom.palettePreview = document.getElementById('palette-preview');
    dom.bgColor = document.getElementById('bg-color');
    dom.strokeColor = document.getElementById('stroke-color');
    dom.fillType = document.getElementById('fill-type');
    // dom.opacity = document.getElementById('opacity'); // Already cached above
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
    document.querySelectorAll('input[type="range"]').forEach(input => {
        const display = input.parentElement?.querySelector('.value-display');
        if (display) {
            dom[input.id + 'Display'] = display; // e.g., dom.complexityDisplay
            display.textContent = input.value;
            input.addEventListener('input', () => {
                 display.textContent = input.value;
            });
        } else {
            console.warn(`Value display span not found for range input: #${input.id}`);
        }
    });

    console.log("DOM elements cached:", Object.keys(dom).length);
}