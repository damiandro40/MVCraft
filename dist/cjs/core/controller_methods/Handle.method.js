'use strict';

var index = require('../../node_modules/kleur/index.js');
var Logger = require('../../helpers/Logger.js');

const createHandle = (ctx, ctrl) => {
    return (exception, handler) => {
        if(ctx.exceptions[exception]) return Logger(`Handler for exception (${index.blue().bold(exception)}) in controller (path: ${index.blue().bold(ctrl.path)}, method: ${index.blue().bold(ctrl.method)}) has already been declared`, 'controller')
            
        ctx.exceptions[exception] = handler;
    }
};

module.exports = createHandle;
//# sourceMappingURL=Handle.method.js.map
