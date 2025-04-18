// public/js/modules/patterns/Padovan.js

// ----- MODULE IMPORTS -----
// Import necessary utilities
import { createSVGElement, randomChoice } from '../utils.js';
// Import state if needed
// import { state } from '../state.js';
// Import color utilities if needed
// import { getRandomFill } from '../colorUtils.js';
// Import random utils if needed
// import { random, randomInt } from '../utils.js';


/**
 * Generates an SVG pattern based on the Padovan sequence.
 * Visualizes as a spiral of connected line segments.
 * @param {SVGElement} parent - The parent SVG group element (<g>).
 * @param {object} options - Generation options.
 * @param {string[]} palette - Color palette.
 * @returns {object} Generation results.
 */
export function generatePadovanPattern(parent, options, palette) {
  console.log("Generating Padovan pattern...");
  // Destructure options
  const { viewportWidth: width, viewportHeight: height, complexity, density, scale, strokeWeight, opacity, strokeColor } = options;
  let elementCount = 0;

  // 1. Calculate Padovan Sequence
  // Determine number of terms based on complexity/density
  const numTerms = Math.max(10, Math.floor(complexity * 3 + density / 5) + 5);
  const sequence = [1, 1, 1]; // P(0), P(1), P(2)
  for (let n = 3; n < numTerms; n++) {
      // Formula: P(n) = P(n-2) + P(n-3)
      sequence[n] = sequence[n - 2] + sequence[n - 3];
      // Basic check for excessively large numbers
      if (sequence[n] > 1e6) { // Avoid potential performance issues with huge values
           console.warn("Padovan sequence value exceeded limit, stopping early.");
           break;
      }
  }
   if (sequence.length <= 3) {
       console.warn("Padovan sequence too short to draw.");
       return { elementCount: 0, sequence: 'Padovan (Too Short)' };
   }


  // 2. Visualize as Line Spiral
  const sizeScale = scale * 5; // Adjust this factor to control overall size of the spiral
  const angleIncrement = (2 * Math.PI) / 3; // Rotate 120 degrees (associated with triangle spiral)

  // Starting position (center) and angle
  let currentX = width / 2;
  let currentY = height / 2;
  let currentAngle = 0; // Start pointing right (0 radians)

  // Create a group for the spiral elements (uses imported createSVGElement)
  const spiralGroup = createSVGElement('g', {
      stroke: strokeColor, // Apply base stroke color to group
      'stroke-width': strokeWeight,
      opacity: opacity
  }, parent);


  // Loop through sequence terms (start from index 3 for drawing)
  for (let i = 3; i < sequence.length; i++) {
      // Length of the current line segment based on sequence value and scaling
      const segmentLength = Math.max(1, sequence[i] * sizeScale);

      // Calculate the end point of the current segment using trigonometry
      const nextX = currentX + segmentLength * Math.cos(currentAngle);
      const nextY = currentY + segmentLength * Math.sin(currentAngle);

      // Draw the line segment (uses imported createSVGElement and randomChoice)
      createSVGElement('line', {
          x1: currentX.toFixed(2),
          y1: currentY.toFixed(2),
          x2: nextX.toFixed(2),
          y2: nextY.toFixed(2),
          // Optional: Vary color per segment using imported randomChoice
          stroke: randomChoice(palette) || strokeColor,
          // Optional: Vary stroke width slightly? (Requires importing 'random' from utils)
          // 'stroke-width': strokeWeight * random(0.8, 1.2)
      }, spiralGroup); // Add line to the spiral group

      elementCount++;

      // Update current position to the end of the segment for the next iteration
      currentX = nextX;
      currentY = nextY;

      // Update the angle for the next segment rotation
      currentAngle += angleIncrement;
  }

  console.log(`Generated Padovan sequence with ${sequence.length} terms.`);
  // Return results, including sequence info
  return { elementCount, sequenceName: 'Padovan', terms: sequence.length };
}
