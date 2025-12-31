import { useEffect, useState } from "react";
import { getArticles } from "../services/api";
import ArticleCard from "./ArticleCard";
import { motion } from "framer-motion";

function ArticleList({ darkMode }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchArticles() {
      try {
        setLoading(true);
        setError(null);

        const data = await getArticles();

        if (isMounted) {
          setArticles(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to load articles:", err);
          setError("Failed to load articles. Please try again.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchArticles();

    return () => {
      isMounted = false;
    };
  }, []);

  /* ---------- UI States ---------- */

  if (loading) {
    return (
      <div
        style={{
          padding: 80,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
        }}
      >
        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            width: 48,
            height: 48,
            border: darkMode ? "4px solid #334155" : "4px solid #e2e8f0",
            borderTopColor: darkMode ? "#60a5fa" : "#3b82f6",
            borderRadius: "50%",
          }}
        />
        <p
          style={{
            fontSize: 18,
            color: darkMode ? "#94a3b8" : "#64748b",
            fontWeight: 500,
          }}
        >
          Loading articles…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: 80,
          textAlign: "center",
        }}
      >
        <p
          style={{
            color: "#ef4444",
            fontSize: 18,
            fontWeight: 500,
          }}
        >
          {error}
        </p>
      </motion.div>
    );
  }

  if (!articles.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: 80,
          textAlign: "center",
        }}
      >
        <p
          style={{
            color: darkMode ? "#94a3b8" : "#64748b",
            fontSize: 18,
            fontWeight: 500,
          }}
        >
          No articles found.
        </p>
      </motion.div>
    );
  }

  /* ---------- Main Render ---------- */

  return (
    <main
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "24px 16px 80px",
      }}
    >
      <motion.h2
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        style={{
          marginBottom: 32,
          fontSize: "clamp(1.5rem, 3vw, 2rem)",
          fontWeight: 700,
          color: darkMode ? "#e2e8f0" : "#1e293b",
        }}
      >
        Latest Articles
      </motion.h2>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.1,
            },
          },
        }}
      >
        {articles.map((article, index) => (
          <motion.div
            key={article._id || article.sourceUrl || index}
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <ArticleCard article={article} darkMode={darkMode} />
          </motion.div>
        ))}
      </motion.div>
    </main>
  );
}

export default ArticleList;