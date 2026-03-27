const ApiResponse = require('../utils/ApiResponse');

const errorHandler = (err, req, res, next) => {
    console.error(err.stack); // Log real error (for backend traces)
    
    // Si es un error de Mongoose/MongoDB que queremos enmascarar parcialmente,
    // o un error genérico, devolvemos un ApiResponse estándar.
    let statusCode = err.statusCode || 500;
    let message = 'Internal Server Error';

    if (err.kind === 'ObjectId') {
        statusCode = 404;
        message = 'Resource not found';
    } else if (err.name === 'ValidationError') {
        statusCode = 400;
        message = err.message;
    } else if (statusCode !== 500) {
        message = err.message; // Error customizado intencionalmente enviado al frontend (ej. 403, 400)
    }

    res.status(statusCode).json(ApiResponse.error(message));
};

module.exports = errorHandler;
