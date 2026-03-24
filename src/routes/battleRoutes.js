const express = require('express');
const { createBattle, listMyBattles } = require('../controllers/battleController');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);
router.get('/', listMyBattles);
router.post('/', createBattle);

module.exports = router;
