const express = require('express');
const {
  listFavorites,
  createFavorite,
  updateFavorite,
  removeFavorite,
} = require('../controllers/favoriteController');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);
router.get('/', listFavorites);
router.post('/', createFavorite);
router.patch('/:id', updateFavorite);
router.delete('/:id', removeFavorite);

module.exports = router;
