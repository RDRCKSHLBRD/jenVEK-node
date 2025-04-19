// public/js/modules/patterns/Lissajous.js

// ----- MODULE IMPORTS -----
// Import necessary utilities
import { createSVGElement, random, randomChoice, pointsToPathString } from '../utils.js'; // Added pointsToPathString
// Import state if needed
// import { state } from '../state.js';
// Import color utilities if needed
// import { getRandomFill } from '../colorUtils.js';


/**
 * Generates patterns based on Lissajous curves using parameters from options.
 * Applies curve smoothing based on options.
 * @param {SVGElement} parent - The parent SVG group element (<g>).
 * @param {object} options - Generation options, including lissajousA, lissajousB, lissajousDelta, curveSmoothing, splineTension.
 * @param {string[]} palette - Color palette.
 * @returns {object} Generation results.
 */
export function generateLissajousPattern(parent, options, palette) {
    // Destructure options, including the specific Lissajous and smoothing parameters
    const {
        viewportWidth: width, viewportHeight: height, complexity, density, repetition, scale, strokeWeight, opacity, strokeColor,
        lissajousA, lissajousB, lissajousDelta, // Lissajous params
        curveSmoothing, splineTension // Smoothing params
    } = options;
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

    // Use the parameters directly from options
    const a = lissajousA || 1;
    const b = lissajousB || 1;
    const delta = lissajousDelta || 0;

    console.log(`Generating ${numCurves} Lissajous curves (a=${a}, b=${b}, delta=${(delta/Math.PI).toFixed(3)}π, smoothing: ${curveSmoothing})...`); // Updated log

    // Generate each Lissajous curve
    for (let i = 0; i < numCurves; i++) {
        // *** Change: Store points as objects {x, y} ***
        const pathPoints = []; // Array to store point objects

        // Add slight random offsets to center or radius for variation if desired
        const currentCenterX = centerX + random(-width*0.02, width*0.02);
        const currentCenterY = centerY + random(-height*0.02, height*0.02);
        const currentRadiusX = radiusX * random(0.9, 1.1);
        const currentRadiusY = radiusY * random(0.9, 1.1);


        // Calculate points along the curve using parametric equations
        for (let j = 0; j <= steps; j++) {
            // Parameter t ranges from 0 to 2*PI (scaled by repetition slightly for potentially longer trails)
            const t = (j / steps) * Math.PI * 2 * Math.max(1, repetition / 1.5); // Adjusted repetition scaling
            // Lissajous equations:
            const x = currentCenterX + currentRadiusX * Math.sin(a * t + delta);
            const y = currentCenterY + currentRadiusY * Math.sin(b * t);
            // *** Change: Push point object ***
            pathPoints.push({ x: x, y: y });
        }

         // Draw the path if enough points were generated
         if (pathPoints.length > 1) {
             // *** Change: Use pointsToPathString utility for drawing ***
             const d = pointsToPathString(pathPoints, curveSmoothing, { splineTension }, true); // Pass points, smoothing options, and closePath=true

             // Only draw if path string is valid
             if (d) {
                 createSVGElement('path', {
                     d: d, // Use the generated path string
                     fill: 'none', // Curves are not filled
                     stroke: randomChoice(palette) || strokeColor,
                     'stroke-width': Math.max(0.5, strokeWeight * random(0.8, 1.2)),
                     opacity: opacity * random(0.7, 1)
                 }, parent);
                 elementCount++;
             } else {
                 console.warn("pointsToPathString returned empty for Lissajous curve, skipping draw.");
             }
         }
    }
     // Return results including the parameters used
     return {
        elementCount,
        curves: numCurves,
        stepsPerCurve: steps,
        freqA: a,
        freqB: b,
        phaseDelta: delta,
        smoothing: curveSmoothing // Include smoothing type in results
     };
}

