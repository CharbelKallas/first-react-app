import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { UserContext, type UserContextValue } from './userContext';
import { loadUsername, saveUsername } from './storage';
import { parseUsername } from './username';

export function UserProvider({ children }: { children: ReactNode }) {
  // Lazy initializer: read storage once, so a page refresh keeps the user.
  const [username, setUsername] = useState(loadUsername);

  const logIn = useCallback((rawName: string) => {
    const parsed = parseUsername(rawName);
    if (!parsed.ok) return parsed.error;
    saveUsername(parsed.name);
    setUsername(parsed.name);
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
