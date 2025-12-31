const mongoose = require('mongoose');

const { Schema } = mongoose;

const ArticleSchema = new Schema({
  title: { type: String, required: true },

  // ✅ Store original scraped content
  originalContent: {
    type: String,
  },

  // ✅ Store enhanced content (current content)
  content: {
    type: String,
    required: true,
  },

  sourceUrl: { type: String },
  isUpdated: { type: Boolean, default: false },
  references: { type: [String], default: [] },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Article', ArticleSchema);
