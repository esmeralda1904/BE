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

    return res.status(201).json({ message: 'Suscripción registrada' });
  } catch (error) {
    next(error);
  }
};

const sendTestPush = async (req, res, next) => {
  try {
    const { userId, title, body, url } = req.body;
    const targetUserId = userId || req.user._id;

    const result = await sendPushToUser(targetUserId, {
      title: title || 'Notificación de prueba',
      body: body || 'Push notification funcionando correctamente.',
      url: url || '/',
      icon: '/icon-192.png',
      badge: '/icon-96.png',
    });

    return res.json({ message: 'Push enviado', result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicVapidKey,
  subscribePush,
  sendTestPush,
};
