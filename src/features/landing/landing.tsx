import { useNavigate } from 'react-router';
import { paths } from '../../router/paths';
import { useUser } from '../../session/userContext';

export default function Landing() {
  const { username, logOut } = useUser();
  const navigate = useNavigate();

  const handleLogOut = () => {
    logOut();
    navigate(paths.welcome, { replace: true });
  };

  return (
    <div className="landing">
      <header className="landing__bar">
        <button type="button" className="landing__logout" onClick={handleLogOut}>
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
