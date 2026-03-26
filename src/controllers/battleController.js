const Battle = require('../models/Battle');
const Team = require('../models/Team');
const User = require('../models/User');
const { getPokemonByNameOrId } = require('../services/pokeApiService');
const { sendPushToUser } = require('../services/pushService');

const normalizeMove = (moveName) => String(moveName || '').toLowerCase().trim();

const getStatValue = (pokemonData, statName, fallback = 60) => {
  const stat = pokemonData?.stats?.find((item) => item.stat?.name === statName);
  return stat?.base_stat || fallback;
};

const computeDamage = ({ attackerData, defenderData, moveName }) => {
  const attack = getStatValue(attackerData, 'attack', 60);
  const defense = getStatValue(defenderData, 'defense', 60);
  const base = Math.max(8, Math.round((attack / Math.max(25, defense)) * 14));
  const randomBonus = Math.floor(Math.random() * 8);
  const moveBonus = Math.min(10, normalizeMove(moveName).length % 11);
  return base + randomBonus + moveBonus;
};

const getBattleResultLabel = (battle) => {
  if (battle.userHp === battle.opponentHp) {
    return 'Empate técnico.';
  }

  if (battle.winner && String(battle.winner) === String(battle.user)) {
    return 'Ganó el retador.';
  }

  return 'Ganó el oponente.';
};

const ensureFriendRelation = async (me, opponentUser) => {
  if (!me.friends.some((id) => id.equals(opponentUser._id))) {
    return false;
  }

  return true;
};

const resolveOpponent = async ({ friendId, friendCode }) => {
  if (friendId) {
    return User.findById(friendId);
  }

  return User.findOne({
    friendCode: String(friendCode || '').toUpperCase().trim(),
  });
};

const initializeBattleWithTeams = async (battle, userTeam, opponentTeam) => {
  const userActive = userTeam.pokemons[0];
  const opponentActive = opponentTeam.pokemons[0];

  const [userData, opponentData] = await Promise.all([
    getPokemonByNameOrId(userActive.pokemonId || userActive.pokemonName),
    getPokemonByNameOrId(opponentActive.pokemonId || opponentActive.pokemonName),
  ]);

  battle.team = userTeam._id;
  battle.opponentTeam = opponentTeam._id;
  battle.userActivePokemon = {
    pokemonId: userActive.pokemonId,
    pokemonName: userActive.pokemonName,
    moves: Array.isArray(userActive.moves) ? userActive.moves.slice(0, 4) : [],
  };
  battle.opponentActivePokemon = {
    pokemonId: opponentActive.pokemonId,
    pokemonName: opponentActive.pokemonName,
    moves: Array.isArray(opponentActive.moves) ? opponentActive.moves.slice(0, 4) : [],
  };
  battle.userMaxHp = Math.max(60, getStatValue(userData, 'hp', 60) * 2);
  battle.opponentMaxHp = Math.max(60, getStatValue(opponentData, 'hp', 60) * 2);
  battle.userHp = battle.userMaxHp;
  battle.opponentHp = battle.opponentMaxHp;
  battle.turnUser = battle.user;
  battle.turnNumber = 0;
  battle.status = 'in_progress';
  battle.summary = 'Batalla iniciada. Turno del retador.';
  battle.battleLog = ['Batalla iniciada. Turno del retador.'];
};

const createBattleChallenge = async (req, res, next) => {
  try {
    const { friendId, friendCode } = req.body;

    if (!friendId && !friendCode) {
      return res.status(400).json({
        message: 'friendId o friendCode es requerido',
      });
    }

    const me = await User.findById(req.user._id);
    const opponentUser = await resolveOpponent({ friendId, friendCode });

    if (!opponentUser) {
      return res.status(404).json({ message: 'No se encontró al jugador rival' });
    }

    if (opponentUser._id.equals(req.user._id)) {
      return res.status(400).json({ message: 'No puedes retarte a ti misma' });
    }

    const areFriends = await ensureFriendRelation(me, opponentUser);

    if (!areFriends) {
      return res.status(403).json({
        message: 'Solo puedes retar a usuarios que ya aceptaron tu amistad',
      });
    }

    const battle = await Battle.create({
      user: req.user._id,
      opponent: opponentUser._id,
      status: 'pending',
      summary: 'Reto enviado. Esperando aceptación del rival.',
      battleLog: ['Reto enviado. Esperando aceptación del rival.'],
    });

    await sendPushToUser(opponentUser._id, {
      title: 'Te retaron a una batalla',
      body: `${req.user.email} quiere batallar contigo.`,
      url: '/battles',
      icon: '/icon-192.png',
      badge: '/icon-96.png',
      tag: 'battle-challenge',
      urgency: 'high',
      ttlSeconds: 60,
      actions: [
        { action: 'open-battles', title: 'Ver batalla' },
      ],
      actionUrls: {
        'open-battles': '/battles',
      },
      data: {
        type: 'battle-challenge',
        challengerId: req.user._id,
        challengerEmail: req.user.email,
        battleId: battle._id,
      },
    });

    res.status(201).json(battle);
  } catch (error) {
    next(error);
  }
};

const acceptBattleChallenge = async (req, res, next) => {
  try {
    const { battleId } = req.params;
    const battle = await Battle.findById(battleId);

    if (!battle) {
      return res.status(404).json({ message: 'Reto no encontrado' });
    }

    if (!battle.opponent.equals(req.user._id)) {
      return res.status(403).json({ message: 'Solo el jugador retado puede aceptar' });
    }

    if (battle.status !== 'pending') {
      return res.status(409).json({ message: 'Este reto ya no está pendiente' });
    }

    battle.status = 'accepted';
    battle.summary = 'Reto aceptado. Preparando equipos...';
    battle.battleLog = ['Reto aceptado. Preparando equipos...'];

    const [challengerTeam, opponentTeam] = await Promise.all([
      Team.findOne({ user: battle.user }).sort({ createdAt: 1 }),
      Team.findOne({ user: battle.opponent }).sort({ createdAt: 1 }),
    ]);

    const canAutoStart =
      challengerTeam &&
      opponentTeam &&
      Array.isArray(challengerTeam.pokemons) && challengerTeam.pokemons.length > 0 &&
      Array.isArray(opponentTeam.pokemons) && opponentTeam.pokemons.length > 0;

    if (canAutoStart) {
      await initializeBattleWithTeams(battle, challengerTeam, opponentTeam);
    } else {
      battle.summary = 'Reto aceptado. Ambos jugadores deben elegir equipo.';
      battle.battleLog = ['Reto aceptado. Ambos jugadores deben elegir equipo.'];
    }

    await battle.save();

    await sendPushToUser(battle.user, {
      title: 'Aceptaron tu reto',
      body: canAutoStart
        ? `${req.user.email} aceptó. La batalla ya está lista.`
        : `${req.user.email} aceptó la batalla. Elijan equipo para empezar.`,
      url: canAutoStart ? `/battles/arena?battleId=${battle._id}` : '/battles',
      icon: '/icon-192.png',
      badge: '/icon-96.png',
      tag: 'battle-accepted',
      urgency: 'high',
      ttlSeconds: 60,
      actions: [{ action: 'open-battles', title: canAutoStart ? 'Jugar' : 'Elegir equipo' }],
      actionUrls: {
        'open-battles': canAutoStart ? `/battles/arena?battleId=${battle._id}` : '/battles',
      },
      data: {
        type: 'battle-accepted',
        battleId: battle._id,
      },
    });

    if (canAutoStart) {
      await sendPushToUser(battle.opponent, {
        title: 'Batalla iniciada',
        body: 'Reto aceptado. Ya pueden jugar.',
        url: `/battles/arena?battleId=${battle._id}`,
        icon: '/icon-192.png',
        badge: '/icon-96.png',
        tag: 'battle-started',
        urgency: 'high',
        ttlSeconds: 60,
        actions: [{ action: 'open-battle', title: 'Jugar ahora' }],
        actionUrls: {
          'open-battle': `/battles/arena?battleId=${battle._id}`,
        },
        data: {
          type: 'battle-started',
          battleId: battle._id,
        },
      });
    }

    return res.json(battle);
  } catch (error) {
    next(error);
  }
};

const rejectBattleChallenge = async (req, res, next) => {
  try {
    const { battleId } = req.params;
    const battle = await Battle.findById(battleId)
      .populate('user', 'email')
      .populate('opponent', 'email');

    if (!battle) {
      return res.status(404).json({ message: 'Reto no encontrado' });
    }

    if (!battle.opponent._id.equals(req.user._id)) {
      return res.status(403).json({ message: 'Solo el jugador retado puede rechazar' });
    }

    if (battle.status !== 'pending') {
      return res.status(409).json({ message: 'Este reto ya no está pendiente' });
    }

    battle.status = 'rejected';
    battle.summary = 'Reto rechazado por el rival.';
    battle.battleLog = ['Reto rechazado por el rival.'];
    await battle.save();

    await sendPushToUser(battle.user._id, {
      title: 'Reto rechazado',
      body: `${battle.opponent.email} rechazó tu solicitud de batalla.`,
      url: '/battles',
      icon: '/icon-192.png',
      badge: '/icon-96.png',
      tag: 'battle-rejected',
      urgency: 'high',
      ttlSeconds: 60,
    });

    return res.json(battle);
  } catch (error) {
    next(error);
  }
};

const cancelBattleChallenge = async (req, res, next) => {
  try {
    const { battleId } = req.params;
    const battle = await Battle.findById(battleId)
      .populate('user', 'email')
      .populate('opponent', 'email');

    if (!battle) {
      return res.status(404).json({ message: 'Reto no encontrado' });
    }

    if (!battle.user._id.equals(req.user._id)) {
      return res.status(403).json({ message: 'Solo quien retó puede cancelar la solicitud' });
    }

    if (!['pending', 'accepted'].includes(battle.status)) {
      return res.status(409).json({ message: 'Esta solicitud ya no se puede cancelar' });
    }

    battle.status = 'rejected';
    battle.summary = 'Reto cancelado por quien lo envió.';
    battle.battleLog = ['Reto cancelado por quien lo envió.'];
    await battle.save();

    await sendPushToUser(battle.opponent._id, {
      title: 'Solicitud cancelada',
      body: `${battle.user.email} canceló la solicitud de batalla.`,
      url: '/battles',
      icon: '/icon-192.png',
      badge: '/icon-96.png',
      tag: 'battle-canceled',
      urgency: 'high',
      ttlSeconds: 60,
    });

    return res.json(battle);
  } catch (error) {
    next(error);
  }
};

const selectBattleTeam = async (req, res, next) => {
  try {
    const { battleId } = req.params;
    const { teamId } = req.body;

    if (!teamId) {
      return res.status(400).json({ message: 'teamId es requerido' });
    }

    const battle = await Battle.findById(battleId);

    if (!battle) {
      return res.status(404).json({ message: 'Batalla no encontrada' });
    }

    if (!battle.user.equals(req.user._id) && !battle.opponent.equals(req.user._id)) {
      return res.status(403).json({ message: 'No tienes acceso a esta batalla' });
    }

    if (!['accepted', 'in_progress'].includes(battle.status)) {
      return res.status(409).json({ message: 'La batalla no está en fase de selección de equipo' });
    }

    const selectedTeam = await Team.findOne({ _id: teamId, user: req.user._id });

    if (!selectedTeam) {
      return res.status(404).json({ message: 'Equipo no encontrado' });
    }

    if (!selectedTeam.pokemons.length) {
      return res.status(400).json({ message: 'El equipo debe tener al menos 1 pokémon' });
    }

    if (battle.user.equals(req.user._id)) {
      battle.team = selectedTeam._id;
    } else {
      battle.opponentTeam = selectedTeam._id;
    }

    if (battle.team && battle.opponentTeam && battle.status !== 'in_progress') {
      const [userTeam, opponentTeam] = await Promise.all([
        Team.findById(battle.team),
        Team.findById(battle.opponentTeam),
      ]);

      await initializeBattleWithTeams(battle, userTeam, opponentTeam);

      await sendPushToUser(battle.user, {
        title: 'Batalla iniciada',
        body: 'Ambos equipos están listos. Es tu turno.',
        url: '/battles',
        icon: '/icon-192.png',
        badge: '/icon-96.png',
        tag: 'battle-started',
        urgency: 'high',
        ttlSeconds: 60,
      });

      await sendPushToUser(battle.opponent, {
        title: 'Batalla iniciada',
        body: 'Ambos equipos están listos. Espera el turno del rival.',
        url: '/battles',
        icon: '/icon-192.png',
        badge: '/icon-96.png',
        tag: 'battle-started',
        urgency: 'high',
        ttlSeconds: 60,
      });
    }

    await battle.save();
    return res.json(battle);
  } catch (error) {
    next(error);
  }
};

const getBattleById = async (req, res, next) => {
  try {
    const { battleId } = req.params;
    const battle = await Battle.findById(battleId)
      .populate('user', 'email friendCode')
      .populate('opponent', 'email friendCode')
      .populate('team', 'name pokemons')
      .populate('opponentTeam', 'name pokemons')
      .populate('winner', 'email');

    if (!battle) {
      return res.status(404).json({ message: 'Batalla no encontrada' });
    }

    if (!battle.user._id.equals(req.user._id) && !battle.opponent._id.equals(req.user._id)) {
      return res.status(403).json({ message: 'No tienes acceso a esta batalla' });
    }

    return res.json(battle);
  } catch (error) {
    next(error);
  }
};

const performBattleMove = async (req, res, next) => {
  try {
    const { battleId } = req.params;
    const { moveName } = req.body;
    const normalizedMove = normalizeMove(moveName);

    if (!normalizedMove) {
      return res.status(400).json({ message: 'moveName es requerido' });
    }

    const battle = await Battle.findById(battleId)
      .populate('user', 'email')
      .populate('opponent', 'email')
      .populate('winner', 'email');

    if (!battle) {
      return res.status(404).json({ message: 'Batalla no encontrada' });
    }

    if (!battle.user._id.equals(req.user._id) && !battle.opponent._id.equals(req.user._id)) {
      return res.status(403).json({ message: 'No tienes acceso a esta batalla' });
    }

    if (battle.status !== 'in_progress') {
      return res.status(409).json({ message: 'La batalla no está en progreso' });
    }

    if (!battle.turnUser || !battle.turnUser.equals(req.user._id)) {
      return res.status(409).json({ message: 'Debes esperar tu turno' });
    }

    const isUserTurn = battle.user._id.equals(req.user._id);
    const attackerSlot = isUserTurn ? 'userActivePokemon' : 'opponentActivePokemon';
    const defenderSlot = isUserTurn ? 'opponentActivePokemon' : 'userActivePokemon';
    const attackerName = battle[attackerSlot].pokemonName;
    const defenderName = battle[defenderSlot].pokemonName;

    const allowedMoves = (battle[attackerSlot].moves || []).map((move) => normalizeMove(move));
    if (allowedMoves.length && !allowedMoves.includes(normalizedMove)) {
      return res.status(400).json({ message: 'Movimiento no válido para este pokémon' });
    }

    const [attackerData, defenderData] = await Promise.all([
      getPokemonByNameOrId(battle[attackerSlot].pokemonId || attackerName),
      getPokemonByNameOrId(battle[defenderSlot].pokemonId || defenderName),
    ]);

    const damage = computeDamage({ attackerData, defenderData, moveName: normalizedMove });

    if (isUserTurn) {
      battle.opponentHp = Math.max(0, battle.opponentHp - damage);
    } else {
      battle.userHp = Math.max(0, battle.userHp - damage);
    }

    const actorEmail = isUserTurn ? battle.user.email : battle.opponent.email;
    battle.battleLog.unshift(`${actorEmail} usó ${normalizedMove} e hizo ${damage} de daño.`);
    battle.turnNumber += 1;

    const defenderDefeated = isUserTurn ? battle.opponentHp <= 0 : battle.userHp <= 0;

    if (defenderDefeated || battle.turnNumber >= battle.maxTurns) {
      battle.status = 'finished';

      if (battle.userHp === battle.opponentHp) {
        battle.winner = null;
        battle.summary = 'Empate técnico.';
      } else if (battle.userHp > battle.opponentHp) {
        battle.winner = battle.user._id;
        battle.summary = 'Batalla finalizada: ganó el retador.';
      } else {
        battle.winner = battle.opponent._id;
        battle.summary = 'Batalla finalizada: ganó el oponente.';
      }

      battle.userScore = battle.userHp;
      battle.opponentScore = battle.opponentHp;

      await sendPushToUser(battle.user._id, {
        title: 'Batalla terminada',
        body: `Resultado: ${getBattleResultLabel(battle)}`,
        url: '/battles',
        icon: '/icon-192.png',
        badge: '/icon-96.png',
        tag: 'battle-finished',
        urgency: 'high',
        ttlSeconds: 60,
      });

      await sendPushToUser(battle.opponent._id, {
        title: 'Batalla terminada',
        body: `Resultado: ${getBattleResultLabel(battle)}`,
        url: '/battles',
        icon: '/icon-192.png',
        badge: '/icon-96.png',
        tag: 'battle-finished',
        urgency: 'high',
        ttlSeconds: 60,
      });
    } else {
      battle.turnUser = isUserTurn ? battle.opponent._id : battle.user._id;
      battle.summary = `Turno de ${isUserTurn ? battle.opponent.email : battle.user.email}.`;
    }

    await battle.save();
    return res.json(battle);
  } catch (error) {
    next(error);
  }
};

const listMyBattles = async (req, res, next) => {
  try {
    const battles = await Battle.find({
      $or: [{ user: req.user._id }, { opponent: req.user._id }],
    })
      .populate('user', 'email friendCode')
      .populate('opponent', 'email friendCode')
      .populate('team', 'name')
      .populate('opponentTeam', 'name')
      .populate('winner', 'email')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(battles);
  } catch (error) {
    next(error);
  }
};

const deleteBattle = async (req, res, next) => {
  try {
    const { battleId } = req.params;
    const battle = await Battle.findById(battleId);

    if (!battle) {
      return res.status(404).json({ message: 'Batalla no encontrada' });
    }

    const isParticipant = battle.user.equals(req.user._id) || battle.opponent.equals(req.user._id);

    if (!isParticipant) {
      return res.status(403).json({ message: 'No tienes acceso para eliminar esta batalla' });
    }

    if (battle.status !== 'finished') {
      return res.status(409).json({ message: 'Solo puedes eliminar batallas ya jugadas' });
    }

    await Battle.deleteOne({ _id: battleId });
    return res.json({ message: 'Batalla eliminada correctamente' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBattleChallenge,
  acceptBattleChallenge,
  rejectBattleChallenge,
  cancelBattleChallenge,
  selectBattleTeam,
  getBattleById,
  performBattleMove,
  listMyBattles,
  deleteBattle,
};
