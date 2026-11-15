import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import App from './App';
import AppRoutes from './router/AppRoutes';
import { UserProvider } from './session/UserProvider';
import { USERNAME_STORAGE_KEY } from './session/storage';
import { USERNAME_MAX_INPUT_LENGTH } from './session/username';

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
}

function renderAt(path: string) {
  const user = userEvent.setup();
  render(
    <UserProvider>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
        <LocationProbe />
      </MemoryRouter>
    </UserProvider>,
  );
  return { user, location: () => screen.getByTestId('location').textContent };
}

describe('routing', () => {
  it('sends a new visitor from / to the welcome page', () => {
    const { location } = renderAt('/');
    expect(location()).toBe('/welcome');
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
  });

  it('sends a visitor without a username away from /logged-in', () => {
    const { location } = renderAt('/logged-in');
    expect(location()).toBe('/welcome');
  });

  it('shows a not-found page for unknown URLs', async () => {
    const { user, location } = renderAt('/does-not-exist');
    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: /start page/i }));
    expect(location()).toBe('/welcome');
  });
});

describe('log in flow', () => {
  it('logs in by pressing Enter and greets the user', async () => {
    const { user, location } = renderAt('/welcome');
    await user.type(screen.getByLabelText(/username/i), 'Ada{Enter}');

    expect(location()).toBe('/logged-in');
    expect(screen.getByRole('heading', { name: 'Hello Ada' })).toBeInTheDocument();
    expect(window.sessionStorage.getItem(USERNAME_STORAGE_KEY)).toBe('Ada');
  });

  it('logs in with the button and trims the name', async () => {
    const { user } = renderAt('/welcome');
    await user.type(screen.getByLabelText(/username/i), '   Grace   Hopper  ');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(screen.getByRole('heading', { name: 'Hello Grace Hopper' })).toBeInTheDocument();
  });

  it('refuses an empty or blank username and explains why', async () => {
    const { user, location } = renderAt('/welcome');
    const input = screen.getByLabelText(/username/i);

    await user.click(screen.getByRole('button', { name: /log in/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/enter a username/i);
    expect(input).toHaveAttribute('aria-invalid', 'true');

    await user.type(input, '    {Enter}');
    expect(location()).toBe('/welcome');
    expect(window.sessionStorage.getItem(USERNAME_STORAGE_KEY)).toBeNull();
  });

  it('shows an error instead of silently cutting an oversized paste', async () => {
    const { user, location } = renderAt('/welcome');
    await user.click(screen.getByLabelText(/username/i));
    await user.paste('Ada' + ' '.repeat(USERNAME_MAX_INPUT_LENGTH) + 'Smith');
    await user.keyboard('{Enter}');

    expect(location()).toBe('/welcome');
    expect(screen.getByRole('alert')).toHaveTextContent(/too long/i);
  });

  it('clears the error once the user edits the name', async () => {
    const { user } = renderAt('/welcome');
    await user.click(screen.getByRole('button', { name: /log in/i }));
    expect(screen.getByRole('alert')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/username/i), 'A');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders markup in a username as plain text', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const { user } = renderAt('/welcome');
    const payload = '<img src=x onerror=alert(1)>';
    await user.type(screen.getByLabelText(/username/i), `${payload}{Enter}`);

    expect(screen.getByRole('heading', { name: `Hello ${payload}` })).toBeInTheDocument();
    expect(document.querySelector('img')).toBeNull();
    expect(alertSpy).not.toHaveBeenCalled();
  });
});

describe('session', () => {
  it('keeps the user after a page reload', () => {
    window.sessionStorage.setItem(USERNAME_STORAGE_KEY, 'Ada');
    const { location } = renderAt('/');
    expect(location()).toBe('/logged-in');
    expect(screen.getByRole('heading', { name: 'Hello Ada' })).toBeInTheDocument();
  });

  it('logs out, forgets the user and guards the page again', async () => {
    window.sessionStorage.setItem(USERNAME_STORAGE_KEY, 'Ada');
    const { user, location } = renderAt('/logged-in');

    await user.click(screen.getByRole('button', { name: /log out/i }));
    expect(location()).toBe('/welcome');
    expect(window.sessionStorage.getItem(USERNAME_STORAGE_KEY)).toBeNull();
  });
});

describe('when sessionStorage is blocked', () => {
  it('still logs in and out, keeping the user in memory', async () => {
    for (const method of ['getItem', 'setItem', 'removeItem'] as const) {
      vi.spyOn(Storage.prototype, method).mockImplementation(() => {
        throw new DOMException('Storage is disabled', 'SecurityError');
      });
    }
    const { user, location } = renderAt('/');
    expect(location()).toBe('/welcome');

    await user.type(screen.getByLabelText(/username/i), 'Ada{Enter}');
    expect(location()).toBe('/logged-in');
    expect(screen.getByRole('heading', { name: 'Hello Ada' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /log out/i }));
    expect(location()).toBe('/welcome');
  });
});

describe('App (real browser router)', () => {
  it('boots at the current URL and completes the flow', async () => {
    window.history.pushState(null, '', '/');
    const user = userEvent.setup();
    render(<App />);

    expect(window.location.pathname).toBe('/welcome');
    await user.type(screen.getByLabelText(/username/i), 'Linus{Enter}');
    expect(window.location.pathname).toBe('/logged-in');
    expect(screen.getByRole('heading', { name: 'Hello Linus' })).toBeInTheDocument();
  });
});
