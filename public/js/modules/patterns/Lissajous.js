// public/js/modules/patterns/Lissajous.js

// ----- MODULE IMPORTS -----
// Import necessary utilities
import { createSVGElement, random, randomInt, randomChoice } from '../utils.js';
// Import state if needed
// import { state } from '../state.js';
// Import color utilities if needed
// import { getRandomFill } from '../colorUtils.js';


/**
 * Generates patterns based on Lissajous curves.
 * @param {SVGElement} parent - The parent SVG group element (<g>).
 * @param {object} options - Generation options.
 * @param {string[]} palette - Color palette.
 * @returns {object} Generation results.
 */
export function generateLissajousPattern(parent, options, palette) {
    // Destructure options
    const { viewportWidth: width, viewportHeight: height, complexity, density, repetition, scale, strokeWeight, opacity, strokeColor } = options;
    let elementCount = 0;

    // Number of curves based on complexity and repetition
    const numCurves = Math.max(1, Math.floor(complexity * 0.5 * repetition));
    // Number of steps (points) per curve based on density
    const steps = Math.max(50, Math.floor(100 * (density / 100)) + 50);

    // Center and radius for the curves
    const centerX = width / 2;
    const centerY = height / 2;
    const radiusX = width * 0.4 * scale; // Max horizontal extent
    const radiusY = height * 0.4 * scale; // Max vertical extent

    console.log(`Generating ${numCurves} Lissajous curves...`);

    // Generate each Lissajous curve
    for (let i = 0; i < numCurves; i++) {
         // Frequencies (a, b) determine the shape (uses imported randomInt)
         const a = randomInt(1, Math.floor(complexity / 2) + 1);
         const b = randomInt(1, Math.floor(complexity / 2) + 1);
         // Phase difference (delta) also affects the shape (uses imported randomChoice)
         const delta = Math.PI / randomChoice([1, 2, 3, 4, 6, 8]);

        const pathPoints = []; // Array to store points for the path

        // Calculate points along the curve using parametric equations
        for (let j = 0; j <= steps; j++) {
            // Parameter t ranges from 0 to 2*PI (scaled by repetition)
            const t = (j / steps) * Math.PI * 2 * Math.max(1, repetition / 2);
            // Lissajous equations:
            const x = centerX + radiusX * Math.sin(a * t + delta);
            const y = centerY + radiusY * Math.sin(b * t);
            pathPoints.push(`${x.toFixed(2)},${y.toFixed(2)}`); // Add point (with fixed precision)
        }

         // Draw the path if enough points were generated (uses imported createSVGElement)
         if (pathPoints.length > 1) {
             createSVGElement('path', {
                 d: `M ${pathPoints[0]} L ${pathPoints.slice(1).join(' L ')}`,
                 fill: 'none', // Curves are not filled
                 // Uses imported randomChoice and random
                 stroke: randomChoice(palette) || strokeColor,
                 'stroke-width': Math.max(0.5, strokeWeight * random(0.8, 1.2)),
                 opacity: opacity * random(0.7, 1)
             }, parent);
             elementCount++;
         }
    }
     // Return results
     return { elementCount, curves: numCurves, stepsPerCurve: steps };
}
