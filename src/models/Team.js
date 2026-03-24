const mongoose = require('mongoose');

const teamPokemonSchema = new mongoose.Schema(
  {
    pokemonId: { type: Number, required: true },
    pokemonName: { type: String, required: true },
    nickname: { type: String, default: '' },
    role: { type: String, default: '' },
  },
  { _id: false }
);

const teamSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    pokemons: {
      type: [teamPokemonSchema],
      validate: {
        validator: (value) => value.length <= 6,
        message: 'Un equipo no puede tener más de 6 pokémon',
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Team', teamSchema);
