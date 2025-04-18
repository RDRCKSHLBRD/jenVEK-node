// public/js/modules/patterns/QuadTree.js

// ----- MODULE IMPORTS -----
// Import shared state (needed for recursionCount)
import { state } from '../state.js';
// Import necessary utilities
import { createSVGElement, random, randomInt, randomChoice } from '../utils.js';
// Import color utilities
import { getRandomFill } from '../colorUtils.js';

// ----- CONSTANTS -----
// Define safety constant locally if only used here, or import if shared
const MAX_RECURSION_SAFETY = 10000;

// ----- PATTERN GENERATION FUNCTIONS -----

/**
 * Generates a pattern using a Quadtree subdivision algorithm.
 * @param {SVGElement} parent - The parent SVG group element (<g>).
 * @param {object} options - Generation options.
 * @param {string[]} palette - Color palette.
 * @returns {object} Generation results.
 */
export function generateQuadtreePattern(parent, options, palette) {
    const { viewportWidth: width, viewportHeight: height, maxRecursion, complexity, density } = options;
    // Reset global recursion counter via imported state object
    state.recursionCount = 0;

    // Define the root quad covering the entire viewport
    const rootQuad = { x: 0, y: 0, width, height, depth: 0 };
    // Start the recursive quadtree generation
    generateQuadtreeNode(parent, rootQuad, maxRecursion, options, palette);

     // Return results
     return {
        elementCount: state.recursionCount, // Total elements (nodes processed/drawn)
        // Report actual depth reached
        maxDepthReached: Math.min(state.recursionCount > 0 ? maxRecursion : 0, maxRecursion, Math.ceil(Math.log(state.recursionCount+1)/Math.log(4))), // Estimate depth
        complexity: options.complexity,
        density: options.density
    };
}

/**
 * Helper function for recursive quadtree generation. Subdivides or draws leaf nodes.
 * NOTE: Internal to this module.
 * @param {SVGElement} parent - The parent SVG group element (<g>).
 * @param {object} quad - Data for the current quad { x, y, width, height, depth }.
 * @param {number} maxDepth - Maximum recursion depth allowed by options.
 * @param {object} options - Generation options.
 * @param {string[]} palette - Color palette.
 */
function generateQuadtreeNode(parent, quad, maxDepth, options, palette) {
    const { x, y, width, height, depth } = quad;

    // Base case: Stop recursion if max depth reached, safety limit hit, or node is too small
    // Uses imported state object
    if (depth >= maxDepth || state.recursionCount >= MAX_RECURSION_SAFETY || width < 2 || height < 2) {
         if (state.recursionCount >= MAX_RECURSION_SAFETY) console.warn('Max recursion safety limit hit!');
        return;
    }
    // Uses imported state object
    state.recursionCount++; // Increment count for processing this node

     // Subdivision probability: Influenced by complexity, density, and current depth
    const subdivideProb = 0.4 + (options.complexity / 10) * 0.3 + (options.density / 100) * 0.3 - (depth / maxDepth) * 0.3;
    // Uses Math.random() (potentially seeded via generateSVG)
    const shouldSubdivide = Math.random() < subdivideProb;

    if (shouldSubdivide) {
        // --- Subdivide Node ---
        const halfWidth = width / 2;
        const halfHeight = height / 2;
         // Add slight randomness to the division point (uses imported random)
         const midX = x + halfWidth + random(-halfWidth * 0.1, halfWidth * 0.1);
         const midY = y + halfHeight + random(-halfHeight * 0.1, halfHeight * 0.1);

         // Ensure midpoints stay within the parent quad boundaries roughly
         const clampedMidX = Math.max(x + halfWidth * 0.5, Math.min(x + halfWidth * 1.5, midX));
         const clampedMidY = Math.max(y + halfHeight * 0.5, Math.min(y + halfHeight * 1.5, midY));

        // Recursively call for the four child quadrants
        generateQuadtreeNode(parent, { x: x,           y: y,           width: clampedMidX - x,             height: clampedMidY - y,             depth: depth + 1 }, maxDepth, options, palette);
        generateQuadtreeNode(parent, { x: clampedMidX, y: y,           width: x + width - clampedMidX,     height: clampedMidY - y,             depth: depth + 1 }, maxDepth, options, palette);
        generateQuadtreeNode(parent, { x: x,           y: clampedMidY, width: clampedMidX - x,             height: y + height - clampedMidY,     depth: depth + 1 }, maxDepth, options, palette);
        generateQuadtreeNode(parent, { x: clampedMidX, y: clampedMidY, width: x + width - clampedMidX,     height: y + height - clampedMidY,     depth: depth + 1 }, maxDepth, options, palette);

        // Optionally draw dividing lines (uses imported createSVGElement)
        if (options.complexity > 5 && options.density > 40) {
             const lineOpacity = Math.max(0.05, 0.3 - depth * 0.05);
             const lineWeight = Math.max(0.1, options.strokeWeight * (0.8 - depth * 0.1));
             createSVGElement('line', { x1: clampedMidX, y1: y, x2: clampedMidX, y2: y + height, stroke: options.strokeColor, 'stroke-width': lineWeight, opacity: lineOpacity }, parent);
             createSVGElement('line', { x1: x, y1: clampedMidY, x2: x + width, y2: clampedMidY, stroke: options.strokeColor, 'stroke-width': lineWeight, opacity: lineOpacity }, parent);
             // Uses imported state object
             state.recursionCount += 2; // Count lines as elements (optional)
        }

    } else {
        // --- Draw Leaf Node ---
         // Uses imported getRandomFill
         const fill = getRandomFill(palette, options);
         const stroke = options.strokeColor;
         const sw = Math.max(0.1, options.strokeWeight * (1 - depth / maxDepth));
         const op = Math.max(0.1, options.opacity * (1 - depth / (maxDepth * 1.5)));
         const cx = x + width / 2;
         const cy = y + height / 2;
         const r = Math.min(width, height) / 2 * 0.8 * options.scale;

         // Uses imported randomInt
         const leafType = randomInt(0, 4);
         // Uses imported createSVGElement, random, randomChoice
         switch(leafType) {
             case 0: // Rectangle
                 createSVGElement('rect', { x: x + width*0.1, y: y + height*0.1, width: Math.max(1, width*0.8), height: Math.max(1, height*0.8), fill, stroke, 'stroke-width': sw, opacity: op}, parent);
                 break;
             case 1: // Circle
                 createSVGElement('circle', { cx, cy, r: Math.max(1, r), fill, stroke, 'stroke-width': sw, opacity: op}, parent);
                 break;
             case 2: // Ellipse
                  createSVGElement('ellipse', { cx, cy, rx: Math.max(1, r), ry: Math.max(1, r * random(0.5, 1)), fill, stroke, 'stroke-width': sw, opacity: op, transform: `rotate(${random(0,90)} ${cx} ${cy})` }, parent);
                 break;
             case 3: // Polygon
                 const points = [];
                 const sides = randomInt(3, 6);
                  for (let i = 0; i < sides; i++) {
                     const angle = (i / sides) * Math.PI * 2;
                     points.push(`${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`);
                 }
                 createSVGElement('polygon', { points: points.join(' '), fill, stroke, 'stroke-width': sw, opacity: op}, parent);
                 break;
             case 4: // Arc
                 const startAngle = random(0, Math.PI * 2);
                 const endAngle = startAngle + random(Math.PI / 2, Math.PI * 1.5);
                 const largeArc = (endAngle - startAngle) >= Math.PI ? 1 : 0;
                 const x1 = cx + Math.cos(startAngle) * r;
                 const y1 = cy + Math.sin(startAngle) * r;
                 const x2 = cx + Math.cos(endAngle) * r;
                 const y2 = cy + Math.sin(endAngle) * r;
                 createSVGElement('path', {
                     d: `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
                     fill: 'none',
                     stroke: randomChoice(palette) || stroke,
                     'stroke-width': sw * 1.5,
                     opacity: op
                 }, parent);
                 break;
         }
    }
}
