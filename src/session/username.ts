export const USERNAME_MAX_LENGTH = 32;

// At least one letter, digit, punctuation mark or symbol, so a name made only of
// invisible characters (e.g. zero-width spaces) cannot produce a blank greeting.
const VISIBLE_CHAR = /[\p{L}\p{N}\p{P}\p{S}]/u;

// Control characters (Cc) and Unicode bidi overrides/isolates. The latter can
// make a name render differently from what was typed (text-direction spoofing).
const FORBIDDEN_CHARS = /[\p{Cc}\u202A-\u202E\u2066-\u2069]/u;

/** Trim, collapse inner whitespace and use a canonical Unicode form. */
export function normalizeUsername(raw: string): string {
  return raw.normalize('NFC').replace(/\s+/gu, ' ').trim();
}

/**
 * Returns a user-facing error message, or `null` when the (already normalized)
 * username is acceptable.
 */
export function validateUsername(name: string): string | null {
  if (name.length === 0) return 'Please enter a username.';
  // Count code points, not UTF-16 units, so emoji count as one character.
  if ([...name].length > USERNAME_MAX_LENGTH) {
    return `Username must be at most ${USERNAME_MAX_LENGTH} characters.`;
  }
  if (FORBIDDEN_CHARS.test(name)) return 'Username contains characters that are not allowed.';
  if (!VISIBLE_CHAR.test(name)) return 'Please enter a username.';
  return null;
}
