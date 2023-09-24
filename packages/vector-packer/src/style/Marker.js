import { extend, isNil, isString, isNumber, isFunction, hasOwn, isObject } from './Util';
import { isFunctionDefinition, interpolated } from '@maptalks/function-type';

/**
 * Get SVG Base64 String from a marker symbol with (markerType : path)
 * @param  {Object} symbol - symbol with markerType of path
 * @return {String}        SVG Base64 String
 * @memberOf Util
 */
export function getMarkerPathBase64(symbol, width, height) {
    if (!symbol['markerPath']) {
        return null;
    }
    let op = 1;
    const styles = translateToSVGStyles(symbol);
    //context.globalAlpha doesn't take effect with drawing SVG in IE9/10/11 and EGDE, so set opacity in SVG element.
    if (isNumber(symbol['markerOpacity'])) {
        op = symbol['markerOpacity'];
    }
    if (isNumber(symbol['opacity'])) {
        op *= symbol['opacity'];
    }
    const svgStyles = {};
    if (styles) {
        for (const p in styles['stroke']) {
            if (hasOwn(styles['stroke'], p)) {
                if (!isNil(styles['stroke'][p])) {
                    svgStyles[p] = styles['stroke'][p];
                }
            }
        }
        for (const p in styles['fill']) {
            if (hasOwn(styles['fill'], p)) {
                if (!isNil(styles['fill'][p])) {
                    svgStyles[p] = styles['fill'][p];
                }
            }
        }
    }

    const pathes = Array.isArray(symbol['markerPath']) ? symbol['markerPath'] : [symbol['markerPath']];
    let path;
    const pathesToRender = [];
    for (let i = 0; i < pathes.length; i++) {
        path = isString(pathes[i]) ? {
            'path': pathes[i]
        } : pathes[i];
        path = extend({}, path, svgStyles);
        path['d'] = path['path'];
        delete path['path'];
        pathesToRender.push(path);
    }
    const svg = ['<svg version="1.1"', 'xmlns="http://www.w3.org/2000/svg"'];
    if (op < 1) {
        svg.push('opacity="' + op + '"');
    }
    // if (symbol['markerWidth'] && symbol['markerHeight']) {
    //     svg.push('height="' + symbol['markerHeight'] + '" width="' + symbol['markerWidth'] + '"');
    // }
    if (symbol['markerPathWidth'] && symbol['markerPathHeight']) {
        svg.push('viewBox="0 0 ' + symbol['markerPathWidth'] + ' ' + symbol['markerPathHeight'] + '"');
    }
    svg.push('preserveAspectRatio="none"');
    if (width) {
        svg.push('width="' + width + '"');
    }
    if (height) {
        svg.push('height="' + height + '"');
    }
    svg.push('><defs></defs>');

    for (let i = 0; i < pathesToRender.length; i++) {
        let strPath = '<path ';
        for (const p in pathesToRender[i]) {
            if (hasOwn(pathesToRender[i], p)) {
                strPath += ' ' + p + '="' + pathesToRender[i][p] + '"';
            }
        }
        strPath += '></path>';
        svg.push(strPath);
    }
    svg.push('</svg>');
    const b64 = 'data:image/svg+xml;base64,' + btoa(svg.join(' '));
    return b64;
}

/**
 * Translate symbol properties to SVG properties
 * @param  {Object} s - object with symbol properties
 * @return {Object}   object with SVG properties
 */
function translateToSVGStyles(s) {
    const result = {
        'stroke': {
            'stroke': s['markerLineColor'],
            'stroke-width': s['markerLineWidth'],
            'stroke-opacity': s['markerLineOpacity'],
            'stroke-dasharray': null,
            'stroke-linecap': 'butt',
            'stroke-linejoin': 'round'
        },
        'fill': {
            'fill': s['markerFill'],
            'fill-opacity': s['markerFillOpacity']
        }
    };
    if (result['stroke']['stroke-width'] === 0) {
        result['stroke']['stroke-opacity'] = 0;
    }
    return result;
}

export function evaluateIconSize(symbol, symbolDef, properties, zoom, markerWidthFn, markerHeightFn) {
    if (isNil(symbolDef.markerWidth) && isNil(symbolDef.markerHeight)) {
        return null;
    }
    const keyNameWidth = '__fn_markerWidth'.trim();
    const keyNameHeight = '__fn_markerHeight'.trim();
    let width = symbolDef.markerWidth || 0;
    let height = symbolDef.markerHeight || 0;
    if (isObject(width)) {
        if (width.type !== 'identity') {
            width = findLargestStops(width);
        } else {
            // 要先执行一次 symbol.markerWidth, __fn_markerWidth才会生成
            width = symbol.markerWidth;
            if (symbol[keyNameWidth]) {
                width = symbol[keyNameWidth](zoom, properties);
            }
            // identity 返回的是stops
            if (isObject(width)) {
                if (width.type === 'identity') {
                    width = markerWidthFn(zoom, properties);
                } else {
                    width = findLargestStops(width);
                }
            }
        }
    }
    if (isObject(height)) {
        if (height.type !== 'identity') {
            height = findLargestStops(height);
        } else {
            height = symbol.markerHeight;
            if (symbol[keyNameHeight]) {
                height = symbol[keyNameHeight](zoom, properties);
            }
            // identity 返回的是stops
            if (isObject(height)) {
                if (height.type === 'identity') {
                    height = markerHeightFn(zoom, properties);
                } else {
                    height = findLargestStops(height);
                }
            }

        }
    }

    return [width, height];
}

const DEFAULT_TEXT_SIZE = 16;
const FN_STOPS_KEY = '___fn_in_stops';

export function evaluateTextSize(symbol, symbolDef, properties, zoom) {
    const keyName = '__fn_textSize'.trim();
    let textSize = symbol.textSize;
    if (isNil(symbolDef.textSize)) {
        //default text size of marker
        return [DEFAULT_TEXT_SIZE, DEFAULT_TEXT_SIZE];
    }
    if (symbol[keyName]) {
        textSize = symbol[keyName];
    }
    const size = [];
    if (isFunction(textSize)) {
        size[0] = textSize(zoom, properties);
    } else {
        size[0] = textSize;
    }
    if (isFunctionDefinition(size[0])) {
        const key = size[0]['__fn_key'] = size[0]['__fn_key'] || JSON.stringify(size[0]);
        if (!symbol[FN_STOPS_KEY]) {
            symbol[FN_STOPS_KEY] = {};
        }
        if(!symbol[FN_STOPS_KEY][key]) {
            symbol[FN_STOPS_KEY][key] = interpolated(size[0]);
        }

        const fn = symbol[FN_STOPS_KEY][key];
        size[0] = fn(zoom, properties);
    }

    size[1] = size[0];
    return size;
}

export function findLargestStops(value) {
    const stops = value.stops;
    let max = -Infinity;
    for (let i = 0; i < stops.length; i++) {
        let v = stops[i][1];
        if (isObject(stops[i][1])) {
            v = findLargestStops(stops[i][1]);
        }
        if (v > max) {
            max = v;
        }
    }
    return max;
}
