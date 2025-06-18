import $ from '../../node_modules/kleur/index.js';
import Logger from '../../helpers/Logger.js';

const createAddController = (ctx) => {
    return (data) => {
        let currentCtrl = null;
        try { 
            for(const ctrl of data) {
                currentCtrl = ctrl;
                ctx.addComponent('controller', ctrl);
            }
        } catch (err) {
            const arr = err.message.split('__');
            let msg = null;
            let payload = null;

            if(arr.length === 2) {
                msg = arr[0];
                payload = arr[1];
            } else {
                msg = arr[0];
            }

            switch(msg) {
                case 'missing_field':
                    Logger(`Missing field (${$.blue().bold(payload)}). Found in controller (path: ${$.blue().bold(currentCtrl.path || '...')}, method: ${$.blue().bold(currentCtrl.method || '...')})`);
                    break
                case 'invalid_field_type':
                    Logger(`Controller ${$.bold(payload)} type is invalid. Found in controller (path: ${$.blue().bold(currentCtrl.path)}, method: ${$.blue().bold(currentCtrl.method)})`);
                    break
                case 'invalid_field_value':
                    Logger(`Controller ${payload} (${$.blue().bold(data[payload])}) is not valid value. Found in controller (path: ${$.blue().bold(currentCtrl.path)}, method: ${$.blue().bold(currentCtrl.method)})`, 'app');
                    break
                case 'not_verified':
                    Logger(`Controller for path (${$.blue().bold(currentCtrl.path)}) and method (${$.blue().bold(currentCtrl.method)}) has already been registered`, 'app');
                    break
            }
        }
    }
};

export { createAddController as default };
//# sourceMappingURL=AddController.method.js.map
