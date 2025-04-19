// public/js/modules/generator.js

// ----- MODULE IMPORTS -----
import { state } from './state.js';
import { dom } from './dom.js';
import { getColorPalette, getRandomFill } from './colorUtils.js';
import { updateMathInfo, updateSVGStats } from './ui.js';
import {
    createSVGElement, secureRandom, getTimeSeedValue,
    // Import hashing function if using string seeds, or keep simple for now
} from './utils.js';

// ----- PATTERN FUNCTION IMPORTS -----
// Import all pattern generator functions from their respective files in the patterns directory
import { generateLinesPattern } from './patterns/lines.js';
import { generateRandomPattern } from './patterns/random.js';
import { generateRecursivePattern } from './patterns/recursive.js';
import { generateGridPattern } from './patterns/grid.js';
import { generateQuadtreePattern } from './patterns/QuadTree.js'; // Filename from tree
import { generateFibonacciPattern } from './patterns/Fibonacci.js'; // Filename from tree
import { generateMandelbrotPattern } from './patterns/Mandelbrot.js'; // Filename from tree
import { generatePrimePattern } from './patterns/prime.js';
import { generateTrigPattern } from './patterns/trigWave.js'; // Filename from tree
import { generateBezierPattern } from './patterns/Bezier.js'; // Filename from tree
import { generateLissajousPattern } from './patterns/Lissajous.js'; // Filename from tree
import { generatePadovanPattern } from './patterns/Padovan.js'; // Filename from tree
import { generateRecamanPattern } from './patterns/Recaman.js'; // Filename from tree
import { generateRoseCurvePattern } from './patterns/rose.js'; // Import the Rose Curve


// ----- CORE GENERATION LOGIC -----

/**
 * Retrieves the current generation options from the UI controls and state.
 * @returns {object | null} An object containing all current generation parameters, or null if error.
 */
function getOptions() {
    // Define required element IDs for validation
    const requiredDOMElements = [
        'patternType', 'layerCount', 'complexity', 'density', 'repetition',
        'maxRecursion', 'roseNParam', 'strokeWeight', 'scale', 'opacity',
        'curveSteps', 'offsetX', 'offsetY', 'globalAngle', 'seedOverride', 'lineSpacing',
        'lineWaveAmplitude','lineWaveFrequency','lineSpacingRatio', 'lineSpacingInvert',
        'viewportPreset', 'customWidth', 'customHeight', 'useCursor', 'useTime',
        'colorCategory', 'colorPalette', 'bgColor', 'strokeColor', 'fillType',
        'animation', 'animationType'
    ];
    // Check if all required DOM elements are cached
    for (const id of requiredDOMElements) {
        // Check if the dom object itself or the specific element is missing
        if (!dom || !dom[id]) {
            console.error(`getOptions: Required DOM element #${id} not cached or found!`);
            // Returning null indicates failure to retrieve options
            return null;
        }
    }

    // Read values from cached DOM elements
    try {
        state.currentOptions = {
            patternType: dom.patternType.value,
            complexity: parseInt(dom.complexity.value, 10),
            density: parseInt(dom.density.value, 10),
            maxRecursion: parseInt(dom.maxRecursion.value, 10),
            strokeWeight: parseFloat(dom.strokeWeight.value),
            opacity: parseFloat(dom.opacity.value),
            scale: parseFloat(dom.scale.value),
            layerCount: parseInt(dom.layerCount.value, 10),
            repetition: parseInt(dom.repetition.value, 10),
            fillType: dom.fillType.value,
            bgColor: dom.bgColor.value,
            strokeColor: dom.strokeColor.value,
            useCursor: dom.useCursor.checked,
            useTime: dom.useTime.checked,
            animation: dom.animation.checked,
            animationType: dom.animationType.value,
            viewportWidth: state.viewportWidth,
            viewportHeight: state.viewportHeight,
            capturedX: state.capturedX,
            capturedY: state.capturedY,
            capturedV: state.capturedV,
            roseNParam: parseFloat(dom.roseNParam.value),
            curveSteps: parseInt(dom.curveSteps.value, 10) || 0, // Default to 0 if parsing fails
            offsetX: parseFloat(dom.offsetX.value) || 0, // Default to 0
            offsetY: parseFloat(dom.offsetY.value) || 0, // Default to 0
            globalAngle: parseInt(dom.globalAngle.value, 10) || 0, // Default to 0
            seedOverride: dom.seedOverride.value.trim(), // Get seed as string
            lineSpacing: parseInt(dom.lineSpacing.value,10) || 20,
            lineWaveAmplitude: parseFloat(dom.lineWaveAmplitude.value) || 0,
            lineWaveFrequency: parseFloat(dom.lineWaveFrequency.value) || 1,
            lineSpacingRatio: parseFloat(dom.lineSpacingRatio.value) || 1.0, // Default ratio 1
            lineSpacingInvert: dom.lineSpacingInvert.checked, // Boolean
        };
        return state.currentOptions;
    } catch (error) {
        console.error("Error reading options from DOM:", error);
        return null; // Return null on error
    }
}

/**
 * Simple hash function to convert a string seed into a number.
 * Used when a non-numeric seed override is provided.
 * @param {string} str - The input seed string.
 * @returns {number} A numeric hash value.
 */
function simpleStringHash(str) {
    let hash = 0;
    if (!str || str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash); // Ensure positive seed
}


/**
 * Main function to generate the SVG content based on selected options.
 * Acts as a controller, delegating pattern generation to imported modules.
 */
export function generateSVG() {
    console.log("Generating SVG...");
    stopAnimation(); // Stop any existing animation first

    // Ensure core SVG elements are ready
    if (!dom.svg || !dom.defs) {
        console.error("Cannot generate SVG: SVG canvas or defs element not found/cached.");
        alert("Error: SVG canvas not ready. Please reload.");
        return;
    }

    // Get options, handling potential errors during retrieval
    const options = getOptions();
    if (!options) {
         alert("Error retrieving generation options. Please check console.");
         return;
    }
    // Get the current color palette
    const palette = getColorPalette();

    // --- Clear SVG ---
    dom.defs.innerHTML = ''; // Clear definitions (gradients, patterns)
    // Remove all direct children of the SVG except the <defs> element
    while (dom.svg.lastChild && dom.svg.lastChild !== dom.defs) {
         dom.svg.removeChild(dom.svg.lastChild);
    }

    // --- Set Background ---
    // Add a background rect if a non-white color is selected
    if (options.bgColor && options.bgColor.toUpperCase() !== '#FFFFFF') {
        const bgRect = createSVGElement('rect', { x: 0, y: 0, width: '100%', height: '100%', fill: options.bgColor });
        // Insert background right after <defs>
        dom.svg.insertBefore(bgRect, dom.defs.nextSibling);
    }

    // --- Seeding Logic ---
    const originalRandom = Math.random; // Backup original Math.random
    let seed; // Variable to hold the final numeric seed

    // Use seed override if provided by the user
    if (options.seedOverride) {
        const numSeed = parseFloat(options.seedOverride);
        if (!isNaN(numSeed)) { // Check if it's a valid number
            seed = numSeed;
            console.log(`Using numeric seed override: ${seed}`);
        } else { // Otherwise, hash the string
            seed = simpleStringHash(options.seedOverride);
            console.log(`Using hashed string seed override ('${options.seedOverride}' -> ${seed})`);
        }
    } else {
        // If no override, calculate seed based on time/cursor options
        seed = Date.now(); // Start with current time
        if (options.useTime) {
            seed += getTimeSeedValue() * 1e9; // Add time component
        }
        if (options.useCursor) { // Add cursor/captured components
            if (state.mouseX !== null && state.mouseY !== null) { seed += Math.sin(state.mouseX*0.01)*1e5 + Math.cos(state.mouseY*0.01)*1e5; }
            if (state.capturedX !== null) { seed += Math.sin(state.capturedX*0.1)*1e4; }
            if (state.capturedY !== null) { seed += Math.cos(state.capturedY*0.1)*1e4; }
            if (state.capturedV?.x !== null) { seed += Math.sin(state.capturedV.x*0.1)*1e3; }
            if (state.capturedV?.y !== null) { seed += Math.cos(state.capturedV.y*0.1)*1e3; }
        }
        console.log(`Using time/cursor seed (approx): ${seed}`);
    }

    // Initialize the seeded pseudo-random number generator (PRNG) - simple LCG
    let currentSeed = Math.floor(Math.abs(seed)) % 2147483647; // Ensure positive 32-bit integer range
    if (currentSeed === 0) currentSeed = 1; // Seed cannot be 0 for this LCG
    const seededRandom = () => {
        currentSeed = (currentSeed * 16807) % 2147483647; // Generate next number
        return (currentSeed - 1) / 2147483646; // Normalize to [0, 1)
    };

    // Override Math.random with our seeded generator for this generation cycle
    Math.random = seededRandom;
    console.log(`Using PRNG with initial seed value: ${currentSeed}`);


    // --- Generation Loop (Layers) ---
    let totalElements = 0;
    let combinedMathInfo = {}; // Store details about each layer

    try {
        // Loop for the specified number of layers
        for (let layer = 0; layer < options.layerCount; layer++) {
            state.currentLayer = layer; // Track current layer in global state

            // Calculate CUMULATIVE offset and constant angle for this layer
            const currentOffsetX = layer * options.offsetX;
            const currentOffsetY = layer * options.offsetY;
            const currentAngle = options.globalAngle; // Apply same rotation to each layer group

            // Define the transform: rotate around viewport center, then translate
            const transform = `rotate(${currentAngle}, ${options.viewportWidth / 2}, ${options.viewportHeight / 2}) translate(${currentOffsetX}, ${currentOffsetY})`;

            // Create the layer group with ID and transform
            let layerGroup = createSVGElement('g', {
                id: `layer-${layer}`,
                transform: transform
            }, dom.svg); // Append directly to the main SVG

             // Create options specific to this layer, modifying some based on layer index
             const layerOptions = { ...options };
             if (layer > 0) { // Apply variations only for layers after the first
                 layerOptions.complexity = Math.max(1, options.complexity - layer * 1.5);
                 layerOptions.density = Math.max(1, options.density - layer * 15);
                 layerOptions.strokeWeight = Math.max(0.1, options.strokeWeight * (1 - layer * 0.25));
                 layerOptions.opacity = Math.max(0.1, options.opacity * (1 - layer * 0.2));
                 layerOptions.scale = options.scale * (1 - layer * 0.15);
                 // Note: offsetX, offsetY, globalAngle from the main options are used for the group transform,
                 // layerOptions passed to the pattern function still contain the original values unless modified here.
            }

            let result = {}; // Store result from the pattern function

            // Call the appropriate IMPORTED pattern generation function via switch
            switch (options.patternType) {
                 case 'lines': result = generateLinesPattern(layerGroup, layerOptions, palette); break;
                 case 'random': result = generateRandomPattern(layerGroup, layerOptions, palette); break;
                 case 'recursive': result = generateRecursivePattern(layerGroup, layerOptions, palette); break;
                 case 'grid': result = generateGridPattern(layerGroup, layerOptions, palette); break;
                 case 'quadtree': result = generateQuadtreePattern(layerGroup, layerOptions, palette); break;
                 case 'fibonacci': result = generateFibonacciPattern(layerGroup, layerOptions, palette); break;
                 case 'mandelbrot': result = generateMandelbrotPattern(layerGroup, layerOptions, palette); break;
                 case 'prime': result = generatePrimePattern(layerGroup, layerOptions, palette); break;
                 case 'trig': result = generateTrigPattern(layerGroup, layerOptions, palette); break;
                 case 'bezier': result = generateBezierPattern(layerGroup, layerOptions, palette); break;
                 case 'lissajous': result = generateLissajousPattern(layerGroup, layerOptions, palette); break;
                 case 'padovan': result = generatePadovanPattern(layerGroup, layerOptions, palette); break;
                 case 'recaman': result = generateRecamanPattern(layerGroup, layerOptions, palette); break;
                 case 'rose': result = generateRoseCurvePattern(layerGroup, layerOptions, palette); break;
                 default:
                     console.warn("Unknown pattern type selected:", options.patternType, "Falling back to random.");
                     result = generateRandomPattern(layerGroup, layerOptions, palette);
            }

            // Aggregate results, ensuring result is a valid object
            totalElements += (result && typeof result === 'object' && result.elementCount) ? result.elementCount : 0;
            combinedMathInfo[`Layer_${layer}`] = result || { error: 'Pattern function returned invalid result' };
        }

        // --- Finalize and Update UI ---
        // Store final math info and SVG data in state
        state.mathInfo = {
            generator: options.patternType, layers: options.layerCount,
            viewport: `${options.viewportWidth}x${options.viewportHeight}`,
            totalElements: totalElements, details: combinedMathInfo,
            // Optionally include seed info
            seedUsed: options.seedOverride || `Time/Cursor based (~${seed.toFixed(0)})`
        };
        updateMathInfo(state.mathInfo); // Update display panel
        updateSVGStats(totalElements); // Update stats display
        state.svgData = dom.svg.outerHTML; // Store SVG for download
        state.generationCount++; // Increment counter

        // Start animation if enabled
        if (options.animation) {
            startAnimation();
        }

    } catch (error) {
         // --- Error Handling ---
         console.error('Error during SVG generation main loop:', error);
         const errorText = createSVGElement('text', { x: 10, y: 50, fill: 'red', 'font-family': 'sans-serif', 'font-size': '16px' });
         errorText.textContent = `Error: ${error.message}. Check console.`;
         dom.svg.appendChild(errorText);
         updateMathInfo({ error: error.message });
         updateSVGStats(0);
     }
    finally {
        // --- Cleanup ---
        Math.random = originalRandom; // ALWAYS restore original Math.random
        console.log("Restored original Math.random.");
    }
}


// ----- Animation Functions -----
// (These remain here as they operate on the generated SVG elements)

/**
 * Starts the animation loop based on the current options.
 */
function startAnimation() {
    if (!state.currentOptions?.animation || state.isAnimating) return;
    const elements = dom.svg.querySelectorAll('circle, rect:not([fill="' + state.currentOptions.bgColor + '"]), ellipse, polygon, path, line');
    if (elements.length === 0) return;

    console.log(`Starting animation (${state.currentOptions.animationType})...`);
    state.isAnimating = true;
    const startTime = Date.now();
    const animationType = state.currentOptions.animationType;
    const baseOpacity = state.currentOptions.opacity;
    const baseStrokeWeight = state.currentOptions.strokeWeight;
    const complexityFactor = state.currentOptions.complexity / 10;

    function animateFrame() {
        if (!state.isAnimating) { console.log("Animation stopped externally."); return; }
        const elapsed = Date.now() - startTime;
        const phase = (elapsed % 5000) / 5000; // 5-second cycle

        elements.forEach((element, index) => {
            if (!element.parentElement) return;
             const individualPhase = (phase + (index / elements.length) * 0.5) % 1;
             const sinPhase = Math.sin(individualPhase * Math.PI * 2);
             const cosPhase = Math.cos(individualPhase * Math.PI * 2);

            try {
                switch(animationType) {
                    case 'pulse':
                        let originalSize = parseFloat(element.getAttribute('r')) || Math.max(parseFloat(element.getAttribute('width')), parseFloat(element.getAttribute('height'))) || 5;
                        const pulseFactor = 1 + sinPhase * 0.1 * complexityFactor;
                        if (element.tagName === 'circle') { element.setAttribute('r', Math.max(1, originalSize * pulseFactor)); }
                        else if (element.tagName === 'rect' || element.tagName === 'ellipse') {
                             try {
                                let bbox = element.getBBox(); let cx = bbox.x + bbox.width / 2; let cy = bbox.y + bbox.height / 2;
                                element.setAttribute('transform', `translate(${cx} ${cy}) scale(${pulseFactor}) translate(${-cx} ${-cy})`);
                             } catch (e) { /* ignore getBBox error */ }
                        }
                        break;
                    case 'rotate':
                         let currentTransform = element.getAttribute('transform') || ''; currentTransform = currentTransform.replace(/rotate\([^)]+\)/g, '').trim();
                         let bbox; try { bbox = element.getBBox(); } catch(e) { bbox = {x:0, y:0, width:0, height:0}; }
                         const cx = bbox.x + bbox.width / 2; const cy = bbox.y + bbox.height / 2;
                         element.setAttribute('transform', `${currentTransform} rotate(${phase * 360 * (index % 3 + 1)}, ${cx}, ${cy})`);
                        break;
                    case 'opacity':
                        const targetOpacity = baseOpacity * (0.5 + (cosPhase + 1) * 0.25);
                        element.setAttribute('opacity', Math.max(0.1, Math.min(1, targetOpacity)));
                        break;
                     case 'morph':
                          const originalSW = parseFloat(element.getAttribute('stroke-width')) ?? baseStrokeWeight;
                          if (originalSW > 0) { const morphFactor = 1 + sinPhase * 0.3 * complexityFactor; element.setAttribute('stroke-width', Math.max(0.1, originalSW * morphFactor)); }
                         break;
                }
            } catch (e) { /* Ignore animation errors */ }
        });
        state.animationFrame = requestAnimationFrame(animateFrame);
    }
    state.animationFrame = requestAnimationFrame(animateFrame);
}

/**
 * Stops the currently running animation loop. Exported for external use (e.g., button click).
 */
export function stopAnimation() {
    if (state.animationFrame) {
        cancelAnimationFrame(state.animationFrame);
        state.animationFrame = null;
    }
    if (state.isAnimating) {
        console.log("Stopping animation.");
        state.isAnimating = false;
    }
}
