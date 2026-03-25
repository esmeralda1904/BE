const {
  getPublicVapidKey: getVapidPublicKey,
  isPushConfigured,
  subscribeUser,
  sendPushToUser,
} = require('../services/pushService');

const getPublicVapidKey = async (req, res) => {
  res.json({
    configured: isPushConfigured(),
    publicKey: getVapidPublicKey(),
  });
};

const subscribePush = async (req, res, next) => {
  try {
    const subscription = req.body;

    if (
      !subscription ||
      !subscription.endpoint ||
      !subscription.keys ||
      !subscription.keys.p256dh ||
      !subscription.keys.auth
    ) {
      return res.status(400).json({ message: 'Suscripción push inválida' });
    }

    await subscribeUser(req.user._id, subscription);

    return res.status(201).json({
      message: 'Suscripción registrada',
      configured: isPushConfigured(),
    });
  } catch (error) {
    next(error);
  }
};

const sendTestPush = async (req, res, next) => {
  try {
    const { userId, title, body, url, actions, actionUrls, data } = req.body;
    const targetUserId = userId || req.user._id;

    const result = await sendPushToUser(targetUserId, {
      title: title || 'Notificación de prueba',
      body: body || 'Push notification funcionando correctamente.',
      url: url || '/',
      icon: '/icon-192.png',
      badge: '/icon-96.png',
      tag: 'push-test',
      actions: Array.isArray(actions) ? actions : [],
      actionUrls: actionUrls && typeof actionUrls === 'object' ? actionUrls : {},
      data: data && typeof data === 'object' ? data : {},
    });

    return res.json({ message: 'Push enviado', result });
  } catch (error) {
    next(error);
  }
};

const sendFriendInvitePush = async (req, res, next) => {
  try {
    const { targetUserId, senderEmail, senderFriendCode, senderId } = req.body;

    if (!targetUserId || !senderEmail) {
      return res.status(400).json({ message: 'targetUserId y senderEmail son requeridos' });
    }

    const result = await sendPushToUser(targetUserId, {
      title: 'Nueva invitación de amistad',
      body: `${senderEmail} te envió una solicitud de amistad.`,
      url: '/friends',
      icon: '/icon-192.png',
      badge: '/icon-96.png',
      tag: 'friend-invite',
      urgency: 'high',
      ttlSeconds: 60,
      actions: [{ action: 'open-friends', title: 'Ver solicitud' }],
      actionUrls: {
        'open-friends': '/friends',
      },
      data: {
        type: 'friend-invite',
        senderId: senderId || req.user._id,
        senderEmail,
        senderFriendCode: senderFriendCode || null,
      },
    });

    return res.json({ message: 'Notificación de invitación enviada', result });
  } catch (error) {
    next(error);
  }
};

const sendBattleChallengePush = async (req, res, next) => {
  try {
    const { targetUserId, challengerEmail, challengerId, battleId } = req.body;

    if (!targetUserId || !challengerEmail) {
      return res.status(400).json({ message: 'targetUserId y challengerEmail son requeridos' });
    }

    const result = await sendPushToUser(targetUserId, {
      title: 'Te retaron a una batalla',
      body: `${challengerEmail} te retó en Pokédex Battles.`,
      url: '/battles',
      icon: '/icon-192.png',
      badge: '/icon-96.png',
      tag: 'battle-challenge',
      urgency: 'high',
      ttlSeconds: 60,
      actions: [{ action: 'open-battles', title: 'Ver batalla' }],
      actionUrls: {
        'open-battles': '/battles',
      },
      data: {
        type: 'battle-challenge',
        challengerId: challengerId || req.user._id,
        challengerEmail,
        battleId: battleId || null,
      },
    });

    return res.json({ message: 'Notificación de batalla enviada', result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicVapidKey,
  subscribePush,
  sendTestPush,
  sendFriendInvitePush,
  sendBattleChallengePush,
};
