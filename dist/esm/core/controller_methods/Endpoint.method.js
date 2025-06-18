import $ from '../../node_modules/kleur/index.js';
import Logger from '../../helpers/Logger.js';

const createEndpoint = (ctx, ctrl) => {

    return (path, method, handler) => {
        if(ctrl.method !== '*' && method !== ctrl.method) {
            return Logger(`Controller (path: ${$.blue().bold(ctrl.path)}, method: ${$.blue().bold(ctrl.method)}) cannot include endpoint that handles method (${$.blue().bold(method)})`, 'controller')
        }

        if(ctx.endpoints.find(e => e.path === path && e.method === method)) {
            return Logger(`Endpoint (path: ${$.blue().bold(path)}, method: ${$.blue().bold(method)}) has already been declared for controller (path: ${$.blue().bold(ctrl.path)}, method: ${$.blue().bold(ctrl.method)})`)
        }

        ctx.endpoints.push({ path, method, handler });
    }

};

export { createEndpoint as default };
//# sourceMappingURL=Endpoint.method.js.map
