import createStatus from './route_methods/Status.method.js';
import createHeader from './route_methods/Header.method.js';
import createResponse from './route_methods/Response.method.js';
import createContent from './route_methods/Content.method.js';
import createExecute from './route_methods/Execute.method.js';
import createNext from './route_methods/Next.method.js';
import createSetCookie from './route_methods/SetCookie.method.js';

const createRouteContext = (req, res, ctx) => {

    const locals = {
        content: {},
        handled: false
    };

    const methods = {
        Status: createStatus(req, res, locals),
        Header: createHeader(req, res, locals),
        Response: createResponse(req, res, locals),
        Content: createContent(req, res, locals),
        Execute: createExecute(ctx),
        Next: createNext(req, res, locals),
        SetCookie: createSetCookie(req, res)
    };

    return {
        locals,
        methods
    }

};

export { createRouteContext as default };
//# sourceMappingURL=Route.context.js.map
