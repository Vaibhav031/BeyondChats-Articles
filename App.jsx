import ArticleList from "./components/ArticleList";

function App() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        color: "#1e293b",
      }}
    >
      <header
        style={{
          padding: "48px 24px",
          textAlign: "center",
          borderBottom: "1px solid #e2e8f0",
          marginBottom: 48,
          background: "linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            fontWeight: 800,
            background:
              "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            marginBottom: 16,
            letterSpacing: "-0.02em",
          }}
        >
          BeyondChats Articles
        </h1>

        <p
          style={{
            color: "#64748b",
            fontSize: "clamp(1rem, 2vw, 1.25rem)",
            fontWeight: 500,
            maxWidth: 600,
            margin: "0 auto",
          }}
        >
          AI-enhanced content with original references
        </p>
      </header>

      <ArticleList />
    </div>
  );
}

export default App;
