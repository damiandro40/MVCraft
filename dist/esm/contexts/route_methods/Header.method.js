const createHeader = (req, res, locals) => {

    return (name, value) => {
        if(locals.handled === true || locals.aborted === true) return

        res.setHeader(name, value);
    }

};

export { createHeader as default };
//# sourceMappingURL=Header.method.js.map
