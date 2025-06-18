import $ from '../../node_modules/kleur/index.js';
import Logger from '../../helpers/Logger.js';

const createHandle = (ctx, ctrl) => {
    return (exception, handler) => {
        if(ctx.exceptions[exception]) return Logger(`Handler for exception (${$.blue().bold(exception)}) in controller (path: ${$.blue().bold(ctrl.path)}, method: ${$.blue().bold(ctrl.method)}) has already been declared`, 'controller')
            
        ctx.exceptions[exception] = handler;
    }
};

export { createHandle as default };
//# sourceMappingURL=Handle.method.js.map
