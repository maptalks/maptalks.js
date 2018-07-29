import { extend, isNil, isString, isNumber, isFunction } from './Util';

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

export function evaluateSize(symbol, properties, minZoom, maxZoom) {
    let width = isNil(symbol.markerWidth) ? symbol.textSize : symbol.markerWidth,
        height = symbol.markerHeight;
    if (symbol['__fn_markerWidth'] || symbol['__fn_textSize']) {
        width = symbol['__fn_markerWidth'] || symbol['__fn_textSize'];
    }
    if (symbol['__fn_markerHeight']) {
        height = symbol['__fn_markerHeight'];
    }
    const min = [], max = [];
    if (isFunction(width)) {
        const w0 = width(minZoom, properties),
            w1 = width(maxZoom, properties);
        min[0] = Math.min(w0, w1);
        max[0] = Math.max(w0, w1);
    } else {
        min[0] = max[0] = width;
    }

    if (!isNil(symbol.textSize)) {
        min[1] = min[0];
        max[1] = max[0];
    } else if (isFunction(height)) {
        const h0 = height(minZoom, properties),
            h1 = height(maxZoom, properties);
        min[1] = Math.min(h0, h1);
        max[1] = Math.max(h0, h1);
    } else {
        min[1] = max[1] = height;
    }

    return { min, max };
}
