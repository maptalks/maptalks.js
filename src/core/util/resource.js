import { RESOURCE_PROPERTIES, RESOURCE_SIZE_PROPERTIES } from '../Constants';
import { IS_NODE } from './env';
import { extend, isNil, isNumber, isString } from './common';
import { isURL, extractCssUrl, btoa } from './util';
import { isFunctionDefinition, getFunctionTypeResources } from '../mapbox';


/**
 * Translate symbol properties to SVG properties
 * @param  {Object} s - object with symbol properties
 * @return {Object}   object with SVG properties
 * @memberOf Util
 */
export function translateToSVGStyles(s) {
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
            if (styles['stroke'].hasOwnProperty(p)) {
                if (!isNil(styles['stroke'][p])) {
                    svgStyles[p] = styles['stroke'][p];
                }
            }
        }
        for (const p in styles['fill']) {
            if (styles['fill'].hasOwnProperty(p)) {
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
            if (pathesToRender[i].hasOwnProperty(p)) {
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
 * Get external resources from the given symbol
 * @param  {Object} symbol      - symbol
 * @param  {Boolean} toAbsolute - whether convert url to aboslute
 * @return {String[]}           - resource urls
 * @memberOf Util
 */
export function getExternalResources(symbol, toAbsolute) {
    if (!symbol) {
        return [];
    }
    let symbols = symbol;
    if (!Array.isArray(symbol)) {
        symbols = [symbol];
    }
    const resources = [];
    const props = RESOURCE_PROPERTIES;
    let res, resSizeProp;
    let w, h;
    for (let i = symbols.length - 1; i >= 0; i--) {
        symbol = symbols[i];
        if (!symbol) {
            continue;
        }
        if (toAbsolute) {
            symbol = convertResourceUrl(symbol);
        }
        for (let ii = 0; ii < props.length; ii++) {
            res = symbol[props[ii]];
            if (isFunctionDefinition(res)) {
                res = getFunctionTypeResources(res);
            }
            if (!res) {
                continue;
            }
            if (!Array.isArray(res)) {
                res = [res];
            }
            for (let iii = 0; iii < res.length; iii++) {
                if (res[iii].slice(0, 4) === 'url(') {
                    res[iii] = extractCssUrl(res[iii]);
                }
                resSizeProp = RESOURCE_SIZE_PROPERTIES[ii];
                resources.push([res[iii], symbol[resSizeProp[0]], symbol[resSizeProp[1]]]);
            }
        }
        if (symbol['markerType'] === 'path' && symbol['markerPath']) {
            w = isFunctionDefinition(symbol['markerWidth']) ? 200 : symbol['markerWidth'];
            h = isFunctionDefinition(symbol['markerHeight']) ? 200 : symbol['markerHeight'];
            if (isFunctionDefinition(symbol['markerPath'])) {
                res = getFunctionTypeResources(symbol['markerPath']);
                const path = symbol['markerPath'];
                for (let iii = 0; iii < res.length; iii++) {
                    symbol['markerPath'] = res[iii];
                    resources.push([getMarkerPathBase64(symbol), w, h]);
                }
                symbol['markerPath'] = path;
            } else {
                resources.push([getMarkerPathBase64(symbol), w, h]);
            }
        }
    }
    return resources;
}

/**
 * Convert symbol's resources' urls from relative path to an absolute path.
 * @param  {Object} symbol
 * @private
 * @memberOf Util
 */
export function convertResourceUrl(symbol) {
    if (!symbol) {
        return null;
    }

    const s = symbol;
    if (IS_NODE) {
        return s;
    }
    const props = RESOURCE_PROPERTIES;
    let res;
    for (let ii = 0, len = props.length; ii < len; ii++) {
        res = s[props[ii]];
        if (!res) {
            continue;
        }
        s[props[ii]] = _convertUrlToAbsolute(res);
    }
    return s;
}

function _convertUrlToAbsolute(res) {
    if (isFunctionDefinition(res)) {
        const stops = res.stops;
        for (let i = 0; i < stops.length; i++) {
            stops[i][1] = _convertUrlToAbsolute(stops[i][1]);
        }
        return res;
    }
    const embed = 'data:';
    if (res.slice(0, 4) === 'url(') {
        res = extractCssUrl(res);
    }
    if (!isURL(res) &&
        (res.length <= embed.length || res.substring(0, embed.length) !== embed)) {
        res = _absolute(location.href, res);
    }
    return res;
}

function _absolute(base, relative) {
    const stack = base.split('/'),
        parts = relative.split('/');
    if (relative.slice(0, 1) === 0) {
        return stack.slice(0, 3).join('/') + relative;
    } else {
        stack.pop(); // remove current file name (or empty string)
        // (omit if "base" is the current folder without trailing slash)
        for (let i = 0; i < parts.length; i++) {
            if (parts[i] === '.')
                continue;
            if (parts[i] === '..')
                stack.pop();
            else
                stack.push(parts[i]);
        }
        return stack.join('/');
    }
}
