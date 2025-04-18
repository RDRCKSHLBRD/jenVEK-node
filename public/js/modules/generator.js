// public/js/modules/generator.js

// ----- MODULE IMPORTS -----
import { state } from './state.js';
import { dom } from './dom.js';
import { getColorPalette, getRandomFill } from './colorUtils.js'; // Only need these two now
import { updateMathInfo, updateSVGStats } from './ui.js';
import {
    createSVGElement, // Still needed for background/error messages
    secureRandom, getTimeSeedValue // Keep necessary utils used directly here
    // Other utils (random, randomInt etc.) are likely only needed within pattern files now
} from './utils.js';

// ----- PATTERN FUNCTION IMPORTS -----
// Import all pattern generator functions from their respective files in the patterns directory
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
 * @returns {object} An object containing all current generation parameters.
 */
function getOptions() {
    // Ensure core DOM elements needed for options exist
    if (!dom.patternType || !dom.complexity || !dom.density || !dom.maxRecursion || !dom.strokeWeight || !dom.opacity || !dom.scale || !dom.layerCount || !dom.repetition || !dom.fillType || !dom.bgColor || !dom.strokeColor || !dom.useCursor || !dom.useTime || !dom.animation || !dom.animationType) {
        console.error("getOptions: One or more required DOM elements not cached!");
        // Consider returning null or throwing an error to prevent proceeding
        return null;
    }
    // Read values from cached DOM elements
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
    };
    return state.currentOptions;
}

/**
 * Main function to generate the SVG content based on selected options.
 * Acts as a controller, delegating pattern generation to imported modules.
 */
export function generateSVG() {
    console.log("Generating SVG...");
    stopAnimation(); // Stop any existing animation first

    if (!dom.svg || !dom.defs) {
        console.error("Cannot generate SVG: SVG canvas or defs element not found/cached.");
        alert("Error: SVG canvas not ready. Please reload.");
        return;
    }

    const options = getOptions();
    // Handle case where options couldn't be retrieved
    if (!options) {
         alert("Error retrieving generation options. Check console.");
         return;
    }
    const palette = getColorPalette();

    // --- Clear SVG ---
    dom.defs.innerHTML = '';
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
    let seed = Date.now();
    if (options.useTime) seed += getTimeSeedValue() * 1e9;
    if (options.useCursor) {
        if (state.mouseX !== null && state.mouseY !== null) {
             seed += Math.sin(state.mouseX * 0.01) * 1e5 + Math.cos(state.mouseY * 0.01) * 1e5;
        }
        if (state.capturedX !== null) seed += Math.sin(state.capturedX * 0.1) * 1e4;
        if (state.capturedY !== null) seed += Math.cos(state.capturedY * 0.1) * 1e4;
        if (state.capturedV?.x !== null) seed += Math.sin(state.capturedV.x * 0.1) * 1e3;
        if (state.capturedV?.y !== null) seed += Math.cos(state.capturedV.y * 0.1) * 1e3;
    }
    let currentSeed = Math.floor(Math.abs(seed)) % 2147483647;
    if (currentSeed === 0) currentSeed = 1;
    const seededRandom = () => {
        currentSeed = (currentSeed * 16807) % 2147483647;
        return (currentSeed - 1) / 2147483646;
    };
    if (options.useTime || options.useCursor) {
        console.log("Using seeded random generator.");
        Math.random = seededRandom;
    } else {
        console.log("Using default secureRandom.");
        Math.random = secureRandom;
    }

    // --- Generation Loop (Layers) ---
    let totalElements = 0;
    let combinedMathInfo = {};

    try {
        for (let layer = 0; layer < options.layerCount; layer++) {
            state.currentLayer = layer;
            let layerGroup = createSVGElement('g', { id: `layer-${layer}` }, dom.svg);
             const layerOptions = { ...options };
             if (layer > 0) { // Adjust options for subsequent layers
                 layerOptions.complexity = Math.max(1, options.complexity - layer * 1.5);
                 layerOptions.density = Math.max(1, options.density - layer * 15);
                 layerOptions.strokeWeight = Math.max(0.1, options.strokeWeight * (1 - layer * 0.25));
                 layerOptions.opacity = Math.max(0.1, options.opacity * (1 - layer * 0.2));
                 layerOptions.scale = options.scale * (1 - layer * 0.15);
            }

            let result = {}; // To store results from the pattern function

            // Call the appropriate IMPORTED pattern generation function
            switch (options.patternType) {
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

            // Ensure result is an object before trying to access elementCount
            totalElements += (result && typeof result === 'object' && result.elementCount) ? result.elementCount : 0;
            combinedMathInfo[`Layer_${layer}`] = result || { error: 'Pattern function returned invalid result' };
        }

        // --- Finalize and Update UI ---
        state.mathInfo = {
            generator: options.patternType, layers: options.layerCount,
            viewport: `${options.viewportWidth}x${options.viewportHeight}`,
            totalElements: totalElements, details: combinedMathInfo
        };
        updateMathInfo(state.mathInfo);
        updateSVGStats(totalElements);
        state.svgData = dom.svg.outerHTML;
        state.generationCount++;
        if (options.animation) {
            startAnimation();
        }

    } catch (error) {
         console.error('Error during SVG generation:', error);
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


// ----- Pattern Generation Functions -----
// *** All pattern function definitions are now removed from this file ***
// *** They are imported from the './patterns/' directory at the top ***


// ----- Animation Functions -----
// These remain here as they control the overall animation state based on options

/**
 * Starts the animation loop based on the current options.
 */
function startAnimation() {
    if (!state.currentOptions?.animation || state.isAnimating) return;
    // Select elements to animate (exclude potential background rect)
    const elements = dom.svg.querySelectorAll('circle, rect:not([fill="' + state.currentOptions.bgColor + '"]), ellipse, polygon, path, line');
    if (elements.length === 0) return;

    console.log(`Starting animation (${state.currentOptions.animationType})...`);
    state.isAnimating = true;
    const startTime = Date.now();
    const animationType = state.currentOptions.animationType;
    const baseOpacity = state.currentOptions.opacity;
    const baseStrokeWeight = state.currentOptions.strokeWeight;
    const complexityFactor = state.currentOptions.complexity / 10; // Normalize complexity

    function animateFrame() {
        if (!state.isAnimating) { console.log("Animation stopped externally."); return; }
        const elapsed = Date.now() - startTime;
        const phase = (elapsed % 5000) / 5000; // 5-second cycle

        elements.forEach((element, index) => {
            if (!element.parentElement) return; // Skip elements removed from DOM
             const individualPhase = (phase + (index / elements.length) * 0.5) % 1; // Offset phase
             const sinPhase = Math.sin(individualPhase * Math.PI * 2); // Oscillates -1 to 1
             const cosPhase = Math.cos(individualPhase * Math.PI * 2); // Oscillates 1 to -1

            try {
                switch(animationType) {
                    case 'pulse':
                        let originalSize = parseFloat(element.getAttribute('r')) || Math.max(parseFloat(element.getAttribute('width')), parseFloat(element.getAttribute('height'))) || 5;
                        const pulseFactor = 1 + sinPhase * 0.1 * complexityFactor;
                        if (element.tagName === 'circle') { element.setAttribute('r', Math.max(1, originalSize * pulseFactor)); }
                        else if (element.tagName === 'rect' || element.tagName === 'ellipse') {
                             try { // getBBox can fail if element is not rendered
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
                        const targetOpacity = baseOpacity * (0.5 + (cosPhase + 1) * 0.25); // Oscillates between 0.5*base and 1.0*base
                        element.setAttribute('opacity', Math.max(0.1, Math.min(1, targetOpacity)));
                        break;
                     case 'morph':
                          const originalSW = parseFloat(element.getAttribute('stroke-width')) ?? baseStrokeWeight;
                          if (originalSW > 0) { const morphFactor = 1 + sinPhase * 0.3 * complexityFactor; element.setAttribute('stroke-width', Math.max(0.1, originalSW * morphFactor)); }
                         break;
                }
            } catch (e) { /* Ignore animation errors for robustness */ }
        });
        state.animationFrame = requestAnimationFrame(animateFrame);
    }
    state.animationFrame = requestAnimationFrame(animateFrame);
}

/**
 * Stops the currently running animation loop.
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

