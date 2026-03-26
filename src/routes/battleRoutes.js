const express = require('express');
const {
	createBattleChallenge,
	acceptBattleChallenge,
	rejectBattleChallenge,
	cancelBattleChallenge,
	selectBattleTeam,
	getBattleById,
	performBattleMove,
	listMyBattles,
	deleteBattle,
} = require('../controllers/battleController');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);
router.get('/', listMyBattles);
router.post('/challenges', createBattleChallenge);
router.get('/:battleId', getBattleById);
router.delete('/:battleId', deleteBattle);
router.post('/:battleId/accept', acceptBattleChallenge);
router.post('/:battleId/reject', rejectBattleChallenge);
router.post('/:battleId/cancel', cancelBattleChallenge);
router.post('/:battleId/team', selectBattleTeam);
router.post('/:battleId/move', performBattleMove);

module.exports = router;
