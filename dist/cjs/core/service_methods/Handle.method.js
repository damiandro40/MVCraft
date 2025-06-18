'use strict';

var index = require('../../node_modules/kleur/index.js');
var Logger = require('../../helpers/Logger.js');

const createHandle = (exceptions, srv) => {

    return (exception, handler) => {
        if(exceptions[exception]) return Logger(`Handler for exception (${index.blue().bold(exception)}) in service (name: ${index.blue().bold(srv.name)}) has already been declared`, 'service')

        exceptions[exception] = handler;
    }

};

module.exports = createHandle;
//# sourceMappingURL=Handle.method.js.map
