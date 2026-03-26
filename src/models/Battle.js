const mongoose = require('mongoose');

const battleSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    opponent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    opponentTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    userScore: { type: Number, default: 0 },
    opponentScore: { type: Number, default: 0 },
    summary: { type: String, default: 'Reto enviado.' },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'in_progress', 'finished', 'rejected'],
      default: 'pending',
      index: true,
    },
    turnUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    userHp: { type: Number, default: 0 },
    opponentHp: { type: Number, default: 0 },
    userMaxHp: { type: Number, default: 0 },
    opponentMaxHp: { type: Number, default: 0 },
    userActivePokemon: {
      pokemonId: { type: Number, default: null },
      pokemonName: { type: String, default: '' },
      moves: { type: [String], default: [] },
    },
    opponentActivePokemon: {
      pokemonId: { type: Number, default: null },
      pokemonName: { type: String, default: '' },
      moves: { type: [String], default: [] },
    },
    turnNumber: { type: Number, default: 0 },
    maxTurns: { type: Number, default: 8 },
    battleLog: { type: [String], default: [] },
    roundNumber: { type: Number, default: 1 },
    pendingMoves: {
      user: { type: String, default: '' },
      opponent: { type: String, default: '' },
    },
    lastRoundSummary: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Battle', battleSchema);
