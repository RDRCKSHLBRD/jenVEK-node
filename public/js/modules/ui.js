//ui.js


// public/js/modules/ui.js

// Import shared state and DOM references
import { state } from './state.js';
import { dom } from './dom.js';

/**
 * Updates various UI elements based on the current application state.
 * This includes captured coordinates display, viewport inputs, and animation toggle.
 */
export function updateUIFromState() {
    // Ensure DOM elements are cached and available
    if (!dom.capturedCoords || !dom.customWidth || !dom.customHeight || !dom.viewportPreset || !dom.animation) {
        console.warn("updateUIFromState: Some required DOM elements are missing or not cached.");
        return;
    }

    // --- Update captured coordinates display ---
    let capturedText = "";
    if (state.capturedX !== null) {
        capturedText += ` X: ${state.capturedX.toFixed(0)}`;
    }
    if (state.capturedY !== null) {
        capturedText += ` Y: ${state.capturedY.toFixed(0)}`;
    }
    if (state.capturedV && state.capturedV.x !== null && state.capturedV.y !== null) { // Check both x and y for vector
        capturedText += ` V: (${state.capturedV.x.toFixed(0)}, ${state.capturedV.y.toFixed(0)})`;
    }
    dom.capturedCoords.textContent = capturedText.trim(); // Use trim() to remove leading/trailing spaces

    // --- Update viewport inputs based on state ---
    dom.customWidth.value = state.viewportWidth;
    dom.customHeight.value = state.viewportHeight;

    // Try to match the current state viewport dimensions to a preset dropdown option
    const currentViewport = `${state.viewportWidth}x${state.viewportHeight}`;
    let matchedPreset = 'custom'; // Default to 'custom'
    // Iterate through the options in the viewport preset dropdown
    for (const option of dom.viewportPreset.options) {
        // Check if the option's text content includes the current dimensions string
        if (option.value !== 'custom' && option.textContent.includes(currentViewport)) {
            matchedPreset = option.value; // Found a match, set the preset value
            break; // Exit the loop once a match is found
        }
    }
    dom.viewportPreset.value = matchedPreset; // Set the dropdown value

    // --- Update animation toggle state ---
    // Use nullish coalescing operator (??) to default to false if animation option is not set
    dom.animation.checked = state.currentOptions?.animation ?? false;

    // --- Update Range Slider Displays ---
    // This ensures displays are correct even if the state was loaded or changed programmatically
    // It iterates through the cached display elements in the `dom` object.
    Object.keys(dom).forEach(key => {
        // Check if the key corresponds to a range input display (e.g., 'complexityDisplay')
        if (key.endsWith('Display') && dom[key]) {
            // Find the corresponding input element ID (e.g., 'complexity')
            const inputId = key.replace('Display', '');
            // Find the input element itself in the dom cache
            const inputElement = dom[inputId];
            // If the input element exists and has a value, update the display
            if (inputElement && inputElement.value !== undefined) {
                dom[key].textContent = inputElement.value;
            }
        }
    });
}


// Add other UI update functions here as you extract them, e.g.:
// export function updateMathInfo(info) { ... }
// export function updateSVGStats(elementCount) { ... }
// export function updateCursorInfo(event) { ... }
