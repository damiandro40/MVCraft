'use strict';

var Components_config = require('../configs/Components.config.js');
var AddComponent_method = require('./app_methods/AddComponent.method.js');
var GetAllComponents_method = require('./app_methods/GetAllComponents.method.js');

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
        addComponent: AddComponent_method(Components_config, ctx),
        getAllComponents: GetAllComponents_method(Components_config, ctx)
    }

};

module.exports = createAppContext;
//# sourceMappingURL=App.context.js.map
