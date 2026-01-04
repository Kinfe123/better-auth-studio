export default function Index() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8", padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Better Auth Studio - Remix Example</h1>
      <p>Welcome to the Better Auth Studio Remix example!</p>
      <p>
        <a href="/api/studio" style={{ color: "#646cff", textDecoration: "underline" }}>
          Access the Studio at /api/studio
        </a>
      </p>
    </div>
  );
}

