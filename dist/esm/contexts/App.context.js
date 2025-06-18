import ComponentsConfig from '../configs/Components.config.js';
import createAddComponent from './app_methods/AddComponent.method.js';
import createGetAllComponents from './app_methods/GetAllComponents.method.js';

const createAppContext = () => {

    const ctx = {
        components: { controllers: [], views: [], services: [], models: [] },
        options: {
            cors: {},
            config: {}
        }
    };

    return {
        options: () => (ctx.options),
        attachConfig: (config) => ctx.options.config = config,
        addComponent: createAddComponent(ComponentsConfig, ctx),
        getAllComponents: createGetAllComponents(ComponentsConfig, ctx)
    }

};

export { createAppContext as default };
//# sourceMappingURL=App.context.js.map
