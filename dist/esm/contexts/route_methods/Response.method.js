import $ from '../../node_modules/kleur/index.js';
import Logger from '../../helpers/Logger.js';

const createResponse = (req, res, locals) => {
    return (data) => {
        if(locals.handled === true || locals.aborted === true) return

        if(data === null || data === undefined || data === '') data = 'no content';

        const contentType = res.getHeader('content-type');
        if(!contentType) {
            if(Buffer.isBuffer(data)) {
                res.setHeader('Content-Type', 'application/octet-stream');
                Logger(`Missing "${$.blue().bold('Content-Type')}" header. Added "${$.blue().bold('application/octet-stream')}" automatically.`, 'controller');
            } else if(typeof data !== 'string') {
                Logger(`Missing "${$.blue().bold('Content-Type')}" header. Added "${$.blue().bold('application/json')}" automatically.`, 'controller');
                res.setHeader('Content-Type', 'application/json');
            } else {
                Logger(`Missing "${$.blue().bold('Content-Type')}" header. Added "${$.blue().bold('text/plain')}" automatically.`, 'controller');
                res.setHeader('Content-Type', 'text/plain');
            }
        }

        if(!Buffer.isBuffer(data) && typeof data !== 'string' && res.getHeader('content-type') === 'application/json') {
            data = JSON.stringify(data);
        }

        res.end(data);
        
        locals.handled = true;
    }
};

export { createResponse as default };
//# sourceMappingURL=Response.method.js.map
