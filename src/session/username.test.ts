import { describe, expect, it } from 'vitest';
import { USERNAME_MAX_LENGTH, normalizeUsername, validateUsername } from './username';

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

  it('allows emoji built with zero-width joiners', () => {
    const technologist = String.fromCodePoint(0x1f469, 0x200d, 0x1f4bb);
    const darkSkinTechnologist = String.fromCodePoint(0x1f469, 0x1f3ff, 0x200d, 0x1f4bb);
    const rainbowFlag = String.fromCodePoint(0x1f3f3, 0xfe0f, 0x200d, 0x1f308);
    expect(validateUsername(`Ada ${technologist}`)).toBeNull();
    expect(validateUsername(darkSkinTechnologist)).toBeNull();
    expect(validateUsername(rainbowFlag)).toBeNull();
  });
});
