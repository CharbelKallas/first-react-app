import { parseUsername } from './username';

export const USERNAME_STORAGE_KEY = 'first-react-app:username';

/**
 * Reads the remembered username for this browser tab.
 * sessionStorage can be unavailable (privacy modes, blocked site data) or contain
 * a value edited by hand, so failures and invalid values both mean "no user".
 */
export function loadUsername(): string {
  try {
    const stored = window.sessionStorage.getItem(USERNAME_STORAGE_KEY);
    if (stored === null) return '';
    const parsed = parseUsername(stored);
    return parsed.ok ? parsed.name : '';
  } catch {
    return '';
  }
}

/** Saves the username for this tab, or forgets it when given an empty string. */
export function saveUsername(name: string): void {
  try {
    if (name) {
      window.sessionStorage.setItem(USERNAME_STORAGE_KEY, name);
    } else {
      window.sessionStorage.removeItem(USERNAME_STORAGE_KEY);
    }
  } catch {
    // Storage is best-effort: the app keeps working in memory without it.
  }
}
