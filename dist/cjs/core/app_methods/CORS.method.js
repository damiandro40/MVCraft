'use strict';

var Logger = require('../../helpers/Logger.js');

const createCORS = (ctx) => {
    return (options) => {
        if(!options || typeof options !== 'object' || Array.isArray(options)) return Logger(`Cors options must be an object`, 'cors')
        ctx.options().cors = options;
    }
};

module.exports = createCORS;
//# sourceMappingURL=CORS.method.js.map
