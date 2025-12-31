# BeyondChats — Backend (Article Scraper & Enhancer)

## Overview
A Node.js backend that scrapes the *oldest* blog articles from BeyondChats, stores them in MongoDB, and enhances each article’s structure and readability using two external web references (no LLM calls or external APIs required).

Goals: reliable scraping, de-duplication, safe enhancement (structure/readability only), and simple APIs to manage and inspect articles.

---

## Tech stack
- Node.js (CommonJS)
- Express (web server)
- MongoDB + Mongoose (data store)
- Axios (HTTP requests)
- Cheerio (HTML parsing)
- dotenv (env config)

---

## Folder structure (key files)
```
backend/
  src/
    app.js                 # Express app (CORS, JSON, /health)
    server.js              # loads .env, connects DB, starts server with graceful shutdown
    config/
      database.js          # Mongoose connection helper
    models/
      Article.js           # Mongoose Article model
    controllers/
      articleController.js # CRUD controllers
    routes/
      articles.js          # /api/articles routes
    services/
      scraper.js           # scrapes BeyondChats listings and article pages
      search.service.js    # DuckDuckGo HTML search (returns external URLs)
      referenceScraper.service.js # scrapes & extracts plain text from reference pages
      contentEnhancer.service.js  # format/structure enhancement (non-generative)
    scripts/
      importScraped.js     # Phase 1: scrape and save oldest BeyondChats posts
      enhanceArticles.js   # Phase 2: find references, scrape, enhance, update DB
```

---

## Phase 1 — Scrape & Store
- Scraper visits the BeyondChats blogs listing (configurable via `BEYONDCHATS_BLOG_URL`).
- It locates the *last* listing page and extracts article links, then fetches each article page and extracts title/content/url.
- Saves to MongoDB using the `Article` model (fields: `title`, `content`, `sourceUrl`, `isUpdated`, `references`, `createdAt`).
- Duplicate avoidance: checks `sourceUrl` before inserting.

**Run**:
```bash
# ensure backend/.env contains MONGO_URI
node src/scripts/importScraped.js --count 5 --url "https://beyondchats.com/blogs"
```

---

## Phase 2 — Enhance using external references
- For each article where `isUpdated === false`:
  - Build a query (e.g., `"Article title blog"`), use DuckDuckGo HTML search (no API key) to get two external candidate URLs (excluding beyondchats.com).
  - Scrape each reference URL and extract the main article/body text (script/style/footer/nav removed; prefer `<article>`/`<main>`, fallback to paragraphs).
  - Run the in-project content enhancer which:
    - Analyzes reference formatting patterns (paragraph lengths, headings, lists).
    - Re-structures the original article to match those patterns (shorter paragraphs, optional headings, convert enumerations to lists).
    - **Important**: Enhancer is deterministic, heuristic-based, and does *not* invent facts or copy sentences from references — it only rearranges and reflows original content for readability.
  - Update the Article record: `content` (enhanced), `references` (external URLs), and set `isUpdated = true`.

**Run**:
```bash
# process all un-updated articles
node src/scripts/enhanceArticles.js
# or limit number processed
node src/scripts/enhanceArticles.js --limit 5
```

---

## DuckDuckGo HTML search — free & no API key
- Uses DuckDuckGo's HTML endpoint (`https://html.duckduckgo.com/html/`) to perform search queries and parse the results page.
- Advantage: free and no API keys; the code resolves redirect links (`uddg` param) and extracts only article-like URLs (heuristics: contains `/blog`, `/post`, year-based paths).
- Results are filtered to exclude beyondchats.com and return the first unique matches (default: 2).

---

## Content enhancement — structural improvement (not rewriting)
- The enhancer inspects reference articles only to detect formatting preferences (avg sentences per paragraph, headings/lists) and reorganizes the original article accordingly.
- It improves readability by creating shorter paragraphs, optional derived headings, and converting enumerations to lists when appropriate.
- Explicitly avoids:
  - Adding new facts or claims that weren’t present
  - Copying sentences verbatim from reference pages
  - Using external LLMs — it is a deterministic, rule-based transformation

---

## API endpoints
- GET `/health` → `{ status: 'OK' }` (health check)
- CRUD for articles (mounted at `/api/articles`):
  - `POST /api/articles` — create
  - `GET /api/articles` — list
  - `GET /api/articles/:id` — single
  - `PUT /api/articles/:id` — update
  - `DELETE /api/articles/:id` — delete

Example:
```bash
curl http://localhost:5000/health
curl http://localhost:5000/api/articles
```

---

## Running locally — quick start
1. Install deps:
```bash
cd backend
npm install
```
2. Create `.env` at `backend/.env`:
```
MONGO_URI=mongodb://<user>:<pass>@host:port/dbname
PORT=5000
BEYONDCHATS_BLOG_URL=https://beyondchats.com/blogs   # optional
```
3. Start the server:
```bash
npm run dev    # or `node server.js`
```
4. Run scrapers:
```bash
node src/scripts/importScraped.js --count 5
node src/scripts/enhanceArticles.js --limit 10
```

---

## Design decisions & graceful error handling
- Robustness first: all network calls use timeouts and friendly User-Agent strings; parsing errors are caught and logged not thrown to crash processes.
- Idempotency:
  - Import script avoids duplicates using `sourceUrl`.
  - Enhancement marks articles `isUpdated=true` after successful enhancement.
- Resilience:
  - Per-article and per-reference errors are logged and the pipeline continues (skips or retries as appropriate).
  - `server.js` includes startup error handling and graceful shutdown (closes HTTP server and MongoDB connection).
- Privacy / Compliance:
  - Scraping respects basic politeness (pauses between requests) and avoids high-rate scraping.
- Enhancer is conservative to avoid introducing factual changes.

---

## Next steps (suggested)
- Add unit/integration tests and a Postman/Insomnia collection to verify endpoints and scripts.
- Add npm convenience scripts in `backend/package.json`:
```json
"scripts": {
  "dev": "nodemon server.js",
  "import:articles": "node src/scripts/importScraped.js",
  "enhance:articles": "node src/scripts/enhanceArticles.js"
}
```
- Add a small admin dashboard to manage enhancements and retries.

---

If you'd like, I can add the npm scripts to `backend/package.json` and a sample collection next. Let me know which you'd prefer me to add.