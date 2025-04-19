// public/js/modules/patterns/lines.js

// ----- MODULE IMPORTS -----
// Import necessary utilities
import { createSVGElement, randomChoice } from '../utils.js';
// Import color utilities for fill handling
import { getRandomFill } from '../colorUtils.js';
// Import random if needed for phase variation (optional)
// import { random } from '../utils.js';

/**
 * Generates a pattern of parallel wavy lines with variable spacing.
 * Base orientation/spacing set by lineSpacing, then rotated by globalAngle.
 * Spacing between lines increases/decreases based on lineSpacingRatio.
 * Direction of spacing change controlled by lineSpacingInvert.
 * Wave shape controlled by lineWaveAmplitude and lineWaveFrequency.
 * Fill determined by fillType option.
 * @param {SVGElement} parent - The parent SVG group element (<g>).
 * @param {object} options - Generation options object.
 * @param {string[]} palette - The array of hex color strings for the current palette.
 * @returns {object} An object containing generation results (e.g., elementCount).
 */
export function generateLinesPattern(parent, options, palette) {
    console.log("Generating Wavy Lines pattern with variable spacing...");
    // Destructure needed options
    const {
        viewportWidth: width, viewportHeight: height, lineSpacing, globalAngle,
        strokeColor, strokeWeight, opacity, fillType,
        lineWaveAmplitude, lineWaveFrequency,
        lineSpacingRatio, lineSpacingInvert // New spacing controls
    } = options;
    let elementCount = 0;

    // Ensure valid base inputs
    const baseSpacing = Math.max(1, lineSpacing); // Initial spacing
    const ratio = Math.max(0.1, lineSpacingRatio); // Prevent ratio of 0 or less
    const amplitude = lineWaveAmplitude || 0;
    const frequency = lineWaveFrequency || 1;

    console.log(` - Base Spacing: ${baseSpacing}, Ratio: ${ratio}, Invert: ${lineSpacingInvert}, Amplitude: ${amplitude}, Frequency: ${frequency}, Angle: ${globalAngle}`);

    // Calculate draw area slightly larger than viewport diagonal
    const diagonal = Math.sqrt(width * width + height * height);
    const drawWidth = diagonal * 1.2;
    // Estimate number of lines - This is trickier with variable spacing.
    // We might draw slightly too many or too few, but it's a starting point.
    // A better approach might be to loop until currentX exceeds the draw area.
    const estimatedAvgSpacing = baseSpacing * Math.pow(ratio, 5); // Rough estimate
    const numLines = Math.max(5, Math.ceil(drawWidth / Math.max(1, estimatedAvgSpacing)));

    // Create group and apply rotation
    const lineGroup = createSVGElement('g', {
        transform: `rotate(${globalAngle} ${width / 2} ${height / 2})`,
        stroke: strokeColor,
        'stroke-width': strokeWeight,
        opacity: opacity
        // Fill is set per path
    }, parent);

    // Define vertical extent for lines
    const lineLength = diagonal * 1.2;
    const startY = height / 2 - lineLength / 2;
    const endY = height / 2 + lineLength / 2;
    const pathSteps = 50;

    // Calculate starting X position (left edge of expanded draw area)
    const startDrawX = width / 2 - drawWidth / 2;
    let currentX = startDrawX; // Initialize cumulative X position

    // Loop to create each wavy line/path
    for (let i = 0; i < numLines; i++) {
        // The base X for the current line is the accumulated position
        const baseX = currentX;

        const pathPoints = [];
        const phaseShift = i * 0.5;

        // Calculate points along the wavy path
        for (let j = 0; j <= pathSteps; j++) {
            const currentY = startY + (j / pathSteps) * lineLength;
            const sineValue = Math.sin((currentY / height) * Math.PI * 2 * frequency + phaseShift);
            const xOffset = amplitude * sineValue;
            const pointX = baseX + xOffset;
            const pointY = currentY;
            pathPoints.push(`${pointX.toFixed(2)},${pointY.toFixed(2)}`);
        }

        // Create the path element if points were generated
        if (pathPoints.length > 1) {
            const d = `M ${pathPoints[0]} L ${pathPoints.slice(1).join(' L ')} Z`; // Close path
            const fillValue = (fillType === 'none') ? 'none' : getRandomFill(palette, options);

            createSVGElement('path', {
                d: d,
                stroke: randomChoice(palette) || strokeColor,
                fill: fillValue
            }, lineGroup);
            elementCount++;
        }

        // *** Calculate spacing for the NEXT line ***
        // Determine the index for ratio calculation based on invert flag
        // If inverted, lines further right (higher i) use lower power of ratio (closer spacing if ratio > 1)
        const ratioIndex = lineSpacingInvert ? (numLines - 1 - i) : i;
        // Calculate the spacing using geometric progression: base * ratio^index
        const currentGap = baseSpacing * Math.pow(ratio, ratioIndex);
        // Ensure a minimum gap size
        const actualGap = Math.max(1, currentGap);

        // Update currentX for the position of the *next* line
        currentX += actualGap;

        // Optional: Stop if we've drawn past the right edge of the expanded draw area
         if (currentX > startDrawX + drawWidth * 1.1) {
             console.log("Stopping line generation early (exceeded draw width).");
             break;
         }
    }

    console.log(`Generated ${elementCount} wavy lines with variable spacing.`);
    return {
        elementCount,
        pattern: 'Wavy Lines (Variable Spacing)',
        baseSpacing: baseSpacing,
        ratio: ratio,
        invert: lineSpacingInvert,
        amplitude: amplitude,
        frequency: frequency
    };
}
