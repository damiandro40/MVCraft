'use strict';

const createStatus = (req, res, locals) => {
    return (statusCode) => {
        if(locals.handled === true) return
        
        res.statusCode = statusCode;
    }
};

module.exports = createStatus;
//# sourceMappingURL=Status.method.js.map
