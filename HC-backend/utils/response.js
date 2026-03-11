/**
 * Standard API response helpers.
 */

const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
    const response = {
        success: true,
        message,
    };

    if (data !== null) {
        response.data = data;
    }

    return res.status(statusCode).json(response);
};

const sendCreated = (res, data = null, message = 'Created successfully') => {
    return sendSuccess(res, data, message, 201);
};

const sendError = (res, message = 'An error occurred', statusCode = 500, errorCode = 'INTERNAL_ERROR') => {
    return res.status(statusCode).json({
        success: false,
        message,
        errorCode,
    });
};

module.exports = {
    sendSuccess,
    sendCreated,
    sendError,
};
