'use strict';

require('../../node_modules/kleur/index.js');
require('../../helpers/Logger.js');

const createAddService = (ctx) => {

    return (data) => {
        try {
            ctx.addComponent('service', data);
        } catch(err) {
            console.log(err);
        }
    }

};

module.exports = createAddService;
//# sourceMappingURL=AddService.method.js.map
