'use strict';

var Logger = require('../../helpers/Logger.js');

const createRun = (server, config) => {
    return (callback) => {
        server.listen(config.port);
        if(callback && typeof callback !== 'function') return Logger('Callback must be a function', 'app')
        if(callback && typeof callback === 'function') callback(config.port);
    }
};

module.exports = createRun;
//# sourceMappingURL=Run.method.js.map
