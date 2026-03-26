/**
 * Home page placeholder.
 * Displays a simple landing message until the full UI is implemented.
 */
export default function HomePage(): React.ReactElement {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="mb-4 text-4xl font-bold tracking-tight">DSA Sheet Tracker</h1>
      <p className="text-lg text-gray-600">
        Track your Data Structures & Algorithms practice progress.
      </p>
    </main>
  );
}
