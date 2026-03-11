/**
 * Wraps an async route handler so thrown errors are automatically
 * forwarded to Express's error-handling middleware.
 *
 * Usage: router.get('/path', catchAsync(async (req, res) => { ... }));
 */
const catchAsync = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

module.exports = catchAsync;
