import Logger from '../../helpers/Logger.js';

const createRun = (server, config) => {
    return (callback) => {
        server.listen(config.port);
        if(callback && typeof callback !== 'function') return Logger('Callback must be a function', 'app')
        if(callback && typeof callback === 'function') callback(config.port);
    }
};

export { createRun as default };
//# sourceMappingURL=Run.method.js.map
