import Link from "next/link";

const title = "Better Auth Studio";
const description = "An admin studio for Better Auth — manage users, organizations, and auth configuration from a beautiful UI.";

export default function HomePage() {
  return (
    <main style={{ padding: 32 }}>
      <h1>{title}</h1>
      <p>{description}</p>
      <Link href="/docs">Open docs</Link>
    </main>
  );
}
