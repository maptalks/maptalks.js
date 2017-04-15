import { extend, isNil, isFunction, hasOwn } from './common';

/**
 * Whether the color is a gradient
 * @param  {Object}  g - color to test
 * @return {Boolean}
 * @memberOf Util
 */
export function isGradient(g) {
    return g && g['colorStops'];
}

/**
 * Get stamp of a gradient color object.
 * @param  {Object} g gradient color object
 * @return {String}     gradient stamp
 * @memberOf Util
 */
export function getGradientStamp(g) {
    const keys = [g['type']];
    if (g['places']) {
        keys.push(g['places'].join());
    }
    if (g['colorStops']) {
        const stops = [];
        for (let i = g['colorStops'].length - 1; i >= 0; i--) {
            stops.push(g['colorStops'][i].join());
        }
        keys.push(stops.join(','));
    }
    return keys.join('_');
}

/**
 * Get stamp of a symbol
 * @param  {Object|Object[]} symbol symbol
 * @return {String}        symbol's stamp
 * @memberOf Util
 */
export function getSymbolStamp(symbol) {
    const keys = [];
    if (Array.isArray(symbol)) {
        for (let i = 0; i < symbol.length; i++) {
            keys.push(getSymbolStamp(symbol[i]));
        }
        return '[ ' + keys.join(' , ') + ' ]';
    }
    for (const p in symbol) {
        if (hasOwn(symbol, p)) {
            if (!isFunction(symbol[p])) {
                if (isGradient(symbol[p])) {
                    keys.push(p + '=' + getGradientStamp(symbol[p]));
                } else {
                    keys.push(p + '=' + symbol[p]);
                }
            }
        }
    }
    return keys.join(';');
}

/**
 * Reduce opacity of the color by ratio
 * @param  {Object|Object[]} symbol symbols to set
 * @param  {Number} ratio  ratio of opacity to reduce
 * @return {Object|Object[]}      new symbol or symbols
 * @memberOf Util
 */
export function lowerSymbolOpacity(symbol, ratio) {
    function s(_symbol, _ratio) {
        const op = _symbol['opacity'];
        if (isNil(op)) {
            _symbol['opacity'] = _ratio;
        } else {
            _symbol['opacity'] *= _ratio;
        }
    }
    let lower;
    if (Array.isArray(symbol)) {
        lower = [];
        for (let i = 0; i < symbol.length; i++) {
            const d = extend({}, symbol[i]);
            s(d, ratio);
            lower.push(d);
        }
    } else {
        lower = extend({}, symbol);
        s(lower, ratio);
    }
    return lower;
}

/**
 * Merges the properties of sources into the symbol. <br>
 * @param  {Object|Object[]} symbol symbol to extend
 * @param  {...Object} src - sources
 * @return {Object|Object[]}        merged symbol
 * @memberOf Util
 */
export function extendSymbol(symbol) {
    let sources = Array.prototype.slice.call(arguments, 1);
    if (!sources || !sources.length) {
        sources = [{}];
    }
    if (Array.isArray(symbol)) {
        let s, dest;
        const result = [];
        for (let i = 0, l = symbol.length; i < l; i++) {
            s = symbol[i];
            dest = {};
            for (let ii = 0, ll = sources.length; ii < ll; ii++) {
                if (!Array.isArray(sources[ii])) {
                    extend(dest, s, sources[ii] ? sources[ii] : {});
                } else if (!isNil(sources[ii][i])) {
                    extend(dest, s, sources[ii][i]);
                } else {
                    extend(dest, s ? s : {});
                }
            }
            result.push(dest);
        }
        return result;
    } else {
        const args = [{}, symbol];
        args.push.apply(args, sources);
        return extend.apply(this, args);
    }
}
