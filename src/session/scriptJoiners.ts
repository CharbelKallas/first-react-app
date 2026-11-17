// Zero-width joiner (U+200D) and non-joiner (U+200C) rules for scripts that use
// them as real spelling characters. A joiner is meaningful only where it changes
// what is drawn; elsewhere it is invisible, which would let two names that look
// identical be stored differently. So each one is either:
// - meaningful: kept and allowed;
// - redundant (no visible effect in a script that uses joiners): removed during
//   normalization, so both spellings are stored the same way;
// - anything else: left in place, where the allowlist rejects it.

// Viramas that join consonants into one conjunct under Unicode's grapheme rules
// (Devanagari, Bengali, Gujarati, Oriya, Telugu, Malayalam).
export const CONJUNCT_LINKERS = `\\u094D\\u09CD\\u0ACD\\u0B4D\\u0C4D\\u0D4D`;
// Viramas after which a joiner selects a half form or ligature (adds Kannada and
// Sinhala). Gurmukhi and Tamil viramas are always drawn, so a joiner there does nothing.
const HALF_FORM_VIRAMAS = `${CONJUNCT_LINKERS}\\u0CCD\\u0DCA`;
// Viramas after which a non-joiner stops a conjunct from forming.
const NON_JOINER_VIRAMAS = `${HALF_FORM_VIRAMAS}\\u0A4D`;
const DRAWN_VIRAMAS = `\\u0A4D\\u0BCD`;

const INDIC_SCRIPTS = [
  'Devanagari',
  'Bengali',
  'Gurmukhi',
  'Gujarati',
  'Oriya',
  'Tamil',
  'Telugu',
  'Kannada',
  'Malayalam',
  'Sinhala',
]
  .map((script) => `\\p{Script=${script}}`)
  .join('');
const INDIC_LETTER = `(?:(?=\\p{L})[${INDIC_SCRIPTS}])`;

// Arabic-script letters that never connect to the following letter (Unicode
// joining types R and U): alef and hamza forms, dal, thal, reh, zain, waw, teh
// marbuta and their Persian/Urdu/Kurdish variants. A non-joiner after them changes
// nothing; after any other Arabic letter it breaks the connection visibly.
const ARABIC_NON_LEFT_JOINING = `\\u0621-\\u0625\\u0627\\u0629\\u062F-\\u0632\\u0648\\u0671-\\u0677\\u0688-\\u0699\\u06C0\\u06C3-\\u06CB\\u06CD\\u06CF\\u06D2\\u06D3\\u06D5\\u06EE\\u06EF`;
const ARABIC_LETTER = `(?:(?=\\p{L})\\p{Script=Arabic})`;
const ARABIC_LEFT_JOINING_LETTER = `(?:(?![${ARABIC_NON_LEFT_JOINING}])${ARABIC_LETTER})`;
// A following letter must be able to connect back (hamza cannot).
const ARABIC_RIGHT_JOINING_LETTER = `(?:(?![\\u0621\\u0674])${ARABIC_LETTER})`;

const MEANINGFUL_JOINERS = new RegExp(
  [
    `(?<=${ARABIC_LEFT_JOINING_LETTER}\\p{M}*)\\u200C(?=${ARABIC_RIGHT_JOINING_LETTER})`,
    `(?<=[${NON_JOINER_VIRAMAS}])\\u200C(?=${INDIC_LETTER})`,
    `(?<=[${HALF_FORM_VIRAMAS}])\\u200D(?=${INDIC_LETTER})`,
  ].join('|'),
  'gu',
);

const REDUNDANT_JOINERS = new RegExp(
  [
    // Non-joiner between Arabic letters where no connection would form anyway.
    `(?<=[${ARABIC_NON_LEFT_JOINING}]\\p{M}*)\\u200C(?=${ARABIC_LETTER})`,
    `(?<=${ARABIC_LETTER}\\p{M}*)\\u200C(?=[\\u0621\\u0674])`,
    // Non-joiner between Indic letters with no virama before it.
    `(?<=${INDIC_LETTER}(?:(?![${NON_JOINER_VIRAMAS}])\\p{M})*)\\u200C(?=${INDIC_LETTER})`,
    // Joiner after a virama that is always drawn.
    `(?<=[${DRAWN_VIRAMAS}])\\u200D(?=${INDIC_LETTER})`,
  ].join('|'),
  'gu',
);

/** Removes joiners and non-joiners that have no visible effect in their script. */
export function removeRedundantJoiners(text: string): string {
  return text.replace(REDUNDANT_JOINERS, '');
}

/** Removes the joiners and non-joiners that are meaningful, so only stray ones remain. */
export function removeMeaningfulJoiners(text: string): string {
  return text.replace(MEANINGFUL_JOINERS, '');
}
