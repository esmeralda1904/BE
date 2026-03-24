const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const authRoutes = require('./routes/authRoutes');
const pokemonRoutes = require('./routes/pokemonRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const teamRoutes = require('./routes/teamRoutes');
const friendRoutes = require('./routes/friendRoutes');
const battleRoutes = require('./routes/battleRoutes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*',
  })
);
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'pokedex-bff' });
});

app.use('/api/auth', authRoutes);
app.use('/api/pokemon', pokemonRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/battles', battleRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
