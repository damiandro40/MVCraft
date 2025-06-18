import url from 'url';
import createRouteContext from '../contexts/Route.context.js';
import applyCors from './CorsHandler.js';
import BodyParser from './BodyParser.js';
import CookieParser from './CookieParser.js';

const httpHandler = async (req, res, appCtx) => {
    const controllers = appCtx.getAllComponents('controller');
    let ctrl = null;
    const parsedUrl = url.parse(req.url, true);
    const { pathname } = parsedUrl;

    applyCors(req, res, appCtx.options());

    const resolveController = (path, method) => {
        let controller = controllers.find(c => c.path === path && (c.method === method || '*'));
        if(!controller) {
            for(const c of controllers) {
                if(!c.matcher) continue
                if(c.method !== '*' && c.method !== method) continue

                const match = c.matcher(path);
                if(!match) continue
                controller = c;
                controller.params = match;
            }
        }

        if(!controller) controller = controllers.find(c => c.path === '*' && (c.method === method || '*'));
        
        return controller
    };

    ctrl = resolveController(pathname, req.method);

    const routeCtx = createRouteContext(req, res, appCtx);
    routeCtx.locals.content = {
        path: pathname,
        method: req.method,
        query: parsedUrl.query,
        headers: { received: req.headers, sent: res.getHeaders() },
        cookies: CookieParser(req.headers.cookie)
    };

    let redirects = 0;


    while(true) {

        if(redirects > appCtx.options().config.infiniteLoopGuardTreshold) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'text/plain');
            res.end('Internal server error');
            routeCtx.locals.handled = true;
            break
        }

        
        if(routeCtx.locals.aborted === true) routeCtx.locals.aborted = false;
        
        if(!ctrl) {
            res.setHeader('Content-Type', 'text/plain');
            res.statusCode = 404;
            res.end('Path not found');
            routeCtx.locals.handled = true;
            break
        }

        try {
            routeCtx.locals.content.body = await BodyParser(req, ctrl.options.maxBodySize || 0);
        } catch(err) {
            const exception = ctrl.exceptions['body_size_limit'] || ctrl.exceptions['*'];
            if(!exception) throw new Error(err)
            await exception(routeCtx.methods, err);
            break
        }

        if(ctrl.params) routeCtx.locals.content.params = ctrl.params;
        if(ctrl.prehandler) {
            try { 
                await ctrl.prehandler(routeCtx.methods);
                if(typeof routeCtx.locals.next === 'string' && !routeCtx.locals.handled) {
                    ctrl = resolveController(routeCtx.locals.next, req.method);
                    redirects++;
                    routeCtx.locals.content.path = routeCtx.locals.next;
                    routeCtx.locals.next = undefined;
                    continue
                }
            } catch(err) {
                const exception = ctrl.exceptions[err.message] || ctrl.exceptions['*'];
                if(!exception) {
                    throw new Error(err)
                } else {
                    await exception(routeCtx.methods, err);
                }
                break
            }
        }
        if(routeCtx.locals.handled === true) break
        try { 
            await ctrl.handler(routeCtx.methods);
            if(typeof routeCtx.locals.next === 'string' && !routeCtx.locals.handled) {
                ctrl = resolveController(routeCtx.locals.next, req.method);
                redirects++;
                routeCtx.locals.content.path = routeCtx.locals.next;
                routeCtx.locals.next = undefined;
                continue
            }
        } catch(err) {
            const exception = ctrl.exceptions[err.message] || ctrl.exceptions['*'];
            if(!exception) {
                throw new Error(err)
            } else {
                await exception(routeCtx.methods, err);
            }
            break
        }

        break
    }

    if(!routeCtx.locals.handled) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Path not found');
    }

};

export { httpHandler as default };
//# sourceMappingURL=httpHandler.js.map
