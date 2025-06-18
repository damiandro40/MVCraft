const createBuild = (ctx) => {
    return () => {
        const controllers = ctx.controllers;
        const services = ctx.services;
        const views = ctx.views;

        const output = {
            controllers: [],
            services: [],
            views: []
        };

        for(const ctrl of controllers) {
            output.controllers.push(...ctrl);
        }

        for(const srvc of services) {
            output.services.push(srvc);
        }

        for(const vw of views) {
            output.views.push(vw);
        }

        return output
    }
};

export { createBuild as default };
//# sourceMappingURL=Build.method.js.map
