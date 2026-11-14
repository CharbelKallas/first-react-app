import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { UserContext, type UserContextValue } from './userContext';
import { loadUsername, saveUsername } from './storage';
import { normalizeUsername, validateUsername } from './username';

export function UserProvider({ children }: { children: ReactNode }) {
  // Lazy initializer: read storage once, so a page refresh keeps the user.
  const [username, setUsername] = useState(loadUsername);

  const logIn = useCallback((rawName: string) => {
    const name = normalizeUsername(rawName);
    const error = validateUsername(name);
    if (error) return error;
    saveUsername(name);
    setUsername(name);
    return null;
  }, []);

  const logOut = useCallback(() => {
    saveUsername('');
    setUsername('');
  }, []);

  const value = useMemo<UserContextValue>(
    () => ({ username, logIn, logOut }),
    [username, logIn, logOut],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
