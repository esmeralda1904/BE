const express = require('express');
const {
	createBattleChallenge,
	acceptBattleChallenge,
	selectBattleTeam,
	getBattleById,
	performBattleMove,
	listMyBattles,
} = require('../controllers/battleController');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);
router.get('/', listMyBattles);
router.post('/challenges', createBattleChallenge);
router.get('/:battleId', getBattleById);
router.post('/:battleId/accept', acceptBattleChallenge);
router.post('/:battleId/team', selectBattleTeam);
router.post('/:battleId/move', performBattleMove);

module.exports = router;
