'use strict';

const createGetAllComponents = (components, ctx) => {
    const { controllers, views, services, models } = ctx.components;

    return (type) => {
        if(!components[type]) return
        
        if(type === 'controller') return controllers
        if(type === 'view') return views
        if(type === 'service') return services
        if(type === 'model') return models
    }
};

module.exports = createGetAllComponents;
//# sourceMappingURL=GetAllComponents.method.js.map
