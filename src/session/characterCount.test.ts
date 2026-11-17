import { describe, expect, it } from 'vitest';
import { MAX_CONJUNCT_CONSONANTS, countCharacters, hasOverlongConjunct } from './characterCount';

const cp = (...codePoints: number[]) => String.fromCodePoint(...codePoints);
// Intl.Segmenter (with the Unicode data bundled with Node) is the reference.
const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
const realCount = (text: string) => Array.from(segmenter.segment(text)).length;

// Small deterministic PRNG so a failure is reproducible.
function mulberry32(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Building blocks that exercise every joining rule the fallback knows about,
// plus plain characters from several scripts.
const POOL = [
  'a', 'Z', '1', ' ', '#', '-',
  cp(0x301), cp(0x323), cp(0x302), // combining accents
  cp(0x915), cp(0x937), cp(0x92e), cp(0x94d), cp(0x93f), cp(0x947), // Devanagari + virama + vowel signs
  cp(0xd30), cp(0xd4e), cp(0xd4d), // Malayalam letter, dot reph, virama
  cp(0x1100), cp(0x1161), cp(0x11a8), cp(0xac00), cp(0xa960), // Hangul jamo and a syllable
  cp(0x1f1fa), cp(0x1f1f8), // regional indicators
  cp(0x1f469), cp(0x1f468), cp(0x2764), cp(0x1f3f4), cp(0x1f600), // emoji
  cp(0x200d), cp(0xfe0f), cp(0x1f3fb), cp(0x20e3), // joiner, selector, skin tone, keycap
  cp(0xe0067), cp(0xe0062), cp(0xe007f), // tag characters
  cp(0xe1b), cp(0xe31), cp(0xe49), // Thai
  cp(0xf56), cp(0xf92), cp(0xf74), // Tibetan
  cp(0x628), cp(0x64e), // Arabic letter + vowel mark
  cp(0xff76), cp(0xff9e), // halfwidth katakana + sound mark
  cp(0x5c71), cp(0x5e9), cp(0x5bc), // CJK, Hebrew letter + dagesh
];

describe('countCharacters', () => {
  it('never counts more characters than Intl.Segmenter (randomized)', () => {
    const random = mulberry32(20261115);
    for (let i = 0; i < 20_000; i += 1) {
      const length = 1 + Math.floor(random() * 12);
      let text = '';
      for (let j = 0; j < length; j += 1) text += POOL[Math.floor(random() * POOL.length)];
      const counted = countCharacters(text);
      const real = realCount(text);
      if (counted > real) {
        const codePoints = [...text].map((c) => c.codePointAt(0)?.toString(16)).join(' ');
        expect.fail(`counted ${counted} > ${real} for [${codePoints}]`);
      }
    }
  });

  it.each([
    ['plain text', 'Ada Lovelace'],
    ['accented letters', 'Nguy' + cp(0x65, 0x323, 0x302) + 'n'],
    ['flags', cp(0x1f1fa, 0x1f1f8, 0x1f1eb, 0x1f1f7)],
    ['joined emoji', cp(0x1f468, 0x200d, 0x1f469, 0x200d, 0x1f467, 0x200d, 0x1f466)],
    ['skin tones and keycaps', cp(0x1f44d, 0x1f3fd, 0x31, 0xfe0f, 0x20e3)],
    ['a tag flag', cp(0x1f3f4, 0xe0067, 0xe0062, 0xe0073, 0xe0063, 0xe0074, 0xe007f)],
    ['Hindi conjuncts', cp(0x915, 0x94d, 0x937, 0x924, 0x94d, 0x930, 0x93f, 0x92f)],
    ['Malayalam dot reph', cp(0xd4e, 0xd30, 0xd4e, 0xd30)],
    ['Hangul jamo', cp(0x1100, 0x1100, 0x1161, 0x11a8)],
  ])('matches Intl.Segmenter exactly for %s', (_label, text) => {
    expect(countCharacters(text)).toBe(realCount(text));
  });
});

describe('hasOverlongConjunct', () => {
  const virama = cp(0x94d);
  const chain = (n: number) => Array<string>(n).fill(cp(0x915)).join(virama);

  it('allows up to five linked consonants', () => {
    expect(hasOverlongConjunct(chain(2))).toBe(false);
    expect(hasOverlongConjunct(chain(5))).toBe(false);
    expect(hasOverlongConjunct('Ada ' + chain(5) + ' ' + chain(5))).toBe(false);
  });

  it('agrees with countCharacters for chains with any joining characters inside (randomized)', () => {
    // Characters the counter treats as part of the cluster: an accent, a vowel
    // sign, a skin tone, a zero-width joiner, a halfwidth sound mark, a selector.
    const extenders = [cp(0x301), cp(0x93f), cp(0x1f3fb), cp(0x200d), cp(0xff9e), cp(0xfe0f)];
    const random = mulberry32(7);
    const pick = () => extenders[Math.floor(random() * extenders.length)] ?? '';
    const sprinkle = () => Array.from({ length: Math.floor(random() * 3) }, pick).join('');
    for (let i = 0; i < 2_000; i += 1) {
      const consonants = 1 + Math.floor(random() * 10);
      let text = cp(0x915);
      for (let c = 1; c < consonants; c += 1) text += sprinkle() + virama + sprinkle() + cp(0x915);
      const label = `${consonants} consonants: [${[...text].map((ch) => ch.codePointAt(0)?.toString(16)).join(' ')}]`;
      expect([label, countCharacters(text)]).toEqual([label, 1]);
      expect([label, hasOverlongConjunct(text)]).toEqual([label, consonants > MAX_CONJUNCT_CONSONANTS]);
    }
  });

  it('flags a chain with a skin tone after every link', () => {
    const disguised = (cp(0x915) + virama + cp(0x1f3fb)).repeat(31) + cp(0x915);
    expect(countCharacters(disguised)).toBe(1);
    expect(hasOverlongConjunct(disguised)).toBe(true);
  });

  it('flags six or more, also with vowel signs or a joiner inside the chain', () => {
    expect(hasOverlongConjunct(chain(6))).toBe(true);
    expect(hasOverlongConjunct(chain(43))).toBe(true);
    const withZwj = chain(3) + virama + cp(0x200d) + cp(0x915) + virama + cp(0x915) + virama + cp(0x915);
    expect(hasOverlongConjunct(withZwj)).toBe(true);
  });
});
