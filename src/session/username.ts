export const USERNAME_MAX_LENGTH = 32;

// Hard cap on code points. One user-perceived character can be built from many
// code points (a family emoji is 7), so the visible-length limit alone does not
// bound the stored name.
const USERNAME_MAX_CODE_POINTS = USERNAME_MAX_LENGTH * 4;

// Raw input longer than this (in UTF-16 units) is rejected before any Unicode
// processing, so a huge paste cannot make normalization or segmentation slow.
// Generous enough that whitespace or decomposed accents around a valid name fit.
export const USERNAME_MAX_INPUT_LENGTH = USERNAME_MAX_CODE_POINTS * 4;

const EMPTY_MESSAGE = 'Please enter a username.';
const TOO_LONG_MESSAGE = `Username must be at most ${USERNAME_MAX_LENGTH} characters.`;
const TOO_COMPLEX_MESSAGE = 'Username is too long. Try fewer emoji or accents.';
const TOO_MANY_MARKS_MESSAGE = 'Username has too many accent marks.';
const NOT_ALLOWED_MESSAGE = 'Username contains characters that are not allowed.';

// At least one letter, digit, punctuation mark or symbol, so empty input and a
// name made only of invisible characters both count as "no username".
const VISIBLE_CHAR = /[\p{L}\p{N}\p{P}\p{S}]/u;

// Allowlist: every character must be a letter, combining mark (accent), digit,
// punctuation, symbol or a plain space. This excludes control and format
// characters (zero-width spaces, direction marks, BOM, tag characters...),
// private-use characters (which render differently on each device) and code
// points Unicode has not assigned yet. Emoji joiners and flag tags are removed
// before this check when they are part of a real emoji.
const NOT_ALLOWED_CHAR = /[^\p{L}\p{M}\p{N}\p{P}\p{S} ]/u;

// Marks that render as nothing: variation selectors (also usable to hide bytes of
// data), the combining grapheme joiner, Khmer inherent vowels and Mongolian free
// variation selectors. The emoji/text style selectors U+FE0E/U+FE0F are allowed
// only directly after an emoji or a keycap base, where they have a visible effect.
const INVISIBLE_MARK = /[\u034F\u17B4\u17B5\u180B-\u180F\uFE00-\uFE0F\u{E0100}-\u{E01EF}]/u;
const EMOJI_STYLE_SELECTOR = /(?<=\p{Extended_Pictographic})[\uFE0E\uFE0F]|(?<=[0-9#*])\uFE0F(?=\u20E3)/gu;

// Selectors that change nothing on screen are removed during normalization, so
// lookalike spellings of the same name are stored the same way: U+FE0F after an
// emoji that is already shown in emoji style (or after a skin tone), and after a
// digit, '#' or '*' that is not part of a keycap.
const REDUNDANT_EMOJI_SELECTOR = /(?<=[\p{Emoji_Presentation}\p{Emoji_Modifier}])\uFE0F|(?<=[0-9#*])\uFE0F(?!\u20E3)/gu;

// Letters and symbols that render as empty space: Hangul fillers and the blank
// Braille pattern, a common way to fake a blank or lookalike name.
const BLANK_LOOKING_CHAR = /[\u115F\u1160\u3164\uFFA0\u2800]/u;

// Combining marks (accents). Variation selectors are marks too, but only pick
// between text and emoji style, so they are not counted.
const VARIATION_SELECTORS = /[\uFE0E\uFE0F]/gu;
const COMBINING_MARK = /\p{M}/gu;
const BASE_CHAR = /[\p{L}\p{N}\p{P}\p{S}]/gu;
// Fully pointed Hebrew or stacked Tibetan can put four marks on one letter;
// more than six is "Zalgo" text that spills over neighbouring lines.
const MAX_MARKS_PER_CHARACTER = 6;
const TOO_MANY_MARKS_IN_A_ROW = new RegExp(`\\p{M}{${MAX_MARKS_PER_CHARACTER + 1},}`, 'u');
// Real names average well under two marks per character; Zalgo text uses many.
const MAX_MARKS_PER_BASE_CHAR = 2;

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

// Fallback for browsers without Intl.Segmenter: drop every code point that
// joins the previous character instead of starting a new one.
// - a regional-indicator pair is one flag;
const REGIONAL_INDICATOR_PAIR = /[\u{1F1E6}-\u{1F1FF}]{2}/gu;
// - whatever follows a zero-width joiner is part of the same emoji;
const AFTER_JOINER = /(?<=\u200D)[^\u200D]/gu;
// - a letter after an Indic virama (linker) forms a conjunct with the one before;
const AFTER_CONJUNCT_LINKER = /(?<=[\u094D\u09CD\u0ACD\u0B4D\u0C4D\u0D4D]\p{M}*)\p{L}/gu;
// - Hangul vowel and final jamo attach to the syllable before them;
const HANGUL_TRAILING_JAMO = /[\u1160-\u11FF\uD7B0-\uD7FF]/gu;
// - marks, joiners, skin tones and flag tag characters never start a character.
const NON_STARTER = /[\p{M}\u200D\p{Emoji_Modifier}\u{E0020}-\u{E007F}]/gu;

/**
 * Number of user-perceived characters (a joined emoji or flag counts as one).
 * Intl.Segmenter is missing in some supported browsers (Firefox before 125), so
 * it is created on first use. Without it, an approximation is used that may
 * count fewer characters than real segmentation but never more, so it never
 * rejects a name that other browsers accept; the code-point cap still applies.
 */
function visibleLength(text: string): number {
  if (typeof Intl.Segmenter !== 'function') {
    const starters = text
      .replace(REGIONAL_INDICATOR_PAIR, 'F')
      .replace(AFTER_JOINER, '')
      .replace(AFTER_CONJUNCT_LINKER, '')
      .replace(HANGUL_TRAILING_JAMO, '')
      .replace(NON_STARTER, '');
    return [...starters].length;
  }
  graphemeSegmenter ??= new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  return Array.from(graphemeSegmenter.segment(text)).length;
}

function hasTooManyMarks(name: string): boolean {
  const text = name.replace(VARIATION_SELECTORS, '');
  if (TOO_MANY_MARKS_IN_A_ROW.test(text)) return true;
  const marks = text.match(COMBINING_MARK)?.length ?? 0;
  const bases = text.match(BASE_CHAR)?.length ?? 0;
  return marks > bases * MAX_MARKS_PER_BASE_CHAR;
}

/**
 * Trim, collapse inner whitespace, drop emoji selectors that change nothing, and
 * use the compatibility-composed Unicode form (NFKC), which also folds lookalikes
 * such as fullwidth letters into plain ones.
 */
export function normalizeUsername(raw: string): string {
  return raw
    .normalize('NFKC')
    .replace(REDUNDANT_EMOJI_SELECTOR, '')
    .replace(/\s+/gu, ' ')
    .trim();
}

/**
 * Returns a user-facing error message, or `null` when the (already normalized)
 * username is acceptable.
 */
export function validateUsername(name: string): string | null {
  if (!VISIBLE_CHAR.test(name)) return EMPTY_MESSAGE;
  if (visibleLength(name) > USERNAME_MAX_LENGTH) return TOO_LONG_MESSAGE;
  if ([...name].length > USERNAME_MAX_CODE_POINTS) return TOO_COMPLEX_MESSAGE;
  if (LONG_EMOJI_CHAIN.test(name)) return NOT_ALLOWED_MESSAGE;
  const withoutEmojiFormatting = name
    .replace(EMOJI_JOINER, '')
    .replace(EMOJI_FLAG_TAGS, '')
    .replace(EMOJI_STYLE_SELECTOR, '');
  if (
    NOT_ALLOWED_CHAR.test(withoutEmojiFormatting) ||
    INVISIBLE_MARK.test(withoutEmojiFormatting) ||
    BLANK_LOOKING_CHAR.test(name)
  ) {
    return NOT_ALLOWED_MESSAGE;
  }
  if (hasTooManyMarks(name)) return TOO_MANY_MARKS_MESSAGE;
  return null;
}

export type ParsedUsername = { ok: true; name: string } | { ok: false; error: string };

/**
 * Turns raw input (typed or read back from storage) into a clean username, or an
 * error message. Oversized input is rejected before any Unicode processing.
 */
export function parseUsername(raw: string): ParsedUsername {
  if (raw.length > USERNAME_MAX_INPUT_LENGTH) return { ok: false, error: TOO_COMPLEX_MESSAGE };
  const name = normalizeUsername(raw);
  const error = validateUsername(name);
  return error ? { ok: false, error } : { ok: true, name };
}
