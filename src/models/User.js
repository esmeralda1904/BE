const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    friendCode: { type: String, required: true, unique: true, uppercase: true },
    favoritePokemons: [
      {
        favoriteRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Favorite' },
        pokemonId: { type: Number, required: true },
        pokemonName: { type: String, required: true, lowercase: true },
        nickname: { type: String, default: '' },
        notes: { type: String, default: '' },
        isShiny: { type: Boolean, default: false },
        tags: [{ type: String }],
      },
    ],
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    friendRequestsReceived: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    friendRequestsSent: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
