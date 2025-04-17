// public/js/modules/colorUtils.js

// ----- MODULE IMPORTS -----
// Import shared state object
import { state } from './state.js';
// Import cached DOM elements object
import { dom } from './dom.js';
// Import *only* the specific utility functions needed by the color functions:
import { randomInt, randomChoice, secureRandom, random, createSVGElement, generateUniqueId } from './utils.js';

// ----- COLOR MANAGEMENT FUNCTIONS -----

/**
 * Populates the color category and palette dropdown selectors
 * based on the data loaded into `state.allColors`.
 */
export function populateColorSelectors() {
    // Ensure state.allColors is populated (should be by the fetch in main.js)
    if (!state.allColors || Object.keys(state.allColors).length === 0) {
        console.error("Cannot populate selectors: state.allColors is empty!");
        // Optionally, disable selectors or show an error message in the UI
        if (dom.colorCategory) dom.colorCategory.disabled = true;
        if (dom.colorPalette) dom.colorPalette.disabled = true;
        return; // Exit if color data isn't available
    }

    // Ensure DOM elements are cached and available
    if (!dom.colorCategory || !dom.colorPalette) {
        console.error("Cannot populate selectors: DOM elements (colorCategory or colorPalette) not found/cached.");
        return;
    }

    // Enable selectors if they were previously disabled
    dom.colorCategory.disabled = false;
    dom.colorPalette.disabled = false;

    dom.colorCategory.innerHTML = ''; // Clear existing options

    // Add options for each category found in the state
    for (const category in state.allColors) {
        const option = document.createElement('option');
        option.value = category;
        // Basic capitalization and space insertion for display text
        option.textContent = category.charAt(0).toUpperCase() + category.slice(1).replace(/([A-Z])/g, ' $1').trim();
        dom.colorCategory.appendChild(option);
    }

    // Add a "Random Category" option at the end
    const randomCatOption = document.createElement('option');
    randomCatOption.value = 'random_category';
    randomCatOption.textContent = 'Random Category';
    dom.colorCategory.appendChild(randomCatOption);


    // Trigger update for the palette dropdown based on the initially selected category
    updatePaletteDropdown();

    // Remove previous listeners before adding new ones to prevent duplicates
    dom.colorCategory.removeEventListener('change', updatePaletteDropdown);
    dom.colorPalette.removeEventListener('change', updatePalettePreview);

    // Add listener for category changes to update the palette dropdown
    dom.colorCategory.addEventListener('change', updatePaletteDropdown);
    // Add listener for palette changes to update the color preview swatch
    dom.colorPalette.addEventListener('change', updatePalettePreview);
}

/**
 * Updates the options in the specific color palette dropdown (#color-palette)
 * based on the currently selected category in #color-category.
 */
export function updatePaletteDropdown() {
    // Ensure DOM elements are available
    if (!dom.colorCategory || !dom.colorPalette) {
        console.error("Cannot update palette dropdown: DOM elements not found/cached.");
        return;
    }

    const selectedCategory = dom.colorCategory.value;
    dom.colorPalette.innerHTML = ''; // Clear existing palette options

    // Handle the "Random Category" selection
    if (selectedCategory === 'random_category') {
        // If random category is chosen, only show a "Random Palette" option
        const randomOption = document.createElement('option');
        randomOption.value = 'random_palette';
        randomOption.textContent = 'Random Palette';
        dom.colorPalette.appendChild(randomOption);
    }
    // Check if the selected category exists in the loaded color data
    else if (state.allColors && state.allColors[selectedCategory]) {
        const palettes = state.allColors[selectedCategory];
        // Assuming each category key holds an array of {name, hex} objects representing a single palette
        if (Array.isArray(palettes)) {
             // Treat the whole category as one selectable palette in the dropdown
             const option = document.createElement('option');
             option.value = selectedCategory; // Use category name as the value
             option.textContent = selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1).replace(/([A-Z])/g, ' $1').trim(); // Formatted name
             dom.colorPalette.appendChild(option);

              // Add an option to select a random subset of colors from this specific category
             const randomInCatOption = document.createElement('option');
             randomInCatOption.value = 'random_in_category';
             randomInCatOption.textContent = 'Random Palette (from this Category)';
             dom.colorPalette.appendChild(randomInCatOption);
        } else {
             console.warn("Color category data structure might be unexpected for:", selectedCategory);
             // Handle unexpected structure, maybe add a default option
        }
    } else {
         console.warn("Selected category not found in color data:", selectedCategory);
         // Provide a default/fallback option in the palette dropdown if category is missing
         const fallbackOption = document.createElement('option');
         fallbackOption.value = 'fallback';
         fallbackOption.textContent = 'Fallback Colors';
         dom.colorPalette.appendChild(fallbackOption);
    }

    // Trigger the preview update after changing palette options
    updatePalettePreview();
}


/**
 * Gets the array of hex color strings for the currently selected palette.
 * Handles random selections and fallbacks.
 * Updates `state.currentPalette`.
 * @returns {string[]} An array of hex color strings.
 */
export function getColorPalette() {
    // Ensure DOM elements are available
    if (!dom.colorCategory || !dom.colorPalette) {
        console.error("Cannot get color palette: DOM elements not found/cached.");
        return ['#FF0000', '#00FF00', '#0000FF']; // Basic fallback
    }

    const category = dom.colorCategory.value;
    const paletteName = dom.colorPalette.value;
    let selectedPaletteHex = [];

    // Ensure state.allColors is available
    if (!state.allColors || Object.keys(state.allColors).length === 0) {
        console.error("Color data (state.allColors) not available for getColorPalette.");
        return ['#FF0000', '#00FF00', '#0000FF']; // Basic fallback
    }

    try { // Wrap logic in try/catch for better error handling
        if (paletteName === 'random_palette') {
            // Select a random category from the available ones
            const availableCategories = Object.keys(state.allColors);
            if (availableCategories.length > 0) {
                const randomCategory = randomChoice(availableCategories);
                // Ensure the chosen category actually has colors and is an array
                if (Array.isArray(state.allColors[randomCategory])) {
                     selectedPaletteHex = state.allColors[randomCategory]
                        .map(c => c?.hex) // Safely access hex property
                        .filter(Boolean); // Filter out null/undefined hex values
                }
            }
        } else if (paletteName === 'random_in_category' && category !== 'random_category') {
            // Select a random subset from the currently selected category
            if (Array.isArray(state.allColors[category])) {
                 let categoryColors = state.allColors[category]
                    .map(c => c?.hex)
                    .filter(Boolean);
                 // Shuffle the array
                 categoryColors.sort(() => 0.5 - secureRandom());
                 // Select a random number of colors (e.g., 5 to 10, or fewer if not available)
                 const subsetSize = randomInt(5, Math.min(10, categoryColors.length));
                 selectedPaletteHex = categoryColors.slice(0, subsetSize);
            }
        } else if (state.allColors[category] && Array.isArray(state.allColors[category])) {
            // Get all colors from the selected category/palette
            selectedPaletteHex = state.allColors[category]
                .map(c => c?.hex)
                .filter(Boolean);
        } else if (paletteName === 'fallback') {
            // Explicit fallback selection
            selectedPaletteHex = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#00FFFF', '#FF00FF'];
        }
        else {
            // Fallback if category/palette combination is somehow invalid
            console.warn(`Could not find selected palette ('${paletteName}' in category '${category}'), using fallback default.`);
            selectedPaletteHex = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#00FFFF', '#FF00FF'];
        }
    } catch (error) {
         console.error("Error during getColorPalette execution:", error);
         selectedPaletteHex = ['#AA0000', '#00AA00', '#0000AA']; // Different error fallback
    }


    // Final safety net: Ensure we always return *something* valid (an array of strings)
    if (!Array.isArray(selectedPaletteHex) || selectedPaletteHex.length === 0) {
        console.warn("Palette resulted in empty or invalid array, using safety fallback.");
        selectedPaletteHex = ['#333333', '#666666', '#999999', '#CCCCCC'];
    }

    // Filter one last time to ensure all elements are valid hex strings (basic check)
    selectedPaletteHex = selectedPaletteHex.filter(hex => typeof hex === 'string' && /^#[0-9A-F]{6}$/i.test(hex));

    // If still empty after filtering, use the ultimate fallback
     if (selectedPaletteHex.length === 0) {
          console.warn("Palette empty after hex validation, using ultimate fallback.");
          selectedPaletteHex = ['#444444', '#888888', '#BBBBBB'];
     }


    state.currentPalette = selectedPaletteHex; // Store the currently used palette hex values in the shared state
    // console.log("Current Palette Set:", state.currentPalette); // Log for debugging
    return state.currentPalette;
}

/**
 * Updates the color swatch preview area (#palette-preview)
 * based on the currently selected palette.
 */
export function updatePalettePreview() {
    // Ensure dom.palettePreview exists
    if (!dom.palettePreview) {
        console.warn("Cannot update preview, palette preview DOM element not found.");
        return;
    }

    const palette = getColorPalette(); // Get the hex values for the current selection
    dom.palettePreview.innerHTML = ''; // Clear previous swatches

    if (palette && Array.isArray(palette)) {
         palette.forEach(hex => {
            // Basic check for valid hex string format
            if (typeof hex === 'string' && hex.startsWith('#')) {
                const colorBox = document.createElement('div');
                colorBox.classList.add('color-box'); // Add class for styling
                colorBox.style.backgroundColor = hex;
                colorBox.title = hex; // Show hex value on hover
                dom.palettePreview.appendChild(colorBox);
            } else {
                 console.warn(`Invalid hex value found in palette for preview: ${hex}`);
            }
         });
    } else {
         console.warn("Cannot update preview, palette is invalid or empty:", palette);
         // Optionally display a message in the preview area
         dom.palettePreview.textContent = "No palette selected or available.";
    }
}


/**
 * Determines the fill style (solid color, gradient, pattern, or none)
 * based on user options and randomness.
 * Creates gradient/pattern definitions in SVG <defs> if needed.
 * @param {string[]} palette - Array of hex color strings.
 * @param {object} options - Current generation options (needs `fillType`).
 * @returns {string} - The fill value (e.g., '#FF0000', 'url(#gradient-123)', 'none').
 */
export function getRandomFill(palette, options) {
    // Ensure palette is valid, provide fallback
    if (!palette || palette.length === 0) {
        console.warn("getRandomFill called with empty palette, using fallback.");
        palette = ['#555555', '#888888', '#BBBBBB'];
    }
    // Ensure options object is valid
    options = options || {}; // Basic fallback for options
    const fillType = options.fillType || 'solid'; // Default to solid if not specified

    if (fillType === 'none') return 'none';

    const chance = secureRandom(); // Random number between 0 and 1

    // Ensure dom.defs exists for gradients/patterns
    if (!dom.defs && (fillType === 'gradient' || fillType === 'pattern')) {
         console.warn("SVG <defs> element not found, cannot create gradient/pattern. Falling back to solid color.");
         return randomChoice(palette) || '#888888'; // Fallback to solid
    }

    // Determine fill based on type and random chance
    // Adjust probabilities as desired
    if (fillType === 'gradient' && chance < 0.4) { // 40% chance for gradient if selected
        return createGradientFill(palette);
    }
    if (fillType === 'pattern' && chance >= 0.4 && chance < 0.8) { // 40% chance for pattern if selected
        return createPatternFill(palette);
    }

    // Default to solid color if type is 'solid', or if random chance falls through for gradient/pattern
    return randomChoice(palette) || '#888888'; // Final fallback color
}

/**
 * Creates an SVG linear or radial gradient definition in the <defs> section
 * and returns the URL reference to it.
 * @param {string[]} palette - Array of hex color strings to use for stops.
 * @returns {string} - The `url(#gradient-id)` string.
 */
export function createGradientFill(palette) {
    if (!dom.defs) {
        console.error("Cannot create gradient: SVG <defs> element not available.");
        return randomChoice(palette) || 'grey'; // Fallback
    }
    if (!palette || palette.length < 2) {
        console.warn("Cannot create gradient with less than 2 colors, using solid.");
        return palette?.[0] || 'grey'; // Use first color or fallback
    }


    const gradientId = generateUniqueId('gradient');
    const isLinear = secureRandom() < 0.7; // 70% chance for linear gradient
    let gradient;

    if (isLinear) {
        gradient = createSVGElement('linearGradient', {
            id: gradientId,
            x1: `${randomInt(0, 100)}%`, y1: `${randomInt(0, 100)}%`, // Random start point
            x2: `${randomInt(0, 100)}%`, y2: `${randomInt(0, 100)}%`  // Random end point
        });
    } else { // Radial Gradient
        gradient = createSVGElement('radialGradient', {
            id: gradientId,
            cx: `${randomInt(25, 75)}%`, cy: `${randomInt(25, 75)}%`, // Center offset
            r:  `${randomInt(50, 150)}%`, // Radius
            fx: `${randomInt(25, 75)}%`, fy: `${randomInt(25, 75)}%`  // Focal point offset
        });
    }

    // Add color stops to the gradient
    const numStops = randomInt(2, Math.min(4, palette.length)); // 2 to 4 stops, max available colors
    const usedColors = []; // Ensure some color variety if possible
    for (let i = 0; i < numStops; i++) {
        let stopColor = randomChoice(palette);
        // Try to pick a different color if palette is large enough
        if (palette.length > numStops && usedColors.includes(stopColor)) {
            stopColor = randomChoice(palette.filter(c => !usedColors.includes(c))) || stopColor;
        }
        usedColors.push(stopColor);

        createSVGElement('stop', {
            offset: `${Math.floor((i / (numStops - 1)) * 100)}%`, // Distribute stops evenly
            'stop-color': stopColor || 'grey', // Fallback stop color
            'stop-opacity': random(0.7, 1.0) // Random opacity for stops
        }, gradient); // Append stop to the gradient element
    }

    dom.defs.appendChild(gradient); // Add the completed gradient definition to SVG <defs>
    return `url(#${gradientId})`; // Return the reference URL
}

/**
 * Creates an SVG pattern definition in the <defs> section
 * with simple random shapes (dots, lines, etc.) and returns the URL reference.
 * @param {string[]} palette - Array of hex color strings.
 * @returns {string} - The `url(#pattern-id)` string.
 */
export function createPatternFill(palette) {
     if (!dom.defs) {
        console.error("Cannot create pattern: SVG <defs> element not available.");
        return randomChoice(palette) || 'lightgrey'; // Fallback
    }
     if (!palette || palette.length === 0) {
        console.warn("Cannot create pattern with empty palette, using solid.");
        return 'lightgrey'; // Fallback
    }

    const patternId = generateUniqueId('pattern');
    const size = randomInt(8, 25); // Size of the pattern tile

    // Create the <pattern> element
    const pattern = createSVGElement('pattern', {
        id: patternId,
        width: size,
        height: size,
        patternUnits: 'userSpaceOnUse', // Pattern coordinates relative to the element it's applied to
        // Optional: Add patternTransform for rotation, scaling etc.
        // patternTransform: `rotate(${randomInt(0, 90)})`
    });

    // Optional: Add a background color to the pattern tile itself
    if (secureRandom() > 0.5) { // 50% chance of pattern background
        createSVGElement('rect', {
            width: size, height: size,
            fill: randomChoice(palette),
            opacity: random(0.1, 0.3) // Low opacity background
        }, pattern);
    }

    // Add shapes to the pattern
    const patternShapeType = randomInt(0, 5); // Choose a type of shape for the pattern
    const strokeColor = randomChoice(palette) || 'grey';
    const fillColor = randomChoice(palette) || 'lightgrey';
    // Ensure fillColor is different from strokeColor if possible
    if (fillColor === strokeColor && palette.length > 1) {
        fillColor = randomChoice(palette.filter(c => c !== strokeColor)) || fillColor;
    }
    const strokeWidth = random(0.5, 1.5); // Thinner strokes for patterns

    switch (patternShapeType) {
         case 0: // Dots / Circles
             createSVGElement('circle', {
                 cx: size / 2, cy: size / 2,
                 r: size * random(0.15, 0.3), // Radius relative to tile size
                 fill: fillColor
             }, pattern);
             break;
         case 1: // Horizontal/Vertical Lines
             createSVGElement('line', {
                 x1: 0, y1: size / 2, x2: size, y2: size / 2, // Horizontal line
                 stroke: strokeColor, 'stroke-width': strokeWidth
             }, pattern);
             if (secureRandom() > 0.6) { // Less frequent perpendicular line
                  createSVGElement('line', {
                      x1: size / 2, y1: 0, x2: size / 2, y2: size, // Vertical line
                      stroke: strokeColor, 'stroke-width': strokeWidth
                  }, pattern);
             }
             break;
         case 2: // Diagonal Lines
             createSVGElement('line', {
                 x1: 0, y1: 0, x2: size, y2: size, // Diagonal top-left to bottom-right
                 stroke: strokeColor, 'stroke-width': strokeWidth
             }, pattern);
             if (secureRandom() > 0.6) { // Less frequent anti-diagonal line
                  createSVGElement('line', {
                      x1: size, y1: 0, x2: 0, y2: size, // Diagonal top-right to bottom-left
                      stroke: strokeColor, 'stroke-width': strokeWidth
                  }, pattern);
             }
             break;
         case 3: // Checkboard Pattern
             createSVGElement('rect', {
                 x: 0, y: 0, width: size / 2, height: size / 2, // Top-left square
                 fill: fillColor
             }, pattern);
             createSVGElement('rect', {
                 x: size / 2, y: size / 2, width: size / 2, height: size / 2, // Bottom-right square
                 fill: fillColor
             }, pattern);
             break;
         case 4: // Triangles
              createSVGElement('polygon', {
                  // Points for a simple triangle filling half the tile
                  points: `0,0 ${size},0 ${size/2},${size}`,
                  fill: fillColor
              }, pattern);
              // Optionally add another triangle with a different color
              if (secureRandom() > 0.5) {
                 createSVGElement('polygon', {
                     points: `0,${size} ${size},${size} ${size/2},0`,
                     fill: randomChoice(palette.filter(c => c !== fillColor)) || strokeColor // Try different color
                 }, pattern);
              }
             break;
         case 5: // Small centered shape (circle or square)
              const shape = secureRandom() > 0.5 ? 'circle' : 'rect';
              const elemSize = size * random(0.3, 0.5); // Size of the small shape
              const elemX = size / 2 - elemSize / 2;
              const elemY = size / 2 - elemSize / 2;
              if (shape === 'circle') {
                 createSVGElement('circle', {
                     cx: size / 2, cy: size / 2, r: elemSize / 2,
                     fill: fillColor,
                     stroke: strokeColor, 'stroke-width': strokeWidth * 0.5 // Thinner stroke for small shape
                 }, pattern);
              } else { // Rectangle
                  createSVGElement('rect', {
                      x: elemX, y: elemY, width: elemSize, height: elemSize,
                      fill: fillColor,
                      stroke: strokeColor, 'stroke-width': strokeWidth * 0.5
                  }, pattern);
              }
             break;
    }

    dom.defs.appendChild(pattern); // Add the completed pattern definition to SVG <defs>
    return `url(#${patternId})`; // Return the reference URL
}
