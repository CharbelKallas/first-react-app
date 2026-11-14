export const USERNAME_MAX_LENGTH = 32;

const EMPTY_MESSAGE = 'Please enter a username.';

// At least one letter, digit, punctuation mark or symbol, so empty input and a
// name made only of invisible characters both count as "no username".
const VISIBLE_CHAR = /[\p{L}\p{N}\p{P}\p{S}]/u;

// Characters that are invisible or change how surrounding text is displayed:
// - Cc: control characters
// - Cf: format characters (zero-width spaces/joiners, direction marks such as
//   LRM/RLM/ALM, bidi overrides and isolates, BOM, word joiner, ...)
// - Hangul fillers and the blank Braille pattern: letters/symbols that render as
//   empty space, a common way to fake a blank or lookalike name.
const FORBIDDEN_CHARS = /[\p{Cc}\p{Cf}\u115F\u1160\u3164\uFFA0\u2800]/u;

// A zero-width joiner between two emoji builds one emoji (e.g. a person + laptop
// becomes a technologist), so those joiners are allowed. Variation selectors and
// skin-tone modifiers may sit before the joiner.
const EMOJI_JOINER = /(?<=[\p{Extended_Pictographic}\p{Emoji_Modifier}\uFE0F])\u200D(?=\p{Extended_Pictographic})/gu;

/** Trim, collapse inner whitespace and use a canonical Unicode form. */
export function normalizeUsername(raw: string): string {
  return raw.normalize('NFC').replace(/\s+/gu, ' ').trim();
}

/**
 * Returns a user-facing error message, or `null` when the (already normalized)
 * username is acceptable.
 */
export function validateUsername(name: string): string | null {
  if (!VISIBLE_CHAR.test(name)) return EMPTY_MESSAGE;
  // Count code points, not UTF-16 units, so emoji count as one character.
  if ([...name].length > USERNAME_MAX_LENGTH) {
    return `Username must be at most ${USERNAME_MAX_LENGTH} characters.`;
  }
  if (FORBIDDEN_CHARS.test(name.replace(EMOJI_JOINER, ''))) {
    return 'Username contains characters that are not allowed.';
  }
  return null;
}
