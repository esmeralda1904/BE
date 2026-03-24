const Favorite = require('../models/Favorite');

const listFavorites = async (req, res, next) => {
  try {
    const items = await Favorite.find({ user: req.user._id }).sort({ createdAt: -1 });
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
