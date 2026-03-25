const webPush = require('web-push');
const PushSubscription = require('../models/PushSubscription');

const getVapidConfig = () => ({
  publicKey: process.env.VAPID_PUBLIC_KEY || '',
  privateKey: process.env.VAPID_PRIVATE_KEY || '',
  subject: process.env.VAPID_SUBJECT || 'mailto:admin@pokedex.local',
});

const ensureVapidSetup = () => {
  const vapid = getVapidConfig();

  if (!vapid.publicKey || !vapid.privateKey) {
    return false;
  }

  webPush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);
  return true;
};

const isPushConfigured = () => {
  const vapid = getVapidConfig();
  return Boolean(vapid.publicKey && vapid.privateKey);
};

const getPublicVapidKey = () => getVapidConfig().publicKey;

const subscribeUser = async (userId, subscription) => {
  const payload = {
    user: userId,
    endpoint: subscription.endpoint,
    expirationTime: subscription.expirationTime ?? null,
    keys: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  };

  await PushSubscription.findOneAndUpdate(
    { endpoint: subscription.endpoint },
    payload,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

const removeSubscriptionByEndpoint = async (endpoint) => {
  await PushSubscription.deleteOne({ endpoint });
};

const getWebPushOptions = (notificationPayload = {}) => {
  const ttlValue = Number(notificationPayload.ttlSeconds);
  const ttlSeconds = Number.isFinite(ttlValue) && ttlValue >= 0 ? Math.floor(ttlValue) : 45;
  const urgency = String(notificationPayload.urgency || 'high').toLowerCase();
  const topic = typeof notificationPayload.tag === 'string' ? notificationPayload.tag.slice(0, 32) : undefined;

  return {
    TTL: ttlSeconds,
    urgency,
    topic,
    headers: {
      Urgency: urgency,
    },
  };
};

const sendPushToUser = async (userId, notificationPayload) => {
  if (!ensureVapidSetup()) {
    return { sent: 0, removed: 0, failures: 0, skipped: true };
  }

  const subscriptions = await PushSubscription.find({ user: userId });
  let sent = 0;
  let removed = 0;
  let failures = 0;

  const payload = JSON.stringify(notificationPayload);
  const pushOptions = getWebPushOptions(notificationPayload);

  for (const subscription of subscriptions) {
    try {
      await webPush.sendNotification(
        {
          endpoint: subscription.endpoint,
          expirationTime: subscription.expirationTime,
          keys: subscription.keys,
        },
        payload,
        pushOptions
      );
      sent += 1;
    } catch (error) {
      if (error.statusCode === 404 || error.statusCode === 410) {
        await removeSubscriptionByEndpoint(subscription.endpoint);
        removed += 1;
      } else {
        failures += 1;
        console.error('[Push] Notification send failed', {
          userId: String(userId),
          endpoint: subscription.endpoint,
          statusCode: error.statusCode,
          message: error.message,
        });
      }
    }
  }

  return {
    sent,
    removed,
    failures,
    skipped: false,
    subscriptions: subscriptions.length,
  };
};

module.exports = {
  getPublicVapidKey,
  isPushConfigured,
  subscribeUser,
  sendPushToUser,
};
