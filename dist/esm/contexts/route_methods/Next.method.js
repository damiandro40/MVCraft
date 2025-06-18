import $ from '../../node_modules/kleur/index.js';
import Logger from '../../helpers/Logger.js';

const createNext = (req, res, locals) => {
    return (path) => {
        if(locals.handled === true || locals.aborted === true) return
        if(!path || typeof path !== 'string') return Logger(`${$.blue().bold('Next')} function argument must be a string`, 'controller')
        locals.next = path;
        locals.aborted = true;
    }
};

export { createNext as default };
//# sourceMappingURL=Next.method.js.map
