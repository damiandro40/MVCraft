import '../../node_modules/kleur/index.js';
import '../../helpers/Logger.js';

const createAddService = (ctx) => {

    return (data) => {
        try {
            ctx.addComponent('service', data);
        } catch(err) {
            console.log(err);
        }
    }

};

export { createAddService as default };
//# sourceMappingURL=AddService.method.js.map
