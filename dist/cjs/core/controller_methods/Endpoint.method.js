'use strict';

var index = require('../../node_modules/kleur/index.js');
var Logger = require('../../helpers/Logger.js');

const createEndpoint = (ctx, ctrl) => {

    return (path, method, handler) => {
        if(ctrl.method !== '*' && method !== ctrl.method) {
            return Logger(`Controller (path: ${index.blue().bold(ctrl.path)}, method: ${index.blue().bold(ctrl.method)}) cannot include endpoint that handles method (${index.blue().bold(method)})`, 'controller')
        }

        if(ctx.endpoints.find(e => e.path === path && e.method === method)) {
            return Logger(`Endpoint (path: ${index.blue().bold(path)}, method: ${index.blue().bold(method)}) has already been declared for controller (path: ${index.blue().bold(ctrl.path)}, method: ${index.blue().bold(ctrl.method)})`)
        }

        ctx.endpoints.push({ path, method, handler });
    }

};

module.exports = createEndpoint;
//# sourceMappingURL=Endpoint.method.js.map
