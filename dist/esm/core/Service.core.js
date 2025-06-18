import createHandle from './service_methods/Handle.method.js';
import createBuild from './service_methods/Build.method.js';

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
        Handle: createHandle(exceptions, { name}),
        Build: createBuild(exceptions, { name, handler })
    }

};

export { Service as default };
//# sourceMappingURL=Service.core.js.map
