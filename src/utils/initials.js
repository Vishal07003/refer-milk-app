/**
 * Utility to extract clean initials from a person or entity name.
 * Rahul Sharma -> RS
 * Rahul -> R
 * "  john   doe  " -> JD
 * Falls back safely to empty string if no valid name or characters exist.
 */
export function getInitials(name, fallback = '') {
  if (!name || typeof name !== 'string') return fallback;

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return fallback;

  if (parts.length === 1) {
    const firstWord = parts[0];
    return firstWord.length > 0 ? firstWord[0].toUpperCase() : fallback;
  }

  const firstInitial = parts[0][0] || '';
  const lastInitial = parts[parts.length - 1][0] || '';
  const result = (firstInitial + lastInitial).toUpperCase();

  return result || fallback;
}

/**
 * Derives user display name from a profile object safely.
 */
export function getUserDisplayName(user, fallback = '') {
  if (!user || typeof user !== 'object') return fallback;

  // 1. Check full name combinations
  const first = (user.first_name || '').trim();
  const last = (user.last_name || '').trim();
  const combined = [first, last].filter(Boolean).join(' ');
  if (combined) return combined;

  // 2. Check user_name / name
  if (user.user_name && typeof user.user_name === 'string' && user.user_name.trim()) {
    return user.user_name.trim();
  }
  if (user.name && typeof user.name === 'string' && user.name.trim()) {
    return user.name.trim();
  }

  // 3. Fallback to phone number if present
  if (user.mobile_number && typeof user.mobile_number === 'string' && user.mobile_number.trim()) {
    return user.mobile_number.trim();
  }

  return fallback;
}
