// public/js/modules/ui.js

// Import shared state and DOM references
import { state } from './state.js';
import { dom } from './dom.js';
// Import utilities needed by UI functions
import { formatNumber } from './utils.js'; // Assuming formatNumber is in utils.js

// ================== UI State Update Functions ==================

/**
 * Updates various UI elements based on the current application state.
 * Includes captured coordinates display, button feedback, viewport inputs, etc.
 */
export function updateUIFromState() { // Ensure this export exists
    // --- Update captured coordinates display ---
    if (dom.capturedCoords) {
        let capturedText = "";
        if (state.capturedX !== null) {
            capturedText += ` X: ${state.capturedX.toFixed(0)}`;
        }
        if (state.capturedY !== null) {
            capturedText += ` Y: ${state.capturedY.toFixed(0)}`;
        }
        // Check if capturedV exists and has non-null x/y before displaying
        if (state.capturedV && state.capturedV.x !== null && state.capturedV.y !== null) {
            capturedText += ` V: (${state.capturedV.x.toFixed(0)}, ${state.capturedV.y.toFixed(0)})`;
        }
        dom.capturedCoords.textContent = capturedText.trim();
    } else {
        console.warn("updateUIFromState: #captured-coords element not found/cached.");
    }

    // *** Update Capture Button Visual Feedback ***
    // Use optional chaining ?. and classList.toggle for cleaner code
    // toggle(className, force) adds if force is true, removes if force is false
    dom.captureXBtn?.classList.toggle('captured', state.capturedX !== null);
    dom.captureYBtn?.classList.toggle('captured', state.capturedY !== null);
    // Consider V captured if its state object exists and has a non-null x or y
    dom.captureVBtn?.classList.toggle('captured', state.capturedV && (state.capturedV.x !== null || state.capturedV.y !== null));


    // --- Update viewport inputs based on state ---
    if (dom.customWidth) {
        dom.customWidth.value = state.viewportWidth;
    } else {
        console.warn("updateUIFromState: #custom-width element not found/cached.");
    }
    if (dom.customHeight) {
        dom.customHeight.value = state.viewportHeight;
    } else {
        console.warn("updateUIFromState: #custom-height element not found/cached.");
    }

    if (dom.viewportPreset) {
        const currentViewport = `${state.viewportWidth}x${state.viewportHeight}`;
        let matchedPreset = 'custom';
        for (const option of dom.viewportPreset.options) {
            if (option.value !== 'custom' && option.textContent.includes(currentViewport)) {
                matchedPreset = option.value;
                break;
            }
        }
        dom.viewportPreset.value = matchedPreset;
    } else {
         console.warn("updateUIFromState: #viewport-preset element not found/cached.");
    }

    // --- Update animation toggle state ---
    if (dom.animation) {
        // Check if currentOptions exists before accessing animation property
        dom.animation.checked = state.currentOptions?.animation ?? false;
    } else {
         console.warn("updateUIFromState: #animation element not found/cached.");
    }

    // --- Update Range Slider Displays ---
    // This relies on dom cache being populated correctly by cacheDOMElements
    Object.keys(dom).forEach(key => {
        // Check if the key corresponds to a range input display (e.g., 'complexityDisplay')
        if (key.endsWith('Display') && dom[key]) {
             // Convert display key back to potential input ID (handle camelCase from hyphenated ID)
             let inputId = key.replace('Display', '');
             // Convert camelCase key back to hyphen-separated id
             inputId = inputId.replace(/([A-Z])/g, "-$1").toLowerCase();

             // Find the input element, checking cache first, then by ID
             // Use the cache key (camelCase) for lookup in dom object
             const cacheKey = inputId.replace(/-/g, '');
             const inputElement = dom[cacheKey] || document.getElementById(inputId); // Check cache first

             if (inputElement && inputElement.value !== undefined) {
                 dom[key].textContent = inputElement.value;
             }
        }
    });
}


/**
 * Updates the Math Properties display panel with details about the generation.
 * @param {object} info - The math information object from the state.
 */
export function updateMathInfo(info) { // Ensure this export exists
    // Ensure the math output DOM element exists
    if (!dom.mathOutput) {
        console.warn("updateMathInfo: Math output DOM element not found.");
        return;
    }

    // Handle null or undefined info object
    if (!info) {
        dom.mathOutput.innerHTML = 'No generation data available.';
        return;
    }

    let html = ''; // String to build the HTML content

    // Display basic generation info if available
    html += `<div><strong>Generator:</strong> ${info.generator || 'N/A'}</div>`;
    html += `<div><strong>Layers:</strong> ${info.layers || 1}</div>`;
    html += `<div><strong>Viewport:</strong> ${info.viewport || 'N/A'}</div>`;
    // Format total element count using the utility function
    html += `<div><strong>Total Elements:</strong> ${formatNumber(info.totalElements || 0)}</div>`;

    // Display detailed layer information if present
    if (info.details && typeof info.details === 'object' && Object.keys(info.details).length > 0) {
         html += '<hr><h4>Layer Details:</h4>';
         // Iterate through each layer's details in the info object
         for (const layerKey in info.details) {
              html += `<div><strong>${layerKey}:</strong> `;
              const layerInfo = info.details[layerKey];
              // Check if layerInfo is an object before processing
              if (layerInfo && typeof layerInfo === 'object') {
                  // Create a string of key-value pairs for the layer's properties
                  const details = Object.entries(layerInfo)
                      // Exclude elementCount as it's summarized above (or handle differently if needed)
                      .filter(([key]) => key !== 'elementCount')
                      // Format each key-value pair
                      .map(([key, value]) => `${key}: ${typeof value === 'number' ? value.toFixed(2) : String(value)}`) // Convert value to string safely
                      .join(', '); // Join pairs with commas
                  // Add the details string and element count for the layer
                  html += `${details} (${formatNumber(layerInfo.elementCount || 0)} elements)</div>`;
              } else {
                  html += `Invalid data for ${layerKey}</div>`;
              }
         }
    }

     // Add captured coordinate info if available in the global state
     if (state.capturedX !== null || state.capturedY !== null || (state.capturedV && state.capturedV.x !== null)) {
          html += '<hr><h4>Captured Coords:</h4>';
          if (state.capturedX !== null) html += `<div>X: ${state.capturedX.toFixed(2)}</div>`;
          if (state.capturedY !== null) html += `<div>Y: ${state.capturedY.toFixed(2)}</div>`;
          if (state.capturedV && state.capturedV.x !== null && state.capturedV.y !== null) {
              html += `<div>V: (${state.capturedV.x.toFixed(2)}, ${state.capturedV.y.toFixed(2)})</div>`;
          }
     }

     // Display error message if present in the info object
     if (info.error) {
        html += `<hr><div style="color: red;"><strong>Error:</strong> ${info.error}</div>`;
     }

    // Update the innerHTML of the math output panel
    dom.mathOutput.innerHTML = html;
}

/**
 * Updates the SVG statistics display (size and element count).
 * @param {number} elementCount - The total number of elements generated.
 */
export function updateSVGStats(elementCount) { // Ensure this export exists
    // Ensure the SVG stats DOM element and SVG canvas exist
    if (!dom.svgStats || !dom.svg) {
        console.warn("updateSVGStats: SVG stats display or SVG canvas element not found.");
        if(dom.svgStats) dom.svgStats.textContent = "Stats unavailable."; // Update display if possible
        return;
    }

    // Get the outer HTML of the SVG element (includes the <svg> tag itself)
    const svgString = dom.svg.outerHTML || "";
    // Calculate the approximate size in kilobytes (KB)
    const svgSizeKB = (svgString.length / 1024).toFixed(2);
    // Update the text content of the stats display element
    // Use formatNumber for the element count
    dom.svgStats.textContent = `Size: ${svgSizeKB} KB | Elements: ${formatNumber(elementCount || 0)}`;
}

// ================== UI Interaction Functions ==================

/**
 * Handles changes to the viewport preset dropdown or custom dimension inputs.
 * Updates the state and the SVG element attributes.
 */
export function handleViewportChange() { // Ensure this export exists
    // Ensure necessary DOM elements are cached
    if (!dom.viewportPreset || !dom.customWidth || !dom.customHeight || !dom.svg) {
        console.error("handleViewportChange: Required DOM elements not found/cached.");
        return;
    }

    const preset = dom.viewportPreset.value;
    let width, height;

    if (preset === 'custom') {
        // Read from custom input fields if 'custom' is selected
        width = parseInt(dom.customWidth.value, 10) || state.viewportWidth; // Use current state as fallback
        height = parseInt(dom.customHeight.value, 10) || state.viewportHeight;
    } else {
        // Extract dimensions from the selected preset option's text content
        const selectedOptionText = dom.viewportPreset.options[dom.viewportPreset.selectedIndex]?.textContent;
        const dimsMatch = selectedOptionText?.match(/(\d+)x(\d+)/); // Regex to find "WxH" pattern

        if (dimsMatch) {
            width = parseInt(dimsMatch[1], 10);
            height = parseInt(dimsMatch[2], 10);
        } else {
             // Fallback if regex fails or option text is unexpected
             console.warn(`Could not parse dimensions from preset: ${selectedOptionText}. Falling back to custom.`);
             width = parseInt(dom.customWidth.value, 10) || 800;
             height = parseInt(dom.customHeight.value, 10) || 600;
             dom.viewportPreset.value = 'custom'; // Switch dropdown back to 'custom'
        }
         // Update custom input fields to reflect the selected preset's dimensions
         dom.customWidth.value = width;
         dom.customHeight.value = height;
    }

     // Ensure minimum dimensions to prevent errors
     width = Math.max(100, width);
     height = Math.max(100, height);

    // Update the global state with the new dimensions
    state.viewportWidth = width;
    state.viewportHeight = height;

    // Update the SVG element's width, height, and viewBox attributes
    dom.svg.setAttribute('width', width);
    dom.svg.setAttribute('height', height);
    dom.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    console.log(`Viewport set to: ${width}x${height}`);
}

/**
 * Updates the cursor position display based on mouse or touch events.
 * Stores the relative coordinates within the SVG canvas in the state.
 * @param {MouseEvent | Touch} event - The mouse or touch event object.
 */
export function updateCursorInfo(event) { // Ensure this export exists
    // Ensure SVG canvas and cursor info display elements are available
    if (!dom.svg || !dom.cursorInfo) {
        // console.warn("updateCursorInfo: SVG or cursorInfo element not found."); // Can be spammy
        return;
    }

    try {
        // Get the bounding rectangle of the SVG canvas
        const rect = dom.svg.getBoundingClientRect();

        // Calculate mouse/touch coordinates relative to the SVG element's top-left corner
        // Use clientX/clientY which are relative to the viewport
        const relativeX = event.clientX - rect.left;
        const relativeY = event.clientY - rect.top;

        // Store the relative coordinates in the global state
        state.mouseX = relativeX;
        state.mouseY = relativeY;

        // Update the text content of the cursor info display element
        dom.cursorInfo.textContent = `X: ${state.mouseX.toFixed(0)}, Y: ${state.mouseY.toFixed(0)}`;

    } catch (error) {
        console.error("Error in updateCursorInfo:", error);
        // Handle potential errors (e.g., if getBoundingClientRect fails)
    }
}


/**
 * Captures the current mouse X coordinate (relative to SVG) into the state.
 * Updates the UI to reflect the captured coordinate and button state.
 */
export function captureX() { // Ensure this export exists
    state.capturedX = state.mouseX;
    console.log("Captured X:", state.capturedX?.toFixed(2)); // Log captured value
    updateUIFromState(); // Update display and button class
}

/**
 * Captures the current mouse Y coordinate (relative to SVG) into the state.
 * Updates the UI to reflect the captured coordinate and button state.
 */
export function captureY() { // Ensure this export exists
    state.capturedY = state.mouseY;
    console.log("Captured Y:", state.capturedY?.toFixed(2)); // Log captured value
    updateUIFromState(); // Update display and button class
}

/**
 * Captures the current mouse X and Y coordinates (relative to SVG) as a vector into the state.
 * Updates the UI to reflect the captured vector and button state.
 */
export function captureV() { // Ensure this export exists
    state.capturedV = { x: state.mouseX, y: state.mouseY };
    // Log captured value carefully checking for nulls
    console.log("Captured V:", state.capturedV ? `(${state.capturedV.x?.toFixed(2)}, ${state.capturedV.y?.toFixed(2)})` : 'null');
    updateUIFromState(); // Update display and button class
}
