'use strict';

var Handle_method = require('./service_methods/Handle.method.js');
var Build_method = require('./service_methods/Build.method.js');

/**
 * 
 * @param {string} name 
 * @param {(data: any) => any} handler 
 * @returns {{
 *      Handle: (exception: string, handler: (err: Error, data?: any) => any) => any,
 *      Build: () => object
 * }}
 */

const Service = (name, handler) => {

    const exceptions = {};

    return {
        Handle: Handle_method(exceptions, { name}),
        Build: Build_method(exceptions, { name, handler })
    }

};

module.exports = Service;
//# sourceMappingURL=Service.core.js.map
