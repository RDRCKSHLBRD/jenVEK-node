// public/js/modules/patterns/trigWave.js

// ----- MODULE IMPORTS -----
// Import necessary utilities
import { createSVGElement, random, randomChoice, pointsToPathString } from '../utils.js'; // Added pointsToPathString
// Import state if needed
// import { state } from '../state.js';
// Import color utilities if needed
// import { getRandomFill } from '../colorUtils.js';

/**
 * Generates patterns based on trigonometric wave functions (sin, cos, tan).
 * Uses the 'curveSmoothing' option to draw straight or smoothed lines.
 * @param {SVGElement} parent - The parent SVG group element (<g>).
 * @param {object} options - Generation options, including curveSmoothing.
 * @param {string[]} palette - Color palette.
 * @returns {object} Generation results.
 */
export function generateTrigPattern(parent, options, palette) {
     // Destructure options
     const {
         viewportWidth: width, viewportHeight: height, complexity, density,
         repetition, scale, strokeWeight, opacity, strokeColor,
         curveSmoothing, splineTension // Get smoothing options
        } = options;
     let elementCount = 0;

     // Number of waves based on complexity and repetition
     const numWaves = Math.max(1, Math.floor(complexity * repetition));
     // Number of points per wave based on density
     const pointsPerWave = Math.max(20, Math.floor(100 * (density / 100)) + 10);

     console.log(`Generating ${numWaves} trig waves (Smoothing: ${curveSmoothing})...`);

    // Generate each wave
    for (let i = 0; i < numWaves; i++) {
        // Store points as objects {x, y}
        const pathPoints = [];

        // Random parameters for variety
        const amplitude = random(height * 0.05, height * 0.4) * scale;
        const frequency = random(0.5, complexity / 2 + 0.5);
        const phase = random(0, Math.PI * 2);
        const yOffset = random(amplitude, height - amplitude);
        const funcType = randomChoice(['sin', 'cos', 'tan']);

        // Calculate points along the wave
        for (let j = 0; j <= pointsPerWave; j++) {
            const x = (j / pointsPerWave) * width;
            let y = yOffset;

            switch(funcType) {
                case 'sin':
                    y += Math.sin( (j / pointsPerWave) * Math.PI * 2 * frequency + phase) * amplitude;
                    break;
                 case 'cos':
                     y += Math.cos( (j / pointsPerWave) * Math.PI * 2 * frequency + phase) * amplitude;
                     break;
                 case 'tan':
                      let angle = (j / pointsPerWave) * Math.PI * frequency + phase;
                      if (Math.abs(Math.cos(angle)) < 0.01) { /* Handle asymptotes if needed */ }
                      let tanVal = Math.tan(angle);
                      tanVal = Math.max(-5, Math.min(5, tanVal)); // Clamp
                      y += tanVal * amplitude * 0.2;
                      break;
            }
            // Clamp y to viewport bounds
            y = Math.max(0, Math.min(height, y));
            // Store point as an object
            pathPoints.push({ x: x, y: y });
        }

         // Draw the path if enough points were generated
         if (pathPoints.length > 1) {
             // *** USE THE NEW UTILITY FUNCTION ***
             const d = pointsToPathString(pathPoints, curveSmoothing, { splineTension }); // Pass options

             createSVGElement('path', {
                 d: d, // Use the generated path string
                 fill: 'none',
                 stroke: randomChoice(palette) || strokeColor,
                 'stroke-width': Math.max(0.5, strokeWeight * random(0.5, 1.5)),
                 opacity: opacity * random(0.7, 1)
             }, parent);
             elementCount++;
         }
    }
    // Return results
    return { elementCount, waves: numWaves, pointsPerWave: pointsPerWave, smoothing: curveSmoothing };
}
