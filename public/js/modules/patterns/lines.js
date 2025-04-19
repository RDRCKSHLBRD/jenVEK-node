// lines.js 


// public/js/modules/patterns/lines.js

// ----- MODULE IMPORTS -----
// Import necessary utilities
import { createSVGElement, randomChoice } from '../utils.js';
// Import state if needed
// import { state } from '../state.js';
// Import color utilities if needed
// import { getRandomFill } from '../colorUtils.js';


/**
 * Generates a pattern of parallel lines.
 * Lines are initially vertical but rotated by the globalAngle option.
 * Spacing is controlled by the lineSpacing option.
 * @param {SVGElement} parent - The parent SVG group element (<g>) passed from generator.js.
 * @param {object} options - Generation options object.
 * @param {string[]} palette - The array of hex color strings for the current palette.
 * @returns {object} An object containing generation results (e.g., elementCount).
 */
export function generateLinesPattern(parent, options, palette) {
    console.log("Generating Lines pattern...");
    // Destructure needed options for clarity
    const {
        viewportWidth: width, viewportHeight: height, lineSpacing, globalAngle,
        strokeColor, strokeWeight, opacity
    } = options;
    let elementCount = 0;

    // Ensure lineSpacing is at least 1 to avoid infinite loops/errors
    const spacing = Math.max(1, lineSpacing);

    // Calculate a distance slightly larger than the viewport diagonal
    // to ensure lines cover the area even after rotation.
    const diagonal = Math.sqrt(width * width + height * height);
    // Draw across an area slightly larger than the diagonal to ensure coverage
    const drawWidth = diagonal * 1.2;

    // Determine the number of lines needed based on spacing
    const numLines = Math.ceil(drawWidth / spacing);

    // Create a group for the lines. Apply rotation to this group.
    // Rotation origin is the center of the viewport (width/2, height/2).
    const lineGroup = createSVGElement('g', {
        // Apply the global rotation transform to the entire group of lines
        transform: `rotate(${globalAngle} ${width / 2} ${height / 2})`,
        // Apply default stroke styles to the group (can be overridden per line)
        stroke: strokeColor,
        'stroke-width': strokeWeight,
        opacity: opacity
    }, parent); // Append this group to the main layer group passed as 'parent'

    // Calculate coordinates for drawing vertical lines centered around the viewport middle
    const startX = width / 2 - drawWidth / 2; // Start drawing from left edge of the expanded draw area
    // Make lines longer than viewport height to ensure coverage after rotation
    const lineLength = diagonal * 1.2;
    const startY = height / 2 - lineLength / 2; // Top endpoint (extends above viewport)
    const endY = height / 2 + lineLength / 2; // Bottom endpoint (extends below viewport)

    // Loop to create each line
    for (let i = 0; i < numLines; i++) {
        // Calculate the x-position for the current vertical line
        const x = startX + i * spacing;

        // Create the line element (uses imported createSVGElement)
        createSVGElement('line', {
            x1: x.toFixed(2),
            y1: startY.toFixed(2),
            x2: x.toFixed(2),
            y2: endY.toFixed(2),
            // Optionally override stroke color per line using imported randomChoice
            stroke: randomChoice(palette) || strokeColor
            // Optional: override other properties like stroke-width per line if desired
            // 'stroke-width': strokeWeight * random(0.5, 1.5) // Requires importing 'random'
        }, lineGroup); // Add the line to the rotated group

        elementCount++;
    }

    console.log(`Generated ${elementCount} lines with spacing ${spacing}.`);
    // Return results including parameters used
    return { elementCount, pattern: 'Lines', spacing: spacing };
}
