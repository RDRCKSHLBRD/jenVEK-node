// public/js/modules/patterns/prime.js

// ----- MODULE IMPORTS -----
// Import necessary utilities
import { createSVGElement, randomInt, isPrime } from '../utils.js';
// Import color utilities
import { getRandomFill } from '../colorUtils.js';
// Import state if needed (not directly used here)
// import { state } from '../state.js';


// ----- PATTERN GENERATION FUNCTIONS -----

/**
 * Generates a pattern based on prime numbers, arranged in a grid or spiral.
 * @param {SVGElement} parent - The parent SVG group element (<g>).
 * @param {object} options - Generation options.
 * @param {string[]} palette - Color palette.
 * @returns {object} Generation results.
 */
export function generatePrimePattern(parent, options, palette) {
    // Destructure options
    const { viewportWidth: width, viewportHeight: height, complexity, density, repetition, scale } = options;
    let elementCount = 0;

    // 1. Generate Prime Numbers
    // Number of primes based on settings
    const numElements = Math.max(10, Math.floor(100 * complexity * (density / 100) * repetition));
    const primes = [];
    let num = 2; // Start checking from 2
    console.log(`Generating up to ${numElements} prime numbers...`);
    while (primes.length < numElements) {
        // Uses imported isPrime utility
        if (isPrime(num)) {
            primes.push(num);
        }
        num++;
        // Safety break for very large searches (optional)
        if (num > 100000 && primes.length < numElements / 2) {
            console.warn("Prime search taking too long, stopping early.");
            break;
        }
    }

    if (primes.length === 0) {
        console.warn("No primes generated.");
        return { elementCount: 0, primeCount: 0 };
    }
    const largestPrime = primes[primes.length - 1];
    console.log(`Generated ${primes.length} primes, largest: ${largestPrime}`);

    // 2. Choose Layout
    // Uses imported randomInt
    const layoutType = randomInt(0, 1); // 0: Grid, 1: Spiral

    // 3. Visualize Primes
    if (layoutType === 0) { // --- Grid Layout ---
        console.log("Using grid layout for primes.");
        const gridSize = Math.ceil(Math.sqrt(primes.length));
        const cellWidth = width / gridSize;
        const cellHeight = height / gridSize;

        for (let i = 0; i < primes.length; i++) {
            const prime = primes[i];
            const row = Math.floor(i / gridSize);
            const col = i % gridSize;
            const x = col * cellWidth + cellWidth / 2;
            const y = row * cellHeight + cellHeight / 2;
            // Size based on log scale relative to largest prime
            const size = Math.max(2, Math.min(cellWidth, cellHeight) * 0.8 * (Math.log(prime + 1) / Math.log(largestPrime + 1)) * scale);
            // Call helper function to draw the element
            drawPrimeElement(parent, x, y, size, prime, options, palette);
            elementCount++;
        }
    } else { // --- Spiral Layout ---
        console.log("Using spiral layout for primes.");
         let x = width / 2, y = height / 2; // Start center
         let step = Math.min(width, height) / Math.sqrt(primes.length) * 0.5 * scale;
         let dx = step, dy = 0;
         let stepsTaken = 0, stepsLimit = 1, turnCounter = 0;

         for (let i = 0; i < primes.length; i++) {
             const prime = primes[i];
             const size = Math.max(1, step * 0.8 * (Math.log(prime + 1) / Math.log(largestPrime + 1)) * scale);
             // Call helper function to draw the element
             drawPrimeElement(parent, x, y, size, prime, options, palette);
             elementCount++;

             // Move spiral position
             x += dx; y += dy;
             stepsTaken++;

             // Turn logic
             if (stepsTaken >= stepsLimit) {
                 stepsTaken = 0;
                 [dx, dy] = [-dy, dx]; // Turn 90 degrees counter-clockwise
                 turnCounter++;
                 if (turnCounter >= 2) {
                     turnCounter = 0;
                     stepsLimit++;
                 }
             }
         }
    }

     // Return results
     return { elementCount, primeCount: primes.length, largestPrime, layout: layoutType === 0 ? 'Grid' : 'Spiral' };
}

/**
 * Helper function for drawing elements in the prime pattern.
 * NOTE: Internal to this module.
 * @param {SVGElement} parent - The parent SVG group element (<g>).
 * @param {number} x - Center x coordinate.
 * @param {number} y - Center y coordinate.
 * @param {number} size - Calculated size for the element.
 * @param {number} primeValue - The prime number being represented.
 * @param {object} options - Generation options.
 * @param {string[]} palette - Color palette.
 */
function drawPrimeElement(parent, x, y, size, primeValue, options, palette) {
    // Uses imported getRandomFill
    const fill = getRandomFill(palette, options);
    const stroke = options.strokeColor;
    const sw = options.strokeWeight;
    const op = options.opacity;

    // Choose shape based on prime modulo (uses imported createSVGElement)
    const shapeType = primeValue % 5;
    switch (shapeType) {
        case 0: // Circle
            createSVGElement('circle', { cx:x, cy:y, r:Math.max(1, size/2), fill, stroke, 'stroke-width': sw, opacity: op }, parent); break;
        case 1: // Square
            createSVGElement('rect', { x:x-size/2, y:y-size/2, width:Math.max(1, size), height:Math.max(1, size), fill, stroke, 'stroke-width': sw, opacity: op }, parent); break;
        case 2: // Triangle
            const h = (Math.sqrt(3)/2) * size; // Height of equilateral triangle
            const yOff = h / 3; // Offset for centering
            const p = [
                `${x},${y - 2*yOff}`,       // Top vertex
                `${x + size / 2},${y + yOff}`, // Bottom right
                `${x - size / 2},${y + yOff}`  // Bottom left
            ].join(' ');
            createSVGElement('polygon', { points:p, fill, stroke, 'stroke-width': sw, opacity: op }, parent); break;
        case 3: // Diamond/Star
            const p2 = [`${x},${y-size/2}`, `${x+size/2},${y}`, `${x},${y+size/2}`, `${x-size/2},${y}`].join(' ');
            createSVGElement('polygon', { points:p2, fill, stroke, 'stroke-width': sw, opacity: op }, parent); break;
        case 4: // Ring
            createSVGElement('circle', { cx:x, cy:y, r:Math.max(1, size/2), fill:'none', stroke:fill, 'stroke-width': Math.max(0.5, sw * 1.5), opacity: op }, parent);
            break;
    }
}
