export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Better Auth + Next.js + Drizzle</h1>
        <p className="text-gray-600 mb-8">Example application with Better Auth Studio</p>
        <div className="space-x-4">
          <a
            href="/api/auth/sign-in"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Sign In
          </a>
          <a
            href="/api/auth/sign-up"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Sign Up
          </a>
        </div>
      </div>
    </main>
  );
}
