import { createContext, useContext } from 'react';

export interface UserContextValue {
  /** The current username, or an empty string when nobody has entered one. */
  username: string;
  /** Validates and stores a username. Returns an error message, or `null` on success. */
  logIn: (rawName: string) => string | null;
  logOut: () => void;
}

export const UserContext = createContext<UserContextValue | null>(null);

export function useUser(): UserContextValue {
  const value = useContext(UserContext);
  if (!value) throw new Error('useUser must be used inside <UserProvider>.');
  return value;
}
