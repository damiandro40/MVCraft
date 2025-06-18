'use strict';

require('../node_modules/kleur/index.js');
var Logger = require('../helpers/Logger.js');
var Build_method = require('./module_methods/Build.method.js');

/**
 * 
 * @param {Object} components 
 * @param {object[]} components.controllers
 * @param {object[]} components.views
 * @param {object[]} components.services
 * @returns {{
 *      Build: () => object
 * }}
 */

const Module = (components) => {
    if(typeof components !== 'object' || components === null || Array.isArray(components)) {
        return Logger('Module config must be an object', 'module')
    }

    if(!components.controllers && !Array.isArray(components.controllers)) {
        return Logger('You need to provide at least controllers inside module config', 'module')
    }

    if(components.views && !Array.isArray(components.views)) {
        return Logger('Views inside module must be provided in array', 'module')
    }

    if(components.services && !Array.isArray(components.services)) {
        return Logger('Services inside module must be provided in array', 'module')
    }

    const ctx = {
        controllers: components.controllers || [],
        views: components.views || [],
        services: components.services || []
    };

    return {
        Build: Build_method(ctx)
    }
};

module.exports = Module;
//# sourceMappingURL=Module.core.js.map
