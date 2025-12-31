require('dotenv').config();

const connectDB = require('../config/database');
const Article = require('../models/Article');
const { duckDuckGoSearch } = require('../services/search.service');
const { extractArticleText } = require('../services/referenceScraper.service');
const { enhanceContent } = require('../services/contentEnhancer.service');
const mongoose = require('mongoose');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Enhances articles in the DB using external references.
 * - Preserves original content
 * - Enhances when references exist
 * - Gracefully handles no-reference cases
 */
async function enhanceArticles({ limit } = {}) {
  console.log('🔎 Connecting to MongoDB...');
  await connectDB();

  try {
    let query = Article.find({ isUpdated: false }).sort({ createdAt: 1 });
    if (limit && Number.isInteger(limit) && limit > 0) {
      query = query.limit(limit);
    }

    const articles = await query.exec();
    console.log(`📚 Found ${articles.length} article(s) to enhance.`);

    let processed = 0;

    for (const art of articles) {
      console.log(`\n➡️ Processing article ${art._id} - "${art.title}"`);

      try {
        const searchQuery = `${art.title} blog`;
        console.log(`   🔍 Searching references for: ${searchQuery}`);

        const urls = await duckDuckGoSearch(searchQuery, { count: 2 });
        console.log(`   🔗 Found ${urls.length} reference URL(s)`);

        const referenceTexts = [];

        for (const url of urls) {
          try {
            console.log(`     🧾 Scraping ${url}`);
            const txt = await extractArticleText(url);

            if (txt && txt.length > 50) {
              referenceTexts.push(txt);
              console.log(`     ✅ Scraped ${txt.length} characters`);
            }

            await sleep(800);
          } catch (err) {
            console.warn(`     ❌ Failed scraping ${url}`, err.message || err);
          }
        }

        // ✅ ALWAYS preserve original content once
        if (!art.originalContent) {
          art.originalContent = art.content;
        }

        // ❗ No references → mark as processed safely
        if (referenceTexts.length === 0) {
          console.warn('   ⚠️ No usable reference content found.');
          art.isUpdated = true;
          art.references = [];
          await art.save();

          processed++;
          console.log('   ⚠️ Marked article as processed without enhancement.');
          continue;
        }

        const refA = referenceTexts[0] || '';
        const refB = referenceTexts[1] || '';

        console.log('   ✍️ Enhancing article...');
        const enhancedContent = enhanceContent(art.content, refA, refB);

        if (!enhancedContent || enhancedContent.length < 20) {
          console.warn('   ⚠️ Enhanced content too short. Saving originalContent and skipping update.');
          // Ensure original content and attempted references are persisted so we don't repeatedly retry blindly
          if (!art.originalContent) art.originalContent = art.content;
          art.references = urls;
          await art.save();
          continue;
        }

        art.content = enhancedContent;
        art.references = urls;
        art.isUpdated = true;

        await art.save();

        processed++;
        console.log('   ✅ Article enhanced successfully.');
        await sleep(600);
      } catch (err) {
        console.error(`   ❌ Error processing article ${art._id}`, err.message || err);
      }
    }

    console.log(`\n🎯 Enhancement completed: ${processed}/${articles.length} articles processed.`);
  } catch (err) {
    console.error('enhanceArticles fatal error:', err.message || err);
  } finally {
    try {
      await mongoose.connection.close(false);
      console.log('🔌 MongoDB connection closed.');
    } catch (err) {
      console.warn('⚠️ Error closing MongoDB connection', err.message || err);
    }
  }
}

if (require.main === module) {
  enhanceArticles()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { enhanceArticles };
