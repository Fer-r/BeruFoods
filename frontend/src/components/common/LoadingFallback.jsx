/**
 * LoadingFallback displays a simple loading message centered on the screen.
 * It is typically used as a fallback UI during lazy loading of components or routes,
 * providing a visual indicator to the user that content is being loaded.
 */
const LoadingFallback = () => (
  <div className="flex justify-center items-center h-screen">
    <p>Loading page...</p>
  </div>
);

export default LoadingFallback; 