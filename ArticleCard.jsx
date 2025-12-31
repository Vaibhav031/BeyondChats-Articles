import { useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, ChevronDown, ChevronUp } from "lucide-react";

function ArticleCard({ article, darkMode }) {
  const [expanded, setExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  if (!article) {
    return null;
  }

  const { title = "Untitled Article", sourceUrl, content, citations = [] } = article;

  return (
    <motion.article
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      whileHover={{ y: -4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      style={{
        border: darkMode ? "1px solid #334155" : "1px solid #e2e8f0",
        borderRadius: 16,
        padding: 32,
        marginBottom: 24,
        backgroundColor: darkMode ? "#1e293b" : "#ffffff",
        boxShadow: isHovered
          ? darkMode
            ? "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)"
            : "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
          : darkMode
          ? "0 4px 6px -1px rgba(0, 0, 0, 0.3)"
          : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* Title */}
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          fontSize: "clamp(1.25rem, 2.5vw, 1.5rem)",
          fontWeight: 700,
          marginBottom: 16,
          color: darkMode ? "#f1f5f9" : "#0f172a",
          lineHeight: 1.3,
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </motion.h3>

      {/* Source URL */}
      {sourceUrl && (
        <motion.a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ x: 4 }}
          style={{
            color: darkMode ? "#60a5fa" : "#3b82f6",
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 500,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 20,
            transition: "color 0.2s ease",
          }}
        >
          View Original Article
          <ExternalLink size={16} />
        </motion.a>
      )}

      {/* Content Preview */}
      {content && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{ marginBottom: 20 }}
        >
          <p
            style={{
              color: darkMode ? "#cbd5e1" : "#475569",
              lineHeight: 1.7,
              fontSize: "clamp(0.95rem, 1.5vw, 1.05rem)",
            }}
          >
            {expanded
              ? content
              : `${content.slice(0, 250)}${content.length > 250 ? "..." : ""}`}
          </p>
          {content.length > 250 && (
            <motion.button
              onClick={() => setExpanded(!expanded)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                marginTop: 12,
                color: darkMode ? "#60a5fa" : "#3b82f6",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
                padding: 0,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {expanded ? (
                <>
                  Show Less <ChevronUp size={16} />
                </>
              ) : (
                <>
                  Read More <ChevronDown size={16} />
                </>
              )}
            </motion.button>
          )}
        </motion.div>
      )}

      {/* Citations */}
      {citations && citations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            marginTop: 24,
            paddingTop: 24,
            borderTop: darkMode ? "1px solid #334155" : "1px solid #e2e8f0",
          }}
        >
          <h4
            style={{
              fontSize: 14,
              fontWeight: 700,
              marginBottom: 12,
              color: darkMode ? "#94a3b8" : "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Citations ({citations.length})
          </h4>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {citations.map((citation, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + idx * 0.05 }}
                style={{
                  padding: "8px 12px",
                  backgroundColor: darkMode ? "#0f172a" : "#f8fafc",
                  borderRadius: 8,
                  borderLeft: darkMode
                    ? "3px solid #60a5fa"
                    : "3px solid #3b82f6",
                }}
              >
                {citation.text && (
                  <a
                    href={citation.link || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: darkMode ? "#60a5fa" : "#3b82f6",
                      textDecoration: "none",
                      fontSize: 14,
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {citation.text}
                    <ExternalLink size={12} />
                  </a>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.article>
  );
}

export default ArticleCard;