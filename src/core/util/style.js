import { extend, isArray, isNil, isFunction, hasOwn } from './common';
import { createFilter } from 'utils';

export function isGradient(g) {
    return g && g['colorStops'];
}

export function getGradientStamp(g) {
    var keys = [g['type']];
    if (g['places']) {
        keys.push(g['places'].join());
    }
    if (g['colorStops']) {
        var stops = [];
        for (var i = g['colorStops'].length - 1; i >= 0; i--) {
            stops.push(g['colorStops'][i].join());
        }
        keys.push(stops.join(','));
    }
    return keys.join('_');
}

export function getSymbolStamp(symbol) {
    var keys = [];
    if (isArray(symbol)) {
        for (var i = 0; i < symbol.length; i++) {
            keys.push(getSymbolStamp(symbol[i]));
        }
        return '[ ' + keys.join(' , ') + ' ]';
    }
    for (var p in symbol) {
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

export function lowerSymbolOpacity(symbol, ratio) {
    function s(_symbol, _ratio) {
        var op = _symbol['opacity'];
        if (isNil(op)) {
            _symbol['opacity'] = _ratio;
        } else {
            _symbol['opacity'] *= _ratio;
        }
    }
    var lower;
    if (isArray(symbol)) {
        lower = [];
        for (var i = 0; i < symbol.length; i++) {
            var d = extend({}, symbol[i]);
            s(d, ratio);
            lower.push(d);
        }
    } else {
        lower = extend({}, symbol);
        s(lower, ratio);
    }
    return lower;
}

export function extendSymbol(symbol) {
    var sources = Array.prototype.slice.call(arguments, 1);
    if (!sources || !sources.length) {
        sources = [{}];
    }
    if (isArray(symbol)) {
        var s, dest, i, ii, l, ll;
        var result = [];
        for (i = 0, l = symbol.length; i < l; i++) {
            s = symbol[i];
            dest = {};
            for (ii = 0, ll = sources.length; ii < ll; ii++) {
                if (!isArray(sources[ii])) {
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
        return extendSymbol([symbol]);
    }
}


/**
 * Compile layer's style, styles to symbolize layer's geometries, e.g.<br>
 * <pre>
 * [
 *   {
 *     'filter' : ['==', 'foo', 'val'],
 *     'symbol' : {'markerFile':'foo.png'}
 *   }
 * ]
 * </pre>
 * @param  {Object|Object[]} styles - style to compile
 * @return {Object[]}       compiled styles
 */
export function compileStyle(styles) {
    if (!isArray(styles)) {
        return compileStyle([styles]);
    }
    var compiled = [];
    for (var i = 0; i < styles.length; i++) {
        if (styles[i]['filter'] === true) {
            compiled.push({
                filter: function () {
                    return true;
                },
                symbol: styles[i].symbol
            });
        } else {
            compiled.push({
                filter: createFilter(styles[i]['filter']),
                symbol: styles[i].symbol
            });
        }
    }
    return compiled;
}
