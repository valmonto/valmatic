import { Link, useRouteError } from 'react-router';

export default function ErrorPage() {
  const error = useRouteError();

  return (
    <div className="flex flex-col items-center gap-4 py-20">
      <h1 className="text-4xl font-bold">Error</h1>
      <p className="text-muted-foreground">
        {error instanceof Error ? error.message : 'Something went wrong'}
      </p>
      <Link to="/" className="text-sm text-primary underline">
        Go home
      </Link>
    </div>
  );
}
