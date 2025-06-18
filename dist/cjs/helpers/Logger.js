'use strict';

var index = require('../node_modules/kleur/index.js');

const prefixes = {
    main: index.yellow().bold('[MVCraft]'),
    app: index.red().bold('[App]'),
    app: index.red().bold('[Module]'),
    cors: index.red().bold('[CORS]'),
    controller: index.green().bold('[Controller]'),
    service: index.green().bold('[Service]')
};

const Logger = (msg, prefix) => {

    let output = prefixes.main;
    if(prefix && prefixes[prefix]) output += ' ' + prefixes[prefix];
    output += ' ' + msg;

    console.log(output);

};

module.exports = Logger;
//# sourceMappingURL=Logger.js.map
