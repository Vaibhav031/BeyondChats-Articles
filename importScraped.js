require('dotenv').config();

const connectDB = require('../config/database');
const { fetchOldestArticles } = require('../services/scraper');
const Article = require('../models/Article');

/**
 * Imports scraped articles into MongoDB.
 * Options:
 *  - count: number of articles to fetch (default 7)
 *  - blogUrl: optional override of listing URL
 *  - reset: if true, clears articles collection before import
 */
async function importScraped({ count = 7, blogUrl, reset = false } = {}) {
  try {
    await connectDB();

    // ✅ RESET MODE (OPTION 1)
    if (reset) {
      await Article.deleteMany({});
      console.log('🧹 Articles collection cleared.');
    }

    const articles = await fetchOldestArticles({ blogUrl, count });

    let saved = 0;
    let skipped = 0;

    for (const art of articles) {
      const { title, content, url } = art;

      if (!url) {
        console.warn('Skipping article without source URL:', title || '<no title>');
        skipped++;
        continue;
      }

      const exists = await Article.findOne({ sourceUrl: url });
      if (exists) {
        console.log('Skipping duplicate:', url);
        skipped++;
        continue;
      }

      const doc = new Article({
        title,
        content,
        sourceUrl: url,
      });

      await doc.save();
      console.log('Saved article:', doc._id.toString(), '-', title);
      saved++;
    }

    console.log(`✅ Import complete: saved=${saved}, skipped=${skipped}`);
    return { saved, skipped };
  } catch (err) {
    console.error('❌ importScraped error:', err.message || err);
    throw err;
  } finally {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState) {
      await mongoose.connection.close(false);
      console.log('🔌 MongoDB connection closed.');
    }
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);

  const countIndex = args.indexOf('--count');
  const count = countIndex >= 0 ? parseInt(args[countIndex + 1], 10) : 7;

  const urlIndex = args.indexOf('--url');
  const blogUrl = urlIndex >= 0 ? args[urlIndex + 1] : undefined;

  const reset = args.includes('--reset');

  importScraped({ count, blogUrl, reset })
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = importScraped;
