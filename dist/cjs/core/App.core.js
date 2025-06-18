'use strict';

var http = require('http');
var App_config = require('../configs/App.config.js');
var App_context = require('../contexts/App.context.js');
var httpHandler = require('../utils/httpHandler.js');
var CORS_method = require('./app_methods/CORS.method.js');
var AddController_method = require('./app_methods/AddController.method.js');
var AddService_method = require('./app_methods/AddService.method.js');
var CreateModule_method = require('./app_methods/CreateModule.method.js');
var Run_method = require('./app_methods/Run.method.js');

/**
 * @typedef {Object} CORSOptions
 * @property {string | string[]} origins - Origins that are allowed (e.g. domains)
 * @property {string | string[]} methods - HTTP methods that are allowed
 * @property {string[]} headers - Allowed headers
 * @property {boolean} credentials - Allow cookies or not
 * @property {number} maxAge - Cache life time (in seconds)
 */

/**
 * @param {Object} options 
 * @param {number} [options.port = 3000]
 * @param {number} [options.infiniteLoopGuardTreshold = 10]
 * @returns {{
 *      CORS: (options: {
 *          origins: string | string[],
 *          methods: string | string[],
 *          headers: string[],
 *          credentials: boolean,
 *          maxAge: number
 *      }) => void
 *      AddController: (data: object) => void
 *      AddService: (data: object) => void
 *      CreateModule: (data: object) => void
 *      Run: (callback?: (port?: number) => void) => void
 * }}
 */

const App = (options = {}) => {

    const config = { ...App_config, ...options };

    const appCtx = App_context();

    appCtx.attachConfig(config);

    const server = http.createServer((req, res) => httpHandler(req, res, appCtx));

    return {
        CORS: CORS_method(appCtx),
        AddController: AddController_method(appCtx),
        AddService: AddService_method(appCtx),
        CreateModule: CreateModule_method(appCtx),
        Run: Run_method(server, config)
    }

};

module.exports = App;
//# sourceMappingURL=App.core.js.map
