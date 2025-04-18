// rose.js


// public/js/modules/patterns/rose.js

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
 * Generates patterns based on Rose Curves (r = a * cos(n * theta)).
 * @param {SVGElement} parent - The parent SVG group element (<g>).
 * @param {object} options - Generation options.
 * @param {string[]} palette - Color palette.
 * @returns {object} Generation results.
 */
export function generateRoseCurvePattern(parent, options, palette) {
    console.log("Generating Rose Curve pattern...");
    // Destructure options
    const { viewportWidth: width, viewportHeight: height, complexity, density, scale, strokeWeight, opacity, strokeColor } = options;
    let elementCount = 0;

    // 1. Determine Rose Curve parameters 'a' and 'n'
    // 'a' controls the maximum radius (size) - base it on viewport and scale
    const a = Math.min(width, height) * 0.4 * scale;
    // 'n' controls the number/shape of petals - base it on complexity
    // Let's map complexity (1-20) to n (1-10) for integer values common in examples
    const n = Math.max(1, Math.round(complexity / 2)); // Ensure n is at least 1

    // 2. Calculate points along the curve
    // Number of steps determines smoothness - base it on density
    const steps = Math.max(50, Math.floor(density * 3) + 50);
    const points = [];
    const cx = width / 2; // Center X
    const cy = height / 2; // Center Y

    // Angle range: 0 to 2*PI generally ensures the curve closes for integer n
    const angleRange = (n % 2 !== 0) ? Math.PI * 2 : Math.PI; // Optimization: PI is enough if n is even
    const endAngle = Math.PI * 2; // Safer to always go to 2*PI to ensure closure

    console.log(`Rose Curve params: a=${a.toFixed(1)}, n=${n}, steps=${steps}`);

    for (let i = 0; i <= steps; i++) {
        const theta = (i / steps) * endAngle;
        // Rose curve formula: r = a * cos(n * theta)
        const r = a * Math.cos(n * theta);

        // Convert polar coordinates (r, theta) to Cartesian (x, y)
        // Add cx, cy to translate relative to the center
        const x = cx + r * Math.cos(theta);
        const y = cy + r * Math.sin(theta);

        points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
    }

    // 3. Draw the curve as an SVG path
    if (points.length > 1) {
        // Create the 'd' attribute string for the path
        const d = `M ${points[0]} L ${points.slice(1).join(' L ')}`;

        // Create the path element (uses imported createSVGElement and randomChoice)
        createSVGElement('path', {
            d: d,
            stroke: randomChoice(palette) || strokeColor, // Use random color from palette
            'stroke-width': strokeWeight,
            fill: 'none', // Rose curves are typically not filled
            opacity: opacity
         }, parent);
        elementCount = 1; // Count the path as one element
    } else {
        console.warn("Not enough points generated for Rose Curve path.");
    }

    // Return results
    return { elementCount, pattern: 'Rose Curve', nParam: n, amplitude: a.toFixed(2) };
}
