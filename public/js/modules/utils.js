// public/js/modules/utils.js

/**
 * The XML namespace for SVG elements. Required for createElementNS.
 */
export const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * Provides a source for cryptographically secure random numbers if available,
 * otherwise falls back to Math.random().
 */
const randomSource = window.crypto || window.msCrypto;

/**
 * Generates a cryptographically secure random number between 0 (inclusive) and 1 (exclusive)
 * if crypto API is available, otherwise uses Math.random().
 * @returns {number} A random float between 0 and 1.
 */
export function secureRandom() {
  if (randomSource && randomSource.getRandomValues) {
      const buffer = new Uint32Array(1);
      randomSource.getRandomValues(buffer);
      return buffer[0] / 0xFFFFFFFF;
  }
  console.warn("Using fallback Math.random() as crypto API is unavailable.");
  return Math.random();
}

/**
 * Generates a random floating-point number within a specified range.
 * Uses secureRandom for better randomness if available.
 * @param {number} min - The minimum value (inclusive).
 * @param {number} max - The maximum value (exclusive).
 * @returns {number} A random float within the specified range.
 */
export function random(min, max) {
  return secureRandom() * (max - min) + min;
}

/**
 * Generates a random integer within a specified range (inclusive).
 * Uses secureRandom via the random() function.
 * @param {number} min - The minimum integer value (inclusive).
 * @param {number} max - The maximum integer value (inclusive).
 * @returns {number} A random integer within the specified range.
 */
export function randomInt(min, max) {
  return Math.floor(random(min, max + 1));
}

/**
 * Selects a random element from an array.
 * @param {Array<any>} array - The array to choose from.
 * @returns {any | null} A random element from the array, or null if the array is empty or invalid.
 */
export function randomChoice(array) {
  if (!array || !Array.isArray(array) || array.length === 0) {
      console.warn("randomChoice called with invalid or empty array.");
      return null;
  }
  const index = Math.floor(secureRandom() * array.length);
  return array[index];
}

/**
 * Checks if a number is a prime number.
 * @param {number} num - The number to check.
 * @returns {boolean} True if the number is prime, false otherwise.
 */
export function isPrime(num) {
  num = Math.abs(Math.floor(num));
  if (num <= 1) return false;
  if (num <= 3) return true;
  if (num % 2 === 0 || num % 3 === 0) return false;
  let i = 5;
  while (i * i <= num) {
      if (num % i === 0 || num % (i + 2) === 0) return false;
      i += 6;
  }
  return true;
}

/**
 * Calculates the nth Fibonacci number (iteratively).
 * @param {number} n - The index (0-based) of the Fibonacci number to calculate.
 * @returns {number} The nth Fibonacci number.
 */
export function fibonacci(n) {
  n = Math.max(0, Math.floor(n));
  if (n <= 1) return n;
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
      [a, b] = [b, a + b];
  }
  return b;
}

/**
 * Calculates the coordinates of a point on a Fibonacci (phyllotaxis) spiral.
 * @param {number} index - The index of the point (0-based).
 * @param {number} totalPoints - The total number of points in the spiral (for scaling).
 * @param {number} radius - The maximum radius of the spiral.
 * @returns {{x: number, y: number}} The x and y coordinates of the point.
 */
export function goldenRatioPoint(index, totalPoints, radius) {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const angle = index * goldenAngle;
  const distance = radius * Math.sqrt(index / totalPoints);
  return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance
  };
}

/**
 * Creates an SVG element with specified attributes and appends it to a parent if provided.
 * Uses the SVG_NS constant for the correct namespace.
 * @param {string} tag - The tag name of the SVG element (e.g., 'circle', 'rect', 'path').
 * @param {object} [attrs={}] - An object containing attributes to set (e.g., { cx: 50, fill: 'red' }).
 * @param {SVGElement | null} [parent=null] - The parent SVG element to append the new element to.
 * @returns {SVGElement} The created SVG element.
 */
export function createSVGElement(tag, attrs = {}, parent = null) {
  const elem = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) {
      if (value !== null && value !== undefined) {
           elem.setAttribute(key, value);
      }
  }
  if (parent && parent.appendChild) {
      parent.appendChild(elem);
  } else if (parent) {
      console.warn(`createSVGElement: Provided parent for tag '${tag}' is not a valid node.`);
  }
  return elem;
}

/**
 * Generates a pseudo-unique ID string, useful for SVG elements like gradients or patterns.
 * Combines a prefix, the current timestamp, and a random number.
 * @param {string} [prefix='svg-elem'] - A prefix for the ID.
 * @returns {string} A generated unique ID string.
 */
export function generateUniqueId(prefix = 'svg-elem') {
  return `${prefix}-${Date.now()}-${randomInt(1000, 9999)}`;
}

/**
 * Formats a number by adding commas as thousands separators.
 * @param {number} num - The number to format.
 * @returns {string} The formatted number string.
 */
export function formatNumber(num) {
    if (typeof num !== 'number') {
        console.warn(`formatNumber expected a number, received: ${typeof num}`);
        return String(num);
    }
  try {
      return new Intl.NumberFormat().format(num);
  } catch (e) {
      console.warn("Intl.NumberFormat failed, using basic regex fallback for formatNumber.", e);
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
}

/**
 * Gets a value between 0 and 1 representing the fraction of the current day that has passed.
 * Useful for seeding animations or generators based on time.
 * @returns {number} A float between 0 (start of day) and 1 (end of day).
 */
export function getTimeSeedValue() {
  const now = new Date();
  const secondsInDay = 86400;
  const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds() + now.getMilliseconds() / 1000;
  return currentSeconds / secondsInDay;
}


// ========================================================
// NEW Curve Smoothing Utility Functions
// ========================================================

/**
 * Converts an array of points into an SVG path string ('d' attribute),
 * optionally applying smoothing using Catmull-Rom to Bezier conversion.
 * @param {Array<{x: number, y: number}>} points - Array of point objects.
 * @param {string} smoothingType - 'straight', 'cubic_bezier', 'quadratic_bezier'.
 * @param {object} options - Additional options (e.g., { splineTension: 0.5 }).
 * @param {boolean} [closePath=false] - Whether to add 'Z' to close the path.
 * @returns {string} The SVG path 'd' attribute string.
 */
export function pointsToPathString(points, smoothingType = 'straight', options = {}, closePath = false) {
    if (!points || points.length < 2) {
        return ''; // Need at least two points for a path
    }

    let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

    switch (smoothingType) {
        case 'cubic_bezier':
            d += pointsToCubicBezierString(points, options.splineTension);
            break;
        case 'quadratic_bezier':
            // Placeholder: Implement quadratic Bezier logic if needed
             console.warn("Quadratic Bezier smoothing not fully implemented yet, using straight lines.");
             d += points.slice(1).map(p => `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
            break;
        case 'straight':
        default:
            d += points.slice(1).map(p => `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
            break;
    }

    if (closePath) {
        d += ' Z';
    }

    return d;
}

/**
 * Converts an array of points to a Cubic Bezier path string using Catmull-Rom interpolation.
 * Internal helper for pointsToPathString.
 * @param {Array<{x: number, y: number}>} points - Array of point objects.
 * @param {number} [tension=0.5] - Catmull-Rom tension (0=linear, 0.5=standard, 1=tighter).
 * @returns {string} The path string segment starting from the second point (e.g., " C cp1x,cp1y cp2x,cp2y x1,y1 C ...").
 */
function pointsToCubicBezierString(points, tension = 0.5) {
    if (points.length < 2) return '';

    let pathSegment = '';
    // Adjust tension: Catmull-Rom uses alpha, often tension = (1 - alpha) / 2.
    // We'll use the tension value directly for simplicity here, scaling its effect.
    const t = tension; // Keep it simple for now

    // Add virtual start/end points for tangent calculation at endpoints if not closing path
    // For simplicity, we'll just duplicate endpoints for now. Better methods exist.
    const pts = [points[0], ...points, points[points.length - 1]];

    for (let i = 1; i < pts.length - 2; i++) {
        const p0 = pts[i - 1];
        const p1 = pts[i];     // Start point of segment
        const p2 = pts[i + 1]; // End point of segment
        const p3 = pts[i + 2];

        // Calculate tangents using Catmull-Rom formula (simplified tension application)
        // Tangent at p1
        const tx1 = (p2.x - p0.x) * t;
        const ty1 = (p2.y - p0.y) * t;
        // Tangent at p2
        const tx2 = (p3.x - p1.x) * t;
        const ty2 = (p3.y - p1.y) * t;

        // Convert tangents to Bezier control points
        // Control point 1 (near p1)
        const cp1x = p1.x + tx1 / 3; // Adjust divisor for tension effect if needed
        const cp1y = p1.y + ty1 / 3;
        // Control point 2 (near p2)
        const cp2x = p2.x - tx2 / 3;
        const cp2y = p2.y - ty2 / 3;

        // Append Cubic Bezier segment command
        pathSegment += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
    }
    return pathSegment;
}
