// generator.js

// public/js/modules/generator.js

// ----- MODULE IMPORTS -----
import { state } from './state.js';
import { dom } from './dom.js';
import { getColorPalette, getRandomFill, createGradientFill, createPatternFill } from './colorUtils.js'; // Import color functions
import { updateMathInfo, updateSVGStats } from './ui.js'; // Import UI update functions
import {
    createSVGElement, random, randomInt, randomChoice, isPrime, fibonacci,
    secureRandom, getTimeSeedValue, generateUniqueId // Import necessary utils
} from './utils.js';

// ----- CONSTANTS -----
const MAX_RECURSION_SAFETY = 10000; // Prevent browser freeze in recursive patterns

// ----- CORE GENERATION LOGIC -----

/**
 * Retrieves the current generation options from the UI controls and state.
 * @returns {object} An object containing all current generation parameters.
 */
function getOptions() {
    // Ensure DOM elements are cached before accessing them
    if (!dom.patternType || !dom.complexity || !dom.density /* ... add checks for all needed dom elements */) {
        console.error("getOptions: Required DOM elements not cached!");
        // Return default options or throw an error
        return { /* default options */ };
    }

    state.currentOptions = {
        patternType: dom.patternType.value,
        complexity: parseInt(dom.complexity.value, 10),
        density: parseInt(dom.density.value, 10),
        maxRecursion: parseInt(dom.maxRecursion.value, 10),
        strokeWeight: parseFloat(dom.strokeWeight.value),
        opacity: parseFloat(dom.opacity.value),
        scale: parseFloat(dom.scale.value),
        layerCount: parseInt(dom.layerCount.value, 10),
        repetition: parseInt(dom.repetition.value, 10),
        fillType: dom.fillType.value,
        bgColor: dom.bgColor.value,
        strokeColor: dom.strokeColor.value,
        useCursor: dom.useCursor.checked,
        useTime: dom.useTime.checked,
        animation: dom.animation.checked,
        animationType: dom.animationType.value,
        viewportWidth: state.viewportWidth,
        viewportHeight: state.viewportHeight,
        // Include captured coordinates from state
        capturedX: state.capturedX,
        capturedY: state.capturedY,
        capturedV: state.capturedV,
    };
    return state.currentOptions;
}

/**
 * Main function to generate the SVG content based on selected options.
 * Clears the existing SVG, sets background, generates patterns layer by layer,
 * updates stats, and optionally starts animation.
 */
export function generateSVG() {
    console.log("Generating SVG...");
    stopAnimation(); // Stop any existing animation first

    // Ensure SVG and defs elements are available
    if (!dom.svg || !dom.defs) {
        console.error("Cannot generate SVG: SVG canvas or defs element not found/cached.");
        alert("Error: SVG canvas not ready. Please reload.");
        return;
    }

    const options = getOptions();
    const palette = getColorPalette(); // Ensure palette is valid (handled within getColorPalette)

    // --- Clear SVG ---
    dom.defs.innerHTML = ''; // Clear existing defs
    // Clear main SVG content (excluding defs) by removing all direct children except defs
    while (dom.svg.lastChild && dom.svg.lastChild !== dom.defs) {
         dom.svg.removeChild(dom.svg.lastChild);
    }

    // --- Set Background ---
    // Set SVG background (insert *after* defs)
    // Check for non-white/transparent background color
    if (options.bgColor && options.bgColor.toUpperCase() !== '#FFFFFF') {
        const bgRect = createSVGElement('rect', {
            x: 0, y: 0, width: '100%', height: '100%', fill: options.bgColor
        });
        // Insert background rect immediately after the defs element
        dom.svg.insertBefore(bgRect, dom.defs.nextSibling);
    }

    // --- Seeding Logic ---
    const originalRandom = Math.random; // Store original Math.random
    let seed = Date.now(); // Base seed on current time

    // Add time-based seed component if selected
    if (options.useTime) {
        seed += getTimeSeedValue() * 1e9; // Incorporate fraction of day
    }
    // Add cursor/captured coordinate-based seed components if selected
    if (options.useCursor) {
        // Use sine/cosine to get varied values, scale to avoid tiny influences
        if (state.mouseX !== null && state.mouseY !== null) {
             seed += Math.sin(state.mouseX * 0.01) * 1e5;
             seed += Math.cos(state.mouseY * 0.01) * 1e5;
        }
        if (state.capturedX !== null) seed += Math.sin(state.capturedX * 0.1) * 1e4;
        if (state.capturedY !== null) seed += Math.cos(state.capturedY * 0.1) * 1e4;
        if (state.capturedV?.x !== null) seed += Math.sin(state.capturedV.x * 0.1) * 1e3;
        if (state.capturedV?.y !== null) seed += Math.cos(state.capturedV.y * 0.1) * 1e3;
    }

    // Create a seeded random number generator (PRNG) using a simple LCG algorithm
    let currentSeed = Math.floor(Math.abs(seed)) % 2147483647; // Ensure seed is positive integer within range
    if (currentSeed === 0) currentSeed = 1; // Avoid seed being 0
    const seededRandom = () => {
        currentSeed = (currentSeed * 16807) % 2147483647; // LCG parameters
        return (currentSeed - 1) / 2147483646; // Normalize to range [0, 1)
    };

    // Override Math.random if seeding is enabled
    if (options.useTime || options.useCursor) {
        console.log("Using seeded random generator. Seed value (approx):", seed);
        Math.random = seededRandom;
    } else {
        console.log("Using default secureRandom (or Math.random fallback).");
        // Ensure Math.random points to our secureRandom or its fallback
        Math.random = secureRandom;
    }


    // --- Generation Loop (Layers) ---
    let totalElements = 0;
    let combinedMathInfo = {}; // Object to store math details for each layer

    try {
        // Loop through the number of layers specified by the user
        for (let layer = 0; layer < options.layerCount; layer++) {
            state.currentLayer = layer; // Update global state for current layer index
            // Create a group element <g> for the current layer and append it to the SVG
            let layerGroup = createSVGElement('g', { id: `layer-${layer}` }, dom.svg);

             // Create layer-specific options, potentially modifying them based on layer index
             const layerOptions = { ...options }; // Shallow copy base options
             if (layer > 0) { // Apply variations for subsequent layers (layer index > 0)
                 // Example variations: reduce complexity, density, stroke weight, opacity, scale for upper layers
                 layerOptions.complexity = Math.max(1, options.complexity - layer * 1.5); // Decrease complexity
                 layerOptions.density = Math.max(1, options.density - layer * 15);        // Decrease density
                 layerOptions.strokeWeight = Math.max(0.1, options.strokeWeight * (1 - layer * 0.25)); // Decrease stroke weight
                 layerOptions.opacity = Math.max(0.1, options.opacity * (1 - layer * 0.2));          // Decrease opacity
                 layerOptions.scale = options.scale * (1 - layer * 0.15);                   // Decrease scale
                 // You could also change fillType, strokeColor, etc. for different layers
             }

            state.recursionCount = 0; // Reset recursion counter for each layer
            let result = {}; // Object to store results from the pattern function

            // Call the appropriate pattern generation function based on the selected type
            switch (options.patternType) {
                 case 'random': result = generateRandomPattern(layerGroup, layerOptions, palette); break;
                 case 'recursive': result = generateRecursivePattern(layerGroup, layerOptions, palette); break;
                 case 'grid': result = generateGridPattern(layerGroup, layerOptions, palette); break;
                 case 'quadtree': result = generateQuadtreePattern(layerGroup, layerOptions, palette); break;
                 case 'fibonacci': result = generateFibonacciPattern(layerGroup, layerOptions, palette); break;
                 case 'mandelbrot': result = generateMandelbrotPattern(layerGroup, layerOptions, palette); break;
                 case 'prime': result = generatePrimePattern(layerGroup, layerOptions, palette); break;
                 case 'trig': result = generateTrigPattern(layerGroup, layerOptions, palette); break;
                 case 'bezier': result = generateBezierPattern(layerGroup, layerOptions, palette); break;
                 case 'lissajous': result = generateLissajousPattern(layerGroup, layerOptions, palette); break;
                 case 'padovan': result = generatePadovanPattern(layerGroup, layerOptions, palette); break;
                 case 'recaman': result = generateRecamanPattern(layerGroup, layerOptions, palette); break;
                 default:
                     // Fallback for unknown pattern types
                     console.warn("Unknown pattern type selected:", options.patternType, "Falling back to random.");
                     result = generateRandomPattern(layerGroup, layerOptions, palette);
            }
            // Accumulate total element count and store layer-specific math info
            totalElements += result.elementCount || 0;
            combinedMathInfo[`Layer_${layer}`] = result; // Store result object under layer key
        }

        // --- Finalize and Update UI ---
        // Store overall math info in the global state
        state.mathInfo = {
            generator: options.patternType,
            layers: options.layerCount,
            viewport: `${options.viewportWidth}x${options.viewportHeight}`,
            totalElements: totalElements,
            details: combinedMathInfo // Include the layer-specific details
        };
        updateMathInfo(state.mathInfo); // Update the math info display panel
        updateSVGStats(totalElements); // Update the SVG size and element count display

        // Store the generated SVG markup in the state for download purposes
        state.svgData = dom.svg.outerHTML;
        state.generationCount++; // Increment generation counter

        // Start animation if the option is checked
        if (options.animation) {
            startAnimation();
        }

    } catch (error) {
        // --- Error Handling ---
        console.error('Error during SVG generation:', error);
        // Display a user-friendly error message directly in the SVG area
        const errorText = createSVGElement('text', {
            x: 10, y: 50, fill: 'red',
            'font-family': 'sans-serif', 'font-size': '16px'
        });
        errorText.textContent = `Error: ${error.message}. Check console for details.`;
        dom.svg.appendChild(errorText); // Append error message to the SVG canvas

        // Update UI panels to reflect the error state
        updateMathInfo({ error: error.message });
        updateSVGStats(0); // Reset stats on error
    } finally {
        // --- Cleanup ---
        // ALWAYS restore the original Math.random function after generation finishes or errors out
        Math.random = originalRandom;
        console.log("Restored original Math.random.");
    }
}


// ----- Pattern Generation Functions -----
// Includes existing patterns + new ones: Trig, Bezier, Lissajous

function generateRandomPattern(parent, options, palette) {
    const { viewportWidth: width, viewportHeight: height, complexity, density, repetition, scale, strokeWeight, opacity, strokeColor } = options;
    let elementCount = 0;
    // Calculate number of shapes based on complexity, density, and repetition
    // Added Math.max to ensure at least a few shapes even at low settings
    const numShapes = Math.max(3, Math.floor(complexity * (density / 100) * 20 * repetition));

    for (let i = 0; i < numShapes; i++) {
        const shapeType = Math.random(); // Use potentially seeded random
        let shape;
        const fill = getRandomFill(palette, options); // Get fill style (solid, gradient, pattern, none)
        const stroke = strokeColor; // Base stroke color from options
        const sw = strokeWeight; // Base stroke weight from options
        const op = opacity; // Base opacity from options

        // Determine shape type based on random value
        if (shapeType < 0.3) { // Circle (30% chance)
            const radius = random(5, 30 * complexity * scale); // Radius influenced by complexity and scale
            shape = createSVGElement('circle', {
                cx: random(0, width), cy: random(0, height), // Random position
                r: Math.max(1, radius), // Ensure radius is at least 1
                fill, stroke, 'stroke-width': sw, opacity: op
            }, parent); // Append to parent group
        } else if (shapeType < 0.6) { // Rectangle (30% chance)
            const rectW = random(10, 50 * complexity * scale); // Width influenced by complexity and scale
            const rectH = random(10, 50 * complexity * scale); // Height influenced by complexity and scale
            const rectX = random(0, width - rectW); // Random X, ensuring it fits within width
            const rectY = random(0, height - rectH); // Random Y, ensuring it fits within height
            shape = createSVGElement('rect', {
                x: rectX, y: rectY,
                width: Math.max(1, rectW), height: Math.max(1, rectH), // Ensure dimensions are at least 1
                fill, stroke, 'stroke-width': sw, opacity: op,
                // Add a random rotation around its center
                transform: `rotate(${random(-30, 30)} ${rectX + rectW / 2} ${rectY + rectH / 2})`
            }, parent); // Append to parent group
        } else { // Polygon (40% chance)
            const points = [];
            const numPoints = randomInt(3, 7); // Random number of vertices (3 to 7)
            const centerX = random(0, width); // Random center X
            const centerY = random(0, height); // Random center Y
            const radius = random(10, 40 * complexity * scale); // Base radius influenced by complexity and scale
            for (let j = 0; j < numPoints; j++) {
                // Calculate angle for each vertex, adding slight jitter
                const angle = (j / numPoints) * Math.PI * 2 + random(-0.1, 0.1);
                // Vary radius slightly for each vertex
                const r = radius * random(0.8, 1.2);
                // Calculate vertex coordinates and add to points array
                points.push(`${centerX + Math.cos(angle) * r},${centerY + Math.sin(angle) * r}`);
            }
            shape = createSVGElement('polygon', {
                points: points.join(' '), // Join points with spaces
                fill, stroke, 'stroke-width': sw, opacity: op
            }, parent); // Append to parent group
        }
        elementCount++; // Increment element counter
    }
    // Return information about the generated pattern
    return { elementCount, complexity: options.complexity, density: options.density, repetition: options.repetition };
}

function generateRecursivePattern(parent, options, palette) {
     const { viewportWidth: width, viewportHeight: height, complexity, maxRecursion, scale } = options;
     state.recursionCount = 0; // Reset global recursion counter for this generation

     // Initial size based on viewport and scale
     const initialSize = Math.min(width, height) * 0.4 * scale;
     // Center the initial shape with slight random offset
     const startX = width / 2 + random(-width * 0.1, width * 0.1);
     const startY = height / 2 + random(-height * 0.1, height * 0.1);

    // Define the initial shape data
    const initialShape = {
        type: Math.random() < 0.5 ? 'circle' : 'rect', // Randomly start with circle or rect
        x: startX,
        y: startY,
        size: initialSize, // Use 'size' for both circle radius and rect side length for simplicity
        depth: 0 // Initial depth is 0
    };

    // Start the recursive drawing process
    recursiveDraw(parent, initialShape, maxRecursion, options, palette);

    // Return results
    return {
        elementCount: state.recursionCount, // Total elements drawn (including recursive calls)
        // Report actual depth reached, capped by user setting or safety limit
        recursionDepthReached: Math.min(state.recursionCount > 0 ? maxRecursion : 0, maxRecursion, Math.ceil(Math.log2(state.recursionCount+1))), // Estimate depth based on count
        complexity: options.complexity
    };
}

// Helper function for recursive drawing
function recursiveDraw(parent, shapeData, maxDepth, options, palette) {
    // Base case: Stop recursion if max depth is reached, or safety limit hit
    if (shapeData.depth >= maxDepth || state.recursionCount >= MAX_RECURSION_SAFETY) {
        if (state.recursionCount >= MAX_RECURSION_SAFETY) console.warn('Max recursion safety limit hit!');
        return;
    }
    state.recursionCount++; // Increment count for this element being drawn

    const { type, x, y, size, depth } = shapeData;
    const fill = getRandomFill(palette, options); // Get fill for this shape
    const stroke = options.strokeColor; // Stroke color from options

    // Adjust stroke weight and opacity based on depth (decrease for deeper elements)
    const strokeWidth = Math.max(0.1, options.strokeWeight * (1 - depth / (maxDepth * 1.5)));
    const opacity = Math.max(0.1, options.opacity * (1 - depth / (maxDepth * 2)));

    // Draw the current shape (circle or rectangle)
    if (type === 'circle') {
        createSVGElement('circle', {
            cx: x, cy: y, r: Math.max(1, size / 2), // Ensure radius is positive
            fill, stroke, 'stroke-width': strokeWidth, opacity
        }, parent);
    } else { // rect
        createSVGElement('rect', {
             x: x - size / 2, y: y - size / 2, // Position based on center
             width: Math.max(1, size), height: Math.max(1, size), // Ensure positive dimensions
             fill, stroke, 'stroke-width': strokeWidth, opacity,
             transform: `rotate(${random(-10, 10)} ${x} ${y})` // Apply slight random rotation
        }, parent);
    }

    // --- Recursive Step ---
    // Calculate properties for child shapes
    const childDepth = depth + 1;
    // Branching factor: Number of children depends on complexity
    const numChildren = randomInt(2, Math.max(2, Math.floor(options.complexity / 1.5))); // Fewer branches than random pattern
    // Scale factor: Children are smaller, factor decreases with depth and density influences it
    const scaleFactor = Math.max(0.1, (0.6 - depth * 0.05) * (options.density / 150 + 0.4)); // Adjusted scaling
    const childSize = size * scaleFactor;

    // Stop recursion if children become too small
    if (childSize < 1) return;

    // Create and draw children recursively
    for (let i = 0; i < numChildren; i++) {
        // Position children relative to the parent
        const angle = (i / numChildren) * Math.PI * 2 + random(-0.3, 0.3); // Angle with jitter
        const distance = size * 0.6 * random(0.7, 1.3); // Distance from parent center
        const childX = x + Math.cos(angle) * distance;
        const childY = y + Math.sin(angle) * distance;

        // Randomly choose child shape type, possibly influenced by parent type
        // 60% chance to be same type as parent, 40% chance to switch
        const childType = Math.random() < 0.6 ? type : (type === 'circle' ? 'rect' : 'circle');

        // Recursive call for the child shape
        recursiveDraw(parent, {
            type: childType,
            x: childX,
            y: childY,
            size: childSize,
            depth: childDepth
        }, maxDepth, options, palette);
    }
}


function generateGridPattern(parent, options, palette) {
     const { viewportWidth: width, viewportHeight: height, complexity, density, repetition, scale, strokeWeight, opacity, strokeColor } = options;
     let elementCount = 0;
     // Grid size influenced by complexity and repetition (more cells for higher values)
     const cellsPerSide = Math.max(2, Math.floor(complexity * 1.5 + repetition));
     const cellWidth = width / cellsPerSide;
     const cellHeight = height / cellsPerSide;
     // Density threshold: Higher density means lower threshold (more cells filled)
     const densityThreshold = 1 - (density / 100);

     // Iterate through grid cells
     for (let row = 0; row < cellsPerSide; row++) {
         for (let col = 0; col < cellsPerSide; col++) {
             // Skip drawing in this cell based on density threshold
             if (Math.random() < densityThreshold) continue;

             const cx = col * cellWidth + cellWidth / 2; // Center X of the cell
             const cy = row * cellHeight + cellHeight / 2; // Center Y of the cell
             const cellOptions = { ...options }; // Copy options for potential modification within cell

             // Choose what type of content to draw in the cell
             const cellContentType = randomInt(0, 5); // Increased variety
             const fill = getRandomFill(palette, cellOptions); // Get fill style
             const stroke = strokeColor; // Base stroke color
             const sw = strokeWeight; // Base stroke weight
             const op = opacity; // Base opacity
             // Calculate base size for element within the cell, scaled by options
             const elementScale = Math.min(cellWidth, cellHeight) * 0.4 * scale * random(0.7, 1.1);

             // Draw the selected content type
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
                     const angle = random(0, Math.PI * 2); // Random angle
                     const len = elementScale * 2; // Length based on scale
                     createSVGElement('line', {
                         x1: cx - Math.cos(angle) * len / 2, y1: cy - Math.sin(angle) * len / 2, // Start point
                         x2: cx + Math.cos(angle) * len / 2, y2: cy + Math.sin(angle) * len / 2, // End point
                         stroke: randomChoice(palette) || stroke, // Use random palette color or default stroke
                         'stroke-width': sw * random(1, 3), // Vary stroke width
                         opacity: op
                     }, parent);
                    break;
                 case 3: // Polygon
                    const points = [];
                    const vertices = randomInt(3, 7); // 3 to 7 vertices
                    for (let i = 0; i < vertices; i++) {
                        const a = (i / vertices) * Math.PI * 2; // Angle for vertex
                        points.push(`${cx + Math.cos(a) * elementScale},${cy + Math.sin(a) * elementScale}`); // Calculate vertex position
                    }
                    createSVGElement('polygon', { points: points.join(' '), fill, stroke, 'stroke-width': sw, opacity: op }, parent);
                     break;
                 case 4: // Ellipse
                     createSVGElement('ellipse', { cx, cy, rx: Math.max(1, elementScale * random(0.7, 1.3)), ry: Math.max(1, elementScale * random(0.7, 1.3)), fill, stroke, 'stroke-width': sw, opacity: op }, parent);
                     break;
                 case 5: // Nested Shape (Example: rect inside circle)
                      const outerR = elementScale * 1.2; // Outer circle radius
                      createSVGElement('circle', { cx, cy, r: Math.max(1, outerR), fill: 'none', stroke: stroke, 'stroke-width': sw * 0.5, opacity: op * 0.5 }, parent);
                      const innerW = outerR * 0.6; // Inner rectangle width
                      // Only draw inner if size is reasonable
                      if (innerW > 1) {
                           createSVGElement('rect', { x: cx - innerW/2, y: cy - innerW/2, width: innerW, height: innerW, fill, stroke: 'none', opacity: op}, parent);
                           elementCount++; // Count inner shape as a separate element
                      }
                     break;
             }
             elementCount++; // Increment count for the main element in the cell
         }
     }

     // Optionally add grid lines based on complexity/density
    if (complexity > 4 && density > 30) {
        const gridLineStroke = strokeColor; // Use base stroke color for grid lines
        const gridLineOpacity = opacity * 0.2; // Make grid lines faint
        const gridLineSW = Math.max(0.1, strokeWeight * 0.5); // Make grid lines thin
        // Draw horizontal grid lines
        for (let row = 0; row <= cellsPerSide; row++) {
            createSVGElement('line', { x1: 0, y1: row * cellHeight, x2: width, y2: row * cellHeight, stroke: gridLineStroke, 'stroke-width': gridLineSW, opacity: gridLineOpacity }, parent);
            elementCount++;
        }
        // Draw vertical grid lines
        for (let col = 0; col <= cellsPerSide; col++) {
             createSVGElement('line', { x1: col * cellWidth, y1: 0, x2: col * cellWidth, y2: height, stroke: gridLineStroke, 'stroke-width': gridLineSW, opacity: gridLineOpacity }, parent);
            elementCount++;
        }
    }

     // Return results
     return { elementCount, gridSize: `${cellsPerSide}x${cellsPerSide}`, cellCount: cellsPerSide * cellsPerSide };
}


function generateQuadtreePattern(parent, options, palette) {
    const { viewportWidth: width, viewportHeight: height, maxRecursion, complexity, density } = options;
    state.recursionCount = 0; // Reset global recursion counter

    // Define the root quad covering the entire viewport
    const rootQuad = { x: 0, y: 0, width, height, depth: 0 };
    // Start the recursive quadtree generation
    generateQuadtreeNode(parent, rootQuad, maxRecursion, options, palette);

     // Return results
     return {
        elementCount: state.recursionCount, // Total elements (nodes processed/drawn)
        // Report actual depth reached
        maxDepthReached: Math.min(state.recursionCount > 0 ? maxRecursion : 0, maxRecursion, Math.ceil(Math.log(state.recursionCount+1)/Math.log(4))), // Estimate depth
        complexity: options.complexity,
        density: options.density
    };
}

// Helper function for recursive quadtree generation
function generateQuadtreeNode(parent, quad, maxDepth, options, palette) {
    const { x, y, width, height, depth } = quad;

    // Base case: Stop recursion if max depth reached, safety limit hit, or node is too small
    if (depth >= maxDepth || state.recursionCount >= MAX_RECURSION_SAFETY || width < 2 || height < 2) {
         if (state.recursionCount >= MAX_RECURSION_SAFETY) console.warn('Max recursion safety limit hit!');
        return;
    }
    state.recursionCount++; // Increment count for processing this node

     // Subdivision probability: Influenced by complexity, density, and current depth
     // Higher complexity/density increases probability, deeper levels decrease it
    const subdivideProb = 0.4 + (options.complexity / 10) * 0.3 + (options.density / 100) * 0.3 - (depth / maxDepth) * 0.3;
    const shouldSubdivide = Math.random() < subdivideProb; // Use potentially seeded random

    if (shouldSubdivide) {
        // --- Subdivide Node ---
        const halfWidth = width / 2;
        const halfHeight = height / 2;
         // Add slight randomness to the division point for visual interest
         const midX = x + halfWidth + random(-halfWidth * 0.1, halfWidth * 0.1);
         const midY = y + halfHeight + random(-halfHeight * 0.1, halfHeight * 0.1);

         // Ensure midpoints stay within the parent quad boundaries roughly
         const clampedMidX = Math.max(x + halfWidth * 0.5, Math.min(x + halfWidth * 1.5, midX));
         const clampedMidY = Math.max(y + halfHeight * 0.5, Math.min(y + halfHeight * 1.5, midY));


        // Recursively call for the four child quadrants
        // Top-left child
        generateQuadtreeNode(parent, { x: x,           y: y,           width: clampedMidX - x,             height: clampedMidY - y,             depth: depth + 1 }, maxDepth, options, palette);
        // Top-right child
        generateQuadtreeNode(parent, { x: clampedMidX, y: y,           width: x + width - clampedMidX,     height: clampedMidY - y,             depth: depth + 1 }, maxDepth, options, palette);
        // Bottom-left child
        generateQuadtreeNode(parent, { x: x,           y: clampedMidY, width: clampedMidX - x,             height: y + height - clampedMidY,     depth: depth + 1 }, maxDepth, options, palette);
        // Bottom-right child
        generateQuadtreeNode(parent, { x: clampedMidX, y: clampedMidY, width: x + width - clampedMidX,     height: y + height - clampedMidY,     depth: depth + 1 }, maxDepth, options, palette);

        // Optionally draw dividing lines for visual structure
        if (options.complexity > 5 && options.density > 40) {
             const lineOpacity = Math.max(0.05, 0.3 - depth * 0.05); // Fainter lines deeper down
             const lineWeight = Math.max(0.1, options.strokeWeight * (0.8 - depth * 0.1)); // Thinner lines deeper down
             // Draw vertical dividing line
             createSVGElement('line', { x1: clampedMidX, y1: y, x2: clampedMidX, y2: y + height, stroke: options.strokeColor, 'stroke-width': lineWeight, opacity: lineOpacity }, parent);
             // Draw horizontal dividing line
             createSVGElement('line', { x1: x, y1: clampedMidY, x2: x + width, y2: clampedMidY, stroke: options.strokeColor, 'stroke-width': lineWeight, opacity: lineOpacity }, parent);
             state.recursionCount += 2; // Count lines as elements (optional)
        }

    } else {
        // --- Draw Leaf Node ---
        // Don't subdivide further, draw something in this quad
         const fill = getRandomFill(palette, options); // Get fill style
         const stroke = options.strokeColor; // Base stroke color
         // Adjust stroke weight and opacity based on depth
         const sw = Math.max(0.1, options.strokeWeight * (1 - depth / maxDepth));
         const op = Math.max(0.1, options.opacity * (1 - depth / (maxDepth * 1.5)));
         // Calculate center and radius for shapes within the quad
         const cx = x + width / 2;
         const cy = y + height / 2;
         // Base radius/size, scaled by options and quad size
         const r = Math.min(width, height) / 2 * 0.8 * options.scale;

         // Choose a random shape type for the leaf node
         const leafType = randomInt(0, 4);
         switch(leafType) {
             case 0: // Rectangle (fills most of the quad)
                 createSVGElement('rect', { x: x + width*0.1, y: y + height*0.1, width: Math.max(1, width*0.8), height: Math.max(1, height*0.8), fill, stroke, 'stroke-width': sw, opacity: op}, parent);
                 break;
             case 1: // Circle (centered)
                 createSVGElement('circle', { cx, cy, r: Math.max(1, r), fill, stroke, 'stroke-width': sw, opacity: op}, parent);
                 break;
             case 2: // Ellipse (random orientation/ratio)
                  createSVGElement('ellipse', { cx, cy, rx: Math.max(1, r), ry: Math.max(1, r * random(0.5, 1)), fill, stroke, 'stroke-width': sw, opacity: op, transform: `rotate(${random(0,90)} ${cx} ${cy})` }, parent);
                 break;
             case 3: // Polygon (Triangle/Diamond/etc.)
                 const points = [];
                 const sides = randomInt(3, 6); // 3 to 6 sides
                  for (let i = 0; i < sides; i++) {
                     const angle = (i / sides) * Math.PI * 2; // Angle for vertex
                     points.push(`${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`); // Calculate vertex position
                 }
                 createSVGElement('polygon', { points: points.join(' '), fill, stroke, 'stroke-width': sw, opacity: op}, parent);
                 break;
             case 4: // Arc or Path segment (simple example)
                 const startAngle = random(0, Math.PI * 2); // Random start angle
                 const endAngle = startAngle + random(Math.PI / 2, Math.PI * 1.5); // Random arc length
                 const largeArc = (endAngle - startAngle) >= Math.PI ? 1 : 0; // Flag for arcs > 180 degrees
                 // Calculate start and end points of the arc
                 const x1 = cx + Math.cos(startAngle) * r;
                 const y1 = cy + Math.sin(startAngle) * r;
                 const x2 = cx + Math.cos(endAngle) * r;
                 const y2 = cy + Math.sin(endAngle) * r;
                 // Create the path element using SVG arc command (A)
                 createSVGElement('path', {
                     d: `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`, // M=MoveTo, A=ArcTo
                     fill: 'none', // Arcs are typically not filled
                     stroke: randomChoice(palette) || stroke, // Use random palette color or default stroke
                     'stroke-width': sw * 1.5, // Make arcs slightly thicker
                     opacity: op
                 }, parent);
                 break;
         }
    }
}


function generateFibonacciPattern(parent, options, palette) {
    const { viewportWidth: width, viewportHeight: height, complexity, density, repetition, scale, strokeWeight, opacity, strokeColor } = options;
    // Max radius based on viewport and scale
    const maxRadius = Math.min(width, height) * 0.45 * scale;
    // Number of elements based on complexity, density, repetition
    const numElements = Math.max(10, Math.floor(50 * complexity * (density / 100) * repetition));
    const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio
    const goldenAngle = 2 * Math.PI * (1 - 1 / phi); // Golden angle in radians
    let elementCount = 0;

    // Center the spiral using a group transform
    const group = createSVGElement('g', { transform: `translate(${width / 2}, ${height / 2})` }, parent);

    // Generate elements along the spiral
    for (let i = 0; i < numElements; i++) {
        const theta = i * goldenAngle; // Angle for this element
        // Distance from center, using sqrt for more even distribution (phyllotaxis)
        const distance = maxRadius * Math.sqrt(i / numElements);
        const x = distance * Math.cos(theta); // Cartesian X
        const y = distance * Math.sin(theta); // Cartesian Y

        // Calculate base size: influenced by complexity and position (outer elements smaller)
        const baseSize = Math.max(1, maxRadius * 0.1 * (1 - i / numElements) * (complexity / 5));
        let size = baseSize;
        // Optional: Use actual Fibonacci sequence for first few element sizes for visual effect
        // if (i < 10) { size = Math.max(1, fibonacci(10 - i) * maxRadius * 0.005 * complexity); }

        const fill = getRandomFill(palette, options); // Get fill style
        const stroke = strokeColor; // Base stroke color
        const sw = strokeWeight; // Base stroke weight
        const op = opacity; // Base opacity

        // Vary shape type based on index (creates rings of similar shapes)
        const shapeType = i % randomInt(3, 6); // Cycle through 3 to 6 shape types
        switch (shapeType) {
            case 0: // Circle
                createSVGElement('circle', { cx: x, cy: y, r: Math.max(1, size), fill, stroke, 'stroke-width': sw, opacity: op }, group);
                break;
            case 1: // Square (rotated towards center/away from center)
                createSVGElement('rect', { x: x - size / 2, y: y - size / 2, width: Math.max(1, size), height: Math.max(1, size), fill, stroke, 'stroke-width': sw, opacity: op, transform: `rotate(${theta * 180 / Math.PI + random(-10, 10)}, ${x}, ${y})` }, group);
                break;
            case 2: // Triangle (equilateral, pointing outwards)
                 const points = [];
                 for (let j = 0; j < 3; j++) {
                     const angle = theta + j * (2 * Math.PI / 3); // Angles for 3 vertices
                     points.push(`${x + size * Math.cos(angle)},${y + size * Math.sin(angle)}`);
                 }
                 createSVGElement('polygon', { points: points.join(' '), fill, stroke, 'stroke-width': sw, opacity: op }, group);
                break;
             case 3: // Ellipse (aligned with spiral direction)
                 createSVGElement('ellipse', { cx: x, cy: y, rx: Math.max(1, size * random(0.8, 1.2)), ry: Math.max(1, size * random(0.5, 1)), fill, stroke, 'stroke-width': sw, opacity: op, transform: `rotate(${theta * 180 / Math.PI + random(-10, 10)}, ${x}, ${y})`}, group);
                break;
             case 4: // Line segment radiating outwards
                 const len = size * 2; // Length of the line
                 createSVGElement('line', {
                     x1: x - Math.cos(theta) * len / 2, y1: y - Math.sin(theta) * len / 2, // Inner point
                     x2: x + Math.cos(theta) * len / 2, y2: y + Math.sin(theta) * len / 2, // Outer point
                     stroke: randomChoice(palette) || stroke, // Random palette color or default
                     'stroke-width': sw * random(0.5, 1.5), // Vary stroke width
                     opacity: op
                 }, group);
                 break;
             // Add more cases: Star? Arc? Different polygon?
        }
        elementCount++; // Increment element count
    }

    // Optionally add a connecting spiral path for visual structure
    if (complexity > 5 && density > 50 && repetition > 1) { // Condition on settings
        const pathPoints = [];
        // Sample points along the spiral path
        const step = Math.max(1, Math.floor(numElements / (50 * repetition))); // Adjust sampling step
        for (let i = 0; i < numElements; i += step) {
            const theta = i * goldenAngle;
            const distance = maxRadius * Math.sqrt(i / numElements);
            pathPoints.push(`${distance * Math.cos(theta)},${distance * Math.sin(theta)}`);
        }
        // Draw the path if enough points were sampled
        if (pathPoints.length > 1) {
             createSVGElement('path', {
                 // M = MoveTo first point, L = LineTo subsequent points
                 d: `M ${pathPoints[0]} L ${pathPoints.slice(1).join(' L ')}`,
                 fill: 'none', // Path is not filled
                 stroke: strokeColor, // Use base stroke color
                 'stroke-width': strokeWeight * 0.5, // Make path thinner
                 opacity: 0.4 // Make path semi-transparent
             }, group); // Add path to the centered group
            elementCount++; // Count the path as an element
        }
    }

    // Return results
    return {
        elementCount,
        goldenRatio: phi.toFixed(8),
        goldenAngleRad: goldenAngle.toFixed(8),
        numElementsGenerated: numElements
    };
}


function generateMandelbrotPattern(parent, options, palette) {
     const { viewportWidth: width, viewportHeight: height, complexity, density, scale, strokeWeight, opacity, strokeColor } = options;
     let elementCount = 0;
     // Resolution of the grid for calculation, scales with complexity
     const resolution = Math.max(10, Math.min(150, Math.floor(complexity * 10))); // Capped resolution
     const cellWidth = width / resolution;
     const cellHeight = height / resolution;
     // Density threshold: Higher density means lower threshold (more points calculated/drawn)
     const densityThreshold = 1 - (density / 100);

     // Mandelbrot calculation parameters (region of the complex plane)
     const xMin = -2.1, xMax = 0.6, yMin = -1.2, yMax = 1.2;
     // Max iterations: More iterations give finer detail, scales with complexity
     const maxIter = Math.floor(complexity * 15) + 20;

     // Iterate through the grid cells
     for (let row = 0; row < resolution; row++) {
         for (let col = 0; col < resolution; col++) {
            // Skip calculation based on density
            if (Math.random() < densityThreshold) continue;

             // Map grid cell coordinates (col, row) to complex plane coordinates (x0, y0)
             const x0 = xMin + (xMax - xMin) * (col / resolution);
             const y0 = yMin + (yMax - yMin) * (row / resolution);
             let x = 0, y = 0, iter = 0, x2 = 0, y2 = 0; // Initialize iteration variables

             // Mandelbrot iteration: z_{n+1} = z_n^2 + c, where c = x0 + i*y0
             // Check if the point escapes (|z|^2 > 4) within maxIter iterations
             while (x2 + y2 <= 4 && iter < maxIter) {
                 // Calculate next iteration:
                 // Real part: x = x^2 - y^2 + x0
                 // Imaginary part: y = 2*x*y + y0 (using previous x, y)
                 y = 2 * x * y + y0; // Calculate new y first
                 x = x2 - y2 + x0; // Calculate new x using old x2, y2
                 x2 = x * x; // Precompute x^2 for next iteration/check
                 y2 = y * y; // Precompute y^2 for next iteration/check
                 iter++; // Increment iteration counter
             }

             // Draw something if the point escaped (iter < maxIter)
             if (iter < maxIter && iter > 0) {
                 const normIter = iter / maxIter; // Normalized iteration count (0 to 1)
                 // Select color from palette based on iteration count
                 const colorIndex = Math.floor(normIter * (palette.length - 1));
                 const fillColor = palette[colorIndex] || 'grey'; // Fallback color

                 // Calculate size of the element based on escape speed (faster escape = smaller size)
                 const size = Math.max(1, Math.min(cellWidth, cellHeight) * 0.9 * (1 - normIter) * scale);
                 // Calculate pixel coordinates for the center of the cell
                 const px = col * cellWidth + cellWidth / 2;
                 const py = row * cellHeight + cellHeight / 2;
                 // Use thinner stroke for these elements
                 const sw = Math.max(0.1, strokeWeight * 0.5);
                 const op = opacity; // Base opacity

                 // Vary shape based on iteration count or position
                  const shapeType = iter % 4; // Cycle through 4 shapes
                  switch(shapeType) {
                      case 0: // Circle
                          createSVGElement('circle', {cx:px, cy:py, r:Math.max(1, size/2), fill:fillColor, stroke:strokeColor, 'stroke-width':sw, opacity:op}, parent); break;
                      case 1: // Square
                          createSVGElement('rect', {x:px-size/2, y:py-size/2, width:Math.max(1, size), height:Math.max(1, size), fill:fillColor, stroke:strokeColor, 'stroke-width':sw, opacity:op}, parent); break;
                      case 2: // Rotating Ellipse
                          createSVGElement('ellipse', {cx:px, cy:py, rx:Math.max(1, size/2), ry:Math.max(1, size/4), fill:fillColor, stroke:strokeColor, 'stroke-width':sw, opacity:op, transform:`rotate(${iter*5} ${px} ${py})`}, parent); break;
                      case 3: // Diamond (4-sided polygon)
                        const pts = `${px},${py-size/2} ${px+size/2},${py} ${px},${py+size/2} ${px-size/2},${py}`;
                        createSVGElement('polygon', {points:pts, fill:fillColor, stroke:strokeColor, 'stroke-width':sw, opacity:op}, parent); break;
                  }
                 elementCount++; // Increment element count
             }
             // Optional: Draw points *inside* the set (iter === maxIter) with a different style
             // else if (iter === maxIter && density > 80) {
             //     createSVGElement('circle', {cx:px, cy:py, r:1, fill: strokeColor, opacity: 0.5}, parent);
             //     elementCount++;
             // }
         }
     }

    // Return results
    return { elementCount, resolution, maxIterations: maxIter };
}

function generatePrimePattern(parent, options, palette) {
    const { viewportWidth: width, viewportHeight: height, complexity, density, repetition, scale } = options;
    let elementCount = 0;
    // Number of primes to generate, based on settings
    const numElements = Math.max(10, Math.floor(100 * complexity * (density / 100) * repetition));
    const primes = [];
    let num = 2; // Start checking from 2

    // Generate the required number of prime numbers
    while (primes.length < numElements) {
        if (isPrime(num)) { // Use the isPrime utility function
            primes.push(num);
        }
        num++;
    }

    // Handle edge case where no primes are found (shouldn't happen with numElements >= 10)
    if (primes.length === 0) return { elementCount: 0, primeCount: 0 };

    const largestPrime = primes[primes.length - 1]; // Get the largest prime generated

    // Choose a layout type randomly (Grid or Spiral)
    const layoutType = randomInt(0, 1);

    if (layoutType === 0) { // Grid Layout
        const gridSize = Math.ceil(Math.sqrt(primes.length)); // Determine grid dimensions
        const cellWidth = width / gridSize;
        const cellHeight = height / gridSize;

        // Place each prime in the grid
        for (let i = 0; i < primes.length; i++) {
            const prime = primes[i];
            const row = Math.floor(i / gridSize);
            const col = i % gridSize;
            // Calculate center position of the cell
            const x = col * cellWidth + cellWidth / 2;
            const y = row * cellHeight + cellHeight / 2;
            // Calculate size based on prime value relative to largest (log scale for better distribution)
            const size = Math.max(2, Math.min(cellWidth, cellHeight) * 0.8 * (Math.log(prime + 1) / Math.log(largestPrime + 1)) * scale);
            // Draw the element representing the prime
            drawPrimeElement(parent, x, y, size, prime, options, palette);
            elementCount++;
        }
    } else { // Spiral Layout (Ulam spiral variation)
         let x = width / 2, y = height / 2; // Start at center
         // Calculate step size based on viewport and number of primes
         let step = Math.min(width, height) / Math.sqrt(primes.length) * 0.5 * scale; // Adjust step size
         let dx = step, dy = 0; // Initial movement direction (right)
         let stepsTaken = 0, stepsLimit = 1, turnCounter = 0; // Spiral control variables

         // Place each prime along the spiral path
         for (let i = 0; i < primes.length; i++) {
             const prime = primes[i];
             // Calculate size based on prime value or index
             const size = Math.max(1, step * 0.8 * (Math.log(prime + 1) / Math.log(largestPrime + 1)) * scale);
             // Draw the element representing the prime at the current spiral position
             drawPrimeElement(parent, x, y, size, prime, options, palette);
             elementCount++;

             // Move to the next position in the spiral
             x += dx; y += dy;
             stepsTaken++;

             // Check if it's time to turn
             if (stepsTaken >= stepsLimit) {
                 stepsTaken = 0; // Reset steps taken in current direction
                 // Turn counter-clockwise: (dx, dy) -> (-dy, dx)
                 [dx, dy] = [-dy, dx];
                 turnCounter++;
                 // Increase the number of steps needed before the next turn every 2 turns
                 if (turnCounter >= 2) {
                     turnCounter = 0;
                     stepsLimit++;
                 }
             }
         }
    }

     // Optional: Draw connections between twin primes (primes p, p+2) - More complex
     // if (complexity > 6 && density > 60) {
     //     // Requires mapping primes back to their positions (especially complex for spiral)
     //     // ... implementation omitted for brevity ...
     // }

     // Return results
     return { elementCount, primeCount: primes.length, largestPrime };
}

// Helper function for drawing elements in the prime pattern
function drawPrimeElement(parent, x, y, size, primeValue, options, palette) {
    const fill = getRandomFill(palette, options); // Get fill style
    const stroke = options.strokeColor; // Base stroke color
    const sw = options.strokeWeight; // Base stroke weight
    const op = options.opacity; // Base opacity

    // Choose shape based on prime modulo (e.g., prime % 5)
    const shapeType = primeValue % 5;
    switch (shapeType) {
        case 0: // Circle
            createSVGElement('circle', { cx:x, cy:y, r:Math.max(1, size/2), fill, stroke, 'stroke-width': sw, opacity: op }, parent); break;
        case 1: // Square
            createSVGElement('rect', { x:x-size/2, y:y-size/2, width:Math.max(1, size), height:Math.max(1, size), fill, stroke, 'stroke-width': sw, opacity: op }, parent); break;
        case 2: // Triangle (equilateral)
            // Calculate vertices for an equilateral triangle centered at (x, y)
            const p = [
                `${x},${y - size / 2 / Math.cos(Math.PI / 6)}`, // Top vertex
                `${x + size / 2},${y + size / 2 * Math.tan(Math.PI / 6)}`, // Bottom right
                `${x - size / 2},${y + size / 2 * Math.tan(Math.PI / 6)}` // Bottom left
            ].join(' ');
            createSVGElement('polygon', { points:p, fill, stroke, 'stroke-width': sw, opacity: op }, parent); break;
        case 3: // Star (simple 4-point)
            // Points for a simple diamond/4-point star shape
            const p2 = [`${x},${y-size/2}`, `${x+size/4},${y}`, `${x},${y+size/2}`, `${x-size/4},${y}`].join(' ');
            createSVGElement('polygon', { points:p2, fill, stroke, 'stroke-width': sw, opacity: op }, parent); break;
        case 4: // Ring / Donut (using two circles or stroke-dasharray)
            // Draw outer circle with stroke, no fill
            createSVGElement('circle', { cx:x, cy:y, r:Math.max(1, size/2), fill:'none', stroke:fill, 'stroke-width': Math.max(0.5, sw * 1.5), opacity: op }, parent);
            // Optional: Punch hole with background color (simpler than clip-path)
            // if (size > 4) {
            //    createSVGElement('circle', { cx:x, cy:y, r:size/4, fill:options.bgColor || 'white', stroke:'none', opacity: 1 }, parent);
            // }
            break;
    }
}

// NEW Pattern: Trigonometric Waves
function generateTrigPattern(parent, options, palette) {
     const { viewportWidth: width, viewportHeight: height, complexity, density, repetition, scale, strokeWeight, opacity, strokeColor } = options;
     let elementCount = 0;
     // Number of waves based on complexity and repetition
     const numWaves = Math.floor(complexity * repetition);
     // Number of points per wave based on density (more points = smoother curve)
     const pointsPerWave = Math.max(20, Math.floor(100 * (density / 100)) + 10);

    // Generate each wave
    for (let i = 0; i < numWaves; i++) {
        const pathPoints = []; // Array to store points for the path 'd' attribute
        // Random amplitude, frequency, phase, and vertical offset for variety
        const amplitude = random(height * 0.05, height * 0.4) * scale; // Wave height
        const frequency = random(0.5, complexity / 2 + 0.5); // How many cycles across the width
        const phase = random(0, Math.PI * 2); // Horizontal shift
        const yOffset = random(amplitude, height - amplitude); // Vertical position
        const funcType = randomChoice(['sin', 'cos', 'tan']); // Choose trig function

        // Calculate points along the wave
        for (let j = 0; j <= pointsPerWave; j++) {
            const x = (j / pointsPerWave) * width; // X position along the width
            let y = yOffset; // Start with base vertical offset

            // Calculate Y based on the chosen trig function
            switch(funcType) {
                case 'sin':
                    y += Math.sin( (j / pointsPerWave) * Math.PI * 2 * frequency + phase) * amplitude;
                    break;
                 case 'cos':
                     y += Math.cos( (j / pointsPerWave) * Math.PI * 2 * frequency + phase) * amplitude;
                     break;
                 case 'tan':
                      // Handle tan carefully due to asymptotes (vertical lines)
                      let angle = (j / pointsPerWave) * Math.PI * frequency + phase;
                      // Avoid calculating tan very close to asymptotes (k*PI + PI/2)
                      if (Math.abs(Math.cos(angle)) < 0.01) {
                          // Skip this point or handle discontinuity (e.g., start new path segment)
                          // For simplicity, we might just get a large value and clamp it
                      }
                      let tanVal = Math.tan(angle);
                      // Clamp extreme values to prevent huge jumps and keep wave visible
                      tanVal = Math.max(-5, Math.min(5, tanVal)); // Clamp between -5 and 5
                      y += tanVal * amplitude * 0.2; // Scale down tan amplitude significantly
                      break;
            }

             // Ensure y stays within the SVG viewport bounds
            y = Math.max(0, Math.min(height, y));
            // Add the calculated point to the path array
            pathPoints.push(`${x},${y}`);
        }

         // Draw the path if enough points were generated
         if (pathPoints.length > 1) {
             createSVGElement('path', {
                 // M = MoveTo first point, L = LineTo subsequent points
                 d: `M ${pathPoints[0]} L ${pathPoints.slice(1).join(' L ')}`,
                 fill: 'none', // Waves are typically not filled
                 stroke: randomChoice(palette) || strokeColor, // Use random palette color or default
                 'stroke-width': Math.max(0.5, strokeWeight * random(0.5, 1.5)), // Vary stroke width
                 opacity: opacity * random(0.7, 1) // Vary opacity slightly
             }, parent); // Append path to parent group
             elementCount++; // Increment element count
         }
    }
    // Return results
    return { elementCount, waves: numWaves, pointsPerWave: pointsPerWave };
}


// NEW Pattern: Bezier Curves
function generateBezierPattern(parent, options, palette) {
    const { viewportWidth: width, viewportHeight: height, complexity, density, repetition, strokeWeight, opacity, strokeColor } = options;
    let elementCount = 0;
    // Number of curves based on settings
    const numCurves = Math.floor(complexity * (density / 100) * 5 * repetition);

    // Generate each curve
    for (let i = 0; i < numCurves; i++) {
        // Define start, end, and control points randomly within the viewport
        const x1 = random(0, width);
        const y1 = random(0, height);
        const x2 = random(0, width);
        const y2 = random(0, height);
        // Control points determine the curve's shape
        const cx1 = random(0, width);
        const cy1 = random(0, height);
        const cx2 = random(0, width);
        const cy2 = random(0, height);

        // --- Use captured coordinates if available ---
        // Use captured X/Y for start point if available, otherwise use random x1/y1
        const startX = state.capturedX ?? x1;
        const startY = state.capturedY ?? y1;
        // Use captured Vector X/Y for end point if available, otherwise use random x2/y2
        const endX = (state.capturedV && state.capturedV.x !== null) ? state.capturedV.x : x2;
        const endY = (state.capturedV && state.capturedV.y !== null) ? state.capturedV.y : y2;
        // Could also use captured points for control points with some offset/logic

         // Create the path element using the cubic Bezier command (C)
         createSVGElement('path', {
             // d attribute: M = MoveTo start, C = Cubic Bezier curve to end using control points
             d: `M ${startX} ${startY} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${endX} ${endY}`,
             fill: 'none', // Bezier curves are typically not filled
             stroke: randomChoice(palette) || strokeColor, // Use random palette color or default
             'stroke-width': Math.max(0.5, strokeWeight * random(0.5, 2)), // Vary stroke width
             opacity: opacity * random(0.5, 1) // Vary opacity
         }, parent); // Append path to parent group
         elementCount++; // Increment element count
    }

    // Return results
    return { elementCount, curves: numCurves, type: 'Cubic Bezier' };
}

// NEW Pattern: Lissajous Curves
function generateLissajousPattern(parent, options, palette) {
    const { viewportWidth: width, viewportHeight: height, complexity, density, repetition, scale, strokeWeight, opacity, strokeColor } = options;
    let elementCount = 0;
    // Number of curves based on complexity and repetition
    const numCurves = Math.max(1, Math.floor(complexity * 0.5 * repetition));
    // Number of steps (points) per curve based on density
    const steps = Math.max(50, Math.floor(100 * (density / 100)) + 50);

    // Center and radius for the curves
    const centerX = width / 2;
    const centerY = height / 2;
    const radiusX = width * 0.4 * scale; // Max horizontal extent
    const radiusY = height * 0.4 * scale; // Max vertical extent

    // Generate each Lissajous curve
    for (let i = 0; i < numCurves; i++) {
         // Frequencies (a, b) determine the shape. Integers often produce closed curves.
         // Higher complexity allows for higher frequencies.
         const a = randomInt(1, Math.floor(complexity / 2) + 1);
         const b = randomInt(1, Math.floor(complexity / 2) + 1);
         // Phase difference (delta) also affects the shape
         const delta = Math.PI / randomChoice([1, 2, 3, 4, 6, 8]); // Common fractions of PI

        const pathPoints = []; // Array to store points for the path
        // Calculate points along the curve using parametric equations
        for (let j = 0; j <= steps; j++) {
            // Parameter t ranges from 0 to 2*PI (or more for repetition)
            const t = (j / steps) * Math.PI * 2 * Math.max(1, repetition / 2); // Repetition affects how many times the curve is traced
            // Lissajous equations:
            const x = centerX + radiusX * Math.sin(a * t + delta);
            const y = centerY + radiusY * Math.sin(b * t);
            pathPoints.push(`${x},${y}`); // Add point to array
        }

         // Draw the path if enough points were generated
         if (pathPoints.length > 1) {
             createSVGElement('path', {
                 // M = MoveTo first point, L = LineTo subsequent points
                 d: `M ${pathPoints[0]} L ${pathPoints.slice(1).join(' L ')}`,
                 fill: 'none', // Curves are not filled
                 stroke: randomChoice(palette) || strokeColor, // Use random palette color or default
                 'stroke-width': Math.max(0.5, strokeWeight * random(0.8, 1.2)), // Slightly vary stroke width
                 opacity: opacity * random(0.7, 1) // Slightly vary opacity
             }, parent); // Append path to parent group
             elementCount++; // Increment element count
         }
    }
     // Return results
     return { elementCount, curves: numCurves, stepsPerCurve: steps };
}



/**
 * Generates an SVG pattern based on the Padovan sequence.
 */

 function generatePadovanPattern(parent, options, palette) {
    console.log("Generating Padovan pattern...");
    const { viewportWidth: width, viewportHeight: height, complexity, density, scale, strokeWeight, opacity, strokeColor } = options;
    let elementCount = 0;

    // 1. Calculate Padovan Sequence
    // Determine number of terms based on complexity/density
    const numTerms = Math.max(10, Math.floor(complexity * 3 + density / 5) + 5);
    const sequence = [1, 1, 1]; // P(0), P(1), P(2)
    for (let n = 3; n < numTerms; n++) {
        // Formula: P(n) = P(n-2) + P(n-3)
        sequence[n] = sequence[n - 2] + sequence[n - 3];
        // Basic check for excessively large numbers (optional, depends on expected numTerms)
        if (sequence[n] > 1e6) {
             console.warn("Padovan sequence value exceeded limit, stopping early.");
             break;
        }
    }
     if (sequence.length <= 3) {
         console.warn("Padovan sequence too short to draw.");
         return { elementCount: 0, sequence: 'Padovan (Too Short)' };
     }


    // 2. Visualize as Line Spiral
    const sizeScale = scale * 5; // Adjust this factor to control overall size
    const angleIncrement = (2 * Math.PI) / 3; // Rotate 120 degrees (fits triangle spiral pattern)

    // Starting position (center) and angle
    let currentX = width / 2;
    let currentY = height / 2;
    let currentAngle = 0; // Start pointing right (0 radians)

    // Create a group for the spiral elements
    const spiralGroup = createSVGElement('g', {
        stroke: strokeColor, // Apply base stroke color to group
        'stroke-width': strokeWeight,
        opacity: opacity
    }, parent);


    // Loop through sequence terms (skip initial 1,1,1)
    for (let i = 3; i < sequence.length; i++) {
        const segmentLength = Math.max(1, sequence[i] * sizeScale); // Length of the current line segment

        // Calculate the end point of the current segment
        const nextX = currentX + segmentLength * Math.cos(currentAngle);
        const nextY = currentY + segmentLength * Math.sin(currentAngle);

        // Draw the line segment
        createSVGElement('line', {
            x1: currentX,
            y1: currentY,
            x2: nextX,
            y2: nextY,
            // Optional: Vary color per segment
            stroke: randomChoice(palette) || strokeColor,
            // Optional: Vary stroke width slightly?
            // 'stroke-width': strokeWeight * random(0.8, 1.2)
        }, spiralGroup); // Add line to the spiral group

        elementCount++;

        // Update current position to the end of the segment
        currentX = nextX;
        currentY = nextY;

        // Update the angle for the next segment
        currentAngle += angleIncrement;
    }

    console.log(`Generated Padovan sequence with ${sequence.length} terms.`);
    return { elementCount, sequenceName: 'Padovan', terms: sequence.length };
}


/**
 * Generates an SVG pattern based on Recamán's sequence.
 * Typically visualized as a series of connecting semicircles/arcs.
 * @param {SVGElement} parent - The parent SVG group element (<g>) to append shapes to.
 * @param {object} options - The generation options object.
 * @param {string[]} palette - The array of hex color strings for the current palette.
 * @returns {object} An object containing generation results (e.g., elementCount).
 */


///// RECAMAN


function generateRecamanPattern(parent, options, palette) {
    console.log("Generating Recamán's sequence pattern...");
    const { viewportWidth: width, viewportHeight: height, complexity, density, scale, strokeWeight, opacity, strokeColor } = options;
    let elementCount = 0;

    // 1. Calculate Recamán's Sequence
    const numTerms = Math.max(10, Math.floor(complexity * 5 + density / 2)); // Determine number of terms
    const sequence = [0]; // a(0) = 0
    const usedNumbers = new Set([0]); // Keep track of numbers used in the sequence

    for (let n = 1; n < numTerms; n++) {
        const previousTerm = sequence[n - 1];
        const backward = previousTerm - n; // Potential next term by subtracting n

        // Check if backward step is valid (positive and not already used)
        if (backward > 0 && !usedNumbers.has(backward)) {
            sequence[n] = backward;
        } else {
            // Otherwise, step forward
            sequence[n] = previousTerm + n;
        }
        // Add the new term to the set of used numbers
        usedNumbers.add(sequence[n]);

        // Optional: Check for very large numbers if needed
        if (sequence[n] > 1e6) {
             console.warn("Recamán sequence value exceeded limit, stopping early.");
             break;
        }
    }

    if (sequence.length <= 1) {
        console.warn("Recamán sequence too short to draw.");
        return { elementCount: 0, sequence: 'Recamán (Too Short)' };
    }

    // 2. Visualize as Alternating Arcs
    const baselineY = height / 2; // Draw arcs relative to the vertical center

    // Determine the range of sequence values to scale appropriately
    let minVal = 0;
    let maxVal = 0;
    sequence.forEach(val => {
        if (val < minVal) minVal = val;
        if (val > maxVal) maxVal = val;
    });
    const sequenceRange = Math.max(1, maxVal - minVal); // Avoid division by zero

    // Calculate scaling factor to fit the sequence range within ~80% of viewport width
    const targetWidth = width * 0.8;
    const effectiveScale = scale * (targetWidth / sequenceRange);

    // Calculate offset to center the drawing horizontally
    const drawingWidth = sequenceRange * effectiveScale;
    const offsetX = (width - drawingWidth) / 2 - (minVal * effectiveScale); // Adjust offset by minVal

    // Create a group for the arcs, applying centering transform and base styles
    const arcGroup = createSVGElement('g', {
        transform: `translate(${offsetX.toFixed(2)}, 0)`, // Center horizontally
        stroke: strokeColor,
        'stroke-width': strokeWeight,
        opacity: opacity,
        fill: 'none' // Arcs are not filled
    }, parent);

    // Loop through sequence terms to draw arcs between consecutive points
    for (let n = 1; n < sequence.length; n++) {
        const val1 = sequence[n - 1];
        const val2 = sequence[n];

        // Map sequence values to horizontal screen coordinates
        const x1 = val1 * effectiveScale;
        const x2 = val2 * effectiveScale;

        // Calculate arc properties
        const diameter = Math.abs(x2 - x1);
        const radius = diameter / 2;

        // Skip drawing if the arc is too small to be visible
        if (radius < 0.1) continue;

        // Determine arc direction (sweep-flag): 0 = clockwise, 1 = counter-clockwise
        // Alternate direction based on step number 'n'
        const sweepFlag = n % 2;

        // Create the SVG path data string for the arc
        // M = MoveTo start point
        // A = ArcTo: rx ry x-axis-rotation large-arc-flag sweep-flag x y
        const d = `M ${x1.toFixed(2)} ${baselineY} A ${radius.toFixed(2)} ${radius.toFixed(2)} 0 0 ${sweepFlag} ${x2.toFixed(2)} ${baselineY}`;

        // Create the path element for the arc
        createSVGElement('path', {
            d: d,
            stroke: randomChoice(palette) || strokeColor // Use random color from palette
        }, arcGroup); // Add arc to the transformed group

        elementCount++;
    }

    console.log(`Generated Recamán sequence with ${sequence.length} terms.`);
    return { elementCount, sequenceName: 'Recamán', terms: sequence.length };

}

// ----- Animation Functions -----

/**
 * Starts the animation loop based on the current options.
 */
function startAnimation() {
    // Exit if animation is disabled in options or already running
    if (!state.currentOptions?.animation || state.isAnimating) return;

    // Select all relevant visual elements within the SVG canvas
    // Exclude the background rectangle if it exists
    const elements = dom.svg.querySelectorAll('circle, rect:not([fill="' + state.currentOptions.bgColor + '"]), ellipse, polygon, path, line');
    if (elements.length === 0) return; // Exit if no elements to animate

    console.log(`Starting animation (${state.currentOptions.animationType})...`);
    state.isAnimating = true;
    const startTime = Date.now();
    const animationType = state.currentOptions.animationType;
    const baseOpacity = state.currentOptions.opacity;
    const baseStrokeWeight = state.currentOptions.strokeWeight;
    const complexityFactor = state.currentOptions.complexity / 10; // Factor from 0.1 to 1.0

    // Store original attributes if needed for complex reset or tweening (optional)
    // elements.forEach(el => { el._originalAttrs = { transform: el.getAttribute('transform'), ... }; });

    // --- Animation Loop Function ---
    function animateFrame() {
        // Stop the loop if the animation flag has been turned off
        if (!state.isAnimating) {
            console.log("Animation stopped externally.");
            return;
        }

        const elapsed = Date.now() - startTime;
        // Phase cycles from 0 to 1 every 5 seconds (5000 ms)
        const phase = (elapsed % 5000) / 5000;

        // Animate each selected element
        elements.forEach((element, index) => {
            // Skip if element somehow got removed from DOM (shouldn't normally happen)
            if (!element.parentElement) return;

             // Calculate an individual phase offset for each element for variation
             // Adding (index / elements.length) * 0.5 ensures elements animate slightly out of sync
             const individualPhase = (phase + (index / elements.length) * 0.5) % 1;
             // Use sine of the phase to get a smooth oscillation between -1 and 1
             const sinPhase = Math.sin(individualPhase * Math.PI * 2);
             // Use cosine for values oscillating between 1 and -1 (starts at peak)
             const cosPhase = Math.cos(individualPhase * Math.PI * 2); // Value oscillating between 1 and -1

            try {
                // Apply animation based on the selected type
                switch(animationType) {
                    case 'pulse': // Pulse size (radius, width/height)
                        // Attempt to get original dimension (r, width, or fallback)
                        let originalSize = parseFloat(element.getAttribute('r')) || // Circle radius
                                           Math.max(parseFloat(element.getAttribute('width')), parseFloat(element.getAttribute('height'))) || // Rect/Ellipse max dimension
                                           5; // Fallback size
                         // Calculate pulse factor (1 +/- small amount based on sinPhase and complexity)
                        const pulseFactor = 1 + sinPhase * 0.1 * complexityFactor;
                        // Apply to relevant attribute, ensuring minimum size
                        if (element.tagName === 'circle') {
                            element.setAttribute('r', Math.max(1, originalSize * pulseFactor));
                        } else if (element.tagName === 'rect' || element.tagName === 'ellipse') {
                            // Basic scaling for rect/ellipse (more complex to scale proportionally)
                            // This requires storing original width/height or using transform:scale
                             let bbox = element.getBBox();
                             let cx = bbox.x + bbox.width / 2;
                             let cy = bbox.y + bbox.height / 2;
                             element.setAttribute('transform', `translate(${cx} ${cy}) scale(${pulseFactor}) translate(${-cx} ${-cy})`);

                        }
                        break;

                    case 'rotate': // Rotate element around its center
                         let currentTransform = element.getAttribute('transform') || '';
                         // Remove previous rotation applied by this animation to prevent accumulation
                         // This regex is basic, might need refinement for complex transforms
                         currentTransform = currentTransform.replace(/rotate\([^)]+\)/g, '').trim();
                         let bbox;
                         try {
                             bbox = element.getBBox(); // Get bounding box for center calculation
                         } catch(e) {
                             // Fallback if getBBox fails (e.g., element not rendered yet)
                             bbox = {x:0, y:0, width:0, height:0};
                             console.warn("getBBox failed for animation:", element.tagName, e);
                         }
                         const cx = bbox.x + bbox.width / 2;
                         const cy = bbox.y + bbox.height / 2;
                         // Apply new rotation, varying speed based on index
                         // phase * 360 gives degrees 0-360. Multiply by index factor for speed variation.
                         element.setAttribute('transform', `${currentTransform} rotate(${phase * 360 * (index % 3 + 1)}, ${cx}, ${cy})`);
                        break;

                    case 'opacity': // Fade opacity in and out
                        // Use the base opacity from options as the maximum
                        // Calculate opacity: base * (midpoint + oscillation)
                        // (cosPhase + 1) / 2 gives a value oscillating between 0 and 1
                        const targetOpacity = baseOpacity * (0.5 + (cosPhase + 1) * 0.25); // Oscillates between 0.5*base and 1.0*base
                        element.setAttribute('opacity', Math.max(0.1, Math.min(1, targetOpacity))); // Clamp between 0.1 and 1
                        break;

                     case 'morph': // Simple morph example: change stroke width
                         // Only animate stroke width if it's initially positive
                          const originalSW = parseFloat(element.getAttribute('stroke-width')) ?? baseStrokeWeight;
                          if (originalSW > 0) {
                              // Oscillate stroke width around its original value
                              const morphFactor = 1 + sinPhase * 0.3 * complexityFactor; // Morph amount scales with complexity
                              element.setAttribute('stroke-width', Math.max(0.1, originalSW * morphFactor)); // Ensure minimum stroke width
                          }
                         break;
                }
            } catch (e) {
                 // Log animation errors less intrusively
                 // console.warn("Animation error for element:", element.tagName, e);
                 // Ignore errors for elements that might not have the animated attribute (like <g>) or if getBBox fails.
            }
        });

        // Request the next frame, storing the ID
        state.animationFrame = requestAnimationFrame(animateFrame);
    } // --- End of Animation Loop Function ---

    // Start the animation loop
    state.animationFrame = requestAnimationFrame(animateFrame);
}

/**
 * Stops the currently running animation loop.
 */
export function stopAnimation() {
    // If an animation frame request is pending, cancel it
    if (state.animationFrame) {
        cancelAnimationFrame(state.animationFrame);
        state.animationFrame = null; // Clear the stored ID
    }
    // If the animation loop was active, log that it's stopping
    if (state.isAnimating) {
        console.log("Stopping animation.");
        state.isAnimating = false; // Set the flag to false
         // Optional: Reset elements to original state if attributes were stored
         // This requires storing original attributes before starting animation
         // dom.svg.querySelectorAll(...).forEach(el => { /* reset attributes from el._originalAttrs */ });
    }
}
