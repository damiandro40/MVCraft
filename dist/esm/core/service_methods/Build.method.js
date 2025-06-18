const createBuild = (exceptions, srv) => {
    return () => {
        return { name: srv.name, handler: srv.handler, exceptions }
    }
};

export { createBuild as default };
//# sourceMappingURL=Build.method.js.map
