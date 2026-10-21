/**
 * Formats an address into a clean, human-readable string.
 * Safely handles:
 * - null / undefined / non-object types
 * - already formatted strings (preserving them, trimming whitespace)
 * - address objects containing { house_number, street, area, city, state, pincode, instructions, latitude, longitude }
 * - prevents [object Object] from ever being returned or rendered
 * - ignores null, undefined, and empty string components
 * - avoids duplicate parts
 * - never includes instructions or coordinates in the main address string
 *
 * @param {string|object|null|undefined} addr
 * @param {string} fallback
 * @returns {string}
 */
export const formatAddress = (addr, fallback = 'Sangola Route Address') => {
  if (!addr) return fallback;

  if (typeof addr === 'string') {
    const trimmed = addr.trim();
    if (!trimmed || trimmed === '[object Object]') return fallback;
    return trimmed;
  }

  if (typeof addr === 'object') {
    const rawParts = [
      addr.house_number,
      addr.street,
      addr.area,
      addr.city,
      addr.state,
      addr.pincode ? (typeof addr.pincode === 'string' ? addr.pincode.trim() : String(addr.pincode)) : null,
    ];

    const seen = new Set();
    const cleanParts = [];

    for (const part of rawParts) {
      if (part === null || part === undefined) continue;
      const str = String(part).trim();
      if (!str || str === '[object Object]') continue;

      const lower = str.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        cleanParts.push(str);
      }
    }

    if (cleanParts.length > 0) {
      return cleanParts.join(', ');
    }

    return fallback;
  }

  return fallback;
};

/**
 * Extracts delivery instructions/notes separately.
 *
 * @param {string|object|null|undefined} addr
 * @returns {string}
 */
export const getDeliveryInstructions = (addr) => {
  if (!addr || typeof addr !== 'object') return '';
  const note = addr.instructions || addr.delivery_instructions || addr.notes || '';
  if (typeof note === 'string') {
    const trimmed = note.trim();
    return trimmed === '[object Object]' ? '' : trimmed;
  }
  return '';
};
