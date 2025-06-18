import '../../node_modules/kleur/index.js';
import Logger from '../../helpers/Logger.js';

const createCreateModule = (ctx) => {
    return (data) => {
        try {
            for(const ctrl of data.controllers) {
                ctx.addComponent('controller', ctrl);
            }

            if(data.services) {
                for(const srvc of data.services) {
                    ctx.addComponent('service', srvc);
                }
            }

            if(data.views) {
                for(const vw of data.views) {
                    ctx.addComponent('view', vw);
                }
            }
        } catch(err) {
            Logger(`An error occured while loading module into your app...`, 'module');
        }
    }
};

export { createCreateModule as default };
//# sourceMappingURL=CreateModule.method.js.map
