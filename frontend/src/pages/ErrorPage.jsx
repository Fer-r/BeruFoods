import { useRouteError, Link } from 'react-router';

export default function ErrorPage() {
  const error = useRouteError();
  console.error(error);

  let errorMessage = "Sorry, an unexpected error has occurred.";
  let errorDetails = null;

  if (error) {
    if (typeof error === 'string') {
      errorMessage = error;
    } else if (error.statusText) {
      errorMessage = error.statusText;
    } else if (error.message) {
      errorMessage = error.message;
    }
    if (error.data) {
        errorDetails = <p><i>{error.data}</i></p>;
    }
  }

  return (
    <div id="error-page" className="flex flex-col items-center justify-center min-h-screen bg-base-200 text-center p-4">
      <h1 className="text-4xl font-bold text-error mb-4">Oops!</h1>
      <p className="text-lg text-base-content mb-2">{errorMessage}</p>
      {errorDetails}
      <p className="text-base-content mb-6">
        It seems something went wrong. You can try refreshing the page or go back to safety.
      </p>
      <Link to="/" className="btn btn-primary">
        Go to Homepage
      </Link>
    </div>
  );
} 