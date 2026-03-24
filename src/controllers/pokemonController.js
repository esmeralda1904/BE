const { listPokemons, getPokemonDetail } = require('../services/pokeApiService');

const list = async (req, res, next) => {
  try {
    const { limit, offset, name, type1, type2, region } = req.query;
    const result = await listPokemons({ limit, offset, name, type1, type2, region });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const detail = async (req, res, next) => {
  try {
    const data = await getPokemonDetail(req.params.idOrName);
    res.json(data);
  } catch (error) {
    error.status = 404;
    error.message = 'Pokémon no encontrado';
    next(error);
  }
};

module.exports = {
  list,
  detail,
};
