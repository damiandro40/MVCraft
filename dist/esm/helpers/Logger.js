import $ from '../node_modules/kleur/index.js';

const prefixes = {
    main: $.yellow().bold('[MVCraft]'),
    app: $.red().bold('[App]'),
    app: $.red().bold('[Module]'),
    cors: $.red().bold('[CORS]'),
    controller: $.green().bold('[Controller]'),
    service: $.green().bold('[Service]')
};

const Logger = (msg, prefix) => {

    let output = prefixes.main;
    if(prefix && prefixes[prefix]) output += ' ' + prefixes[prefix];
    output += ' ' + msg;

    console.log(output);

};

export { Logger as default };
//# sourceMappingURL=Logger.js.map
