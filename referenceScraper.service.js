const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Fetches a page and extracts cleaned plain-text article content.
 * - Removes script/style/nav/footer/header/aside and common ad/newsletter selectors
 * - Prefers <article> or <main>, falls back to common content selectors, then <p> tags
 * - Cleans excessive whitespace and returns paragraphs separated by double newlines
 *
 * @param {string} url
 * @param {object} opts
 * @param {number} opts.timeout - request timeout in ms (default 15000)
 * @returns {Promise<string>} plain text content (empty string on error)
 */
async function extractArticleText(url, { timeout = 15000 } = {}) {
  if (!url || typeof url !== 'string') {
    throw new Error('url string is required');
  }

  const http = axios.create({ timeout, headers: { 'User-Agent': 'BeyondChats-ReferenceScraper/1.0' } });

  try {
    const resp = await http.get(url);
    const $ = cheerio.load(resp.data);

    // Remove non-content elements
    const removeSelectors = [
      'script',
      'style',
      'nav',
      'footer',
      'header',
      'noscript',
      'aside',
      '.ads',
      '.advert',
      '.cookie-banner',
      '.subscribe',
      '.newsletter',
    ];
    $(removeSelectors.join(',')).remove();

    // Prefer semantic containers
    let container = $('article').first();
    if (!container || !container.length) container = $('main').first();

    // Fallback selectors to look for
    const fallbackSelectors = ['.post-content', '.entry-content', '.article-body', '.content', '.post', '.blog-post'];
    if ((!container || !container.length) || container.text().trim().length < 50) {
      for (const sel of fallbackSelectors) {
        const el = $(sel).first();
        if (el && el.length && el.text().trim().length > 50) {
          container = el;
          break;
        }
      }
    }

    // Extract paragraphs from container or whole page
    let paragraphs = [];
    if (container && container.length && container.text().trim().length > 0) {
      paragraphs = container.find('p').map((i, p) => $(p).text().trim()).get().filter(Boolean);
      // If container has no <p> tags, take its text as single paragraph
      if (paragraphs.length === 0) {
        const txt = container.text().trim();
        if (txt.length) paragraphs = [txt];
      }
    } else {
      paragraphs = $('p').map((i, p) => $(p).text().trim()).get().filter(Boolean);
    }

    // Normalize whitespace: collapse multiple spaces, trim lines, drop empty lines
    const cleaned = paragraphs
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .filter((line) => line.length > 0)
      .join('\n\n')
      .trim();

    return cleaned;
  } catch (err) {
    console.error('extractArticleText error for', url, err.message || err);
    return '';
  }
}

module.exports = { extractArticleText };
