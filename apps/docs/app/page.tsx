import Link from "next/link";

const title = "Better Auth Studio";
const description = "The admin dashboard for your Better Auth project. Manage users, organizations, and auth settings from a powerful visual interface.";

export default function HomePage() {
  return (
    <main style={{ padding: 32 }}>
      <h1>{title}</h1>
      <p>{description}</p>
      <Link href="/docs">Open docs</Link>
    </main>
  );
}
