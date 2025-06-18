var ComponentsConfig = {
    controller: {
        fields: {
            path: {
                type: 'string',
                required: true
            },
            method: {
                type: 'string',
                required: true,
                allowed: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', '*']
            },
            handler: {
                type: 'function',
                required: true
            }
        },
        verify: (arr, data) => {
            if(arr.find(c => c.path === data.path && c.method === data.method)) return false
            return true
        }
    },
    service: {
        fields: {
            name: {
                type: 'string',
                required: true
            },
            handler: {
                type: 'function',
                required: true
            }
        },
        verify: (arr, data) => {
            if(arr.find(s => s.name === data.name)) return false
            return true
        }
    }
};

export { ComponentsConfig as default };
//# sourceMappingURL=Components.config.js.map
