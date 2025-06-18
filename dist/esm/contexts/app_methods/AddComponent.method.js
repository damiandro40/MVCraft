const createAddComponent = (components, ctx) => {
    const { controllers, views, services, models } = ctx.components;

    return (type, data) => {
        if(!components[type]) throw new Error('component_not_found')
        if(!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('invalid_data_type')
        
        let arr = null;
        if(type === 'controller') arr = controllers;
        if(type === 'view') arr = views;
        if(type === 'service') arr = services;
        if(type === 'model') arr = models;

        const fields = components[type].fields;

        for(const field in fields) {
            if(fields[field].required === true && !data[field]) throw new Error(`missing_field__${field}`)
            if(data[field] && typeof data[field] !== fields[field].type) throw new Error(`invalid_field_type__${field}`)
            if(data[field] && fields[field].allowed && !fields[field].allowed.includes(data[field])) throw new Error(`invalid_field_value__${field}`)
        }

        const verify = components[type].verify(arr, data);
        if(!verify) throw new Error('not_verified')
        
        arr.push(data);
    }
};

export { createAddComponent as default };
//# sourceMappingURL=AddComponent.method.js.map
