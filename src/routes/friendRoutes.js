const express = require('express');
const {
	addFriendByCode,
	listFriends,
	acceptFriendRequest,
	rejectFriendRequest,
	removeFriend,
} = require('../controllers/friendController');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);
router.get('/', listFriends);
router.post('/add', addFriendByCode);
router.post('/requests/:requesterId/accept', acceptFriendRequest);
router.delete('/requests/:requesterId', rejectFriendRequest);
	router.delete('/:friendId', removeFriend);

module.exports = router;
