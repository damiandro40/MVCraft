const createBuild = (ctx, ctrl) => {
    const { path, method, handler } = ctrl;

    return () => {
        const pathRegexp = /\{([^}]+)\}/g;
        const output = [];

        if(ctx.endpoints.length === 0) {
            output.push({ path, method, exceptions: ctx.exceptions, options: ctx.options, handler });
        } else {
            for(const endpoint of ctx.endpoints) {
                output.push({
                    path: path + endpoint.path,
                    method: endpoint.method,
                    exceptions: ctx.exceptions,
                    options: ctx.options,
                    prehandler: handler,
                    handler: endpoint.handler
                });
            }
        }

        for(const item of output) {
            if(!pathRegexp.test(item.path)) continue

            item.matcher = (path) => {
                const regexPattern = item.path.replace(/{(\w+)}/g, (_, name) => `(?<${name}>[^/]+)`);
                const regex = new RegExp(`^${regexPattern}$`);

                const result = path.match(regex);
                return result ? result.groups : null
            };
        }

        return output
    }
};

export { createBuild as default };
//# sourceMappingURL=Build.method.js.map
