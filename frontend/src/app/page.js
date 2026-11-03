import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
      <h1 className="text-3xl font-bold">Empty Bottle</h1>
      <p className="max-w-md text-gray-600">
        Find campus drinking water points that are available, clean, cool and
        not crowded.
      </p>
      <div className="flex gap-3">
        <Link href="/login" className="rounded bg-blue-600 px-4 py-2 text-white">
          Login
        </Link>
        <Link href="/register" className="rounded border border-blue-600 px-4 py-2 text-blue-600">
          Register
        </Link>
      </div>
    </main>
  );
}
