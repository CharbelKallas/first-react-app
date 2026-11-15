export const USERNAME_MAX_LENGTH = 32;

// Hard cap on code points. One user-perceived character can be built from many
// code points (a family emoji is 7), so the visible-length limit alone does not
// bound the stored name.
const USERNAME_MAX_CODE_POINTS = USERNAME_MAX_LENGTH * 4;

const EMPTY_MESSAGE = 'Please enter a username.';
const TOO_LONG_MESSAGE = `Username must be at most ${USERNAME_MAX_LENGTH} characters.`;
const NOT_ALLOWED_MESSAGE = 'Username contains characters that are not allowed.';

// At least one letter, digit, punctuation mark or symbol, so empty input and a
// name made only of invisible characters both count as "no username".
const VISIBLE_CHAR = /[\p{L}\p{N}\p{P}\p{S}]/u;

// Characters that are invisible or change how surrounding text is displayed:
// - Cc: control characters
// - Cf: format characters (zero-width spaces/joiners, direction marks such as
//   LRM/RLM/ALM, bidi overrides and isolates, BOM, word joiner, tag characters)
// - Hangul fillers and the blank Braille pattern: letters/symbols that render as
//   empty space, a common way to fake a blank or lookalike name.
const FORBIDDEN_CHARS = /[\p{Cc}\p{Cf}\u115F\u1160\u3164\uFFA0\u2800]/u;

// More than four combining marks in a row is "Zalgo" text that spills over
// neighbouring lines; real scripts and keycap emoji need far fewer.
const LONG_MARK_RUN = /\p{M}{5,}/u;

// An emoji, optionally followed by a skin tone or the emoji presentation selector.
const EMOJI = `\\p{Extended_Pictographic}(?:\\p{Emoji_Modifier}|\\uFE0F)?`;

// A zero-width joiner directly after an emoji and before another builds one
// emoji (person + laptop = technologist), so those joiners are allowed.
const EMOJI_JOINER = new RegExp(`(?<=${EMOJI})\\u200D(?=\\p{Extended_Pictographic})`, 'gu');

// Real joined emoji have at most four parts (a family, a kiss); longer chains
// render as many emoji but count as one character.
const LONG_EMOJI_CHAIN = new RegExp(`(?:${EMOJI}\\u200D){4,}`, 'u');

// Tag characters after a black flag spell out a region flag. Only the three flags
// Unicode recommends are allowed, so tags cannot carry arbitrary hidden text.
const FLAG_SUBDIVISIONS = ['gbeng', 'gbsct', 'gbwls'];
const toTagEscapes = (code: string) =>
  [...code].map((c) => `\\u{${(0xe0000 + c.charCodeAt(0)).toString(16)}}`).join('');
const EMOJI_FLAG_TAGS = new RegExp(
  `(?<=\\u{1F3F4})(?:${FLAG_SUBDIVISIONS.map(toTagEscapes).join('|')})\\u{E007F}`,
  'gu',
);

let graphemeSegmenter: Intl.Segmenter | undefined;

/**
 * Number of user-perceived characters (a joined emoji or flag counts as one).
 * Intl.Segmenter is missing in some supported browsers (Firefox before 125), so
 * it is created on first use and code points are counted when it is absent.
 */
function visibleLength(text: string): number {
  if (typeof Intl.Segmenter !== 'function') return [...text].length;
  graphemeSegmenter ??= new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  return Array.from(graphemeSegmenter.segment(text)).length;
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
  if ([...name].length > USERNAME_MAX_CODE_POINTS || visibleLength(name) > USERNAME_MAX_LENGTH) {
    return TOO_LONG_MESSAGE;
  }
  if (LONG_MARK_RUN.test(name) || LONG_EMOJI_CHAIN.test(name)) return NOT_ALLOWED_MESSAGE;
  const withoutEmojiFormatting = name.replace(EMOJI_JOINER, '').replace(EMOJI_FLAG_TAGS, '');
  if (FORBIDDEN_CHARS.test(withoutEmojiFormatting)) return NOT_ALLOWED_MESSAGE;
  return null;
}
