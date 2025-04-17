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
      // Create a buffer to hold one 32-bit unsigned integer
      const buffer = new Uint32Array(1);
      // Fill the buffer with random values
      randomSource.getRandomValues(buffer);
      // Convert the integer to a float between 0 and 1
      return buffer[0] / 0xFFFFFFFF; // 0xFFFFFFFF is the maximum value for a Uint32
  }
  // Fallback to the less secure Math.random() if crypto is not available
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
  // +1 makes the maximum value inclusive
  return Math.floor(random(min, max + 1));
}

/**
 * Selects a random element from an array.
 * @param {Array<any>} array - The array to choose from.
 * @returns {any | null} A random element from the array, or null if the array is empty or invalid.
 */
export function randomChoice(array) {
  // Basic validation for the input array
  if (!array || !Array.isArray(array) || array.length === 0) {
      console.warn("randomChoice called with invalid or empty array.");
      return null;
  }
  // Calculate a random index within the array bounds
  const index = Math.floor(secureRandom() * array.length);
  return array[index];
}

/**
 * Checks if a number is a prime number.
 * @param {number} num - The number to check.
 * @returns {boolean} True if the number is prime, false otherwise.
 */
export function isPrime(num) {
  // Ensure the number is an integer and handle base cases
  num = Math.abs(Math.floor(num));
  if (num <= 1) return false; // 1 and numbers less than 1 are not prime
  if (num <= 3) return true;  // 2 and 3 are prime

  // Eliminate multiples of 2 and 3 quickly
  if (num % 2 === 0 || num % 3 === 0) return false;

  // Check for factors from 5 upwards, stepping by 6 (optimisation)
  // We only need to check up to the square root of num
  let i = 5;
  while (i * i <= num) {
      // Check i and i + 2 (potential prime factors)
      if (num % i === 0 || num % (i + 2) === 0) return false;
      i += 6; // Step by 6 covers all potential prime factors (5, 7, 11, 13, ...)
  }
  // If no factors were found, the number is prime
  return true;
}

/**
 * Calculates the nth Fibonacci number (iteratively).
 * @param {number} n - The index (0-based) of the Fibonacci number to calculate.
 * @returns {number} The nth Fibonacci number.
 */
export function fibonacci(n) {
  // Ensure n is a non-negative integer
  n = Math.max(0, Math.floor(n));
  if (n <= 1) return n; // F(0) = 0, F(1) = 1

  // Iterative calculation
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
      // Use array destructuring for simultaneous assignment
      [a, b] = [b, a + b];
  }
  return b; // b holds the nth Fibonacci number
}

/**
 * Calculates the coordinates of a point on a Fibonacci (phyllotaxis) spiral.
 * @param {number} index - The index of the point (0-based).
 * @param {number} totalPoints - The total number of points in the spiral (for scaling).
 * @param {number} radius - The maximum radius of the spiral.
 * @returns {{x: number, y: number}} The x and y coordinates of the point.
 */
export function goldenRatioPoint(index, totalPoints, radius) {
  // Golden angle in radians (approximately 137.5 degrees)
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  // Calculate the angle for this point
  const angle = index * goldenAngle;
  // Calculate the distance from the center, using sqrt for even distribution
  const distance = radius * Math.sqrt(index / totalPoints);
  // Convert polar coordinates (distance, angle) to Cartesian coordinates (x, y)
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
  // Create the element in the SVG namespace
  const elem = document.createElementNS(SVG_NS, tag);

  // Set attributes from the attrs object
  for (const [key, value] of Object.entries(attrs)) {
      // Ensure value is not null or undefined before setting the attribute
      // Allows setting attributes like stroke-width="0"
      if (value !== null && value !== undefined) {
           elem.setAttribute(key, value);
      }
  }

  // Append the element to the parent if a parent is provided
  if (parent && parent.appendChild) { // Check if parent is a valid node
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
  // Combine prefix, timestamp, and a random integer for uniqueness
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
        return String(num); // Return string representation
    }
  // Use Intl.NumberFormat for locale-aware formatting (more robust)
  try {
      return new Intl.NumberFormat().format(num);
  } catch (e) {
      console.warn("Intl.NumberFormat failed, using basic regex fallback for formatNumber.", e);
      // Basic regex fallback (less robust for different locales)
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
  const secondsInDay = 86400; // 24 hours * 60 minutes * 60 seconds
  // Calculate total seconds passed since midnight
  const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds() + now.getMilliseconds() / 1000;
  // Return the fraction of the day completed
  return currentSeconds / secondsInDay;
}
