const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

const signToken = (user) =>
  jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

const createFriendCode = () => crypto.randomBytes(4).toString('hex').toUpperCase();

const register = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password || password.length < 6) {
      return res.status(400).json({ message: 'Email y password (mínimo 6) son requeridos' });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });

    if (exists) {
      return res.status(409).json({ message: 'Ese correo ya está registrado' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    let friendCode = createFriendCode();

    while (await User.findOne({ friendCode })) {
      friendCode = createFriendCode();
    }

    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      friendCode,
    });

    return res.status(201).json({
      token: signToken(user),
      user: { id: user._id, email: user.email, friendCode: user.friendCode },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: (email || '').toLowerCase() });

    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const valid = await bcrypt.compare(password || '', user.passwordHash);

    if (!valid) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    return res.json({
      token: signToken(user),
      user: { id: user._id, email: user.email, friendCode: user.friendCode },
    });
  } catch (error) {
    next(error);
  }
};

const me = async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      email: req.user.email,
      friendCode: req.user.friendCode,
      friendsCount: req.user.friends.length,
    },
  });
};

module.exports = {
  register,
  login,
  me,
};
