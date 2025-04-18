// public/js/modules/patterns/Mandelbrot.js

// ----- MODULE IMPORTS -----
// Import necessary utilities
import { createSVGElement } from '../utils.js';
// Import state if needed (not directly used here)
// import { state } from '../state.js';
// Import color utilities if needed (palette is passed in)
// import { getRandomFill } from '../colorUtils.js';
// Import random utils if needed (uses Math.random, which might be seeded)
// import { random, randomInt, randomChoice } from '../utils.js';


/**
 * Generates an approximation of the Mandelbrot set visualization.
 * Colors points based on how quickly they escape the threshold.
 * @param {SVGElement} parent - The parent SVG group element (<g>).
 * @param {object} options - Generation options.
 * @param {string[]} palette - Color palette.
 * @returns {object} Generation results.
 */
export function generateMandelbrotPattern(parent, options, palette) {
     // Destructure options
     const { viewportWidth: width, viewportHeight: height, complexity, density, scale, strokeWeight, opacity, strokeColor } = options;
     let elementCount = 0;

     // Resolution of the grid for calculation
     const resolution = Math.max(10, Math.min(150, Math.floor(complexity * 10)));
     const cellWidth = width / resolution;
     const cellHeight = height / resolution;
     // Density threshold (probability to skip calculation)
     const densityThreshold = 1 - (density / 100);

     // Mandelbrot calculation parameters (complex plane region)
     const xMin = -2.1, xMax = 0.6, yMin = -1.2, yMax = 1.2;
     // Max iterations for escape check
     const maxIter = Math.floor(complexity * 15) + 20;

     console.log(`Generating Mandelbrot pattern (Res: ${resolution}, MaxIter: ${maxIter})...`);

     // Iterate through the grid cells
     for (let row = 0; row < resolution; row++) {
         for (let col = 0; col < resolution; col++) {
            // Skip calculation based on density (uses Math.random potentially seeded)
            if (Math.random() < densityThreshold) continue;

             // Map grid cell to complex number c = x0 + iy0
             const x0 = xMin + (xMax - xMin) * (col / resolution);
             const y0 = yMin + (yMax - yMin) * (row / resolution);
             let x = 0, y = 0, iter = 0, x2 = 0, y2 = 0; // Iteration variables

             // Mandelbrot iteration: z = z^2 + c
             while (x2 + y2 <= 4 && iter < maxIter) { // Check escape condition |z|^2 <= 4
                 y = 2 * x * y + y0; // Imaginary part (using previous x, y)
                 x = x2 - y2 + x0; // Real part (using previous x^2, y^2)
                 x2 = x * x;
                 y2 = y * y;
                 iter++;
             }

             // Draw a shape if the point escaped (iter < maxIter)
             if (iter < maxIter && iter > 0) {
                 const normIter = iter / maxIter; // Normalize iteration count
                 // Choose color based on normalized iteration count
                 const colorIndex = Math.floor(normIter * (palette.length - 1));
                 const fillColor = palette[colorIndex] || 'grey';

                 // Size based on escape speed (faster escape = smaller size)
                 const size = Math.max(1, Math.min(cellWidth, cellHeight) * 0.9 * (1 - normIter) * scale);
                 const px = col * cellWidth + cellWidth / 2; // Center X of cell
                 const py = row * cellHeight + cellHeight / 2; // Center Y of cell
                 const sw = Math.max(0.1, strokeWeight * 0.5); // Thinner stroke
                 const op = opacity;

                 // Vary shape based on iteration count (uses imported createSVGElement)
                  const shapeType = iter % 4;
                  switch(shapeType) {
                      case 0: // Circle
                          createSVGElement('circle', {cx:px, cy:py, r:Math.max(1, size/2), fill:fillColor, stroke:strokeColor, 'stroke-width':sw, opacity:op}, parent); break;
                      case 1: // Square
                          createSVGElement('rect', {x:px-size/2, y:py-size/2, width:Math.max(1, size), height:Math.max(1, size), fill:fillColor, stroke:strokeColor, 'stroke-width':sw, opacity:op}, parent); break;
                      case 2: // Rotating Ellipse
                          createSVGElement('ellipse', {cx:px, cy:py, rx:Math.max(1, size/2), ry:Math.max(1, size/4), fill:fillColor, stroke:strokeColor, 'stroke-width':sw, opacity:op, transform:`rotate(${iter*5} ${px} ${py})`}, parent); break;
                      case 3: // Diamond
                        const pts = `${px},${py-size/2} ${px+size/2},${py} ${px},${py+size/2} ${px-size/2},${py}`;
                        createSVGElement('polygon', {points:pts, fill:fillColor, stroke:strokeColor, 'stroke-width':sw, opacity:op}, parent); break;
                  }
                 elementCount++;
             }
         }
     }

    // Return results
    return { elementCount, resolution, maxIterations: maxIter };
}
