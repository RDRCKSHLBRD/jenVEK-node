// download.js


// public/js/modules/download.js

// Import shared state - needed to access generated SVG data and options
import { state } from './state.js';

/**
 * Triggers a browser download for the currently generated SVG data.
 */
export function downloadSVG() {
    // Check if SVG data exists in the state
    if (!state.svgData) {
        alert('Please generate an SVG first before downloading.');
        console.warn('downloadSVG called but state.svgData is empty.');
        return;
    }

    try {
        // Create a Blob object from the SVG string data.
        // A Blob represents raw immutable data.
        // Set the MIME type to 'image/svg+xml' for proper handling by browsers/OS.
        const blob = new Blob([state.svgData], { type: 'image/svg+xml;charset=utf-8' });

        // Create a temporary URL representing the Blob object.
        const url = URL.createObjectURL(blob);

        // Create a temporary anchor (link) element to trigger the download.
        const link = document.createElement('a');
        link.href = url; // Set the link's target to the Blob URL.
        // Suggest a filename for the download. Includes a timestamp for uniqueness.
        link.download = `jenVek-svg-${Date.now()}.svg`;

        // Append the link to the document body (required for Firefox compatibility).
        document.body.appendChild(link);
        // Programmatically click the link to initiate the download.
        link.click();

        // Clean up: Remove the temporary link element from the document.
        document.body.removeChild(link);
        // Clean up: Revoke the temporary Blob URL to free up memory/resources.
        URL.revokeObjectURL(url);

        console.log('SVG download initiated.');

    } catch (error) {
        console.error('Error during SVG download:', error);
        alert('An error occurred while trying to download the SVG file. Please check the console.');
    }
}

/**
 * Triggers a browser download for a JSON file containing the generation options,
 * math properties, and other relevant metadata.
 */
export function downloadJSON() {
    // Prepare the data object to be saved in the JSON file.
    const dataToSave = {
        timestamp: new Date().toISOString(), // Record the time of generation/download
        generationCount: state.generationCount, // Include the generation counter
        optionsUsed: state.currentOptions, // Save the options used for the last generation
        mathProperties: state.mathInfo, // Include the calculated math properties
        capturedCoordinates: { // Include any captured coordinates used
             x: state.capturedX,
             y: state.capturedY,
             vector: state.capturedV
        },
        // Note: Raw SVG data (state.svgData) is usually too large for metadata JSON.
        // It's saved separately via downloadSVG().
        // If needed for specific use cases, you could add a truncated version or specific attributes.
    };

    try {
        // Convert the JavaScript data object into a JSON string.
        // null and 2 arguments provide pretty-printing with indentation for readability.
        const jsonData = JSON.stringify(dataToSave, null, 2);

        // Create a Blob object from the JSON string data.
        // Set the MIME type to 'application/json'.
        const blob = new Blob([jsonData], { type: 'application/json;charset=utf-8' });

        // Create a temporary URL representing the Blob object.
        const url = URL.createObjectURL(blob);

        // Create a temporary anchor (link) element.
        const link = document.createElement('a');
        link.href = url;
        // Suggest a filename for the download.
        link.download = `jenVek-data-${Date.now()}.json`;

        // Append, click, and remove the link to trigger the download.
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Revoke the temporary Blob URL.
        URL.revokeObjectURL(url);

        console.log('JSON data download initiated.');

    } catch (error) {
        console.error('Error during JSON download:', error);
        alert('An error occurred while trying to download the JSON data file. Please check the console.');
    }
}
