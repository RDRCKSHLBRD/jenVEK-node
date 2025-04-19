// public/js/modules/patterns/lines.js

// ----- MODULE IMPORTS -----
// Import necessary utilities
import { createSVGElement, randomChoice, pointsToPathString } from '../utils.js'; // Added pointsToPathString
// Import color utilities for fill handling
import { getRandomFill } from '../colorUtils.js';
// Import random if needed for phase variation (optional)
// import { random } from '../utils.js';

/**
 * Generates a pattern of parallel wavy lines with variable spacing.
 * Can now apply smoothing between calculated points.
 * @param {SVGElement} parent - The parent SVG group element (<g>).
 * @param {object} options - Generation options object, including curveSmoothing, splineTension.
 * @param {string[]} palette - The array of hex color strings for the current palette.
 * @returns {object} An object containing generation results (e.g., elementCount).
 */
export function generateLinesPattern(parent, options, palette) {
    // Destructure needed options, including smoothing options
    const {
        viewportWidth: width, viewportHeight: height, lineSpacing, globalAngle,
        strokeColor, strokeWeight, opacity, fillType,
        lineWaveAmplitude, lineWaveFrequency,
        lineSpacingRatio, lineSpacingInvert,
        curveSmoothing, splineTension // Get smoothing options
    } = options;
    let elementCount = 0;

    console.log(`Generating Wavy Lines pattern (Smoothing: ${curveSmoothing})...`);

    // Ensure valid base inputs
    const baseSpacing = Math.max(1, lineSpacing);
    const ratio = Math.max(0.1, lineSpacingRatio);
    const amplitude = lineWaveAmplitude || 0;
    const frequency = lineWaveFrequency || 1;

    console.log(` - Base Spacing: ${baseSpacing}, Ratio: ${ratio}, Invert: ${lineSpacingInvert}, Amplitude: ${amplitude}, Frequency: ${frequency}, Angle: ${globalAngle}`);

    // Calculate draw area slightly larger than viewport diagonal
    const diagonal = Math.sqrt(width * width + height * height);
    const drawWidth = diagonal * 1.2;
    const estimatedAvgSpacing = baseSpacing * Math.pow(ratio, 5);
    const numLines = Math.max(5, Math.ceil(drawWidth / Math.max(1, estimatedAvgSpacing)));

    // Create group and apply rotation
    const lineGroup = createSVGElement('g', {
        transform: `rotate(${globalAngle} ${width / 2} ${height / 2})`,
        // Stroke/opacity applied per path now for potentially different colors/styles
    }, parent);

    // Define vertical extent for lines
    const lineLength = diagonal * 1.2;
    const startY = height / 2 - lineLength / 2;
    const endY = height / 2 + lineLength / 2;
    const pathSteps = 50; // Number of points calculated along the wave

    // Calculate starting X position
    const startDrawX = width / 2 - drawWidth / 2;
    let currentX = startDrawX;

    // Loop to create each wavy line/path
    for (let i = 0; i < numLines; i++) {
        const baseX = currentX;
        // Store points as objects {x, y}
        const pathPoints = [];
        const phaseShift = i * 0.5; // Simple phase shift based on line index

        // Calculate points along the wavy path
        for (let j = 0; j <= pathSteps; j++) {
            const currentY = startY + (j / pathSteps) * lineLength;
            const sineValue = Math.sin((currentY / height) * Math.PI * 2 * frequency + phaseShift);
            const xOffset = amplitude * sineValue;
            const pointX = baseX + xOffset;
            const pointY = currentY;
            // Store point object
            pathPoints.push({ x: pointX, y: pointY });
        }

        // Create the path element if points were generated
        if (pathPoints.length > 1) {
            // *** USE THE NEW UTILITY FUNCTION TO GET THE PATH STRING ***
            // Pass true for closePath because original code used 'Z'
            const d = pointsToPathString(pathPoints, curveSmoothing, { splineTension }, true);

            const fillValue = (fillType === 'none') ? 'none' : getRandomFill(palette, options);
            const pathStrokeColor = randomChoice(palette) || strokeColor; // Vary stroke color

            createSVGElement('path', {
                d: d, // Use the generated path string (straight or smoothed)
                stroke: pathStrokeColor,
                'stroke-width': strokeWeight,
                fill: fillValue,
                opacity: opacity
            }, lineGroup);
            elementCount++;
        }

        // Calculate spacing for the NEXT line
        const ratioIndex = lineSpacingInvert ? (numLines - 1 - i) : i;
        const currentGap = baseSpacing * Math.pow(ratio, ratioIndex);
        const actualGap = Math.max(1, currentGap);
        currentX += actualGap;

        // Optional stop condition
         if (currentX > startDrawX + drawWidth * 1.1) {
             console.log("Stopping line generation early (exceeded draw width).");
             break;
         }
    }

    console.log(`Generated ${elementCount} lines with variable spacing.`);
    return {
        elementCount,
        pattern: 'Wavy Lines (Variable Spacing)',
        smoothing: curveSmoothing, // Include smoothing type in results
        baseSpacing: baseSpacing,
        ratio: ratio,
        invert: lineSpacingInvert,
        amplitude: amplitude,
        frequency: frequency
    };
}
