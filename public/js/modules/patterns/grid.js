// public/js/modules/patterns/grid.js

// ----- MODULE IMPORTS -----
// Import necessary utilities from ../utils.js
import { createSVGElement, random, randomInt, randomChoice } from '../utils.js';
// Import color utilities from ../colorUtils.js
import { getRandomFill } from '../colorUtils.js';
// Import state if needed (grid doesn't seem to use it directly, but good practice if unsure)
// import { state } from '../state.js';

/**
 * Generates a pattern by placing shapes within a grid structure.
 * @param {SVGElement} parent - The parent SVG group element (<g>).
 * @param {object} options - Generation options.
 * @param {string[]} palette - Color palette.
 * @returns {object} Generation results.
 */
export function generateGridPattern(parent, options, palette) {
     // Destructure options for easier access
     const { viewportWidth: width, viewportHeight: height, complexity, density, repetition, scale, strokeWeight, opacity, strokeColor } = options;
     let elementCount = 0;

     // Grid size influenced by complexity and repetition
     const cellsPerSide = Math.max(2, Math.floor(complexity * 1.5 + repetition));
     const cellWidth = width / cellsPerSide;
     const cellHeight = height / cellsPerSide;
     // Density threshold (probability to skip a cell)
     const densityThreshold = 1 - (density / 100);

     // Iterate through grid cells
     for (let row = 0; row < cellsPerSide; row++) {
         for (let col = 0; col < cellsPerSide; col++) {
             // Skip drawing in this cell based on density threshold
             // Uses Math.random() which might be seeded by the main generator function
             if (Math.random() < densityThreshold) continue;

             const cx = col * cellWidth + cellWidth / 2; // Center X of the cell
             const cy = row * cellHeight + cellHeight / 2; // Center Y of the cell
             // Copy options for potential modification within cell (currently unused but good practice)
             const cellOptions = { ...options };

             // Choose what type of content to draw in the cell using imported randomInt
             const cellContentType = randomInt(0, 5);
             // Get fill style using imported getRandomFill
             const fill = getRandomFill(palette, cellOptions);
             const stroke = strokeColor;
             const sw = strokeWeight;
             const op = opacity;
             // Calculate base size for element within the cell, scaled by options, using imported random
             const elementScale = Math.min(cellWidth, cellHeight) * 0.4 * scale * random(0.7, 1.1);

             // Draw the selected content type using imported createSVGElement
             switch (cellContentType) {
                case 0: // Circle
                    createSVGElement('circle', { cx, cy, r: Math.max(1, elementScale), fill, stroke, 'stroke-width': sw, opacity: op }, parent);
                    break;
                case 1: // Rectangle (rotated)
                    const w = elementScale * 2 * random(0.8, 1.2);
                    const h = elementScale * 2 * random(0.8, 1.2);
                    createSVGElement('rect', { x: cx - w/2, y: cy - h/2, width: Math.max(1, w), height: Math.max(1, h), fill, stroke, 'stroke-width': sw, opacity: op, transform: `rotate(${random(-20, 20)} ${cx} ${cy})` }, parent);
                    break;
                 case 2: // Line segment
                     const angle = random(0, Math.PI * 2);
                     const len = elementScale * 2;
                     createSVGElement('line', {
                         x1: cx - Math.cos(angle) * len / 2, y1: cy - Math.sin(angle) * len / 2,
                         x2: cx + Math.cos(angle) * len / 2, y2: cy + Math.sin(angle) * len / 2,
                         // Use imported randomChoice here
                         stroke: randomChoice(palette) || stroke,
                         'stroke-width': sw * random(1, 3),
                         opacity: op
                     }, parent);
                    break;
                 case 3: // Polygon
                    const points = [];
                    // Use imported randomInt here
                    const vertices = randomInt(3, 7);
                    for (let i = 0; i < vertices; i++) {
                        const a = (i / vertices) * Math.PI * 2;
                        points.push(`${cx + Math.cos(a) * elementScale},${cy + Math.sin(a) * elementScale}`);
                    }
                    createSVGElement('polygon', { points: points.join(' '), fill, stroke, 'stroke-width': sw, opacity: op }, parent);
                     break;
                 case 4: // Ellipse
                     createSVGElement('ellipse', { cx, cy, rx: Math.max(1, elementScale * random(0.7, 1.3)), ry: Math.max(1, elementScale * random(0.7, 1.3)), fill, stroke, 'stroke-width': sw, opacity: op }, parent);
                     break;
                 case 5: // Nested Shape (Example: rect inside circle)
                      const outerR = elementScale * 1.2;
                      createSVGElement('circle', { cx, cy, r: Math.max(1, outerR), fill: 'none', stroke: stroke, 'stroke-width': sw * 0.5, opacity: op * 0.5 }, parent);
                      const innerW = outerR * 0.6;
                      if (innerW > 1) {
                           createSVGElement('rect', { x: cx - innerW/2, y: cy - innerW/2, width: innerW, height: innerW, fill, stroke: 'none', opacity: op}, parent);
                           elementCount++; // Count inner shape
                      }
                     break;
             }
             elementCount++; // Increment count for the main element
         }
     }

     // Optionally add grid lines
    if (complexity > 4 && density > 30) {
        const gridLineStroke = strokeColor;
        const gridLineOpacity = opacity * 0.2;
        const gridLineSW = Math.max(0.1, strokeWeight * 0.5);
        // Draw horizontal lines
        for (let row = 0; row <= cellsPerSide; row++) {
            createSVGElement('line', { x1: 0, y1: row * cellHeight, x2: width, y2: row * cellHeight, stroke: gridLineStroke, 'stroke-width': gridLineSW, opacity: gridLineOpacity }, parent);
            elementCount++;
        }
        // Draw vertical lines
        for (let col = 0; col <= cellsPerSide; col++) {
             createSVGElement('line', { x1: col * cellWidth, y1: 0, x2: col * cellWidth, y2: height, stroke: gridLineStroke, 'stroke-width': gridLineSW, opacity: gridLineOpacity }, parent);
            elementCount++;
        }
    }

     // Return results
     return { elementCount, gridSize: `${cellsPerSide}x${cellsPerSide}`, cellCount: cellsPerSide * cellsPerSide };
}
