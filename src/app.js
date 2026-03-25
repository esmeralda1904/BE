const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const authRoutes = require('./routes/authRoutes');
const pokemonRoutes = require('./routes/pokemonRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const teamRoutes = require('./routes/teamRoutes');
const friendRoutes = require('./routes/friendRoutes');
const battleRoutes = require('./routes/battleRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

dotenv.config();

const app = express();
const allowedOrigins = (process.env.FRONTEND_URL || '*')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const normalizeOrigin = (origin) => origin.trim().replace(/\/$/, '');

const isOriginAllowed = (origin) => {
  if (!origin) {
    return true;
  }

  const normalizedOrigin = normalizeOrigin(origin);

  return allowedOrigins.some((allowedOrigin) => {
    if (allowedOrigin === '*') {
      return true;
    }

    const normalizedAllowedOrigin = normalizeOrigin(allowedOrigin);

    if (!normalizedAllowedOrigin.includes('*')) {
      return normalizedAllowedOrigin === normalizedOrigin;
    }

    const wildcardPattern = `^${normalizedAllowedOrigin
      .split('*')
      .map((segment) => escapeRegExp(segment))
      .join('.*')}$`;

    return new RegExp(wildcardPattern).test(normalizedOrigin);
  });
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Not allowed by CORS'));
    },
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
app.use('/api/notifications', notificationRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
