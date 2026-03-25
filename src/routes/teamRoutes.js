const express = require('express');
const {
	listTeams,
	createTeam,
	updateTeam,
	deleteTeam,
	listFriendTeams,
	listFriendTeamsByCode,
} = require('../controllers/teamController');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);
router.get('/', listTeams);
	router.get('/friend-code/:friendCode', listFriendTeamsByCode);
router.get('/friend/:friendId', listFriendTeams);
router.post('/', createTeam);
router.patch('/:id', updateTeam);
router.delete('/:id', deleteTeam);

module.exports = router;
