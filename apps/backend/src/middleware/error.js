export function notFoundHandler(req, res) {
    res.status(404).json({ error: 'Not Found', path: req.originalUrl });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
    const status = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    if (status >= 500) {
        console.error('[backend] error', err);
    }

    res.status(status).json({ error: message });
}
