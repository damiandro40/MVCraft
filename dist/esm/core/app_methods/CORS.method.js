import Logger from '../../helpers/Logger.js';

const createCORS = (ctx) => {
    return (options) => {
        if(!options || typeof options !== 'object' || Array.isArray(options)) return Logger(`Cors options must be an object`, 'cors')
        ctx.options().cors = options;
    }
};

export { createCORS as default };
//# sourceMappingURL=CORS.method.js.map
