// public/js/modules/patterns/lines.js

// ----- MODULE IMPORTS -----
// Import necessary utilities
import { createSVGElement, randomChoice, pointsToPathString } from '../utils.js';
// Import color utilities for fill handling
// import { getRandomFill } from '../colorUtils.js'; // No longer needed for fill here
// Import random if needed for phase variation (optional)
// import { random } from '../utils.js';

/**
 * Generates a pattern of parallel wavy lines with variable spacing and optional parabolic arc.
 * Can apply smoothing between calculated points.
 * Can use captured coordinates (capturedX, capturedY) to influence line shape.
 * @param {SVGElement} parent - The parent SVG group element (<g>).
 * @param {object} options - Generation options object.
 * @param {string[]} palette - The array of hex color strings for the current palette.
 * @returns {object} An object containing generation results (e.g., elementCount).
 */
export function generateLinesPattern(parent, options, palette) {
    // Destructure needed options, including smoothing, captured coords, and the new arc amount
    const {
        viewportWidth: width, viewportHeight: height, lineSpacing, globalAngle,
        strokeColor, strokeWeight, opacity, // Removed fillType as lines shouldn't be filled
        lineWaveAmplitude, lineWaveFrequency, lineArcAmount,
        lineSpacingRatio, lineSpacingInvert,
        curveSmoothing, splineTension, // Smoothing options
        capturedX, capturedY // Captured coordinate options
        // capturedV is available in options but not used in this version
    } = options;
    let elementCount = 0;

    console.log(`Generating Wavy Lines pattern (Smoothing: ${curveSmoothing}, Captured Pt: ${capturedX !== null ? 'Yes' : 'No'}, Arc: ${lineArcAmount})...`);

    // Ensure valid base inputs
    const baseSpacing = Math.max(1, lineSpacing);
    const ratio = Math.max(0.1, lineSpacingRatio);
    const amplitude = lineWaveAmplitude || 0;
    const frequency = lineWaveFrequency || 1;
    const arcAmount = lineArcAmount || 0; // Get arc amount, default to 0

    console.log(` - Base Spacing: ${baseSpacing}, Ratio: ${ratio}, Invert: ${lineSpacingInvert}, Amplitude: ${amplitude}, Frequency: ${frequency}, Arc: ${arcAmount}, Angle: ${globalAngle}`);
    if (capturedX !== null) {
        console.log(` - Captured Point: (${capturedX.toFixed(0)}, ${capturedY.toFixed(0)})`);
    }

    // Calculate draw area slightly larger than viewport diagonal
    const diagonal = Math.sqrt(width * width + height * height);
    const drawWidth = diagonal * 1.2;
    const estimatedAvgSpacing = baseSpacing * Math.pow(ratio, 5); // Estimate average spacing for rough line count
    const numLines = Math.max(5, Math.ceil(drawWidth / Math.max(1, estimatedAvgSpacing)));

    // Create group and apply rotation
    const lineGroup = createSVGElement('g', {
        transform: `rotate(${globalAngle} ${width / 2} ${height / 2})`,
    }, parent);

    // Define vertical extent for lines
    const lineLength = diagonal * 1.2;
    const startY = height / 2 - lineLength / 2;
    const endY = height / 2 + lineLength / 2;
    const pathSteps = 50; // Number of points calculated along the wave/arc

    // Calculate starting X position
    const startDrawX = width / 2 - drawWidth / 2;
    let currentX = startDrawX;

    // Parameters for the attractor effect (if captured point is used)
    const maxInfluenceDistance = width * 0.3; // Max distance point has effect
    const maxPullStrength = 80; // Max pixels to displace the line
    const falloffRate = 0.02; // How quickly the effect diminishes with distance

    // Loop to create each wavy/arced line/path
    for (let i = 0; i < numLines; i++) {
        const baseX = currentX;
        const pathPoints = [];
        const phaseShift = i * 0.5; // Phase shift for wave variety

        // Calculate points along the path
        for (let j = 0; j <= pathSteps; j++) {
            const normalizedProgress = j / pathSteps; // Progress along the line (0 to 1)
            const currentY = startY + normalizedProgress * lineLength;

            // 1. Calculate base waviness offset (if amplitude > 0)
            let waveOffsetX = 0;
            if (amplitude !== 0) {
                 const sineValue = Math.sin((currentY / height) * Math.PI * 2 * frequency + phaseShift);
                 waveOffsetX = amplitude * sineValue;
            }
            const initialPointX = baseX + waveOffsetX; // X position based only on wave

            // 2. Calculate influence from captured point (if it exists)
            let captureOffsetX = 0;
            if (capturedX !== null && capturedY !== null) {
                const dx = capturedX - initialPointX; // Distance to capture point AFTER wave offset
                const dy = capturedY - currentY;
                const distSq = dx * dx + dy * dy;

                // Apply effect only within range and avoid division by zero
                if (distSq > 1 && distSq < maxInfluenceDistance * maxInfluenceDistance) {
                    const distance = Math.sqrt(distSq);
                    // Calculate influence (stronger when closer)
                    const influence = maxPullStrength / (1 + distance * falloffRate);
                    // Calculate offset towards capturedX
                    captureOffsetX = (dx / distance) * influence;
                }
            }

            // 3. Calculate parabolic arc offset (if arcAmount !== 0)
            let arcOffsetX = 0;
            if (arcAmount !== 0) {
                 // Parabolic function: 4 * amount * x * (1 - x) -> 0 at ends, peak=amount at middle
                 // *** TEST: Negate the arc amount to see if it reverses the visual curve ***
                 arcOffsetX = -4 * arcAmount * normalizedProgress * (1 - normalizedProgress);
            }

            // 4. Combine all offsets and store final point
            const finalPointX = initialPointX + captureOffsetX + arcOffsetX;
            pathPoints.push({ x: finalPointX, y: currentY });
        }

        // Create the path element if points were generated
        if (pathPoints.length > 1) {
            // Use the utility function to get the path string (smoothed or straight)
            const d = pointsToPathString(pathPoints, curveSmoothing, { splineTension }, false); // Don't close path for lines

            const pathStrokeColor = randomChoice(palette) || strokeColor;

            createSVGElement('path', {
                d: d,
                stroke: pathStrokeColor,
                'stroke-width': strokeWeight,
                fill: 'none', // *** Ensure fill is none ***
                opacity: opacity
            }, lineGroup);
            elementCount++;
        }

        // Calculate spacing for the NEXT line
        const ratioIndex = lineSpacingInvert ? (numLines - 1 - i) : i;
        const currentGap = baseSpacing * Math.pow(ratio, ratioIndex);
        const actualGap = Math.max(1, currentGap);
        currentX += actualGap;

        // Optional stop condition to prevent infinite loops if spacing becomes too small
         if (currentX > startDrawX + drawWidth * 1.1 || actualGap < 0.01) {
             console.log(`Stopping line generation early (exceeded draw width or gap too small: ${actualGap.toFixed(3)}).`);
             break;
         }
    }

    console.log(`Generated ${elementCount} lines.`);
    // Return metadata including the new arc amount
    return {
        elementCount,
        pattern: 'Wavy/Arced Lines (Variable Spacing)',
        smoothing: curveSmoothing,
        baseSpacing: baseSpacing,
        ratio: ratio,
        invert: lineSpacingInvert,
        amplitude: amplitude,
        frequency: frequency,
        arcAmount: arcAmount, // Added arcAmount to results
        usedCapture: capturedX !== null // Indicate if capture point was used
    };
}