// public/js/modules/patterns/Fibonacci.js

// ----- MODULE IMPORTS -----
// Import necessary utilities
import { createSVGElement, random, randomInt, randomChoice } from '../utils.js';
// Import color utilities
import { getRandomFill } from '../colorUtils.js';
// Import state if needed (not directly used here, but potentially useful)
// import { state } from '../state.js';
// Import fibonacci function if uncommenting the size calculation line below
// import { fibonacci } from '../utils.js';


/**
 * Generates a pattern based on the Fibonacci sequence and the Golden Angle,
 * typically forming a phyllotaxis spiral.
 * @param {SVGElement} parent - The parent SVG group element (<g>).
 * @param {object} options - Generation options.
 * @param {string[]} palette - Color palette.
 * @returns {object} Generation results.
 */
export function generateFibonacciPattern(parent, options, palette) {
    // Destructure options
    const { viewportWidth: width, viewportHeight: height, complexity, density, repetition, scale, strokeWeight, opacity, strokeColor } = options;

    // Calculate parameters for the spiral
    const maxRadius = Math.min(width, height) * 0.45 * scale;
    const numElements = Math.max(10, Math.floor(50 * complexity * (density / 100) * repetition));
    const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio
    const goldenAngle = 2 * Math.PI * (1 - 1 / phi); // Golden angle
    let elementCount = 0;

    // Center the spiral using a group transform
    const group = createSVGElement('g', { transform: `translate(${width / 2}, ${height / 2})` }, parent);

    // Generate elements along the spiral
    for (let i = 0; i < numElements; i++) {
        const theta = i * goldenAngle; // Angle for this element
        const distance = maxRadius * Math.sqrt(i / numElements); // Distance using sqrt for even distribution
        const x = distance * Math.cos(theta);
        const y = distance * Math.sin(theta);

        // Calculate base size (outer elements smaller)
        const baseSize = Math.max(1, maxRadius * 0.1 * (1 - i / numElements) * (complexity / 5));
        let size = baseSize;
        // Optional: Use actual Fibonacci sequence for first few element sizes
        // Requires importing fibonacci from utils.js
        // if (i < 10) { size = Math.max(1, fibonacci(10 - i) * maxRadius * 0.005 * complexity); }

        // Get styles using imported functions
        const fill = getRandomFill(palette, options);
        const stroke = strokeColor;
        const sw = strokeWeight;
        const op = opacity;

        // Vary shape type based on index (uses imported randomInt)
        const shapeType = i % randomInt(3, 6);
        // Uses imported createSVGElement, random, randomChoice
        switch (shapeType) {
            case 0: // Circle
                createSVGElement('circle', { cx: x, cy: y, r: Math.max(1, size), fill, stroke, 'stroke-width': sw, opacity: op }, group);
                break;
            case 1: // Square (rotated)
                createSVGElement('rect', { x: x - size / 2, y: y - size / 2, width: Math.max(1, size), height: Math.max(1, size), fill, stroke, 'stroke-width': sw, opacity: op, transform: `rotate(${theta * 180 / Math.PI + random(-10, 10)}, ${x}, ${y})` }, group);
                break;
            case 2: // Triangle
                 const points = [];
                 for (let j = 0; j < 3; j++) {
                     const angle = theta + j * (2 * Math.PI / 3);
                     points.push(`${x + size * Math.cos(angle)},${y + size * Math.sin(angle)}`);
                 }
                 createSVGElement('polygon', { points: points.join(' '), fill, stroke, 'stroke-width': sw, opacity: op }, group);
                break;
             case 3: // Ellipse
                 createSVGElement('ellipse', { cx: x, cy: y, rx: Math.max(1, size * random(0.8, 1.2)), ry: Math.max(1, size * random(0.5, 1)), fill, stroke, 'stroke-width': sw, opacity: op, transform: `rotate(${theta * 180 / Math.PI + random(-10, 10)}, ${x}, ${y})`}, group);
                break;
             case 4: // Line segment
                 const len = size * 2;
                 createSVGElement('line', {
                     x1: x - Math.cos(theta) * len / 2, y1: y - Math.sin(theta) * len / 2,
                     x2: x + Math.cos(theta) * len / 2, y2: y + Math.sin(theta) * len / 2,
                     stroke: randomChoice(palette) || stroke,
                     'stroke-width': sw * random(0.5, 1.5),
                     opacity: op
                 }, group);
                 break;
        }
        elementCount++;
    }

    // Optionally add a connecting spiral path
    if (complexity > 5 && density > 50 && repetition > 1) {
        const pathPoints = [];
        const step = Math.max(1, Math.floor(numElements / (50 * repetition)));
        for (let i = 0; i < numElements; i += step) {
            const theta = i * goldenAngle;
            const distance = maxRadius * Math.sqrt(i / numElements);
            pathPoints.push(`${distance * Math.cos(theta)},${distance * Math.sin(theta)}`);
        }
        if (pathPoints.length > 1) {
             createSVGElement('path', {
                 d: `M ${pathPoints[0]} L ${pathPoints.slice(1).join(' L ')}`,
                 fill: 'none',
                 stroke: strokeColor,
                 'stroke-width': strokeWeight * 0.5,
                 opacity: 0.4
             }, group);
            elementCount++;
        }
    }

    // Return results
    return {
        elementCount,
        goldenRatio: phi.toFixed(8),
        goldenAngleRad: goldenAngle.toFixed(8),
        numElementsGenerated: numElements
    };
}

