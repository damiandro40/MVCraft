import $ from '../../node_modules/kleur/index.js';
import Logger from '../../helpers/Logger.js';

const createExecute = (ctx) => {
    return (name, data) => {

        const services = ctx.getAllComponents('service');
        const service = services.find(s => s.name === name);

        if(!service) return Logger(`Could not find service (name: ${$.blue().bold(name)})`, 'service')

        try { 
            return service.handler(data)
        } catch(err) {
            const exception = service.exceptions[err.message] || service.exceptions['*'];
            if(!exception) {
                throw new Error(err)
            } else {
                return exception(err, data)
            }
        }
    }
};

export { createExecute as default };
//# sourceMappingURL=Execute.method.js.map
