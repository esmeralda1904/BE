const notFound = (req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
};

const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Error interno del servidor';

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({ message });
};

module.exports = { notFound, errorHandler };
