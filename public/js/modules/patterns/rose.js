// public/js/modules/patterns/rose.js

// ----- MODULE IMPORTS -----
// Import necessary utilities
import { createSVGElement, randomChoice } from '../utils.js';
// Import color utilities for fill handling
import { getRandomFill } from '../colorUtils.js';
// Import state if needed (not directly used here)
// import { state } from '../state.js';


/**
 * Generates patterns based on Rose Curves (r = a * cos(n * theta)).
 * Uses 'roseNParam' from options for the 'n' value.
 * Applies fill based on 'fillType' option.
 * @param {SVGElement} parent - The parent SVG group element (<g>).
 * @param {object} options - Generation options, including roseNParam, fillType.
 * @param {string[]} palette - Color palette.
 * @returns {object} Generation results.
 */
export function generateRoseCurvePattern(parent, options, palette) {
    console.log("Generating Rose Curve pattern...");
    // Destructure options
    const { viewportWidth: width, viewportHeight: height, density, scale, strokeWeight, opacity, strokeColor, roseNParam, fillType } = options;
    let elementCount = 0;

    // 1. Determine Rose Curve parameters 'a' and 'n'
    const a = Math.min(width, height) * 0.4 * scale; // Size parameter
    // Use the value directly from the options (slider)
    // Ensure n is at least a small positive number to avoid issues with Math.cos(0) always being 1 if n=0
    const n = Math.max(0.1, roseNParam);

    // 2. Calculate points along the curve
    // Number of steps determines smoothness - base it on density
    const steps = Math.max(50, Math.floor(density * 3) + 50);
    const points = [];
    const cx = width / 2; // Center X
    const cy = height / 2; // Center Y
    // Loop 0 to 2*PI to ensure curve closes, especially for fractional n
    const endAngle = Math.PI * 2;

    console.log(`Rose Curve params: a=${a.toFixed(1)}, n=${n}, steps=${steps}`);

    for (let i = 0; i <= steps; i++) {
        const theta = (i / steps) * endAngle;
        // Rose curve formula: r = a * cos(n * theta)
        const r = a * Math.cos(n * theta);

        // Convert polar coordinates (r, theta) to Cartesian (x, y)
        // Add cx, cy to translate relative to the center
        const x = cx + r * Math.cos(theta);
        const y = cy + r * Math.sin(theta);

        points.push(`${x.toFixed(2)},${y.toFixed(2)}`); // Add point with fixed precision
    }

    // 3. Draw the curve as an SVG path
    if (points.length > 1) {
        // Create the 'd' attribute string for the path: Move to start, Line to subsequent points, Close path
        const d = `M ${points[0]} L ${points.slice(1).join(' L ')} Z`;

        // Determine fill based on options using imported function
        const fillValue = (fillType === 'none') ? 'none' : getRandomFill(palette, options);

        // Create the path element (uses imported createSVGElement and randomChoice)
        createSVGElement('path', {
            d: d,
            stroke: randomChoice(palette) || strokeColor, // Vary stroke color
            'stroke-width': strokeWeight,
            fill: fillValue, // Apply determined fill
            opacity: opacity
         }, parent);
        elementCount = 1; // Count the path as one element
    } else {
        console.warn("Not enough points generated for Rose Curve path.");
    }

    // Return results, including parameters used
    return { elementCount, pattern: 'Rose Curve', nParam: n, amplitude: a.toFixed(2) };
}
