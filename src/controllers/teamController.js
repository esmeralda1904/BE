const Team = require('../models/Team');
const User = require('../models/User');

const listTeams = async (req, res, next) => {
  try {
    const teams = await Team.find({ user: req.user._id }).sort({ updatedAt: -1 });
    res.json(teams);
  } catch (error) {
    next(error);
  }
};

const createTeam = async (req, res, next) => {
  try {
    const { name, pokemons = [] } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'El nombre del equipo es requerido' });
    }

    if (pokemons.length > 6) {
      return res.status(400).json({ message: 'Máximo 6 pokémon por equipo' });
    }

    const team = await Team.create({ user: req.user._id, name, pokemons });
    res.status(201).json(team);
  } catch (error) {
    next(error);
  }
};

const updateTeam = async (req, res, next) => {
  try {
    const { pokemons = [] } = req.body;

    if (pokemons.length > 6) {
      return res.status(400).json({ message: 'Máximo 6 pokémon por equipo' });
    }

    const team = await Team.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, req.body, {
      new: true,
    });

    if (!team) {
      return res.status(404).json({ message: 'Equipo no encontrado' });
    }

    res.json(team);
  } catch (error) {
    next(error);
  }
};

const deleteTeam = async (req, res, next) => {
  try {
    const team = await Team.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!team) {
      return res.status(404).json({ message: 'Equipo no encontrado' });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const listFriendTeams = async (req, res, next) => {
  try {
    const { friendId } = req.params;
    const me = await User.findById(req.user._id);

    if (!me.friends.some((id) => id.equals(friendId))) {
      return res.status(403).json({ message: 'Solo puedes ver equipos de tus amigas' });
    }

    const teams = await Team.find({ user: friendId }).sort({ updatedAt: -1 });
    res.json(teams);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  listFriendTeams,
};
