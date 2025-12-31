const mongoose = require('mongoose');
const Article = require('../models/Article');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Create an article
async function createArticle(req, res) {
  try {
    const { title, content, sourceUrl, references } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'title and content are required' });
    }

    const article = new Article({
      title,
      content,
      sourceUrl,
      references,
    });

    await article.save();
    return res.status(201).json(article);
  } catch (err) {
    console.error('createArticle error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Get all articles
async function getAllArticles(req, res) {
  try {
    const articles = await Article.find().sort({ createdAt: -1 });
    return res.status(200).json(articles);
  } catch (err) {
    console.error('getAllArticles error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Get article by id
async function getArticleById(req, res) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid article id' });
    }

    const article = await Article.findById(id);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    return res.status(200).json(article);
  } catch (err) {
    console.error('getArticleById error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Update article
async function updateArticle(req, res) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid article id' });
    }

    const updates = req.body;
    // mark isUpdated true if content or title changed
    if (updates.content || updates.title) updates.isUpdated = true;

    const article = await Article.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    return res.status(200).json(article);
  } catch (err) {
    console.error('updateArticle error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Delete article
async function deleteArticle(req, res) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid article id' });
    }

    const article = await Article.findByIdAndDelete(id);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    return res.status(204).send();
  } catch (err) {
    console.error('deleteArticle error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  createArticle,
  getAllArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
};
