import { createServer } from 'http';
import { fileURLToPath, pathToFileURL, URL } from 'url';
import path from 'path';
import fs from 'fs';

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

const ANSI_BACKGROUND_OFFSET = 10;

const wrapAnsi16 = (offset = 0) => code => `\u001B[${code + offset}m`;

const wrapAnsi256 = (offset = 0) => code => `\u001B[${38 + offset};5;${code}m`;

const wrapAnsi16m = (offset = 0) => (red, green, blue) => `\u001B[${38 + offset};2;${red};${green};${blue}m`;

const styles$1 = {
	modifier: {
		reset: [0, 0],
		// 21 isn't widely supported and 22 does the same thing
		bold: [1, 22],
		dim: [2, 22],
		italic: [3, 23],
		underline: [4, 24],
		overline: [53, 55],
		inverse: [7, 27],
		hidden: [8, 28],
		strikethrough: [9, 29],
	},
	color: {
		black: [30, 39],
		red: [31, 39],
		green: [32, 39],
		yellow: [33, 39],
		blue: [34, 39],
		magenta: [35, 39],
		cyan: [36, 39],
		white: [37, 39],

		// Bright color
		blackBright: [90, 39],
		gray: [90, 39], // Alias of `blackBright`
		grey: [90, 39], // Alias of `blackBright`
		redBright: [91, 39],
		greenBright: [92, 39],
		yellowBright: [93, 39],
		blueBright: [94, 39],
		magentaBright: [95, 39],
		cyanBright: [96, 39],
		whiteBright: [97, 39],
	},
	bgColor: {
		bgBlack: [40, 49],
		bgRed: [41, 49],
		bgGreen: [42, 49],
		bgYellow: [43, 49],
		bgBlue: [44, 49],
		bgMagenta: [45, 49],
		bgCyan: [46, 49],
		bgWhite: [47, 49],

		// Bright color
		bgBlackBright: [100, 49],
		bgGray: [100, 49], // Alias of `bgBlackBright`
		bgGrey: [100, 49], // Alias of `bgBlackBright`
		bgRedBright: [101, 49],
		bgGreenBright: [102, 49],
		bgYellowBright: [103, 49],
		bgBlueBright: [104, 49],
		bgMagentaBright: [105, 49],
		bgCyanBright: [106, 49],
		bgWhiteBright: [107, 49],
	},
};

Object.keys(styles$1.modifier);
const foregroundColorNames = Object.keys(styles$1.color);
const backgroundColorNames = Object.keys(styles$1.bgColor);
[...foregroundColorNames, ...backgroundColorNames];

function assembleStyles() {
	const codes = new Map();

	for (const [groupName, group] of Object.entries(styles$1)) {
		for (const [styleName, style] of Object.entries(group)) {
			styles$1[styleName] = {
				open: `\u001B[${style[0]}m`,
				close: `\u001B[${style[1]}m`,
			};

			group[styleName] = styles$1[styleName];

			codes.set(style[0], style[1]);
		}

		Object.defineProperty(styles$1, groupName, {
			value: group,
			enumerable: false,
		});
	}

	Object.defineProperty(styles$1, 'codes', {
		value: codes,
		enumerable: false,
	});

	styles$1.color.close = '\u001B[39m';
	styles$1.bgColor.close = '\u001B[49m';

	styles$1.color.ansi = wrapAnsi16();
	styles$1.color.ansi256 = wrapAnsi256();
	styles$1.color.ansi16m = wrapAnsi16m();
	styles$1.bgColor.ansi = wrapAnsi16(ANSI_BACKGROUND_OFFSET);
	styles$1.bgColor.ansi256 = wrapAnsi256(ANSI_BACKGROUND_OFFSET);
	styles$1.bgColor.ansi16m = wrapAnsi16m(ANSI_BACKGROUND_OFFSET);

	// From https://github.com/Qix-/color-convert/blob/3f0e0d4e92e235796ccb17f6e85c72094a651f49/conversions.js
	Object.defineProperties(styles$1, {
		rgbToAnsi256: {
			value(red, green, blue) {
				// We use the extended greyscale palette here, with the exception of
				// black and white. normal palette only has 4 greyscale shades.
				if (red === green && green === blue) {
					if (red < 8) {
						return 16;
					}

					if (red > 248) {
						return 231;
					}

					return Math.round(((red - 8) / 247) * 24) + 232;
				}

				return 16
					+ (36 * Math.round(red / 255 * 5))
					+ (6 * Math.round(green / 255 * 5))
					+ Math.round(blue / 255 * 5);
			},
			enumerable: false,
		},
		hexToRgb: {
			value(hex) {
				const matches = /[a-f\d]{6}|[a-f\d]{3}/i.exec(hex.toString(16));
				if (!matches) {
					return [0, 0, 0];
				}

				let [colorString] = matches;

				if (colorString.length === 3) {
					colorString = [...colorString].map(character => character + character).join('');
				}

				const integer = Number.parseInt(colorString, 16);

				return [
					/* eslint-disable no-bitwise */
					(integer >> 16) & 0xFF,
					(integer >> 8) & 0xFF,
					integer & 0xFF,
					/* eslint-enable no-bitwise */
				];
			},
			enumerable: false,
		},
		hexToAnsi256: {
			value: hex => styles$1.rgbToAnsi256(...styles$1.hexToRgb(hex)),
			enumerable: false,
		},
		ansi256ToAnsi: {
			value(code) {
				if (code < 8) {
					return 30 + code;
				}

				if (code < 16) {
					return 90 + (code - 8);
				}

				let red;
				let green;
				let blue;

				if (code >= 232) {
					red = (((code - 232) * 10) + 8) / 255;
					green = red;
					blue = red;
				} else {
					code -= 16;

					const remainder = code % 36;

					red = Math.floor(code / 36) / 5;
					green = Math.floor(remainder / 6) / 5;
					blue = (remainder % 6) / 5;
				}

				const value = Math.max(red, green, blue) * 2;

				if (value === 0) {
					return 30;
				}

				// eslint-disable-next-line no-bitwise
				let result = 30 + ((Math.round(blue) << 2) | (Math.round(green) << 1) | Math.round(red));

				if (value === 2) {
					result += 60;
				}

				return result;
			},
			enumerable: false,
		},
		rgbToAnsi: {
			value: (red, green, blue) => styles$1.ansi256ToAnsi(styles$1.rgbToAnsi256(red, green, blue)),
			enumerable: false,
		},
		hexToAnsi: {
			value: hex => styles$1.ansi256ToAnsi(styles$1.hexToAnsi256(hex)),
			enumerable: false,
		},
	});

	return styles$1;
}

const ansiStyles = assembleStyles();

/* eslint-env browser */

const level = (() => {
	if (!('navigator' in globalThis)) {
		return 0;
	}

	if (globalThis.navigator.userAgentData) {
		const brand = navigator.userAgentData.brands.find(({brand}) => brand === 'Chromium');
		if (brand && brand.version > 93) {
			return 3;
		}
	}

	if (/\b(Chrome|Chromium)\//.test(globalThis.navigator.userAgent)) {
		return 1;
	}

	return 0;
})();

const colorSupport = level !== 0 && {
	level};

const supportsColor = {
	stdout: colorSupport,
	stderr: colorSupport,
};

// TODO: When targeting Node.js 16, use `String.prototype.replaceAll`.
function stringReplaceAll(string, substring, replacer) {
	let index = string.indexOf(substring);
	if (index === -1) {
		return string;
	}

	const substringLength = substring.length;
	let endIndex = 0;
	let returnValue = '';
	do {
		returnValue += string.slice(endIndex, index) + substring + replacer;
		endIndex = index + substringLength;
		index = string.indexOf(substring, endIndex);
	} while (index !== -1);

	returnValue += string.slice(endIndex);
	return returnValue;
}

function stringEncaseCRLFWithFirstIndex(string, prefix, postfix, index) {
	let endIndex = 0;
	let returnValue = '';
	do {
		const gotCR = string[index - 1] === '\r';
		returnValue += string.slice(endIndex, (gotCR ? index - 1 : index)) + prefix + (gotCR ? '\r\n' : '\n') + postfix;
		endIndex = index + 1;
		index = string.indexOf('\n', endIndex);
	} while (index !== -1);

	returnValue += string.slice(endIndex);
	return returnValue;
}

const {stdout: stdoutColor, stderr: stderrColor} = supportsColor;

const GENERATOR = Symbol('GENERATOR');
const STYLER = Symbol('STYLER');
const IS_EMPTY = Symbol('IS_EMPTY');

// `supportsColor.level` → `ansiStyles.color[name]` mapping
const levelMapping = [
	'ansi',
	'ansi',
	'ansi256',
	'ansi16m',
];

const styles = Object.create(null);

const applyOptions = (object, options = {}) => {
	if (options.level && !(Number.isInteger(options.level) && options.level >= 0 && options.level <= 3)) {
		throw new Error('The `level` option should be an integer from 0 to 3');
	}

	// Detect level if not set manually
	const colorLevel = stdoutColor ? stdoutColor.level : 0;
	object.level = options.level === undefined ? colorLevel : options.level;
};

const chalkFactory = options => {
	const chalk = (...strings) => strings.join(' ');
	applyOptions(chalk, options);

	Object.setPrototypeOf(chalk, createChalk.prototype);

	return chalk;
};

function createChalk(options) {
	return chalkFactory(options);
}

Object.setPrototypeOf(createChalk.prototype, Function.prototype);

for (const [styleName, style] of Object.entries(ansiStyles)) {
	styles[styleName] = {
		get() {
			const builder = createBuilder(this, createStyler(style.open, style.close, this[STYLER]), this[IS_EMPTY]);
			Object.defineProperty(this, styleName, {value: builder});
			return builder;
		},
	};
}

styles.visible = {
	get() {
		const builder = createBuilder(this, this[STYLER], true);
		Object.defineProperty(this, 'visible', {value: builder});
		return builder;
	},
};

const getModelAnsi = (model, level, type, ...arguments_) => {
	if (model === 'rgb') {
		if (level === 'ansi16m') {
			return ansiStyles[type].ansi16m(...arguments_);
		}

		if (level === 'ansi256') {
			return ansiStyles[type].ansi256(ansiStyles.rgbToAnsi256(...arguments_));
		}

		return ansiStyles[type].ansi(ansiStyles.rgbToAnsi(...arguments_));
	}

	if (model === 'hex') {
		return getModelAnsi('rgb', level, type, ...ansiStyles.hexToRgb(...arguments_));
	}

	return ansiStyles[type][model](...arguments_);
};

const usedModels = ['rgb', 'hex', 'ansi256'];

for (const model of usedModels) {
	styles[model] = {
		get() {
			const {level} = this;
			return function (...arguments_) {
				const styler = createStyler(getModelAnsi(model, levelMapping[level], 'color', ...arguments_), ansiStyles.color.close, this[STYLER]);
				return createBuilder(this, styler, this[IS_EMPTY]);
			};
		},
	};

	const bgModel = 'bg' + model[0].toUpperCase() + model.slice(1);
	styles[bgModel] = {
		get() {
			const {level} = this;
			return function (...arguments_) {
				const styler = createStyler(getModelAnsi(model, levelMapping[level], 'bgColor', ...arguments_), ansiStyles.bgColor.close, this[STYLER]);
				return createBuilder(this, styler, this[IS_EMPTY]);
			};
		},
	};
}

const proto = Object.defineProperties(() => {}, {
	...styles,
	level: {
		enumerable: true,
		get() {
			return this[GENERATOR].level;
		},
		set(level) {
			this[GENERATOR].level = level;
		},
	},
});

const createStyler = (open, close, parent) => {
	let openAll;
	let closeAll;
	if (parent === undefined) {
		openAll = open;
		closeAll = close;
	} else {
		openAll = parent.openAll + open;
		closeAll = close + parent.closeAll;
	}

	return {
		open,
		close,
		openAll,
		closeAll,
		parent,
	};
};

const createBuilder = (self, _styler, _isEmpty) => {
	// Single argument is hot path, implicit coercion is faster than anything
	// eslint-disable-next-line no-implicit-coercion
	const builder = (...arguments_) => applyStyle(builder, (arguments_.length === 1) ? ('' + arguments_[0]) : arguments_.join(' '));

	// We alter the prototype because we must return a function, but there is
	// no way to create a function with a different prototype
	Object.setPrototypeOf(builder, proto);

	builder[GENERATOR] = self;
	builder[STYLER] = _styler;
	builder[IS_EMPTY] = _isEmpty;

	return builder;
};

const applyStyle = (self, string) => {
	if (self.level <= 0 || !string) {
		return self[IS_EMPTY] ? '' : string;
	}

	let styler = self[STYLER];

	if (styler === undefined) {
		return string;
	}

	const {openAll, closeAll} = styler;
	if (string.includes('\u001B')) {
		while (styler !== undefined) {
			// Replace any instances already present with a re-opening code
			// otherwise only the part of the string until said closing code
			// will be colored, and the rest will simply be 'plain'.
			string = stringReplaceAll(string, styler.close, styler.open);

			styler = styler.parent;
		}
	}

	// We can move both next actions out of loop, because remaining actions in loop won't have
	// any/visible effect on parts we add here. Close the styling before a linebreak and reopen
	// after next line to fix a bleed issue on macOS: https://github.com/chalk/chalk/pull/92
	const lfIndex = string.indexOf('\n');
	if (lfIndex !== -1) {
		string = stringEncaseCRLFWithFirstIndex(string, closeAll, openAll, lfIndex);
	}

	return openAll + string + closeAll;
};

Object.defineProperties(createChalk.prototype, styles);

const chalk = createChalk();
createChalk({level: stderrColor ? stderrColor.level : 0});

const logger = (msg) => {

    console.log(`${chalk.bold.yellow('[MVCraft]')} ${msg}`);

};

const createContext = () => {

    const controllers = [];
    const views = [];
    const services = [];

    return {
        addController: (path, method, handler, config) => {
            if(!path || !method || !handler) return logger('You need to provide controller path (string), method (string) and handler (function)')
            if(typeof path !== 'string' || typeof method !== 'string' || typeof handler !== 'function') return logger('You need to provide controller path (string), method (string) and handler (function)')

            if(path === '*') path = '/*splat';

            const c = controllers.find(c => c.path === path && c.method === method);
            if(c) return logger(`Controller for path (${path}) and method (${method}) already exists`)

            const matcher = distExports.match(path, { decode: decodeURIComponent });
            controllers.push({ path, method, handler, config, matcher });
        },

        getController: (path, method) => {
            for(const controller of controllers) {
                const matched = controller.matcher(path);
                if(!matched) continue
                if(controller.method !== method) continue

                return {
                    path: controller.path,
                    method: controller.method,
                    handler: controller.handler,
                    config: controller.config,
                    params: matched.params || null
                }
            }
            return null
        },

        addView: (name, handler) => {
            if(!name|| !handler) return logger('You need to provide view name (string) and handler (function)')
            if(typeof name !== 'string' || typeof handler !== 'function') return logger('You need to provide view name (string) and handler (function)')

            const v = views.find(v => v.name === name);
            if(v) return logger(`View named (${name}) already exists`)

            views.push( { name, handler });
        },

        getView: (name) => {
            return views.find(v => v.name === name) || null
        },

        addService: (name, handler) => {
            if(!name|| !handler) return logger('You need to provide service name (string) and handler (function)')
            if(typeof name !== 'string' || typeof handler !== 'function') return logger('You need to provide service name (string) and handler (function)')

            const s = services.find(s => s.name === name);
            if(s) return logger(`Service named (${name}) already exists`)

            services.push({ name, handler });
        },

        getService: (name) => {
            return services.find(s => s.name === name) || null
        }
    }

};

const createResponse = (_ctx, req, res) => {

    return async (statusCode, payload, viewData) => {
        if(req._exceptionHandled) return
        if(req._handled) return logger('You are trying to execute "Response" after already sent response')
        res.statusCode = statusCode;
                
        req._handled = true;
        if(typeof payload === 'string') {
            const view = _ctx.getView(payload);
            if(view) payload = await view.handler(viewData);
        }

        if(res.getHeader('content-type') === 'application/json') {
            res.end(JSON.stringify(payload));
        } else {
            res.end(payload);
        }
    }

};

const defaultExceptionMap = {
    '404': { statusCode: 404, message: 'Path not found' },
    'PAYLOAD_TOO_LARGE': { statusCode: 413, message: 'Body payload size is too large' },
    'timeout': { statusCode: 504, message: 'Request timed out' }
};

const handleExceptions = (name, _ctx, req, res) => {

    const ex = defaultExceptionMap[name] || { statusCode: 500, message: 'Internal server error' };

    req._handled = true;
    res.setHeader('Content-Type', 'text/plain');
    res.statusCode = ex.statusCode;
    res.end(ex.message);

};

const createNext = (_ctx, req, res, config, url, data, createMethods) => {

    return (path) => {
        if(req._exceptionHandled) return
        if(req._handled) return logger('You are trying to execute "Next" after already sent response')

        if(req._endpoints && req._endpoints.length > 0) req._endpoints = [];

        const ctrl = _ctx.getController(path, data.method) || _ctx.getController(path, '*');
        if(!ctrl) return handleExceptions('404', _ctx, req, res)
        if(ctrl.method !== data.method && ctrl.method !== '*') return handleExceptions('404', _ctx, req, res)

        const methods = createMethods(_ctx, req, res, url, config, data);

        req._ctrl = ctrl;

        methods.data.path = path;
        methods.data.params = ctrl.params || null;

        ctrl.handler(methods.handlers);
    }

};

const createSetHeader = (req, res, data) => {

    return (name, value) => {
        if(req._exceptionHandled) return
        if(req._handled) return logger('You are trying to execute "SetHeader" after already sent response')

        data.headers.sent[name] = value;
        res.setHeader(name, value);
    }

};

const parseCookies = (cookies = '') => {
    if (!cookies) return {}

    const output = {};

    cookies.split(';').forEach(cookie => {
        const [name, ...rest] = cookie.split('=');
        const trimmedName = name?.trim();
        const value = rest.join('=').trim();
        if (trimmedName) {
            output[trimmedName] = decodeURIComponent(value);
        }
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

const createHandleCookies = (req, res, data) => {

    const SetCookie = (name, value, options) => {
        if(req._exceptionHandled) return
        if(req._handled) return logger('You are trying to execute "SetCookie" after already sent response')

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
        data.cookies = parseCookies(req.headers.cookie);
    };

    const DelCookie = (name) => {
        if(req._handled) return logger('You are trying to execute "DelCookie" after already sent response')

        const cookies = data.cookies;
        if(!cookies[name]) return

        SetCookie(name, cookies[name].value, { expires: new Date(Date.now() - 5) });
        delete data.cookies[name];
    };

    return { SetCookie, DelCookie }

};

const handlerGuard = async (fn, args, config) => {
    try {
        return await fn(args)
    } catch(err) {
        const handlers = config.req._ctrl.config.handlers;
        let handler = handlers[err.message];
        if(!handler) handler = handlers['*'];
        if(handler) {
            const methods = config.createMethods(config._ctx, config.req, config.res, config.config, config.url, config.data);
            await handler(methods.handlers, err);
            config.req._exceptionHandled = true;
        } else {
            logger(`${chalk.bold.red('[HandlerGuard]')} Detected and handled an unexpected error (${err}). More details below:`);
            console.log(err);
            return handleExceptions(err.message, config._ctx, config.req, config.res)
        }
    }
};

const createEnd = (_ctx, req, res, config, url, data, createMethods) => {

    return async (statusCode = 204) => {
        if(req._exceptionHandled) return
        if(req._handled) return logger('You are trying to execute "End" after already sent response')

        if(req._endpoints && req._endpoints.length > 0) {
            let endpt = req._endpoints.find(e => e.param === e.path && (e.method === data.method || e.method === '*') );
            if(!endpt) endpt = req._endpoints.find(e => e.path === '*' && (e.method === data.method || e.method === '*'));
            if(!endpt) return handleExceptions('404', _ctx, req, res)
            const methods = createMethods(_ctx, req, res, config, url, data);
            await handlerGuard(endpt.handler, methods.handlers, { _ctx, req, res, config, url, data, createMethods });
        } else {
            req._handled = true;
            res.setHeader('Connection', 'close');
            res.statusCode = statusCode;
            res.end();
        }
    }

};

const createEndpoint = (_ctx, req, res, data) => {

    return (path, method = data.method, handler) => {
        if(!data.params?.endpoint) {
            logger('You are trying to set endpoint without providing /:endpoint param');
        }

        req._endpoints.push({ param: data.params?.endpoint, path, method, handler });
    }

};

const createContent = (_ctx, req, res, data) => {

    return () => {
        return data
    }

};

const createExecute = (_ctx, req, res, config, url, data, createMethods) => {

    return async (name, args) => {        
        const fn =  _ctx.getService(name)?.handler; 
        if(!fn) return logger(`Service (${name}) not found`)

        return await handlerGuard(fn, args, { _ctx, req, res, config, url, data, createMethods })
    }

};

const parseQuery = (urlObj) => {

    const output = {};

    for(const [key, value] of urlObj.searchParams) {
        output[key] = value;
    }

    return output

};

const createData = (req, res, config, url) => {

    const data = {};

    data.path = url.pathname;
    data.params = req._params;
    data.method = req.method;
    data.headers = {
        sent: res.getHeaders(),
        received: req.headers
    },
    data.query = parseQuery(url);
    data.cookies = parseCookies(req.headers.cookie);
    
    if(req._body) data.body = req._body;

    if(data.body && req.headers['content-type'] === 'application/json') {
        try {
            data.body = JSON.parse(data.body);
        } catch(err) {
            res.statusCode = 400;
            res.end('Invalid JSON syntax');
        }
    }

    return data

};

const createMethods = (_ctx, req, res, config, url, data) => {

    const handlers = {};

    if(!data) data = createData(req, res, config, url);

    const cookieHandlers = createHandleCookies(req, res, data);

    handlers.Response = createResponse(_ctx, req, res);
    handlers.Next = createNext(_ctx, req, res, config, url, data, createMethods);
    handlers.SetHeader = createSetHeader(req, res, data);
    handlers.SetCookie = cookieHandlers.SetCookie;
    handlers.DelCookie = cookieHandlers.DelCookie;
    handlers.End = createEnd(_ctx, req, res, config, url, data, createMethods);
    handlers.Endpoint = createEndpoint(_ctx, req, res, data);
    handlers.Content = createContent(_ctx, req, res, data);
    handlers.Execute = createExecute(_ctx, req, res, config, url, data, createMethods);

    return { handlers, data }

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

const importComponents = async (base, target) => {
    try {
        const _path = path.join(path.dirname(fileURLToPath(base)), target);
    
        const components = fs.readdirSync(_path);

        const output = [];

        for(let c of components) {
            if(!c.endsWith('.js')) continue

            const _cpath = path.join(_path, c);
            const _cFilePath = pathToFileURL(_cpath).href;
            
            const component = await import(_cFilePath);
            output.push(component.default);
        }

        return output
    } catch(err) {
        return []
    }
};

const defaultConfig = {
    port: 3000,
    maxBodySize: 0,
    connectionTimeout: 10000
};

/**
 * @typedef {object} Config
 * @property {number} port - Port at which your application will be running (by default it is 3000).
 * @property {string} baseURL - import.meta.url - required in order to load controllers, views or services.
 * @property {string} controllers - Path to your controllers. They will be loaded automatically.
 * @property {string} views - Path to your views. They will be loaded automatically.
 * @property {string} services - Path to your services. They will be loaded automatically.
 * @property {number} connectionTimeout - Time in ms after which connection is closed (by default it is 10s).
 * @property {number} maxBodySize - Max body size in bytes accepted in any http request (by default it is 0 - which means there is no limit!).
 */

/**
 * @typedef {object} App
 * @property {(service: object) => object} AddService
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

    config = { ...defaultConfig, ...config };

    const _ctx = createContext();

    const server = createServer(async (req, res) => {
        res.setHeader('X-Powered-By', 'MVCraft');

        const connTimeout = setTimeout(() => {
            return handleExceptions('timeout', _ctx, req, res)
        }, config.connectionTimeout);

        res.on('close', () => {
            if(connTimeout) clearTimeout(connTimeout);
        });

        res.on('finish', () => {
            if(connTimeout) clearTimeout(connTimeout);
        });

        const url = new URL(req.url, `http://${req.headers.host}`);

        const { pathname } = url;
        const { method } = req;

        req._endpoints = [];

        let ctrl = _ctx.getController(pathname, method);
        if(!ctrl) ctrl = _ctx.getController(pathname, '*');
        if(!ctrl) ctrl = _ctx.getController('*', method);
        if(!ctrl) ctrl = _ctx.getController('*', '*');

        if(!ctrl) return handleExceptions('404', _ctx, req, res)

        req._ctrl = ctrl;

        req._params = ctrl.params || null;

        if(method === 'POST' || method === 'PUT') {
            try {
                req._body = await parseBody(req, config.maxBodySize);
            } catch(err) {
                return handleExceptions(err.message, _ctx, req, res)
            }
        }

        const _methods = createMethods(_ctx, req, res, config, url);

        await handlerGuard(ctrl.handler, _methods.handlers, { _ctx, req, res, config, url, data: _methods.data, createMethods });
    });

    return {
        AddView: (view) => {
            if(typeof view !== 'object' || !view || Array.isArray(view)) return logger('View must be an object')
            _ctx.addView(view.name, view.handler);
        },
        AddController: (controller) => {
            if(typeof controller !== 'object' || !controller || Array.isArray(controller)) return logger('Controller must be an object')
            _ctx.addController(controller.path, controller.method, controller.handler, controller.config);
        },
        AddService: (service) => {
            if(typeof service !== 'object' || !service || Array.isArray(service)) return logger('Service must be an object')
            _ctx.addService(service.name, service.handler);
        },
        Run: async (callback) => {
            if((config.controllers || config.views || config.services) && !config.baseURL) {
                return logger('You need to provide baseURL in config in order to import controllers, views or services')
            }

            const components = ['controllers', 'views', 'services'];

            for(let c of components) {

                if(!config.baseURL) break
                if(!config[c]) continue

                const cmps = await importComponents(config.baseURL, config[c]);
                for(let cmp of cmps) {
                    if(typeof cmp !== 'object' || !cmp || Array.isArray(cmp)) continue

                    if(c === 'controllers') _ctx.addController(cmp.path, cmp.method, cmp.handler, cmp.config);
                    if(c === 'views') _ctx.addView(cmp.name, cmp.handler);
                    if(c === 'services') _ctx.addService(cmp.name, cmp.handler);
                }
            }

            server.listen(config.port, () => {
                if(typeof callback === 'function') callback(config.port);
            });
        }
    }

};

/**
 * @param {string} name 
 * @param {(data: any) => any} handler 
 * @returns {object}
 */

const View = (name, handler) => {

    return {
        name,
        handler
    }

};

/**
 * @typedef {'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | '*'} HttpMethod
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
 * @typedef {object} Methods
 * @property {(statusCode: number, payload: string, viewData?: any) => void} Response
 * @property {(path: string) => void} Next
 * @property {(name: string, value: string) => void} SetHeader
 * @property {(name: string, value: string, options?: object) => void} SetCookie
 * @property {(name: string) => void} DelCookie
 * @property {(statusCode?: number) => void} End
 * @property {(path: string, method: HttpMethod, handler: (methods: Methods) => void)} Endpoint
 * @property {() => Data} Content
 * @property {(name: string, args: any) => any} Execute
 */

/**
 * @typedef {object} Controller
 * @property {(exception: string, handler: (methods: Methods, err: Error) => void)} Handle
 * @property {() => object} Build
 */

/**
 * @param {string} path
 * @param {HttpMethod} method
 * @param {(methods: Methods) => void} handler
 * @returns {Controller}
 */

const Controller = (path, method, handler) => {

    const config = {
        handlers: {}
    };
    
    const data = {
        path,
        method,
        handler,
        config
    };

    return {
        Handle: (exception, handler) => {
            if(!exception || !handler) return logger('Controller handler requires exception (string) and handler (function) arguments')
            if(typeof exception !== 'string' || typeof handler !== 'function') return logger('Controller handler requires exception (string) and handler (function) arguments')

            if(config.handlers[exception]) return logger(`Handler for exception (${exception}) in controller for path (${path}) has already been declared`)

            config.handlers[exception] = handler;
        },
        Build: () => {
            return data
        }
    }

};

/**
 * @param {string} name 
 * @param {(data: any) => any} handler 
 * @returns {object}
 */

const Service = (name, handler) => {

    return {
        name,
        handler
    }

};

export { App, Controller, Service, View };
//# sourceMappingURL=Index.js.map
