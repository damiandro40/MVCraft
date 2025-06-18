'use strict';

var index = require('../../node_modules/kleur/index.js');
var Logger = require('../../helpers/Logger.js');

const createNext = (req, res, locals) => {
    return (path) => {
        if(locals.handled === true || locals.aborted === true) return
        if(!path || typeof path !== 'string') return Logger(`${index.blue().bold('Next')} function argument must be a string`, 'controller')
        locals.next = path;
        locals.aborted = true;
    }
};

module.exports = createNext;
//# sourceMappingURL=Next.method.js.map
