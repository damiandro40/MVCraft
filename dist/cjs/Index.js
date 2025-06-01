'use strict';

var http = require('http');
var url = require('url');

var dist = {};

var hasRequiredDist;

function requireDist () {
	if (hasRequiredDist) return dist;
	hasRequiredDist = 1;
	Object.defineProperty(dist, "__esModule", { value: true });
	dist.TokenData = void 0;
	dist.parse = parse;
	dist.compile = compile;
	dist.match = match;
	dist.pathToRegexp = pathToRegexp;
	dist.stringify = stringify;
	const DEFAULT_DELIMITER = "/";
	const NOOP_VALUE = (value) => value;
	const ID_START = /^[$_\p{ID_Start}]$/u;
	const ID_CONTINUE = /^[$\u200c\u200d\p{ID_Continue}]$/u;
	const DEBUG_URL = "https://git.new/pathToRegexpError";
	const SIMPLE_TOKENS = {
	    // Groups.
	    "{": "{",
	    "}": "}",
	    // Reserved.
	    "(": "(",
	    ")": ")",
	    "[": "[",
	    "]": "]",
	    "+": "+",
	    "?": "?",
	    "!": "!",
	};
	/**
	 * Escape text for stringify to path.
	 */
	function escapeText(str) {
	    return str.replace(/[{}()\[\]+?!:*]/g, "\\$&");
	}
	/**
	 * Escape a regular expression string.
	 */
	function escape(str) {
	    return str.replace(/[.+*?^${}()[\]|/\\]/g, "\\$&");
	}
	/**
	 * Tokenize input string.
	 */
	function* lexer(str) {
	    const chars = [...str];
	    let i = 0;
	    function name() {
	        let value = "";
	        if (ID_START.test(chars[++i])) {
	            value += chars[i];
	            while (ID_CONTINUE.test(chars[++i])) {
	                value += chars[i];
	            }
	        }
	        else if (chars[i] === '"') {
	            let pos = i;
	            while (i < chars.length) {
	                if (chars[++i] === '"') {
	                    i++;
	                    pos = 0;
	                    break;
	                }
	                if (chars[i] === "\\") {
	                    value += chars[++i];
	                }
	                else {
	                    value += chars[i];
	                }
	            }
	            if (pos) {
	                throw new TypeError(`Unterminated quote at ${pos}: ${DEBUG_URL}`);
	            }
	        }
	        if (!value) {
	            throw new TypeError(`Missing parameter name at ${i}: ${DEBUG_URL}`);
	        }
	        return value;
	    }
	    while (i < chars.length) {
	        const value = chars[i];
	        const type = SIMPLE_TOKENS[value];
	        if (type) {
	            yield { type, index: i++, value };
	        }
	        else if (value === "\\") {
	            yield { type: "ESCAPED", index: i++, value: chars[i++] };
	        }
	        else if (value === ":") {
	            const value = name();
	            yield { type: "PARAM", index: i, value };
	        }
	        else if (value === "*") {
	            const value = name();
	            yield { type: "WILDCARD", index: i, value };
	        }
	        else {
	            yield { type: "CHAR", index: i, value: chars[i++] };
	        }
	    }
	    return { type: "END", index: i, value: "" };
	}
	class Iter {
	    constructor(tokens) {
	        this.tokens = tokens;
	    }
	    peek() {
	        if (!this._peek) {
	            const next = this.tokens.next();
	            this._peek = next.value;
	        }
	        return this._peek;
	    }
	    tryConsume(type) {
	        const token = this.peek();
	        if (token.type !== type)
	            return;
	        this._peek = undefined; // Reset after consumed.
	        return token.value;
	    }
	    consume(type) {
	        const value = this.tryConsume(type);
	        if (value !== undefined)
	            return value;
	        const { type: nextType, index } = this.peek();
	        throw new TypeError(`Unexpected ${nextType} at ${index}, expected ${type}: ${DEBUG_URL}`);
	    }
	    text() {
	        let result = "";
	        let value;
	        while ((value = this.tryConsume("CHAR") || this.tryConsume("ESCAPED"))) {
	            result += value;
	        }
	        return result;
	    }
	}
	/**
	 * Tokenized path instance.
	 */
	class TokenData {
	    constructor(tokens) {
	        this.tokens = tokens;
	    }
	}
	dist.TokenData = TokenData;
	/**
	 * Parse a string for the raw tokens.
	 */
	function parse(str, options = {}) {
	    const { encodePath = NOOP_VALUE } = options;
	    const it = new Iter(lexer(str));
	    function consume(endType) {
	        const tokens = [];
	        while (true) {
	            const path = it.text();
	            if (path)
	                tokens.push({ type: "text", value: encodePath(path) });
	            const param = it.tryConsume("PARAM");
	            if (param) {
	                tokens.push({
	                    type: "param",
	                    name: param,
	                });
	                continue;
	            }
	            const wildcard = it.tryConsume("WILDCARD");
	            if (wildcard) {
	                tokens.push({
	                    type: "wildcard",
	                    name: wildcard,
	                });
	                continue;
	            }
	            const open = it.tryConsume("{");
	            if (open) {
	                tokens.push({
	                    type: "group",
	                    tokens: consume("}"),
	                });
	                continue;
	            }
	            it.consume(endType);
	            return tokens;
	        }
	    }
	    const tokens = consume("END");
	    return new TokenData(tokens);
	}
	/**
	 * Compile a string to a template function for the path.
	 */
	function compile(path, options = {}) {
	    const { encode = encodeURIComponent, delimiter = DEFAULT_DELIMITER } = options;
	    const data = path instanceof TokenData ? path : parse(path, options);
	    const fn = tokensToFunction(data.tokens, delimiter, encode);
	    return function path(data = {}) {
	        const [path, ...missing] = fn(data);
	        if (missing.length) {
	            throw new TypeError(`Missing parameters: ${missing.join(", ")}`);
	        }
	        return path;
	    };
	}
	function tokensToFunction(tokens, delimiter, encode) {
	    const encoders = tokens.map((token) => tokenToFunction(token, delimiter, encode));
	    return (data) => {
	        const result = [""];
	        for (const encoder of encoders) {
	            const [value, ...extras] = encoder(data);
	            result[0] += value;
	            result.push(...extras);
	        }
	        return result;
	    };
	}
	/**
	 * Convert a single token into a path building function.
	 */
	function tokenToFunction(token, delimiter, encode) {
	    if (token.type === "text")
	        return () => [token.value];
	    if (token.type === "group") {
	        const fn = tokensToFunction(token.tokens, delimiter, encode);
	        return (data) => {
	            const [value, ...missing] = fn(data);
	            if (!missing.length)
	                return [value];
	            return [""];
	        };
	    }
	    const encodeValue = encode || NOOP_VALUE;
	    if (token.type === "wildcard" && encode !== false) {
	        return (data) => {
	            const value = data[token.name];
	            if (value == null)
	                return ["", token.name];
	            if (!Array.isArray(value) || value.length === 0) {
	                throw new TypeError(`Expected "${token.name}" to be a non-empty array`);
	            }
	            return [
	                value
	                    .map((value, index) => {
	                    if (typeof value !== "string") {
	                        throw new TypeError(`Expected "${token.name}/${index}" to be a string`);
	                    }
	                    return encodeValue(value);
	                })
	                    .join(delimiter),
	            ];
	        };
	    }
	    return (data) => {
	        const value = data[token.name];
	        if (value == null)
	            return ["", token.name];
	        if (typeof value !== "string") {
	            throw new TypeError(`Expected "${token.name}" to be a string`);
	        }
	        return [encodeValue(value)];
	    };
	}
	/**
	 * Transform a path into a match function.
	 */
	function match(path, options = {}) {
	    const { decode = decodeURIComponent, delimiter = DEFAULT_DELIMITER } = options;
	    const { regexp, keys } = pathToRegexp(path, options);
	    const decoders = keys.map((key) => {
	        if (decode === false)
	            return NOOP_VALUE;
	        if (key.type === "param")
	            return decode;
	        return (value) => value.split(delimiter).map(decode);
	    });
	    return function match(input) {
	        const m = regexp.exec(input);
	        if (!m)
	            return false;
	        const path = m[0];
	        const params = Object.create(null);
	        for (let i = 1; i < m.length; i++) {
	            if (m[i] === undefined)
	                continue;
	            const key = keys[i - 1];
	            const decoder = decoders[i - 1];
	            params[key.name] = decoder(m[i]);
	        }
	        return { path, params };
	    };
	}
	function pathToRegexp(path, options = {}) {
	    const { delimiter = DEFAULT_DELIMITER, end = true, sensitive = false, trailing = true, } = options;
	    const keys = [];
	    const sources = [];
	    const flags = sensitive ? "" : "i";
	    const paths = Array.isArray(path) ? path : [path];
	    const items = paths.map((path) => path instanceof TokenData ? path : parse(path, options));
	    for (const { tokens } of items) {
	        for (const seq of flatten(tokens, 0, [])) {
	            const regexp = sequenceToRegExp(seq, delimiter, keys);
	            sources.push(regexp);
	        }
	    }
	    let pattern = `^(?:${sources.join("|")})`;
	    if (trailing)
	        pattern += `(?:${escape(delimiter)}$)?`;
	    pattern += end ? "$" : `(?=${escape(delimiter)}|$)`;
	    const regexp = new RegExp(pattern, flags);
	    return { regexp, keys };
	}
	/**
	 * Generate a flat list of sequence tokens from the given tokens.
	 */
	function* flatten(tokens, index, init) {
	    if (index === tokens.length) {
	        return yield init;
	    }
	    const token = tokens[index];
	    if (token.type === "group") {
	        const fork = init.slice();
	        for (const seq of flatten(token.tokens, 0, fork)) {
	            yield* flatten(tokens, index + 1, seq);
	        }
	    }
	    else {
	        init.push(token);
	    }
	    yield* flatten(tokens, index + 1, init);
	}
	/**
	 * Transform a flat sequence of tokens into a regular expression.
	 */
	function sequenceToRegExp(tokens, delimiter, keys) {
	    let result = "";
	    let backtrack = "";
	    let isSafeSegmentParam = true;
	    for (let i = 0; i < tokens.length; i++) {
	        const token = tokens[i];
	        if (token.type === "text") {
	            result += escape(token.value);
	            backtrack += token.value;
	            isSafeSegmentParam || (isSafeSegmentParam = token.value.includes(delimiter));
	            continue;
	        }
	        if (token.type === "param" || token.type === "wildcard") {
	            if (!isSafeSegmentParam && !backtrack) {
	                throw new TypeError(`Missing text after "${token.name}": ${DEBUG_URL}`);
	            }
	            if (token.type === "param") {
	                result += `(${negate(delimiter, isSafeSegmentParam ? "" : backtrack)}+)`;
	            }
	            else {
	                result += `([\\s\\S]+)`;
	            }
	            keys.push(token);
	            backtrack = "";
	            isSafeSegmentParam = false;
	            continue;
	        }
	    }
	    return result;
	}
	function negate(delimiter, backtrack) {
	    if (backtrack.length < 2) {
	        if (delimiter.length < 2)
	            return `[^${escape(delimiter + backtrack)}]`;
	        return `(?:(?!${escape(delimiter)})[^${escape(backtrack)}])`;
	    }
	    if (delimiter.length < 2) {
	        return `(?:(?!${escape(backtrack)})[^${escape(delimiter)}])`;
	    }
	    return `(?:(?!${escape(backtrack)}|${escape(delimiter)})[\\s\\S])`;
	}
	/**
	 * Stringify token data into a path string.
	 */
	function stringify(data) {
	    return data.tokens
	        .map(function stringifyToken(token, index, tokens) {
	        if (token.type === "text")
	            return escapeText(token.value);
	        if (token.type === "group") {
	            return `{${token.tokens.map(stringifyToken).join("")}}`;
	        }
	        const isSafe = isNameSafe(token.name) && isNextNameSafe(tokens[index + 1]);
	        const key = isSafe ? token.name : JSON.stringify(token.name);
	        if (token.type === "param")
	            return `:${key}`;
	        if (token.type === "wildcard")
	            return `*${key}`;
	        throw new TypeError(`Unexpected token: ${token}`);
	    })
	        .join("");
	}
	function isNameSafe(name) {
	    const [first, ...rest] = name;
	    if (!ID_START.test(first))
	        return false;
	    return rest.every((char) => ID_CONTINUE.test(char));
	}
	function isNextNameSafe(token) {
	    if ((token === null || token === void 0 ? void 0 : token.type) !== "text")
	        return true;
	    return !ID_CONTINUE.test(token.value[0]);
	}
	
	return dist;
}

var distExports = requireDist();

const createContext = () => {

    const controllers = [];
    const views = [];

    return {
        addController: (path, method, handler) => {
            controllers.push({ path, method, handler });
        },

        getController: (path, method) => {
            if(path.includes(':')) {
                for(const controller of controllers) {
                    const matcher = distExports.match(controller.path, { decode: decodeURIComponent });
                    const matched = matcher(path);
                    if(!matched) continue
                    if(controller.method !== method) continue

                    return {
                        path: controller.path,
                        method: controller.method,
                        handler: controller.handler,
                        params: matched.params
                    }
                }
                return null
            }

            return controllers.find(c => c.path === path && c.method === method) || null
        },

        addView: (name, handler) => {
            views.push( { name, handler });
        },

        getView: (name) => {
            return views.find(v => v.name === name) || null
        }
    }

};

const parseCookies = (cookies) => {
    if(!cookies) return {}

    const arr = cookies.split(';');
    const output = {};

    arr.forEach(c => {
        const name = c.split('=')[0];
        const value = c.split('=')[1];
        output[name] = decodeURIComponent(value);
    });

    return output
};

const setCookie = (name, value, options = {}) => {

    const { path = '/', maxAge, expires, expiresIn, httpOnly = true, sameSite = 'Lax', secure = false } = options;

    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

    if(path) cookieString += `; Path=${path}`;
    if(maxAge) cookieString += `; Max-Age=${maxAge}`;
    if(expires) cookieString += `; Expires=${expires.toUTCString()}`;
    if(expiresIn) cookieString += `; Expires=${new Date(Date.now() + expiresIn).toUTCString()}`;
    if(httpOnly) cookieString += `; HttpOnly`;
    if(secure) cookieString += `; Secure`;
    if(sameSite) cookieString +=`; SameSite=${sameSite}`; 

    return cookieString

};

const parseBody = (req, maxSize = 0) => {

    return new Promise((resolve, reject) => {
        let body = '';
        let bodySize = 0;

        req.on('data', (chunk) => {
            bodySize += chunk.length;

            if(maxSize !== 0 && bodySize > maxSize) return reject(new Error('PAYLOAD_TOO_LARGE'))
            
            body += chunk.toString();
        });

        req.on('end', () => resolve(body));

        req.on('error', (err) => reject(err));
    })

};

const defaultConfig = {
    port: 3000,
    maxBodySize: 0
};

/**
 * @typedef {object} Config
 * @property {number} port
 * @property {number} maxBodySize
 */

/**
 * @typedef {object} App
 * @property {(view: object) => object} AddView
 * @property {(controller: object) => object} AddController
 * @property {(callback?: (port: number) => void) => void} Run
 */

/**
 * 
 * @param {Config} config 
 * @returns {App}
 */

const App = (config = defaultConfig) => {

    const _ctx = createContext();

    const server = http.createServer(async (req, res) => {
        const _url = new url.URL(req.url, `http://${req.headers.host}`);

        const { pathname } = _url;

        const { method, query } = req;

        let ctrl = _ctx.getController(pathname, method);
        if(!ctrl) ctrl = _ctx.getController(pathname, '*');
        if(!ctrl) ctrl = _ctx.getController('*', method);
        if(!ctrl) ctrl = _ctx.getController('*', '*');

        if(!ctrl) {
            res.statusCode = 404;
            res.end('Path not found');
        } else {

            const data = {
                path: pathname,
                method,
                headers: { sent: res.getHeaders(), received: req.headers },
                cookies: parseCookies(req.headers.cookie),
                query: query || null,
                params: ctrl.params || null,
                body: null
            };

            if(req.method === 'POST' || req.method === 'PUT') {
                data.body = await parseBody(req, config.maxBodySize);
                if(req.headers['content-type'] === 'application/json') {
                    data.body = JSON.parse(data.body);
                }
            }

            const methods = {
                Response: async (statusCode, payload, viewData) => {
                    res.statusCode = statusCode;
                    
                    if(typeof payload === 'string') {
                        const view = _ctx.getView(payload);
                        if(view) payload = await view.handler(viewData);
                    }

                    if(res.getHeader('content-type') === 'application/json') {
                        res.end(JSON.stringify(payload));
                    } else {
                        res.end(payload);
                    }
                },

                SetHeader: (name, value) => {
                    data.headers.sent[name] = value;
                    res.setHeader(name, value);
                },

                SetCookie: (name, value, options) => {
                    const newCookie = setCookie(name, value, options);
                    const existingCookies = res.getHeader('Set-Cookie');
                    if(!existingCookies) {
                        res.setHeader('Set-Cookie', newCookie);
                    } else {
                        if(Array.isArray(existingCookies)) {
                            res.setHeader('Set-Cookie', [...existingCookies, newCookie]);
                        } else {
                            res.setHeader('Set-Cookie', [existingCookies, newCookie]);
                        }
                    }
                    data.headers.sent['Set-Cookie'] = res.getHeader('Set-Cookie');
                },

                DelCookie: (name) => {
                    const cookies = parseCookies(req.headers.cookie);
                    if(!cookies[name]) return

                    methods.SetCookie(name, cookies[name].value, { expires: new Date(Date.now() - 5) });
                    delete data.cookies[name];
                }
            };

            await ctrl.handler(methods, data);
        }

    });

    return {
        AddView: (view) => {
            _ctx.addView(view.name, view.handler);
        },
        AddController: (controller) => {
            _ctx.addController(controller.path, controller.method, controller.handler);
        },
        Run: (callback) => {
            server.listen(config.port, () => {
                if(typeof callback === 'function') callback(config.port);
            });
        }
    }

};

/**
 * @param {string} name 
 * @param {(data: any) => object} handler 
 * @returns {object}
 */

const View = (name, handler) => {

    return {
        name,
        handler
    }

};

/**
 * @typedef {object} Methods
 * @property {(statusCode: number, payload: string, viewData?: any) => void} Response
 * @property {(name: string, value: string) => void} SetHeader
 * @property {(name: string, value: string, options?: object) => void} SetCookie
 * @property {(name: string) => void} DelCookie
 */

/**
 * @typedef {object} Data
 * @property {string} path
 * @property {string} method
 * @property {object} headers
 * @property {object} cookies
 * @property {object|null} query
 * @property {object|null} params
 * @property {object|null} body
 */

/**
 * @param {string} path
 * @param {'GET'|'POST'|'PUT'|'PATCH'|'DELETE'|'*'} method
 * @param {(methods: Methods, data?: Data) => void} handler
 * @returns {object}
 */

const Controller = (path, method, handler) => {
    
    return {
        path,
        method,
        handler
    }

};

exports.App = App;
exports.Controller = Controller;
exports.View = View;
//# sourceMappingURL=Index.js.map
