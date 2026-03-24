const User = require('../models/User');

const addFriendByCode = async (req, res, next) => {
  try {
    const code = (req.body.friendCode || '').toUpperCase().trim();

    if (!code) {
      return res.status(400).json({ message: 'El friendCode es requerido' });
    }

    const friend = await User.findOne({ friendCode: code });

    if (!friend) {
      return res.status(404).json({ message: 'No se encontró usuario con ese código' });
    }

    if (friend._id.equals(req.user._id)) {
      return res.status(400).json({ message: 'No puedes agregarte a ti misma' });
    }

    await User.updateOne({ _id: req.user._id }, { $addToSet: { friends: friend._id } });
    await User.updateOne({ _id: friend._id }, { $addToSet: { friends: req.user._id } });

    res.status(201).json({ message: 'Amiga agregada correctamente', friendCode: friend.friendCode });
  } catch (error) {
    next(error);
  }
};

const listFriends = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('friends', 'email friendCode');
    res.json(user.friends);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addFriendByCode,
  listFriends,
};
