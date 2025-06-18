const createStatus = (req, res, locals) => {
    return (statusCode) => {
        if(locals.handled === true || locals.aborted === true) return
        
        res.statusCode = statusCode;
    }
};

export { createStatus as default };
//# sourceMappingURL=Status.method.js.map
