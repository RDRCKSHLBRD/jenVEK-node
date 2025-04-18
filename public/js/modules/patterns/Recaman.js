// public/js/modules/patterns/Recaman.js

// ----- MODULE IMPORTS -----
// Import necessary utilities
import { createSVGElement, randomChoice } from '../utils.js';
// Import state if needed
// import { state } from '../state.js';
// Import color utilities if needed
// import { getRandomFill } from '../colorUtils.js';
// Import random utils if needed
// import { random, randomInt } from '../utils.js';


/**
 * Generates an SVG pattern based on Recamán's sequence.
 * Visualizes as a series of alternating semi-circular arcs.
 * @param {SVGElement} parent - The parent SVG group element (<g>).
 * @param {object} options - Generation options.
 * @param {string[]} palette - Color palette.
 * @returns {object} An object containing generation results (e.g., elementCount).
 */
export function generateRecamanPattern(parent, options, palette) {
    console.log("Generating Recamán's sequence pattern...");
    // Destructure options
    const { viewportWidth: width, viewportHeight: height, complexity, density, scale, strokeWeight, opacity, strokeColor } = options;
    let elementCount = 0;

    // 1. Calculate Recamán's Sequence
    // Determine number of terms based on complexity/density
    const numTerms = Math.max(10, Math.floor(complexity * 5 + density / 2));
    const sequence = [0]; // a(0) = 0
    const usedNumbers = new Set([0]); // Keep track of numbers used

    for (let n = 1; n < numTerms; n++) {
        const previousTerm = sequence[n - 1];
        const backward = previousTerm - n; // Potential backward step

        // Check if backward step is valid
        if (backward > 0 && !usedNumbers.has(backward)) {
            sequence[n] = backward;
        } else {
            // Step forward
            sequence[n] = previousTerm + n;
        }
        usedNumbers.add(sequence[n]); // Record the new term

        // Optional safety break for large values
        if (sequence[n] > 1e6) {
             console.warn("Recamán sequence value exceeded limit, stopping early.");
             break;
        }
    }

    if (sequence.length <= 1) {
        console.warn("Recamán sequence too short to draw.");
        return { elementCount: 0, sequence: 'Recamán (Too Short)' };
    }

    // 2. Visualize as Alternating Arcs
    const baselineY = height / 2; // Horizontal baseline

    // Determine sequence range for scaling
    let minVal = 0;
    let maxVal = 0;
    sequence.forEach(val => {
        if (val < minVal) minVal = val;
        if (val > maxVal) maxVal = val;
    });
    const sequenceRange = Math.max(1, maxVal - minVal);

    // Calculate scaling factor and centering offset
    const targetWidth = width * 0.8; // Use 80% of viewport width
    const effectiveScale = scale * (targetWidth / sequenceRange);
    const drawingWidth = sequenceRange * effectiveScale;
    const offsetX = (width - drawingWidth) / 2 - (minVal * effectiveScale);

    // Create a group for the arcs (uses imported createSVGElement)
    const arcGroup = createSVGElement('g', {
        transform: `translate(${offsetX.toFixed(2)}, 0)`, // Center horizontally
        stroke: strokeColor,
        'stroke-width': strokeWeight,
        opacity: opacity,
        fill: 'none' // Arcs are not filled
    }, parent);

    // Draw arcs between consecutive terms
    for (let n = 1; n < sequence.length; n++) {
        const val1 = sequence[n - 1];
        const val2 = sequence[n];

        // Map values to screen coordinates
        const x1 = val1 * effectiveScale;
        const x2 = val2 * effectiveScale;

        // Calculate arc properties
        const diameter = Math.abs(x2 - x1);
        const radius = diameter / 2;

        if (radius < 0.1) continue; // Skip tiny arcs

        // Alternate sweep direction
        const sweepFlag = n % 2;

        // Create SVG path data for the arc (uses imported createSVGElement)
        const d = `M ${x1.toFixed(2)} ${baselineY} A ${radius.toFixed(2)} ${radius.toFixed(2)} 0 0 ${sweepFlag} ${x2.toFixed(2)} ${baselineY}`;

        // Create the path element (uses imported randomChoice)
        createSVGElement('path', {
            d: d,
            stroke: randomChoice(palette) || strokeColor
        }, arcGroup);

        elementCount++;
    }

    console.log(`Generated Recamán sequence with ${sequence.length} terms.`);
    // Return results
    return { elementCount, sequenceName: 'Recamán', terms: sequence.length };
}
