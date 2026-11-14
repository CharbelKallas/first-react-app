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

// Emoji are allowed to use two kinds of otherwise-forbidden format characters:
// - a zero-width joiner between two emoji builds one emoji (person + laptop =
//   technologist); variation selectors and skin tones may sit before it;
// - tag characters after a black flag spell out a region flag (England, Scotland,
//   Wales), ending with a cancel tag.
const EMOJI_JOINER = /(?<=[\p{Extended_Pictographic}\p{Emoji_Modifier}\uFE0F])\u200D(?=\p{Extended_Pictographic})/gu;
const EMOJI_FLAG_TAGS = /(?<=\u{1F3F4})[\u{E0020}-\u{E007E}]+\u{E007F}/gu;

const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

/** Number of user-perceived characters (a joined emoji or flag counts as one). */
function visibleLength(text: string): number {
  return Array.from(graphemes.segment(text)).length;
}

/**
 * Trim, collapse inner whitespace and use the compatibility-composed Unicode form
 * (NFKC), which also folds lookalikes such as fullwidth letters into plain ones.
 */
export function normalizeUsername(raw: string): string {
  return raw.normalize('NFKC').replace(/\s+/gu, ' ').trim();
}

/**
 * Returns a user-facing error message, or `null` when the (already normalized)
 * username is acceptable.
 */
export function validateUsername(name: string): string | null {
  if (!VISIBLE_CHAR.test(name)) return EMPTY_MESSAGE;
  if (visibleLength(name) > USERNAME_MAX_LENGTH) {
    return `Username must be at most ${USERNAME_MAX_LENGTH} characters.`;
  }
  const withoutEmojiFormatting = name.replace(EMOJI_JOINER, '').replace(EMOJI_FLAG_TAGS, '');
  if (FORBIDDEN_CHARS.test(withoutEmojiFormatting)) {
    return 'Username contains characters that are not allowed.';
  }
  return null;
}
