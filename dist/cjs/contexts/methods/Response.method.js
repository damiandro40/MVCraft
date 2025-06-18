'use strict';

const createResponse = (req, res, locals) => {
    return (data) => {
        if(locals.handled === true) return

        res.end(data);
        
        locals.handled = true;
    }
};

module.exports = createResponse;
//# sourceMappingURL=Response.method.js.map
