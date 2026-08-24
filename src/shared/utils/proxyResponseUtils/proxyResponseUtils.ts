const HOP_BY_HOP_HEADERS = new Set([
    'connection',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailer',
    'transfer-encoding',
    'upgrade',
    'content-encoding',
    'content-length',
]);

export const sanitizeProxyHeaders = (headers: Headers): Headers => {
    const sanitized = new Headers();
    headers.forEach((value, key) => {
        if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
            sanitized.set(key, value);
        }
    });
    return sanitized;
};

export const sanitizeProxyRequestHeaders = (headers: Headers): Headers => {
    const sanitized = sanitizeProxyHeaders(headers);
    sanitized.set('accept-encoding', 'identity');
    return sanitized;
};
