import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import Landing from '../features/landing/landing';
import NotFound from '../features/not-found/NotFound';
import Onboarding from '../features/onboarding/onboarding';
import { useUser } from '../session/userContext';
import { paths } from './paths';

/** Sends visitors without a username to the welcome page. */
function RequireUser({ children }: { children: ReactNode }) {
  const { username } = useUser();
  return username ? children : <Navigate to={paths.welcome} replace />;
}

function HomeRedirect() {
  const { username } = useUser();
  return <Navigate to={username ? paths.loggedIn : paths.welcome} replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path={paths.home} element={<HomeRedirect />} />
      <Route path={paths.welcome} element={<Onboarding />} />
      <Route
        path={paths.loggedIn}
        element={
          <RequireUser>
            <Landing />
          </RequireUser>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
