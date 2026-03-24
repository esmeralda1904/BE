const mongoose = require('mongoose');

const battleSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    opponent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    opponentTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userScore: { type: Number, required: true },
    opponentScore: { type: Number, required: true },
    summary: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Battle', battleSchema);
