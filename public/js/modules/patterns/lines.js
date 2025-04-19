// public/js/modules/patterns/lines.js

// ----- MODULE IMPORTS -----
// Import necessary utilities
import { createSVGElement, randomChoice } from '../utils.js';
// Import color utilities for fill handling
import { getRandomFill } from '../colorUtils.js';
// Import random if needed for phase variation (optional)
// import { random } from '../utils.js';

/**
 * Generates a pattern of parallel wavy lines.
 * Base orientation/spacing set by lineSpacing, then rotated by globalAngle.
 * Wave shape controlled by lineWaveAmplitude and lineWaveFrequency.
 * Fill determined by fillType option.
 * @param {SVGElement} parent - The parent SVG group element (<g>).
 * @param {object} options - Generation options object.
 * @param {string[]} palette - The array of hex color strings for the current palette.
 * @returns {object} An object containing generation results (e.g., elementCount).
 */
export function generateLinesPattern(parent, options, palette) {
    console.log("Generating Wavy Lines pattern...");
    // Destructure needed options
    const {
        viewportWidth: width, viewportHeight: height, lineSpacing, globalAngle,
        strokeColor, strokeWeight, opacity, fillType, // Added fillType
        lineWaveAmplitude, lineWaveFrequency
    } = options;
    let elementCount = 0;

    // Ensure valid inputs
    const spacing = Math.max(1, lineSpacing);
    const amplitude = lineWaveAmplitude || 0;
    const frequency = lineWaveFrequency || 1;

    console.log(` - Spacing: ${spacing}, Amplitude: ${amplitude}, Frequency: ${frequency}, Angle: ${globalAngle}, Fill: ${fillType}`);

    // Calculate draw area slightly larger than viewport diagonal
    const diagonal = Math.sqrt(width * width + height * height);
    const drawWidth = diagonal * 1.2;
    const numLines = Math.max(1, Math.ceil(drawWidth / spacing));

    // Create a group for the lines and apply global rotation
    const lineGroup = createSVGElement('g', {
        transform: `rotate(${globalAngle} ${width / 2} ${height / 2})`,
        // Set default styles for the group (can be overridden per path)
        // Remove fill: 'none' here if paths might be filled
        stroke: strokeColor,
        'stroke-width': strokeWeight,
        opacity: opacity
    }, parent);

    // Define vertical extent for lines
    const lineLength = diagonal * 1.2;
    const startY = height / 2 - lineLength / 2;
    const endY = height / 2 + lineLength / 2;
    const pathSteps = 50; // Segments per path

    // Calculate starting X position
    const startX = width / 2 - drawWidth / 2;

    // Loop to create each wavy line/path
    for (let i = 0; i < numLines; i++) {
        const baseX = startX + i * spacing;
        const pathPoints = [];
        const phaseShift = i * 0.5;

        // Calculate points along the wavy path
        for (let j = 0; j <= pathSteps; j++) {
            const currentY = startY + (j / pathSteps) * lineLength;
            const sineValue = Math.sin(
                (currentY / height) * Math.PI * 2 * frequency + phaseShift
            );
            const xOffset = amplitude * sineValue;
            const pointX = baseX + xOffset;
            const pointY = currentY;
            pathPoints.push(`${pointX.toFixed(2)},${pointY.toFixed(2)}`);
        }

        // Create the path element if points were generated
        if (pathPoints.length > 1) {
            // Construct the 'd' attribute and add 'Z' to close the path
            const d = `M ${pathPoints[0]} L ${pathPoints.slice(1).join(' L ')} Z`;

            // *** Determine fill based on options ***
            // Uses imported getRandomFill
            const fillValue = (fillType === 'none') ? 'none' : getRandomFill(palette, options);

            // Create the <path> element
            createSVGElement('path', {
                d: d,
                stroke: randomChoice(palette) || strokeColor, // Vary color per line
                fill: fillValue // Apply the determined fill
                // Inherits stroke-width and opacity from the group
            }, lineGroup);
            elementCount++;
        }
    }

    console.log(`Generated ${elementCount} wavy lines.`);
    return {
        elementCount,
        pattern: 'Wavy Lines',
        spacing: spacing,
        amplitude: amplitude,
        frequency: frequency
    };
}
