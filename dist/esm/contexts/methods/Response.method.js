const createResponse = (req, res, locals) => {
    return (data) => {
        if(locals.handled === true) return

        res.end(data);
        
        locals.handled = true;
    }
};

export { createResponse as default };
//# sourceMappingURL=Response.method.js.map
