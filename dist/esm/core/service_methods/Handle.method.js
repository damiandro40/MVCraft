import $ from '../../node_modules/kleur/index.js';
import Logger from '../../helpers/Logger.js';

const createHandle = (exceptions, srv) => {

    return (exception, handler) => {
        if(exceptions[exception]) return Logger(`Handler for exception (${$.blue().bold(exception)}) in service (name: ${$.blue().bold(srv.name)}) has already been declared`, 'service')

        exceptions[exception] = handler;
    }

};

export { createHandle as default };
//# sourceMappingURL=Handle.method.js.map
