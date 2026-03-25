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

    const testPushResult = await sendPushToUser(req.user._id, {
      title: 'Notificaciones activadas',
      body: 'Ya recibirás solicitudes de amistad en tu barra de notificaciones.',
      url: '/friends',
      icon: '/icon-192.png',
      badge: '/icon-96.png',
      tag: 'push-enabled',
      urgency: 'high',
      ttlSeconds: 30,
    });

    return res.status(201).json({
      message: 'Suscripción registrada',
      testPush: testPushResult,
    });
  } catch (error) {
    next(error);
  }
};

const sendTestPush = async (req, res, next) => {
  try {
    const { userId, title, body, url, actions, actionUrls } = req.body;
    const targetUserId = userId || req.user._id;

    const result = await sendPushToUser(targetUserId, {
      title: title || 'Notificación de prueba',
      body: body || 'Push notification funcionando correctamente.',
      url: url || '/',
      icon: '/icon-192.png',
      badge: '/icon-96.png',
      actions: Array.isArray(actions) ? actions : [],
      actionUrls: actionUrls && typeof actionUrls === 'object' ? actionUrls : {},
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
