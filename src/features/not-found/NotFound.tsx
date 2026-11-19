import { Link } from 'react-router';
import { paths } from '../../router/paths';

export default function NotFound() {
  return (
    <main className="not-found">
      <h1>Page not found</h1>
      <p>
        <Link to={paths.home}>Go to the start page</Link>
      </p>
    </main>
  );
}
