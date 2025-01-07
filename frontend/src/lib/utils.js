/**
 * Joins multiple class names together, filtering out any falsy values
 * @param {...string} inputs - Class names to join
 * @returns {string} - Combined class names
 */
export function cn(...inputs) {
    return inputs.filter(Boolean).join(' ');
  }