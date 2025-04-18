// public/js/modules/patterns/trigWave.js

// ----- MODULE IMPORTS -----
// Import necessary utilities
import { createSVGElement, random, randomChoice } from '../utils.js';
// Import state if needed
// import { state } from '../state.js';
// Import color utilities if needed
// import { getRandomFill } from '../colorUtils.js';

/**
 * Generates patterns based on trigonometric wave functions (sin, cos, tan).
 * @param {SVGElement} parent - The parent SVG group element (<g>).
 * @param {object} options - Generation options.
 * @param {string[]} palette - Color palette.
 * @returns {object} Generation results.
 */
export function generateTrigPattern(parent, options, palette) {
     // Destructure options
     const { viewportWidth: width, viewportHeight: height, complexity, density, repetition, scale, strokeWeight, opacity, strokeColor } = options;
     let elementCount = 0;

     // Number of waves based on complexity and repetition
     const numWaves = Math.max(1, Math.floor(complexity * repetition)); // Ensure at least one wave
     // Number of points per wave based on density
     const pointsPerWave = Math.max(20, Math.floor(100 * (density / 100)) + 10);

     console.log(`Generating ${numWaves} trig waves...`);

    // Generate each wave
    for (let i = 0; i < numWaves; i++) {
        const pathPoints = []; // Array to store points for the path 'd' attribute

        // Random parameters for variety (uses imported random)
        const amplitude = random(height * 0.05, height * 0.4) * scale;
        const frequency = random(0.5, complexity / 2 + 0.5);
        const phase = random(0, Math.PI * 2);
        const yOffset = random(amplitude, height - amplitude);
        // Uses imported randomChoice
        const funcType = randomChoice(['sin', 'cos', 'tan']);

        // Calculate points along the wave
        for (let j = 0; j <= pointsPerWave; j++) {
            const x = (j / pointsPerWave) * width;
            let y = yOffset;

            // Calculate Y based on the chosen trig function
            switch(funcType) {
                case 'sin':
                    y += Math.sin( (j / pointsPerWave) * Math.PI * 2 * frequency + phase) * amplitude;
                    break;
                 case 'cos':
                     y += Math.cos( (j / pointsPerWave) * Math.PI * 2 * frequency + phase) * amplitude;
                     break;
                 case 'tan':
                      let angle = (j / pointsPerWave) * Math.PI * frequency + phase;
                      // Basic handling near asymptotes
                      if (Math.abs(Math.cos(angle)) < 0.01) {
                          // Could potentially break the path here and start a new one,
                          // but for simplicity, we just clamp the value.
                      }
                      let tanVal = Math.tan(angle);
                      // Clamp extreme values
                      tanVal = Math.max(-5, Math.min(5, tanVal));
                      y += tanVal * amplitude * 0.2; // Scale down tan amplitude
                      break;
            }

             // Clamp y to viewport bounds
            y = Math.max(0, Math.min(height, y));
            pathPoints.push(`${x.toFixed(2)},${y.toFixed(2)}`); // Use toFixed for cleaner SVG
        }

         // Draw the path if enough points were generated (uses imported createSVGElement)
         if (pathPoints.length > 1) {
             createSVGElement('path', {
                 d: `M ${pathPoints[0]} L ${pathPoints.slice(1).join(' L ')}`,
                 fill: 'none',
                 // Uses imported randomChoice
                 stroke: randomChoice(palette) || strokeColor,
                 // Uses imported random
                 'stroke-width': Math.max(0.5, strokeWeight * random(0.5, 1.5)),
                 opacity: opacity * random(0.7, 1)
             }, parent);
             elementCount++;
         }
    }
    // Return results
    return { elementCount, waves: numWaves, pointsPerWave: pointsPerWave };
}
