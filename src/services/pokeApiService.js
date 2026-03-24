const axios = require('axios');

const client = axios.create({
  baseURL: 'https://pokeapi.co/api/v2',
  timeout: 12000,
});

const REGION_POKEDEX = {
  kanto: 'kanto',
  johto: 'original-johto',
  hoenn: 'hoenn',
  sinnoh: 'sinnoh',
  unova: 'unova',
  kalos: 'kalos-central',
  alola: 'alola',
  galar: 'galar',
  paldea: 'paldea',
};

const flattenEvolution = (chain, acc = []) => {
  if (!chain) {
    return acc;
  }

  acc.push(chain.species.name);
  chain.evolves_to.forEach((next) => flattenEvolution(next, acc));
  return acc;
};

const getPokemonByNameOrId = async (idOrName) => {
  const { data } = await client.get(`/pokemon/${idOrName}`);
  return data;
};

const getPokemonDetail = async (idOrName) => {
  const pokemon = await getPokemonByNameOrId(idOrName);
  const { data: species } = await client.get(`/pokemon-species/${pokemon.id}`);
  const { data: evolution } = await client.get(species.evolution_chain.url);

  return {
    id: pokemon.id,
    name: pokemon.name,
    image: pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default,
    species: species.genera.find((item) => item.language.name === 'es')?.genus || species.name,
    stats: pokemon.stats.map((item) => ({
      name: item.stat.name,
      value: item.base_stat,
    })),
    types: pokemon.types.map((item) => item.type.name),
    attacks: pokemon.moves.slice(0, 6).map((item) => item.move.name),
    evolutionLine: flattenEvolution(evolution.chain),
  };
};

const getSetFromType = async (typeName) => {
  const { data } = await client.get(`/type/${typeName}`);
  return new Set(data.pokemon.map((item) => item.pokemon.name));
};

const getSetFromRegion = async (region) => {
  const mapped = REGION_POKEDEX[region?.toLowerCase()];

  if (!mapped) {
    return null;
  }

  const { data } = await client.get(`/pokedex/${mapped}`);
  return new Set(data.pokemon_entries.map((entry) => entry.pokemon_species.name));
};

const intersectSets = (baseSet, compareSet) => {
  if (!baseSet) {
    return compareSet;
  }

  if (!compareSet) {
    return baseSet;
  }

  return new Set([...baseSet].filter((item) => compareSet.has(item)));
};

const listPokemons = async ({ limit = 24, offset = 0, name, type1, type2, region }) => {
  const normalizedName = (name || '').trim().toLowerCase();

  if (normalizedName && !type1 && !type2 && !region) {
    try {
      const pokemon = await getPokemonByNameOrId(normalizedName);

      return {
        total: 1,
        items: [
          {
            name: pokemon.name,
            url: `${client.defaults.baseURL}/pokemon/${pokemon.id}`,
          },
        ],
      };
    } catch (error) {
      if (error.response?.status === 404) {
        return {
          total: 0,
          items: [],
        };
      }

      throw error;
    }
  }

  let nameSet = null;

  if (type1) {
    nameSet = intersectSets(nameSet, await getSetFromType(type1));
  }

  if (type2) {
    nameSet = intersectSets(nameSet, await getSetFromType(type2));
  }

  if (region) {
    nameSet = intersectSets(nameSet, await getSetFromRegion(region));
  }

  if (!nameSet) {
    const cappedLimit = Math.min(Math.max(Number(limit), 1), 100);
    const safeOffset = Math.max(Number(offset), 0);
    const { data } = await client.get(`/pokemon?limit=${cappedLimit}&offset=${safeOffset}`);

    const results = data.results.filter((item) =>
      normalizedName ? item.name.toLowerCase().includes(normalizedName) : true
    );

    return {
      total: data.count,
      items: results,
    };
  }

  let names = [...nameSet];

  if (normalizedName) {
    names = names.filter((entry) => entry.includes(normalizedName));
  }

  const safeOffset = Math.max(Number(offset), 0);
  const cappedLimit = Math.min(Math.max(Number(limit), 1), 100);
  const paged = names.slice(safeOffset, safeOffset + cappedLimit);

  return {
    total: names.length,
    items: paged.map((entry) => ({ name: entry, url: `${client.defaults.baseURL}/pokemon/${entry}` })),
  };
};

const getTypeAdvantage = async (attackingTypes, defendingTypes) => {
  let multiplier = 1;

  for (const attackType of attackingTypes) {
    const { data } = await client.get(`/type/${attackType}`);
    const doubleTo = new Set(data.damage_relations.double_damage_to.map((entry) => entry.name));
    const halfTo = new Set(data.damage_relations.half_damage_to.map((entry) => entry.name));
    const noneTo = new Set(data.damage_relations.no_damage_to.map((entry) => entry.name));

    for (const defenseType of defendingTypes) {
      if (doubleTo.has(defenseType)) {
        multiplier *= 2;
      }

      if (halfTo.has(defenseType)) {
        multiplier *= 0.5;
      }

      if (noneTo.has(defenseType)) {
        multiplier *= 0;
      }
    }
  }

  return multiplier;
};

module.exports = {
  client,
  getPokemonByNameOrId,
  getPokemonDetail,
  listPokemons,
  getTypeAdvantage,
};
