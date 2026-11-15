import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { paths } from '../../router/paths';
import { useUser } from '../../session/userContext';
import { USERNAME_MAX_INPUT_LENGTH, USERNAME_MAX_LENGTH } from '../../session/username';

export default function Onboarding() {
  const { logIn } = useUser();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  // A real <form> submit handler, so pressing Enter works as well as clicking.
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const loginError = logIn(name);
    if (loginError) {
      setError(loginError);
      return;
    }
    navigate(paths.loggedIn, { replace: true });
  };

  return (
    <main className="onboarding">
      <h1 className="onboarding__title">Welcome</h1>
      <form className="onboarding__form" onSubmit={handleSubmit} noValidate>
        <label htmlFor="username">Username</label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          maxLength={USERNAME_MAX_INPUT_LENGTH}
          placeholder="Enter your username"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (error) setError(null);
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'username-error' : 'username-hint'}
        />
        <button type="submit">Log In</button>
        {error ? (
          <p id="username-error" className="onboarding__error" role="alert">
            {error}
          </p>
        ) : (
          <p id="username-hint" className="onboarding__hint">
            Up to {USERNAME_MAX_LENGTH} characters.
          </p>
        )}
      </form>
    </main>
  );
}
