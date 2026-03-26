const Favorite = require('../models/Favorite');
const User = require('../models/User');

const syncUserFavoritesSnapshot = async (userId) => {
  const favorites = await Favorite.find({ user: userId }).sort({ createdAt: -1 });

  const snapshot = favorites.map((item) => ({
    favoriteRef: item._id,
    pokemonId: item.pokemonId,
    pokemonName: item.pokemonName,
    nickname: item.nickname || '',
    notes: item.notes || '',
    isShiny: Boolean(item.isShiny),
    tags: Array.isArray(item.tags) ? item.tags : [],
  }));

  await User.updateOne({ _id: userId }, { $set: { favoritePokemons: snapshot } });
};

const listFavorites = async (req, res, next) => {
  try {
    const items = await Favorite.find({ user: req.user._id }).sort({ createdAt: -1 });
    const snapshot = items.map((item) => ({
      favoriteRef: item._id,
      pokemonId: item.pokemonId,
      pokemonName: item.pokemonName,
      nickname: item.nickname || '',
      notes: item.notes || '',
      isShiny: Boolean(item.isShiny),
      tags: Array.isArray(item.tags) ? item.tags : [],
    }));

    await User.updateOne({ _id: req.user._id }, { $set: { favoritePokemons: snapshot } });
    res.json(items);
  } catch (error) {
    next(error);
  }
};

const createFavorite = async (req, res, next) => {
  try {
    const { pokemonId, pokemonName, nickname, notes, isShiny, tags } = req.body;

    if (!pokemonId || !pokemonName) {
      return res.status(400).json({ message: 'pokemonId y pokemonName son requeridos' });
    }

    const item = await Favorite.create({
      user: req.user._id,
      pokemonId,
      pokemonName,
      nickname,
      notes,
      isShiny,
      tags,
    });

    await syncUserFavoritesSnapshot(req.user._id);

    res.status(201).json(item);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Ese pokémon ya está en favoritos' });
    }

    next(error);
  }
};

const updateFavorite = async (req, res, next) => {
  try {
    const item = await Favorite.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ message: 'Favorito no encontrado' });
    }

    await syncUserFavoritesSnapshot(req.user._id);

    res.json(item);
  } catch (error) {
    next(error);
  }
};

const removeFavorite = async (req, res, next) => {
  try {
    const item = await Favorite.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!item) {
      return res.status(404).json({ message: 'Favorito no encontrado' });
    }

    await syncUserFavoritesSnapshot(req.user._id);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listFavorites,
  createFavorite,
  updateFavorite,
  removeFavorite,
};
