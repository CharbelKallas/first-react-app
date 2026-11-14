import { describe, expect, it } from 'vitest';
import { USERNAME_MAX_LENGTH, normalizeUsername, validateUsername } from './username';

const RIGHT_TO_LEFT_OVERRIDE = String.fromCodePoint(0x202e);
const NULL_CHAR = String.fromCodePoint(0);

describe('normalizeUsername', () => {
  it('trims and collapses whitespace', () => {
    expect(normalizeUsername('   Ada \t  Lovelace \n')).toBe('Ada Lovelace');
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
});
