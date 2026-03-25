const express = require('express');
const auth = require('../middleware/auth');
const {
  getPublicVapidKey,
  subscribePush,
  sendTestPush,
} = require('../controllers/notificationController');

const router = express.Router();

router.get('/vapid-public-key', auth, getPublicVapidKey);
router.post('/subscribe', auth, subscribePush);
router.post('/send', auth, sendTestPush);

module.exports = router;
