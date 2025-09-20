// Code generator utilities for profile share codes

// Consonants that are easy to distinguish (avoiding I, O, Q, U)
const CONSONANTS = ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'V', 'W', 'X', 'Y', 'Z'];

/**
 * Generate a random share code in format XXX### (3 letters + 3 numbers)
 * @returns {string} Generated share code
 */
export function generateShareCode() {
  // Generate 3 random consonants
  const letters = Array.from({ length: 3 }, () =>
    CONSONANTS[Math.floor(Math.random() * CONSONANTS.length)]
  ).join('');

  // Generate 3 random digits
  const numbers = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

  return letters + numbers;
}

/**
 * Validate share code format
 * @param {string} code - Share code to validate
 * @returns {boolean} True if valid format
 */
export function validateShareCode(code) {
  if (!code || typeof code !== 'string') return false;

  // Must be exactly 6 characters
  if (code.length !== 6) return false;

  // First 3 characters must be consonants
  const letters = code.substring(0, 3).toUpperCase();
  const numbers = code.substring(3, 6);

  // Check if all letters are valid consonants
  const lettersValid = letters.split('').every(letter => CONSONANTS.includes(letter));

  // Check if last 3 characters are digits
  const numbersValid = /^\d{3}$/.test(numbers);

  return lettersValid && numbersValid;
}

/**
 * Format a share code for display (add spacing)
 * @param {string} code - Share code to format
 * @returns {string} Formatted share code (e.g., "BLT 423")
 */
export function formatShareCode(code) {
  if (!code || code.length !== 6) return code;
  return `${code.substring(0, 3)} ${code.substring(3, 6)}`;
}

/**
 * Parse a share code (remove spaces and convert to uppercase)
 * @param {string} input - User input that might contain spaces
 * @returns {string} Cleaned share code
 */
export function parseShareCode(input) {
  if (!input) return '';
  return input.replace(/\s/g, '').toUpperCase();
}

/**
 * Generate a memorable share code (attempts to create pronounceable combinations)
 * @returns {string} Generated share code
 */
export function generateMemorableCode() {
  // Common consonant patterns that are easier to remember
  const patterns = [
    ['B', 'L', 'T'], // BLT
    ['C', 'M', 'D'], // CMD
    ['D', 'M', 'G'], // DMG
    ['M', 'T', 'G'], // MTG
    ['P', 'W', 'R'], // PWR
    ['S', 'T', 'R'], // STR
    ['T', 'R', 'N'], // TRN
    ['W', 'N', 'R'], // WNR
    ['L', 'F', 'T'], // LFT
    ['R', 'G', 'T'], // RGT
  ];

  // Sometimes use a pattern, sometimes generate random
  const usePattern = Math.random() < 0.3;

  let letters;
  if (usePattern && patterns.length > 0) {
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    letters = pattern.join('');
  } else {
    letters = Array.from({ length: 3 }, () =>
      CONSONANTS[Math.floor(Math.random() * CONSONANTS.length)]
    ).join('');
  }

  // Generate memorable numbers (avoid all same digit)
  let numbers;
  do {
    numbers = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  } while (numbers === '000' || numbers === '111' || numbers === '222' ||
           numbers === '333' || numbers === '444' || numbers === '555' ||
           numbers === '666' || numbers === '777' || numbers === '888' ||
           numbers === '999');

  return letters + numbers;
}

/**
 * Check if a code is likely to be offensive or inappropriate
 * @param {string} code - Share code to check
 * @returns {boolean} True if code seems safe
 */
export function isCodeAppropriate(code) {
  if (!code || code.length < 3) return true;

  // List of letter combinations to avoid
  const inappropriate = [
    'ASS', 'FUK', 'FCK', 'SHT', 'DMN', 'HLL', 'PSS', 'CNT', 'DCK', 'BTH'
  ];

  const letters = code.substring(0, 3).toUpperCase();
  return !inappropriate.includes(letters);
}

/**
 * Generate a safe share code (checks for appropriateness)
 * @param {number} maxAttempts - Maximum attempts to generate a safe code
 * @returns {string} Generated safe share code
 */
export function generateSafeShareCode(maxAttempts = 10) {
  let code;
  let attempts = 0;

  do {
    code = generateMemorableCode();
    attempts++;
  } while (!isCodeAppropriate(code) && attempts < maxAttempts);

  return code;
}