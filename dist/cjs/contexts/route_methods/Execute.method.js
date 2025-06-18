'use strict';

var index = require('../../node_modules/kleur/index.js');
var Logger = require('../../helpers/Logger.js');

const createExecute = (ctx) => {
    return (name, data) => {

        const services = ctx.getAllComponents('service');
        const service = services.find(s => s.name === name);

        if(!service) return Logger(`Could not find service (name: ${index.blue().bold(name)})`, 'service')

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

module.exports = createExecute;
//# sourceMappingURL=Execute.method.js.map
