const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    pokemonId: { type: Number, required: true },
    pokemonName: { type: String, required: true, lowercase: true },
    nickname: { type: String, default: '' },
    notes: { type: String, default: '' },
    isShiny: { type: Boolean, default: false },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

favoriteSchema.index({ user: 1, pokemonId: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
