const getPublicVapidKey = async (req, res) => {
  res.json({
    configured: false,
    publicKey: '',
    disabled: true,
  });
};

const subscribePush = async (req, res, next) => {
  try {
    return res.status(200).json({
      disabled: true,
      message: 'Notificaciones push desactivadas temporalmente',
    });
  } catch (error) {
    next(error);
  }
};

const sendTestPush = async (req, res, next) => {
  try {
    return res.status(200).json({
      disabled: true,
      message: 'Notificaciones push desactivadas temporalmente',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicVapidKey,
  subscribePush,
  sendTestPush,
};
