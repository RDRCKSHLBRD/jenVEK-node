// public/js/modules/patterns/Bezier.js

// ----- MODULE IMPORTS -----
// Import necessary utilities
import { createSVGElement, random, randomChoice } from '../utils.js';
// Import shared state (for captured coordinates)
import { state } from '../state.js';
// Import color utilities if needed (palette is passed in)
// import { getRandomFill } from '../colorUtils.js';


/**
 * Generates a pattern consisting of random cubic Bezier curves.
 * Can utilize captured coordinates for start/end points.
 * @param {SVGElement} parent - The parent SVG group element (<g>).
 * @param {object} options - Generation options.
 * @param {string[]} palette - Color palette.
 * @returns {object} Generation results.
 */
export function generateBezierPattern(parent, options, palette) {
    // Destructure options
    const { viewportWidth: width, viewportHeight: height, complexity, density, repetition, strokeWeight, opacity, strokeColor } = options;
    let elementCount = 0;

    // Number of curves based on settings
    const numCurves = Math.max(1, Math.floor(complexity * (density / 100) * 5 * repetition)); // Ensure at least 1 curve
    console.log(`Generating ${numCurves} Bezier curves...`);

    // Generate each curve
    for (let i = 0; i < numCurves; i++) {
        // Define start, end, and control points randomly (uses imported random)
        const x1_rand = random(0, width);
        const y1_rand = random(0, height);
        const x2_rand = random(0, width);
        const y2_rand = random(0, height);
        const cx1 = random(0, width);
        const cy1 = random(0, height);
        const cx2 = random(0, width);
        const cy2 = random(0, height);

        // --- Use captured coordinates if available (uses imported state) ---
        // Use captured X/Y for start point if available, otherwise use random point
        const startX = state.capturedX ?? x1_rand;
        const startY = state.capturedY ?? y1_rand;
        // Use captured Vector X/Y for end point if available, otherwise use random point
        const endX = (state.capturedV && state.capturedV.x !== null) ? state.capturedV.x : x2_rand;
        const endY = (state.capturedV && state.capturedV.y !== null) ? state.capturedV.y : y2_rand;

         // Create the path element using the cubic Bezier command (C)
         // Uses imported createSVGElement
         createSVGElement('path', {
             // d attribute: M = MoveTo start, C = Cubic Bezier curve to end using control points
             d: `M ${startX.toFixed(2)} ${startY.toFixed(2)} C ${cx1.toFixed(2)} ${cy1.toFixed(2)}, ${cx2.toFixed(2)} ${cy2.toFixed(2)}, ${endX.toFixed(2)} ${endY.toFixed(2)}`,
             fill: 'none', // Bezier curves are typically not filled
             // Use imported randomChoice and random
             stroke: randomChoice(palette) || strokeColor,
             'stroke-width': Math.max(0.5, strokeWeight * random(0.5, 2)),
             opacity: opacity * random(0.5, 1)
         }, parent);
         elementCount++;
    }

    // Return results
    return { elementCount, curves: numCurves, type: 'Cubic Bezier' };
}
