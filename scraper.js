const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Fetches the BeyondChats blogs listing, navigates to the last page,
 * and returns the `count` oldest articles (default 5) with { title, content, url }.
 *
 * Options:
 * - blogUrl: the listing URL to start from (defaults to env BEYONDCHATS_BLOG_URL or a common path)
 * - count: number of oldest articles to return
 */
async function fetchOldestArticles({ blogUrl = process.env.BEYONDCHATS_BLOG_URL || 'https://beyondchats.com/blogs', count = 5 } = {}) {
  const http = axios.create({ timeout: 15000, headers: { 'User-Agent': 'BeyondChats-Scraper/1.0' } });

  try {
    // 1) Load the listing page
    const listingResp = await http.get(blogUrl);
    let $ = cheerio.load(listingResp.data);

    // 2) Try to find a 'last' page link via rel="last" or the highest numeric pagination link
    let lastPageUrl = blogUrl;

    const relLast = $('a[rel="last"]').attr('href');
    if (relLast) {
      lastPageUrl = new URL(relLast, blogUrl).toString();
    } else {
      // Collect numeric page links from the page (anchor text that is a number)
      const numericPages = [];
      $('a').each((i, el) => {
        const text = $(el).text().trim();
        const href = $(el).attr('href');
        if (!href) return;
        const n = parseInt(text, 10);
        if (!Number.isNaN(n)) numericPages.push({ n, href });
      });

      if (numericPages.length > 0) {
        numericPages.sort((a, b) => b.n - a.n);
        lastPageUrl = new URL(numericPages[0].href, blogUrl).toString();
      }
    }

    // 3) Load the last page (if different)
    if (lastPageUrl !== blogUrl) {
      const lastResp = await http.get(lastPageUrl);
      $ = cheerio.load(lastResp.data);
    }

    // 4) Collect article links from the page (prefer links that look like article urls)
    const anchors = [];
    const hostname = new URL(blogUrl).hostname;

    $('a').each((i, el) => {
      const href = $(el).attr('href');
      if (!href) return;

      try {
        const absolute = new URL(href, lastPageUrl).toString();

        // ignore anchors to same page fragments or to pagination
        if (absolute.includes('#')) return;

        // Prefer URLs that contain 'blog' or 'article' or are on the same host
        if (absolute.includes('/blog') || absolute.includes('/post') || absolute.includes('/article') || new URL(absolute).hostname === hostname) {
          anchors.push(absolute);
        }
      } catch (e) {
        // skip invalid URLs
      }
    });

    // Deduplicate while preserving order
    const seen = new Set();
    const articleUrls = anchors.filter((u) => {
      if (seen.has(u)) return false;
      seen.add(u);
      return true;
    }).slice(0, count * 3); // grab a few extra in case some are not articles

    // 5) For each candidate, fetch and try to extract title/content; stop once we have `count` valid articles
    const articles = [];

    for (const url of articleUrls) {
      if (articles.length >= count) break;

      try {
        const resp = await http.get(url);
        const $$ = cheerio.load(resp.data);

        // Extract title: prefer h1, fall back to document title
        const title = ($$('h1').first().text().trim() || $$('title').first().text().trim()).replace(/\n|\t/g, ' ').trim();

        // Extract content: try multiple common selectors
        const contentSelectors = ['article', '.post-content', '.entry-content', '.content', '.article-body', '.blog-post', '.post'];
        let content = '';
        for (const sel of contentSelectors) {
          const el = $$(sel).first();
          if (el && el.text && el.text().trim().length > 50) {
            content = el.text().trim();
            break;
          }
        }

        // As fallback, take largest <p> container content
        if (!content) {
          const paragraphs = $$('p').map((i, p) => $$(p).text().trim()).get();
          if (paragraphs.length > 0) {
            // take first few paragraphs
            content = paragraphs.slice(0, 10).join('\n\n').trim();
          }
        }

        if (title && content && content.length > 50) {
          articles.push({ title, content, url });
        }
      } catch (err) {
        // Log and continue
        console.error('Error fetching article', url, err.message || err);
      }
    }

    // If still fewer than desired, return whatever we have
    return articles.slice(0, count);
  } catch (err) {
    console.error('fetchOldestArticles error:', err.message || err);
    return [];
  }
}

module.exports = { fetchOldestArticles };
