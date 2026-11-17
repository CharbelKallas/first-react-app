// Counting user-perceived characters ("grapheme clusters"): a joined emoji, a
// flag or a letter with its accents counts as one.
//
// This is a small, deterministic implementation of the joining rules from Unicode
// UAX #29 instead of Intl.Segmenter. Intl.Segmenter is missing in some supported
// browsers (Firefox before 125), and where it exists its results depend on the
// browser's Unicode version (for example, whether Indic conjuncts count as one
// character), so the same name could be accepted in one browser and rejected in
// another. This counter gives the same answer everywhere.

// Code points that never start a character: marks, other grapheme extenders,
// skin tones and zero-width joiners.
const EXTENDER = `\\p{M}\\p{Grapheme_Extend}\\p{Emoji_Modifier}\\u200D`;

// The counter removes every code point that joins a neighbouring character
// instead of starting a new one (rules from Unicode UAX #29), then counts the rest.
// - a regional-indicator pair is one flag;
const REGIONAL_INDICATOR_PAIR = /[\u{1F1E6}-\u{1F1FF}]{2}/gu;
// - whatever follows a zero-width joiner is part of the same emoji;
const AFTER_JOINER = /(?<=\u200D)[^\u200D]/gu;
// - a letter after an Indic virama (conjunct linker) joins the letter before it;
// Viramas that link consonants into one conjunct (Devanagari, Bengali, Gujarati,
// Oriya, Telugu, Malayalam).
const CONJUNCT_LINKERS = `\\u094D\\u09CD\\u0ACD\\u0B4D\\u0C4D\\u0D4D`;
const AFTER_CONJUNCT_LINKER = new RegExp(`(?<=[${CONJUNCT_LINKERS}][${EXTENDER}]*)\\p{L}`, 'gu');
// - "Prepend" characters (such as the Malayalam dot reph) join the next character;
const PREPEND = /[\u0600-\u0605\u06DD\u070F\u0890\u0891\u08E2\u0D4E\u{110BD}\u{110CD}\u{111C2}\u{111C3}\u{1193F}\u{11941}\u{11A3A}\u{11A84}-\u{11A89}\u{11D46}\u{11F02}]/gu;
// - a Hangul initial consonant joins a following initial or syllable, and vowel
//   and final jamo join whatever comes before them;
const HANGUL_JOINING_INITIAL = /[\u1100-\u115F\uA960-\uA97F](?=[\u1100-\u115F\uA960-\uA97F\uAC00-\uD7A3])/gu;
const HANGUL_TRAILING_JAMO = /[\u1160-\u11FF\uD7B0-\uD7FF]/gu;
// - and extenders never start one.
const NON_STARTER = new RegExp(`[${EXTENDER}]`, 'gu');

/**
 * Number of user-perceived characters in `text`. Compared with current Unicode
 * segmentation it may count fewer characters for rare sequences (it is lenient)
 * but never more, so it never rejects a name a modern browser would count as
 * short enough.
 */
export function countCharacters(text: string): number {
  const starters = text
    // Order matters: rules that look at a neighbour run before the joiner rule
    // removes that neighbour.
    .replace(REGIONAL_INDICATOR_PAIR, 'F')
    .replace(AFTER_CONJUNCT_LINKER, '')
    .replace(PREPEND, '')
    .replace(HANGUL_JOINING_INITIAL, '')
    .replace(HANGUL_TRAILING_JAMO, '')
    .replace(AFTER_JOINER, '')
    .replace(NON_STARTER, '');
  return [...starters].length;
}

// Real conjuncts link at most five consonants (Sanskrit clusters such as
// r-t-s-n-y); a longer chain counts as one character but shows many letters.
// Built from the same EXTENDER and CONJUNCT_LINKERS classes the counter uses, so
// any chain the counter joins into one character is also checked here.
export const MAX_CONJUNCT_CONSONANTS = 5;
const LONG_CONJUNCT = new RegExp(
  `(?:\\p{L}(?:(?![${CONJUNCT_LINKERS}])[${EXTENDER}])*[${CONJUNCT_LINKERS}][${EXTENDER}]*){${MAX_CONJUNCT_CONSONANTS},}\\p{L}`,
  'u',
);

/** True when `text` contains a conjunct of more than MAX_CONJUNCT_CONSONANTS consonants. */
export function hasOverlongConjunct(text: string): boolean {
  return LONG_CONJUNCT.test(text);
}
