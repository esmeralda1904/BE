const express = require('express');
const { addFriendByCode, listFriends } = require('../controllers/friendController');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);
router.get('/', listFriends);
router.post('/add', addFriendByCode);

module.exports = router;
