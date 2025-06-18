const applyCors = (req, res, options) => {
    const { cors } = options;

    if(cors.origins && typeof cors.origins === 'string') res.setHeader('Access-Control-Allow-Origin', cors.origins);
    if(cors.origins && Array.isArray(cors.origins)) {
        if(cors.origins.includes(req.headers.origin)) res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    }

    if(cors.methods && typeof cors.methods === 'string') res.setHeader('Access-Control-Allow-Methods', cors.methods);
    if(cors.methods && Array.isArray(cors.methods)) res.setHeader('Access-Control-Allow-Methods', cors.methods.join(','));

    if(cors.headers && typeof cors.headers === 'string') res.setHeader('Access-Control-Allow-Headers', cors.headers);
    if(cors.headers && Array.isArray(cors.headers)) res.setHeader('Access-Control-Allow-Headers', cors.headers.join(','));
    
    if(cors.credentials && cors.credentials === true) res.setHeader('Access-Control-Allow-Credentials', 'true');
    if(cors.maxAge && typeof cors.maxAge === 'number') res.setHeader('Access-Control-Max-Age', cors.maxAge);
};

export { applyCors as default };
//# sourceMappingURL=CorsHandler.js.map
