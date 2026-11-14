import { BrowserRouter } from 'react-router';
import AppRoutes from './router/AppRoutes';
import { UserProvider } from './session/UserProvider';

export default function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </UserProvider>
  );
}
