'use strict';

const createBuild = (exceptions, srv) => {
    return () => {
        return { name: srv.name, handler: srv.handler, exceptions }
    }
};

module.exports = createBuild;
//# sourceMappingURL=Build.method.js.map
