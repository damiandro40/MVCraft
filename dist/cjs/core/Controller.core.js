'use strict';

var Endpoint_method = require('./controller_methods/Endpoint.method.js');
var Handle_method = require('./controller_methods/Handle.method.js');
var Options_method = require('./controller_methods/Options.method.js');
var Build_method = require('./controller_methods/Build.method.js');

/**
 * @typedef {Object} Content
 * @property {string} path
 * @property {string} method
 * @property {object | null} query
 * @property {object | null} params
 * @property {object | null} body
 * @property {object} headers
 * @property {object} cookies
 */

/**
 * @typedef {Object} Methods
 * @property {(statusCode: number) => void} Status
 * @property {(name: string, value: string) => void} Header
 * @property {(data: any) => void} Response
 * @property {() => Content} Content
 * @property {(name: string, data: any) => any} Execute
 * @property {(path: string) => void} Next
 * @property {(name: string, value: string, options: {
 *      maxAge: number,
 *      expires: Date,
 *      path: string,
 *      domain: string,
 *      httpOnly: boolean,
 *      secure: boolean,
 *      sameSite: string
 * }) => void} SetCookie
 */

/**
 * @typedef {"GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "*"} HttpMethod
 * @typedef {(methods: Methods) => void} Handler
 */

/**
 * @param {string} path 
 * @param {HttpMethod} method 
 * @param {Handler?} handler 
 * @returns {{
 *      Endpoint: (path: string, method: HttpMethod, handler: Handler),
 *      Handle: (exception: string, handler: (methods: Methods, err: Error) => void) => void,
 *      Options: (options: {
 *          maxBodySize: number
 *      }) => void,
 *      Build: () => object[]
 * }}
 */

const Controller = (path, method, handler) => {

    const ctx = {
        endpoints: [],
        exceptions: {},
        options: {}
    };

    return {
        Endpoint: Endpoint_method(ctx, { path, method}),
        Handle: Handle_method(ctx, { path, method}),
        Options: Options_method(ctx),
        Build: Build_method(ctx, { path, method, handler })
    }

};

module.exports = Controller;
//# sourceMappingURL=Controller.core.js.map
