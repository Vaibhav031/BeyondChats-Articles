const axios = require('axios');
const cheerio = require('cheerio');
const { URL } = require('url');

/**
 * Performs a DuckDuckGo HTML search and returns up to `count` unique article URLs
 * that are not on beyondchats.com.
 */
async function duckDuckGoSearch(query, { count = 2 } = {}) {
  if (!query || typeof query !== 'string') {
    throw new Error('query string is required');
  }

  const http = axios.create({
    timeout: 15000,
    headers: { 'User-Agent': 'BeyondChats-Search/1.0' }
  });

  try {
    const resp = await http.get('https://html.duckduckgo.com/html/', {
      params: { q: query }
    });

    const $ = cheerio.load(resp.data);

    const candidates = [];
    const seen = new Set();

    const articlePattern = /(blog|post|article|news|\/\d{4}\/\d{2}|\/\d{4})/i;

    $('a').each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;

      let finalUrl;
      try {
        const resolved = new URL(href, 'https://duckduckgo.com');
        if (
          resolved.hostname.includes('duckduckgo.com') &&
          resolved.searchParams.has('uddg')
        ) {
          finalUrl = decodeURIComponent(resolved.searchParams.get('uddg'));
        } else {
          finalUrl = resolved.toString();
        }
      } catch {
        return;
      }

      if (!finalUrl.startsWith('http')) return;

      try {
        const host = new URL(finalUrl).hostname.toLowerCase();
        if (host.endsWith('beyondchats.com')) return;
      } catch {
        return;
      }

      if (!articlePattern.test(finalUrl)) return;

      if (!seen.has(finalUrl)) {
        seen.add(finalUrl);
        candidates.push(finalUrl);
      }

      if (candidates.length >= count) return false;
    });

    return candidates.slice(0, count);
  } catch (err) {
    console.error('duckDuckGoSearch error:', err.message || err);
    return [];
  }
}

module.exports ={ duckDuckGoSearch };
