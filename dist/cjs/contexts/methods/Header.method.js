'use strict';

const createHeader = (req, res, locals) => {

    return (name, value) => {
        if(locals.handled === true) return

        res.setHeader(name, value);
    }

};

module.exports = createHeader;
//# sourceMappingURL=Header.method.js.map
