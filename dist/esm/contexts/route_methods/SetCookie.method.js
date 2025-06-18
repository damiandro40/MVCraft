const createSetCookie = (req, res) => {
    return (name, value, options = {}) => {
        let cookieStr = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

        if (options.maxAge) cookieStr += `; Max-Age=${options.maxAge}`;
        if (options.expires) cookieStr += `; Expires=${options.expires.toUTCString()}`;
        if (options.path) cookieStr += `; Path=${options.path}`;
        if (options.domain) cookieStr += `; Domain=${options.domain}`;
        if (options.httpOnly) cookieStr += `; HttpOnly`;
        if (options.secure) cookieStr += `; Secure`;
        if (options.sameSite) cookieStr += `; SameSite=${options.sameSite}`;

        const existing = res.getHeader('Set-Cookie');
        if (existing) {
            const header = Array.isArray(existing) ? existing.concat(cookieStr) : [existing, cookieStr];
            res.setHeader('Set-Cookie', header);
        } else {
            res.setHeader('Set-Cookie', cookieStr);
        }
    }
};

export { createSetCookie as default };
//# sourceMappingURL=SetCookie.method.js.map
