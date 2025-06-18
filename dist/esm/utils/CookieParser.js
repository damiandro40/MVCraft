var CookieParser = (header) => {
    if(!header) return {}
    
    return header.split(';').reduce((cookies, cookieStr) => {
        const [name, ...valParts] = cookieStr.trim().split('=');
        const value = valParts.join('=');
        cookies[name] = decodeURIComponent(value);
        return cookies
    }, {})
};

export { CookieParser as default };
//# sourceMappingURL=CookieParser.js.map
