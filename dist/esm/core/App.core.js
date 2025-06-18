import { createServer } from 'http';
import appConfig from '../configs/App.config.js';
import createAppContext from '../contexts/App.context.js';
import httpHandler from '../utils/httpHandler.js';
import createCORS from './app_methods/CORS.method.js';
import createAddController from './app_methods/AddController.method.js';
import createAddService from './app_methods/AddService.method.js';
import createCreateModule from './app_methods/CreateModule.method.js';
import createRun from './app_methods/Run.method.js';

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

    const config = { ...appConfig, ...options };

    const appCtx = createAppContext();

    appCtx.attachConfig(config);

    const server = createServer((req, res) => httpHandler(req, res, appCtx));

    return {
        CORS: createCORS(appCtx),
        AddController: createAddController(appCtx),
        AddService: createAddService(appCtx),
        CreateModule: createCreateModule(appCtx),
        Run: createRun(server, config)
    }

};

export { App as default };
//# sourceMappingURL=App.core.js.map
