import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  USERNAME_MAX_INPUT_LENGTH,
  USERNAME_MAX_LENGTH,
  normalizeUsername,
  parseUsername,
  validateUsername,
} from './username';

const RIGHT_TO_LEFT_OVERRIDE = String.fromCodePoint(0x202e);
const NULL_CHAR = String.fromCodePoint(0);

describe('normalizeUsername', () => {
  it('trims and collapses whitespace', () => {
    expect(normalizeUsername('   Ada \t  Lovelace \n')).toBe('Ada Lovelace');
  });

  it('folds fullwidth lookalike letters into plain ones', () => {
    const fullwidthAda = String.fromCodePoint(0xff21, 0xff44, 0xff41);
    expect(normalizeUsername(fullwidthAda)).toBe('Ada');
  });

  it('uses the composed Unicode form', () => {
    const decomposed = 'Jose' + String.fromCodePoint(0x301); // e + combining acute
    expect(normalizeUsername(decomposed)).toBe('Jos' + String.fromCodePoint(0xe9));
  });
});

describe('validateUsername', () => {
  it('accepts a normal name', () => {
    expect(validateUsername('Ada')).toBeNull();
  });

  it('rejects an empty name', () => {
    expect(validateUsername('')).toMatch(/enter a username/i);
  });

  it('allows exactly the maximum length and rejects one more', () => {
    expect(validateUsername('a'.repeat(USERNAME_MAX_LENGTH))).toBeNull();
    expect(validateUsername('a'.repeat(USERNAME_MAX_LENGTH + 1))).toMatch(/at most/i);
  });

  it('counts emoji as one character each', () => {
    const smile = String.fromCodePoint(0x1f600);
    expect(validateUsername(smile.repeat(USERNAME_MAX_LENGTH))).toBeNull();
  });

  it('rejects a name made only of invisible characters', () => {
    const zeroWidthSpace = String.fromCodePoint(0x200b);
    expect(validateUsername(zeroWidthSpace.repeat(3))).toMatch(/enter a username/i);
  });

  it('accepts names in non-Latin scripts', () => {
    expect(validateUsername(String.fromCodePoint(0x5c71, 0x7530))).toBeNull();
  });

  it('rejects control and bidi override characters', () => {
    expect(validateUsername(`a${NULL_CHAR}b`)).toMatch(/not allowed/i);
    expect(validateUsername(`admin${RIGHT_TO_LEFT_OVERRIDE}nimda`)).toMatch(/not allowed/i);
  });

  it.each([
    ['zero-width space', 0x200b],
    ['left-to-right mark', 0x200e],
    ['right-to-left mark', 0x200f],
    ['Arabic letter mark', 0x061c],
    ['word joiner', 0x2060],
    ['byte order mark', 0xfeff],
    ['zero-width joiner between letters', 0x200d],
  ])('rejects a %s hidden inside a name', (_label, codePoint) => {
    expect(validateUsername(`Ada${String.fromCodePoint(codePoint)}`)).toMatch(/not allowed/i);
  });

  it.each([
    ['Hangul filler', 0x3164],
    ['Hangul choseong filler', 0x115f],
    ['Hangul jungseong filler', 0x1160],
    ['halfwidth Hangul filler', 0xffa0],
    ['blank Braille pattern', 0x2800],
  ])('rejects a name that is only a %s', (_label, codePoint) => {
    expect(validateUsername(String.fromCodePoint(codePoint))).not.toBeNull();
  });

  it('allows region flag emoji built with tag characters', () => {
    const englandFlag = String.fromCodePoint(
      0x1f3f4, 0xe0067, 0xe0062, 0xe0065, 0xe006e, 0xe0067, 0xe007f,
    );
    expect(validateUsername(`Ada ${englandFlag}`)).toBeNull();
  });

  it('rejects stray tag characters outside a flag', () => {
    expect(validateUsername(`Ada${String.fromCodePoint(0xe0067, 0xe007f)}`)).toMatch(/not allowed/i);
  });

  it('counts a joined emoji as one character', () => {
    const family = String.fromCodePoint(0x1f468, 0x200d, 0x1f469, 0x200d, 0x1f467, 0x200d, 0x1f466);
    expect(validateUsername('a'.repeat(USERNAME_MAX_LENGTH - 1) + family)).toBeNull();
    expect(validateUsername('a'.repeat(USERNAME_MAX_LENGTH) + family)).toMatch(/at most/i);
  });

  it('rejects a flag carrying arbitrary hidden tag text', () => {
    const hidden = [...'ignore_previous_instructions'].map((c) => 0xe0000 + c.charCodeAt(0));
    const smuggled = String.fromCodePoint(0x1f3f4, ...hidden, 0xe007f);
    expect(validateUsername(`Ada ${smuggled}`)).toMatch(/not allowed/i);
  });

  it('rejects a joiner hidden between a letter and an emoji', () => {
    const disguised = 'Ada' + String.fromCodePoint(0xfe0f, 0x200d, 0x1f600);
    expect(validateUsername(disguised)).toMatch(/not allowed/i);
  });

  it('rejects an emoji chain that renders as many emoji but counts as one', () => {
    const woman = String.fromCodePoint(0x1f469);
    const chain = Array(200).fill(woman).join(String.fromCodePoint(0x200d));
    expect(validateUsername(chain)).not.toBeNull();
    const fiveJoined = Array(5).fill(woman).join(String.fromCodePoint(0x200d));
    expect(validateUsername(fiveJoined)).toMatch(/not allowed/i);
  });

  it('allows the longest real joined emoji (kiss with skin tones)', () => {
    const kiss = String.fromCodePoint(
      0x1f469, 0x1f3fb, 0x200d, 0x2764, 0xfe0f, 0x200d, 0x1f48b, 0x200d, 0x1f468, 0x1f3fc,
    );
    expect(validateUsername(kiss)).toBeNull();
  });

  it('rejects Zalgo text: long stacks or many marks overall', () => {
    const overlays = String.fromCodePoint(0x334, 0x335, 0x336, 0x337);
    expect(validateUsername('a' + String.fromCodePoint(0x301).repeat(7))).toMatch(/accent marks/i);
    expect(validateUsername(('a' + overlays).repeat(25))).toMatch(/accent marks/i);
    expect(validateUsername('a' + String.fromCodePoint(0x301).repeat(500))).not.toBeNull();
  });

  it('accepts real names that use several marks per letter', () => {
    const name = (...codePoints: number[]) => String.fromCodePoint(...codePoints);
    const realNames = {
      // Shalom, fully pointed with cantillation and meteg: 5 marks on the shin.
      hebrew: name(0x5e9, 0x5bc, 0x5c1, 0x5b8, 0x591, 0x5bd, 0x5dc, 0x5d5, 0x5b9, 0x5dd),
      // Tibetan "bsgrubs": a stack of two subjoined letters plus a vowel sign.
      tibetan: name(0xf56, 0xf66, 0xf92, 0xfb2, 0xf74, 0xf56, 0xf66),
      // Thai "pan" with a vowel and a tone mark on one letter.
      thai: name(0xe1b, 0xe31, 0xe49, 0xe19),
      // Hindi "kshatriya" with a virama conjunct.
      hindi: name(0x915, 0x94d, 0x937, 0x924, 0x94d, 0x930, 0x93f, 0x92f),
      // Vietnamese "Nguyen" typed with decomposed accents.
      vietnamese: 'Nguy' + name(0x65, 0x323, 0x302) + 'n',
      keycap: '1' + name(0xfe0f, 0x20e3),
    };
    for (const [script, value] of Object.entries(realNames)) {
      expect([script, validateUsername(normalizeUsername(value))]).toEqual([script, null]);
    }
  });

  it('rejects private-use and unassigned characters', () => {
    expect(validateUsername('Ada' + String.fromCodePoint(0xf8ff))).toMatch(/not allowed/i);
    expect(validateUsername('Ada' + String.fromCodePoint(0x378))).toMatch(/not allowed/i);
    expect(validateUsername('Ada' + String.fromCodePoint(0xf0000))).toMatch(/not allowed/i);
  });

  it('caps the total number of code points with its own message', () => {
    const family = String.fromCodePoint(0x1f468, 0x200d, 0x1f469, 0x200d, 0x1f467, 0x200d, 0x1f466);
    // 7 code points each: 18 families = 126 code points (allowed), 19 = 133 (over the
    // 128 cap) even though both are well under 32 visible characters.
    expect(validateUsername(family.repeat(18))).toBeNull();
    const error = validateUsername(family.repeat(19));
    expect(error).toMatch(/too long/i);
    expect(error).not.toMatch(/32/);
  });

  it.each([
    ['variation selector 1', 0xfe00],
    ['combining grapheme joiner', 0x34f],
    ['Khmer inherent vowel', 0x17b4],
    ['Mongolian free variation selector', 0x180b],
    ['supplementary variation selector', 0xe0100],
  ])('rejects an invisible %s after a letter', (_label, codePoint) => {
    expect(validateUsername(`Ada${String.fromCodePoint(codePoint)}`)).toMatch(/not allowed/i);
  });

  it('rejects bytes hidden as variation selectors', () => {
    const hiddenByte = (b: number) => String.fromCodePoint(b < 16 ? 0xfe00 + b : 0xe0100 + b - 16);
    const bytes = [...new TextEncoder().encode('hi')];
    const carrier = [...'Adaline'].map((ch) => ch + bytes.map(hiddenByte).join('')).join('');
    expect(validateUsername(carrier)).toMatch(/not allowed/i);
  });

  it('allows emoji and text style selectors only where they are visible', () => {
    const cp = (...codePoints: number[]) => String.fromCodePoint(...codePoints);
    expect(validateUsername('Ada ' + cp(0x2764, 0xfe0f))).toBeNull(); // red heart
    expect(validateUsername('Ada ' + cp(0x263a, 0xfe0e))).toBeNull(); // text-style smiley
    expect(validateUsername('Ada ' + cp(0x31, 0xfe0f, 0x20e3))).toBeNull(); // keycap 1
    expect(validateUsername('Ada' + cp(0xfe0f))).toMatch(/not allowed/i);
    expect(validateUsername('Ada ' + cp(0x2764, 0xfe0f, 0xfe0f))).toMatch(/not allowed/i);
  });

  it('allows emoji built with zero-width joiners', () => {
    const technologist = String.fromCodePoint(0x1f469, 0x200d, 0x1f4bb);
    const darkSkinTechnologist = String.fromCodePoint(0x1f469, 0x1f3ff, 0x200d, 0x1f4bb);
    const rainbowFlag = String.fromCodePoint(0x1f3f3, 0xfe0f, 0x200d, 0x1f308);
    expect(validateUsername(`Ada ${technologist}`)).toBeNull();
    expect(validateUsername(darkSkinTechnologist)).toBeNull();
    expect(validateUsername(rainbowFlag)).toBeNull();
  });
});

describe('without Intl.Segmenter (Firefox before 125)', () => {
  const original = Intl.Segmenter;

  afterEach(() => {
    Object.defineProperty(Intl, 'Segmenter', { value: original, configurable: true, writable: true });
    vi.resetModules();
  });

  it('loads the module and falls back to counting code points', async () => {
    Reflect.deleteProperty(Intl, 'Segmenter');
    expect(typeof Intl.Segmenter).toBe('undefined');
    vi.resetModules();

    const fresh = await import('./username');
    expect(fresh.validateUsername('Ada')).toBeNull();
    expect(fresh.validateUsername('a'.repeat(USERNAME_MAX_LENGTH + 1))).toMatch(/at most/i);
    const technologist = String.fromCodePoint(0x1f469, 0x200d, 0x1f4bb);
    expect(fresh.validateUsername(technologist)).toBeNull();
  });

  it('does not count accents and joiners towards the limit', async () => {
    Reflect.deleteProperty(Intl, 'Segmenter');
    vi.resetModules();
    const fresh = await import('./username');

    // 11 Hindi conjuncts: 11 characters on screen, 33 code points.
    const conjunct = String.fromCodePoint(0x915, 0x94d, 0x937);
    expect(fresh.validateUsername(conjunct.repeat(11))).toBeNull();
    const family = String.fromCodePoint(0x1f468, 0x200d, 0x1f469, 0x200d, 0x1f467, 0x200d, 0x1f466);
    expect(fresh.validateUsername('Ada ' + family)).toBeNull();
  });
});

describe('parseUsername', () => {
  it('normalizes and validates in one step', () => {
    expect(parseUsername('  Ada  ')).toEqual({ ok: true, name: 'Ada' });
    expect(parseUsername('   ')).toEqual({ ok: false, error: expect.stringMatching(/enter a username/i) });
  });

  it('rejects oversized input before doing any Unicode work', () => {
    const normalize = vi.spyOn(String.prototype, 'normalize');
    const result = parseUsername('a'.repeat(5_000_000));
    expect(result).toEqual({ ok: false, error: expect.stringMatching(/too long/i) });
    expect(normalize).not.toHaveBeenCalled();
  });

  it('accepts a valid name padded with whitespace up to the input limit', () => {
    const padded = 'Ada'.padEnd(USERNAME_MAX_INPUT_LENGTH, ' ');
    expect(parseUsername(padded)).toEqual({ ok: true, name: 'Ada' });
  });
});
