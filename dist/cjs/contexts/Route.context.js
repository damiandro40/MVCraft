'use strict';

var Status_method = require('./route_methods/Status.method.js');
var Header_method = require('./route_methods/Header.method.js');
var Response_method = require('./route_methods/Response.method.js');
var Content_method = require('./route_methods/Content.method.js');
var Execute_method = require('./route_methods/Execute.method.js');
var Next_method = require('./route_methods/Next.method.js');
var SetCookie_method = require('./route_methods/SetCookie.method.js');

const createRouteContext = (req, res, ctx) => {

    const locals = {
        content: {},
        handled: false
    };

    const methods = {
        Status: Status_method(req, res, locals),
        Header: Header_method(req, res, locals),
        Response: Response_method(req, res, locals),
        Content: Content_method(req, res, locals),
        Execute: Execute_method(ctx),
        Next: Next_method(req, res, locals),
        SetCookie: SetCookie_method(req, res)
    };

    return {
        locals,
        methods
    }

};

module.exports = createRouteContext;
//# sourceMappingURL=Route.context.js.map
