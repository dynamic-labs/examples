"use client";

/**
 * Route-level error boundary. Without one, a render-time throw drops the user
 * onto Next.js's blank error screen — possibly while a transaction is in
 * flight, taking the on-screen hash with it.
 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="max-w-md mx-auto mt-16 rounded-2xl border border-line p-6 text-center space-y-3">
      <p className="text-sm">Something went wrong.</p>
      <p className="text-xs text-muted break-words">{error.message}</p>
      <button
        onClick={reset}
        className="cursor-pointer text-sm font-medium text-brand hover:underline"
      >
        Try again
      </button>
    </div>
  );
}
