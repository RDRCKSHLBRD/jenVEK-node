// public/js/modules/generator.js

// ----- MODULE IMPORTS -----
import { state } from './state.js';
import { dom } from './dom.js'; // Make sure dom is imported
import { getColorPalette, getRandomFill } from './colorUtils.js';
import { updateMathInfo, updateSVGStats } from './ui.js'; // Ensure ui functions are imported
import {
    createSVGElement, secureRandom, getTimeSeedValue, pointsToPathString, simpleStringHash // Ensure simpleStringHash is imported if used
} from './utils.js'; // Ensure utils functions are imported

// ----- PATTERN FUNCTION IMPORTS -----
// Import all pattern generator functions from their respective files in the patterns directory
import { generateLinesPattern } from './patterns/lines.js';
import { generateRandomPattern } from './patterns/random.js';
import { generateRecursivePattern } from './patterns/recursive.js';
import { generateGridPattern } from './patterns/grid.js';
import { generateQuadtreePattern } from './patterns/QuadTree.js';
import { generateFibonacciPattern } from './patterns/Fibonacci.js';
import { generateMandelbrotPattern } from './patterns/Mandelbrot.js';
import { generatePrimePattern } from './patterns/prime.js';
import { generateTrigPattern } from './patterns/trigWave.js';
import { generateBezierPattern } from './patterns/Bezier.js';
import { generateLissajousPattern } from './patterns/Lissajous.js';
import { generatePadovanPattern } from './patterns/Padovan.js';
import { generateRecamanPattern } from './patterns/Recaman.js';
import { generateRoseCurvePattern } from './patterns/rose.js';


// ----- CORE GENERATION LOGIC -----

/**
 * Retrieves the current generation options from the UI controls and state.
 * @returns {object | null} An object containing all current generation parameters, or null if error.
 */
function getOptions() {
    // Define required element IDs for validation
    // Add the IDs of the new math controls
    const requiredDOMElements = [
        'patternType', 'layerCount', 'complexity', 'density', 'repetition',
        'maxRecursion', 'roseNParam', 'strokeWeight', 'scale', 'opacity',
        'curveSteps', 'offsetX', 'offsetY', 'globalAngle', 'seedOverride', 'lineSpacing',
        'lineWaveAmplitude','lineWaveFrequency', 'lineArcAmount', // Ensure lineArcAmount is checked
        'lineSpacingRatio', 'lineSpacingInvert',
        'viewportPreset', 'customWidth', 'customHeight', 'useCursor', 'useTime',
        'colorCategory', 'colorPalette', 'bgColor', 'strokeColor', 'fillType',
        'animation', 'animationType',
        // New Math Controls (Ensure these IDs match index.html and dom.js cache keys)
        'curve-smoothing', 'spline-tension', 'lissajous-a', 'lissajous-b',
        'lissajous-delta', 'spiral-type', 'spiral-a', 'spiral-b'
    ];

    // Check if all required DOM elements are cached in the dom object
    for (const id of requiredDOMElements) {
        // Construct the expected cache key (remove hyphens for JS property access)
        const cacheKey = id.replace(/-/g, '');
        // Check if the dom object itself exists AND if the specific key exists in the dom object
        if (!dom || !dom[cacheKey]) {
            // As a fallback, try getElementById directly, but log a warning if cache failed
            const elementById = document.getElementById(id);
            if (!elementById) {
                console.error(`getOptions: CRITICAL - DOM element #${id} not found in cache OR document! Cannot proceed.`);
                return null; // Cannot proceed if element doesn't exist at all
            } else {
                console.warn(`getOptions: DOM element #${id} was not found in dom cache, using direct lookup (check dom.js). Caching now.`);
                // Attempt to cache it now if found directly
                 dom[cacheKey] = elementById;
            }
        }
    }

    // Read values from cached DOM elements
    try {
        // Use a temporary object to build options, then assign to state.currentOptions
        const options = {
            // Existing Generator Options
            patternType: dom.patternType.value,
            complexity: parseInt(dom.complexity.value, 10),
            density: parseInt(dom.density.value, 10),
            maxRecursion: parseInt(dom.maxRecursion.value, 10),
            strokeWeight: parseFloat(dom.strokeWeight.value),
            opacity: parseFloat(dom.opacity.value), // Read primary opacity control
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
            viewportWidth: state.viewportWidth, // Get from state
            viewportHeight: state.viewportHeight, // Get from state
            capturedX: state.capturedX, // Get from state
            capturedY: state.capturedY, // Get from state
            capturedV: state.capturedV, // Get from state
            roseNParam: parseFloat(dom.roseNParam.value),
            curveSteps: parseInt(dom.curveSteps.value, 10) || 0,
            offsetX: parseFloat(dom.offsetX.value) || 0,
            offsetY: parseFloat(dom.offsetY.value) || 0,
            globalAngle: parseInt(dom.globalAngle.value, 10) || 0,
            seedOverride: dom.seedOverride.value.trim(),
            lineSpacing: parseInt(dom.lineSpacing.value,10) || 20,
            lineWaveAmplitude: parseFloat(dom.lineWaveAmplitude.value) || 0,
            lineWaveFrequency: parseFloat(dom.lineWaveFrequency.value) || 1,
            // *** CORRECTED: Read and parse lineArcAmount from the cached element ***
            lineArcAmount: parseFloat(dom.lineArcAmount.value) || 0, // Read from cached element, parse as float
            lineSpacingRatio: parseFloat(dom.lineSpacingRatio.value) || 1.0,
            lineSpacingInvert: dom.lineSpacingInvert.checked,

            // *** NEW: Read Math Control Options ***
            // Access cached elements using the corrected cache keys (no hyphens)
            curveSmoothing: dom.curvesmoothing.value, // e.g., 'straight', 'cubic_bezier'
            splineTension: parseFloat(dom.splinetension.value) || 0.5, // Default tension
            lissajousA: parseInt(dom.lissajousa.value, 10) || 3, // Default A freq
            lissajousB: parseInt(dom.lissajousb.value, 10) || 2, // Default B freq
            // Convert selected fraction (string) to radians (number)
            lissajousDelta: parseFloat(dom.lissajousdelta.value) * Math.PI || 0,
            spiralType: dom.spiraltype.value, // e.g., 'archimedean'
            spiralA: parseFloat(dom.spirala.value) || 0, // Default spiral param A
            spiralB: parseFloat(dom.spiralb.value) || 0.1, // Default spiral param B
        };

        // Assign the constructed options object to the global state
        state.currentOptions = options;
        console.log("Current Options Read:", state.currentOptions); // Log the options read
        return state.currentOptions; // Return the options object

    } catch (error) {
        console.error("Error reading options from DOM:", error);
        // Clear current options in state on error? Or keep previous? Decide policy.
        // state.currentOptions = {};
        return null; // Return null on error
    }
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
    // getOptions now updates state.currentOptions directly and returns it
    const options = getOptions();
    if (!options) {
         alert("Error retrieving generation options. Please check console.");
         return;
    }
    // Get the current color palette (ensure this runs *after* options are set if needed)
    const palette = getColorPalette();

    // --- Clear SVG ---
    dom.defs.innerHTML = ''; // Clear definitions (gradients, patterns)
    while (dom.svg.lastChild && dom.svg.lastChild !== dom.defs) {
         dom.svg.removeChild(dom.svg.lastChild);
    }

    // --- Set Background ---
    if (options.bgColor && options.bgColor.toUpperCase() !== '#FFFFFF') {
        const bgRect = createSVGElement('rect', { x: 0, y: 0, width: '100%', height: '100%', fill: options.bgColor });
        dom.svg.insertBefore(bgRect, dom.defs.nextSibling);
    }

    // --- Seeding Logic ---
    const originalRandom = Math.random;
    let seed;
    if (options.seedOverride) {
        const numSeed = parseFloat(options.seedOverride);
        // Use simpleStringHash (imported from utils.js) only if parseFloat results in NaN
        seed = !isNaN(numSeed) ? numSeed : simpleStringHash(options.seedOverride);
        console.log(`Using seed override: ${options.seedOverride} -> ${seed}`);
    } else {
        seed = Date.now();
        if (options.useTime) { seed += getTimeSeedValue() * 1e9; }
        if (options.useCursor) {
             if (state.mouseX !== null) { seed += Math.sin(state.mouseX*0.01)*1e5; }
             if (state.mouseY !== null) { seed += Math.cos(state.mouseY*0.01)*1e5; }
             if (state.capturedX !== null) { seed += Math.sin(state.capturedX*0.1)*1e4; }
             if (state.capturedY !== null) { seed += Math.cos(state.capturedY*0.1)*1e4; }
             if (state.capturedV?.x !== null) { seed += Math.sin(state.capturedV.x*0.1)*1e3; }
             if (state.capturedV?.y !== null) { seed += Math.cos(state.capturedV.y*0.1)*1e3; }
        }
        console.log(`Using time/cursor seed (approx): ${seed.toFixed(0)}`);
    }

    let currentSeed = Math.floor(Math.abs(seed)) % 2147483647;
    if (currentSeed === 0) currentSeed = 1;
    const seededRandom = () => {
        currentSeed = (currentSeed * 16807) % 2147483647;
        return (currentSeed - 1) / 2147483646;
    };
    Math.random = seededRandom;
    console.log(`Using PRNG with initial seed value: ${currentSeed}`);


    // --- Generation Loop (Layers) ---
    let totalElements = 0;
    let combinedMathInfo = {};

    try {
        for (let layer = 0; layer < options.layerCount; layer++) {
            state.currentLayer = layer;
            const currentOffsetX = layer * options.offsetX;
            const currentOffsetY = layer * options.offsetY;
            const currentAngle = options.globalAngle;
            const transform = `rotate(${currentAngle}, ${options.viewportWidth / 2}, ${options.viewportHeight / 2}) translate(${currentOffsetX}, ${currentOffsetY})`;
            let layerGroup = createSVGElement('g', { id: `layer-${layer}`, transform: transform }, dom.svg);

             const layerOptions = { ...options }; // Pass the full options object including new math params
             if (layer > 0) {
                 layerOptions.complexity = Math.max(1, options.complexity - layer * 1.5);
                 layerOptions.density = Math.max(1, options.density - layer * 15);
                 layerOptions.strokeWeight = Math.max(0.1, options.strokeWeight * (1 - layer * 0.25));
                 layerOptions.opacity = Math.max(0.1, options.opacity * (1 - layer * 0.2));
                 layerOptions.scale = options.scale * (1 - layer * 0.15);
            }

            let result = {};
            // Call the appropriate pattern function, passing the full layerOptions
            switch (layerOptions.patternType) {
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
                     console.warn("Unknown pattern type selected:", layerOptions.patternType);
                     result = generateRandomPattern(layerGroup, layerOptions, palette);
            }

            totalElements += (result && typeof result === 'object' && result.elementCount) ? result.elementCount : 0;
            combinedMathInfo[`Layer_${layer}`] = result || { error: 'Pattern function returned invalid result' };
        }

        // --- Finalize and Update UI ---
        state.mathInfo = {
            generator: options.patternType, layers: options.layerCount,
            viewport: `${options.viewportWidth}x${options.viewportHeight}`,
            totalElements: totalElements, details: combinedMathInfo,
            seedUsed: options.seedOverride || `Time/Cursor based (~${seed.toFixed(0)})`
        };
        updateMathInfo(state.mathInfo); // Call the imported function
        updateSVGStats(totalElements); // Call the imported function
        state.svgData = dom.svg.outerHTML;
        state.generationCount++;

        if (options.animation) {
            startAnimation();
        }

    } catch (error) {
         console.error('Error during SVG generation main loop:', error);
         const errorText = createSVGElement('text', { x: 10, y: 50, fill: 'red', 'font-family': 'sans-serif', 'font-size': '16px' });
         errorText.textContent = `Error: ${error.message}. Check console.`;
         dom.svg.appendChild(errorText);
         updateMathInfo({ error: error.message });
         updateSVGStats(0);
     }
    finally {
        Math.random = originalRandom; // Restore original Math.random
        console.log("Restored original Math.random.");
    }
}


// ----- Animation Functions -----
// (Keep existing animation functions as they were)

// *** REMOVED the local simpleStringHash function declaration ***
// It is now imported from utils.js at the top of the file.


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