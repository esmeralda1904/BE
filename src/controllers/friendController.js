const User = require('../models/User');

const toPublicUser = (user) => ({
  _id: user._id,
  email: user.email,
  friendCode: user.friendCode,
});

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

    const me = await User.findById(req.user._id);

    if (!me) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (me.friends.some((id) => id.equals(friend._id))) {
      return res.status(409).json({ message: 'Ya son amigas' });
    }

    const hasIncomingRequest = me.friendRequestsReceived.some((id) => id.equals(friend._id));
    const alreadySent = me.friendRequestsSent.some((id) => id.equals(friend._id));

    if (hasIncomingRequest) {
      await User.updateOne(
        { _id: req.user._id },
        {
          $addToSet: { friends: friend._id },
          $pull: { friendRequestsReceived: friend._id, friendRequestsSent: friend._id },
        }
      );
      await User.updateOne(
        { _id: friend._id },
        {
          $addToSet: { friends: req.user._id },
          $pull: { friendRequestsReceived: req.user._id, friendRequestsSent: req.user._id },
        }
      );

      return res.status(201).json({
        message: 'Solicitud aceptada. Ahora son amigas.',
        status: 'accepted',
      });
    }

    if (alreadySent) {
      return res.status(409).json({ message: 'Ya enviaste una solicitud a esta usuaria' });
    }

    await User.updateOne(
      { _id: req.user._id },
      { $addToSet: { friendRequestsSent: friend._id }, $pull: { friendRequestsReceived: friend._id } }
    );
    await User.updateOne(
      { _id: friend._id },
      { $addToSet: { friendRequestsReceived: req.user._id }, $pull: { friendRequestsSent: req.user._id } }
    );

    res.status(201).json({
      message: 'Solicitud de amistad enviada',
      status: 'pending',
      friendCode: friend.friendCode,
    });
  } catch (error) {
    next(error);
  }
};

const listFriends = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('friends', 'email friendCode')
      .populate('friendRequestsReceived', 'email friendCode')
      .populate('friendRequestsSent', 'email friendCode');

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({
      friends: user.friends.map(toPublicUser),
      incomingRequests: user.friendRequestsReceived.map(toPublicUser),
      outgoingRequests: user.friendRequestsSent.map(toPublicUser),
    });
  } catch (error) {
    next(error);
  }
};

const acceptFriendRequest = async (req, res, next) => {
  try {
    const { requesterId } = req.params;
    const me = await User.findById(req.user._id);

    if (!me) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (!me.friendRequestsReceived.some((id) => id.equals(requesterId))) {
      return res.status(404).json({ message: 'No existe solicitud pendiente de esta usuaria' });
    }

    await User.updateOne(
      { _id: req.user._id },
      {
        $addToSet: { friends: requesterId },
        $pull: { friendRequestsReceived: requesterId, friendRequestsSent: requesterId },
      }
    );

    await User.updateOne(
      { _id: requesterId },
      {
        $addToSet: { friends: req.user._id },
        $pull: { friendRequestsSent: req.user._id, friendRequestsReceived: req.user._id },
      }
    );

    return res.json({ message: 'Solicitud aceptada' });
  } catch (error) {
    next(error);
  }
};

const rejectFriendRequest = async (req, res, next) => {
  try {
    const { requesterId } = req.params;

    await User.updateOne(
      { _id: req.user._id },
      {
        $pull: { friendRequestsReceived: requesterId, friendRequestsSent: requesterId },
      }
    );

    await User.updateOne(
      { _id: requesterId },
      {
        $pull: { friendRequestsSent: req.user._id, friendRequestsReceived: req.user._id },
      }
    );

    return res.json({ message: 'Solicitud eliminada' });
  } catch (error) {
    next(error);
  }
};

const removeFriend = async (req, res, next) => {
  try {
    const { friendId } = req.params;
    const me = await User.findById(req.user._id);

    if (!me) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (!me.friends.some((id) => id.equals(friendId))) {
      return res.status(404).json({ message: 'Esta usuaria no está en tu lista de amigas' });
    }

    await User.updateOne({ _id: req.user._id }, { $pull: { friends: friendId } });
    await User.updateOne({ _id: friendId }, { $pull: { friends: req.user._id } });

    return res.json({ message: 'Amiga eliminada correctamente' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addFriendByCode,
  listFriends,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
};
