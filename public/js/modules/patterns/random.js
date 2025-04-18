// public/js/modules/patterns/random.js

// ----- MODULE IMPORTS -----
// Note the relative paths '../' because this file is one level deeper than generator.js
import { getRandomFill } from '../colorUtils.js';
import { createSVGElement, random, randomInt } from '../utils.js';
// We also need access to the shared state if any pattern needs it (random doesn't directly, but others might)
// import { state } from '../state.js';

/**
 * Generates a pattern with randomly placed and sized basic shapes (circles, rectangles, polygons).
 * @param {SVGElement} parent - The parent SVG group element (<g>) to append shapes to.
 * @param {object} options - The generation options object.
 * @param {string[]} palette - The array of hex color strings for the current palette.
 * @returns {object} An object containing generation results (e.g., elementCount).
 */
export function generateRandomPattern(parent, options, palette) {
    // Destructure necessary options for easier access
    const { viewportWidth: width, viewportHeight: height, complexity, density, repetition, scale, strokeWeight, opacity, strokeColor } = options;
    let elementCount = 0;

    // Calculate number of shapes based on complexity, density, and repetition
    // Added Math.max to ensure at least a few shapes even at low settings
    const numShapes = Math.max(3, Math.floor(complexity * (density / 100) * 20 * repetition));
    console.log(`Generating ${numShapes} random shapes...`); // Log how many shapes are being generated

    for (let i = 0; i < numShapes; i++) {
        const shapeType = Math.random(); // Use potentially seeded random (if overridden in generateSVG)
        let shape; // Variable to hold the created SVG element

        // Get fill style (solid, gradient, pattern, none) using the utility function
        const fill = getRandomFill(palette, options);
        const stroke = strokeColor; // Base stroke color from options
        const sw = strokeWeight; // Base stroke weight from options
        const op = opacity; // Base opacity from options

        // Determine shape type based on random value
        if (shapeType < 0.3) { // --- Circle (30% chance) ---
            const radius = random(5, 30 * complexity * scale); // Radius influenced by complexity and scale
            shape = createSVGElement('circle', {
                cx: random(0, width), cy: random(0, height), // Random position
                r: Math.max(1, radius), // Ensure radius is at least 1
                fill, stroke, 'stroke-width': sw, opacity: op
            }, parent); // Append to parent group

        } else if (shapeType < 0.6) { // --- Rectangle (30% chance) ---
            const rectW = random(10, 50 * complexity * scale); // Width influenced by complexity and scale
            const rectH = random(10, 50 * complexity * scale); // Height influenced by complexity and scale
            // Calculate random X/Y, ensuring the rectangle fits within the viewport bounds
            const rectX = random(0, Math.max(0, width - rectW));
            const rectY = random(0, Math.max(0, height - rectH));
            shape = createSVGElement('rect', {
                x: rectX, y: rectY,
                width: Math.max(1, rectW), height: Math.max(1, rectH), // Ensure dimensions are at least 1
                fill, stroke, 'stroke-width': sw, opacity: op,
                // Add a random rotation around its center
                transform: `rotate(${random(-30, 30)} ${rectX + rectW / 2} ${rectY + rectH / 2})`
            }, parent); // Append to parent group

        } else { // --- Polygon (40% chance) ---
            const points = [];
            const numPoints = randomInt(3, 7); // Random number of vertices (3 to 7)
            const centerX = random(0, width); // Random center X
            const centerY = random(0, height); // Random center Y
            const baseRadius = random(10, 40 * complexity * scale); // Base radius influenced by complexity and scale

            for (let j = 0; j < numPoints; j++) {
                // Calculate angle for each vertex, adding slight jitter for irregularity
                const angle = (j / numPoints) * (Math.PI * 2) + random(-0.1, 0.1);
                // Vary radius slightly for each vertex to make shapes less uniform
                const r = baseRadius * random(0.8, 1.2);
                // Calculate vertex coordinates and add to points array
                points.push(`${(centerX + Math.cos(angle) * r).toFixed(2)},${(centerY + Math.sin(angle) * r).toFixed(2)}`); // Use toFixed for cleaner SVG output
            }
            shape = createSVGElement('polygon', {
                points: points.join(' '), // Join points with spaces
                fill, stroke, 'stroke-width': sw, opacity: op
            }, parent); // Append to parent group
        }
        elementCount++; // Increment element counter
    }
    // Return information about the generated pattern
    return { elementCount, complexity: options.complexity, density: options.density, repetition: options.repetition };
}
