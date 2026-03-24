const express = require('express');
const { list, detail } = require('../controllers/pokemonController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, list);
router.get('/:idOrName', auth, detail);

module.exports = router;
