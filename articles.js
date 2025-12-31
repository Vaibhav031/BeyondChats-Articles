const express = require('express');
const router = express.Router();

const {
  createArticle,
  getAllArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
} = require('../controllers/articleController');

// POST / -> create article
router.post('/', createArticle);

// GET / -> list articles
router.get('/', getAllArticles);

// GET /:id -> get article
router.get('/:id', getArticleById);

// PUT /:id -> update article
router.put('/:id', updateArticle);

// DELETE /:id -> delete article
router.delete('/:id', deleteArticle);

module.exports = router;
