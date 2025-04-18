// public/js/modules/patterns/recursive.js

// ----- MODULE IMPORTS -----
// Import shared state (needed for recursionCount)
import { state } from '../state.js';
// Import necessary utilities
import { createSVGElement, random, randomInt } from '../utils.js';
// Import color utilities
import { getRandomFill } from '../colorUtils.js';

// ----- CONSTANTS -----
// Define safety constant locally if only used here, or import if shared
const MAX_RECURSION_SAFETY = 10000;

// ----- PATTERN GENERATION FUNCTIONS -----

/**
 * Generates a recursive pattern starting with a single shape.
 * @param {SVGElement} parent - The parent SVG group element (<g>).
 * @param {object} options - Generation options.
 * @param {string[]} palette - Color palette.
 * @returns {object} Generation results.
 */
export function generateRecursivePattern(parent, options, palette) {
     const { viewportWidth: width, viewportHeight: height, complexity, maxRecursion, scale } = options;
     // Reset global recursion counter specifically for this pattern generation call
     // Accessing state directly here
     state.recursionCount = 0;

     // Initial size based on viewport and scale
     const initialSize = Math.min(width, height) * 0.4 * scale;
     // Center the initial shape with slight random offset
     const startX = width / 2 + random(-width * 0.1, width * 0.1);
     const startY = height / 2 + random(-height * 0.1, height * 0.1);

    // Define the initial shape data
    const initialShape = {
        type: Math.random() < 0.5 ? 'circle' : 'rect', // Randomly start with circle or rect
        x: startX,
        y: startY,
        size: initialSize, // Use 'size' for both circle radius and rect side length for simplicity
        depth: 0 // Initial depth is 0
    };

    // Start the recursive drawing process
    recursiveDraw(parent, initialShape, maxRecursion, options, palette);

    // Return results
    return {
        elementCount: state.recursionCount, // Total elements drawn (including recursive calls)
        // Report actual depth reached, capped by user setting or safety limit
        recursionDepthReached: Math.min(state.recursionCount > 0 ? maxRecursion : 0, maxRecursion, Math.ceil(Math.log2(state.recursionCount+1))), // Estimate depth based on count
        complexity: options.complexity
    };
}

/**
 * Helper function for recursive drawing. Draws a shape and calls itself for children.
 * NOTE: This function is internal to this module and does not need to be exported.
 * @param {SVGElement} parent - The parent SVG group element (<g>).
 * @param {object} shapeData - Data for the current shape { type, x, y, size, depth }.
 * @param {number} maxDepth - Maximum recursion depth allowed by options.
 * @param {object} options - Generation options.
 * @param {string[]} palette - Color palette.
 */
function recursiveDraw(parent, shapeData, maxDepth, options, palette) {
    // Base case: Stop recursion if max depth is reached, or safety limit hit
    // Accessing state directly here
    if (shapeData.depth >= maxDepth || state.recursionCount >= MAX_RECURSION_SAFETY) {
        if (state.recursionCount >= MAX_RECURSION_SAFETY) console.warn('Max recursion safety limit hit!');
        return;
    }
    // Accessing state directly here
    state.recursionCount++; // Increment count for this element being drawn

    const { type, x, y, size, depth } = shapeData;
    const fill = getRandomFill(palette, options); // Get fill for this shape
    const stroke = options.strokeColor; // Stroke color from options

    // Adjust stroke weight and opacity based on depth (decrease for deeper elements)
    const strokeWidth = Math.max(0.1, options.strokeWeight * (1 - depth / (maxDepth * 1.5)));
    const opacity = Math.max(0.1, options.opacity * (1 - depth / (maxDepth * 2)));

    // Draw the current shape (circle or rectangle)
    if (type === 'circle') {
        createSVGElement('circle', {
            cx: x, cy: y, r: Math.max(1, size / 2), // Ensure radius is positive
            fill, stroke, 'stroke-width': strokeWidth, opacity
        }, parent);
    } else { // rect
        createSVGElement('rect', {
             x: x - size / 2, y: y - size / 2, // Position based on center
             width: Math.max(1, size), height: Math.max(1, size), // Ensure positive dimensions
             fill, stroke, 'stroke-width': strokeWidth, opacity,
             transform: `rotate(${random(-10, 10)} ${x} ${y})` // Apply slight random rotation
        }, parent);
    }

    // --- Recursive Step ---
    // Calculate properties for child shapes
    const childDepth = depth + 1;
    // Branching factor: Number of children depends on complexity
    const numChildren = randomInt(2, Math.max(2, Math.floor(options.complexity / 1.5))); // Fewer branches than random pattern
    // Scale factor: Children are smaller, factor decreases with depth and density influences it
    const scaleFactor = Math.max(0.1, (0.6 - depth * 0.05) * (options.density / 150 + 0.4)); // Adjusted scaling
    const childSize = size * scaleFactor;

    // Stop recursion if children become too small
    if (childSize < 1) return;

    // Create and draw children recursively
    for (let i = 0; i < numChildren; i++) {
        // Position children relative to the parent
        const angle = (i / numChildren) * Math.PI * 2 + random(-0.3, 0.3); // Angle with jitter
        const distance = size * 0.6 * random(0.7, 1.3); // Distance from parent center
        const childX = x + Math.cos(angle) * distance;
        const childY = y + Math.sin(angle) * distance;

        // Randomly choose child shape type, possibly influenced by parent type
        // 60% chance to be same type as parent, 40% chance to switch
        const childType = Math.random() < 0.6 ? type : (type === 'circle' ? 'rect' : 'circle');

        // Recursive call for the child shape
        recursiveDraw(parent, {
            type: childType,
            x: childX,
            y: childY,
            size: childSize,
            depth: childDepth
        }, maxDepth, options, palette);
    }
}

