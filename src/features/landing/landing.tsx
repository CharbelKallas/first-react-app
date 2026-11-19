import { useUser } from '../../session/userContext';

export default function Landing() {
  const { username, logOut } = useUser();

  return (
    <div className="landing">
      <header className="landing__bar">
        {/* Clearing the user is enough: the route guard then redirects to /welcome. */}
        <button type="button" className="landing__logout" onClick={logOut}>
          Log Out
        </button>
      </header>
      <main className="landing__content">
        <h1 className="landing__greeting">Hello {username}</h1>
        <p className="landing__tagline">Welcome to my website!</p>
      </main>
    </div>
  );
}
