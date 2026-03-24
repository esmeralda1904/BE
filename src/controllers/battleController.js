const Battle = require('../models/Battle');
const Team = require('../models/Team');
const User = require('../models/User');
const { getPokemonByNameOrId, getTypeAdvantage, client } = require('../services/pokeApiService');

const sumStats = (pokemon) => pokemon.stats.reduce((acc, item) => acc + item.base_stat, 0);

const bestMovePower = async (pokemon) => {
  const firstMoves = pokemon.moves.slice(0, 6);
  let best = 40;

  for (const moveEntry of firstMoves) {
    try {
      const { data } = await client.get(moveEntry.move.url);
      const power = data.power || 40;

      if (power > best) {
        best = power;
      }
    } catch (error) {
      continue;
    }
  }

  return best;
};

const teamScore = async (team, rivalTeam) => {
  let total = 0;

  for (let i = 0; i < team.pokemons.length; i += 1) {
    const ally = team.pokemons[i];
    const rival = rivalTeam.pokemons[i % rivalTeam.pokemons.length];

    const allyData = await getPokemonByNameOrId(ally.pokemonId || ally.pokemonName);
    const rivalData = await getPokemonByNameOrId(rival.pokemonId || rival.pokemonName);

    const allyTypes = allyData.types.map((entry) => entry.type.name);
    const rivalTypes = rivalData.types.map((entry) => entry.type.name);
    const advantage = await getTypeAdvantage(allyTypes, rivalTypes);
    const attackPower = await bestMovePower(allyData);

    total += sumStats(allyData) + attackPower * 1.5 + advantage * 50;
  }

  return Math.round(total);
};

const createBattle = async (req, res, next) => {
  try {
    const { friendId, teamId, opponentTeamId } = req.body;

    if (!friendId || !teamId || !opponentTeamId) {
      return res.status(400).json({
        message: 'friendId, teamId y opponentTeamId son requeridos',
      });
    }

    const me = await User.findById(req.user._id);

    if (!me.friends.some((id) => id.equals(friendId))) {
      return res.status(403).json({ message: 'Solo puedes batallar con tus amigas' });
    }

    const team = await Team.findOne({ _id: teamId, user: req.user._id });
    const opponentTeam = await Team.findOne({ _id: opponentTeamId, user: friendId });

    if (!team || !opponentTeam) {
      return res.status(404).json({ message: 'No se encontró alguno de los equipos' });
    }

    if (team.pokemons.length === 0 || opponentTeam.pokemons.length === 0) {
      return res.status(400).json({ message: 'Ambos equipos deben tener al menos 1 pokémon' });
    }

    const [myScoreBase, opponentScoreBase] = await Promise.all([
      teamScore(team, opponentTeam),
      teamScore(opponentTeam, team),
    ]);

    const userScore = myScoreBase + Math.floor(Math.random() * 20);
    const opponentScore = opponentScoreBase + Math.floor(Math.random() * 20);
    const winner = userScore >= opponentScore ? req.user._id : friendId;

    const battle = await Battle.create({
      user: req.user._id,
      opponent: friendId,
      team: team._id,
      opponentTeam: opponentTeam._id,
      winner,
      userScore,
      opponentScore,
      summary:
        winner.toString() === req.user._id.toString()
          ? 'Ganaste la batalla por ventaja estratégica.'
          : 'Tu amiga ganó la batalla en esta ronda.',
    });

    res.status(201).json(battle);
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
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(battles);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBattle,
  listMyBattles,
};
