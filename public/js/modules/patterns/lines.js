// public/js/modules/patterns/lines.js

// ----- MODULE IMPORTS -----
// Import necessary utilities
import { createSVGElement, randomChoice } from '../utils.js';
// Import random if needed for phase variation (optional)
// import { random } from '../utils.js';

/**
 * Generates a pattern of parallel wavy lines.
 * Base orientation/spacing set by lineSpacing, then rotated by globalAngle.
 * Wave shape controlled by lineWaveAmplitude and lineWaveFrequency.
 * @param {SVGElement} parent - The parent SVG group element (<g>).
 * @param {object} options - Generation options object.
 * @param {string[]} palette - The array of hex color strings for the current palette.
 * @returns {object} An object containing generation results (e.g., elementCount).
 */
export function generateLinesPattern(parent, options, palette) {
    console.log("Generating Wavy Lines pattern...");
    // Destructure needed options for clarity
    const {
        viewportWidth: width, viewportHeight: height, lineSpacing, globalAngle,
        strokeColor, strokeWeight, opacity,
        lineWaveAmplitude, lineWaveFrequency // Use the wave controls
    } = options;
    let elementCount = 0;

    // Ensure lineSpacing is at least 1
    const spacing = Math.max(1, lineSpacing);
    // Ensure amplitude and frequency have values (frequency shouldn't be 0)
    const amplitude = lineWaveAmplitude || 0; // Default amplitude to 0 if not provided
    const frequency = lineWaveFrequency || 1; // Default frequency to 1 if not provided

    // Calculate draw area slightly larger than viewport diagonal
    const diagonal = Math.sqrt(width * width + height * height);
    const drawWidth = diagonal * 1.2;
    const numLines = Math.max(1, Math.ceil(drawWidth / spacing));

    // Create a group for the lines. Apply rotation to this group.
    const lineGroup = createSVGElement('g', {
        transform: `rotate(${globalAngle} ${width / 2} ${height / 2})`,
        // Set fill to none for the group, paths will only have stroke
        fill: 'none',
        // Apply default stroke styles (can be overridden per line)
        stroke: strokeColor,
        'stroke-width': strokeWeight,
        opacity: opacity
    }, parent);

    // Define vertical extent for lines
    const lineLength = diagonal * 1.2;
    const startY = height / 2 - lineLength / 2;
    const endY = height / 2 + lineLength / 2;
    // Number of segments used to approximate the wavy line path
    const pathSteps = 50; // Increase for smoother curves, decrease for performance

    // Calculate starting X position for the block of lines
    const startX = width / 2 - drawWidth / 2;

    // Loop to create each wavy line/path
    for (let i = 0; i < numLines; i++) {
        // Base horizontal position for this line
        const baseX = startX + i * spacing;
        const pathPoints = []; // Array to hold points for this path's 'd' attribute

        // Optional: Add a phase shift per line for more variation
        // This makes adjacent lines wiggle out of sync
        const phaseShift = i * 0.5; // Adjust multiplier for different effects

        // Calculate points along the wavy path
        for (let j = 0; j <= pathSteps; j++) {
            // Calculate the Y position for this step along the line's length
            const currentY = startY + (j / pathSteps) * lineLength;

            // Calculate the horizontal offset using a sine wave
            // (currentY / height) normalizes y position relative to viewport height
            // frequency controls how many waves appear vertically
            // amplitude controls the maximum horizontal deviation
            const xOffset = amplitude * Math.sin(
                (currentY / height) * Math.PI * 2 * frequency + phaseShift
            );

            // Final point coordinates for the path segment
            const pointX = baseX + xOffset;
            const pointY = currentY;
            pathPoints.push(`${pointX.toFixed(2)},${pointY.toFixed(2)}`);
        }

        // Create the path element if points were generated
        if (pathPoints.length > 1) {
            // Construct the 'd' attribute: M = move to first point, L = line to subsequent points
            const d = `M ${pathPoints[0]} L ${pathPoints.slice(1).join(' L ')}`;

            // Create the <path> element instead of <line>
            createSVGElement('path', {
                d: d,
                stroke: randomChoice(palette) || strokeColor // Vary color per line
                // Inherits stroke-width and opacity from the group
            }, lineGroup); // Add the path to the rotated group
            elementCount++;
        }
    }

    console.log(`Generated ${elementCount} wavy lines.`);
    // Return results including parameters used
    return {
        elementCount,
        pattern: 'Wavy Lines',
        spacing: spacing,
        amplitude: amplitude,
        frequency: frequency
    };
}
