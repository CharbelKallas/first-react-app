import { describe, expect, it, vi } from 'vitest';
import { USERNAME_STORAGE_KEY, loadUsername, saveUsername } from './storage';

describe('username storage', () => {
  it('round-trips a saved username', () => {
    saveUsername('Ada');
    expect(window.sessionStorage.getItem(USERNAME_STORAGE_KEY)).toBe('Ada');
    expect(loadUsername()).toBe('Ada');
  });

  it('removes the entry when saving an empty name', () => {
    saveUsername('Ada');
    saveUsername('');
    expect(window.sessionStorage.getItem(USERNAME_STORAGE_KEY)).toBeNull();
    expect(loadUsername()).toBe('');
  });

  it('ignores a stored value that would fail validation', () => {
    window.sessionStorage.setItem(USERNAME_STORAGE_KEY, 'x'.repeat(500));
    expect(loadUsername()).toBe('');
  });

  it('normalizes a hand-edited stored value', () => {
    window.sessionStorage.setItem(USERNAME_STORAGE_KEY, '  Ada  ');
    expect(loadUsername()).toBe('Ada');
  });

  it('keeps working when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => saveUsername('Ada')).not.toThrow();
    expect(loadUsername()).toBe('');
  });
});
