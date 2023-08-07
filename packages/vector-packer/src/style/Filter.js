import { createFilter, isFeatureFilter } from '@maptalks/feature-filter';
import { expression, featureFilter as createExpressionFilter } from './mapbox-gl-style-spec';
import { extend, isNil } from './Util';
const { isExpression: isMapboxExpression, createExpression: createMapboxExpression } = expression;

export function compileStyle(styles=[]) {
    styles = styles.map(s => {
        const style = extend({}, s);
        if (style.filter && style.filter.value) {
            style.filter = style.filter.value;
        }
        return style;
    });
    return compile(styles);
}

const EVALUATION_PARAM = {};

function compile(styles) {
    if (!Array.isArray(styles)) {
        return compile([styles]);
    }
    const compiled = [];
    for (let i = 0; i < styles.length; i++) {
        let filter;
        if (styles[i]['filter'] === true) {
            filter = function () { return true; };
        } else {
            filter = compileFilter(styles[i].filter);
        }
        compiled.push(extend({}, styles[i], {
            filter: filter
        }));
    }
    return compiled;
}

export function compileFilter(filterValue) {
    if (filterValue === true) {
        return function () { return true; };
    }
    if (filterValue && filterValue.condition) {
        if (filterValue.type === 'any') {
            const conditions = filterValue.condition;
            const filterFns = [];
            for (let i = 0; i < conditions.length; i++) {
                filterFns.push(compileFilter(conditions[i]));
            }
            return (feature, zoom) => {
                for (let i = 0; i < filterFns.length; i++) {
                    if (filterFns[i](feature, zoom)) {
                        return true;
                    }
                }
                return false;
            };
        }
        const filterFn = compileFilter(filterValue.condition);
        if (isNil(filterValue.layer)) {
            return filterFn;
        }
        const check = feature => {
            return feature.layer === filterValue.layer;
        };
        return (feature, zoom) => {
            return check(feature) && filterFn(feature, zoom);
        };
    }
    if (isFeatureFilter(filterValue)) {
        return createFilter(filterValue);
    } else {
        let expression = createExpressionFilter(filterValue);
        expression = expression && expression.filter;
        const filterFn = (feature, zoom) => {
            EVALUATION_PARAM.zoom = zoom;
            return expression && expression(EVALUATION_PARAM, feature);
        };
        return filterFn;
    }
}

const spec = {
    "type": "number",
    "property-type": "data-driven",
    "expression": { "parameters": ["zoom", "feature"] }
};

export function createExpression(expr, type) {
    spec.type = type || 'number';
    const result = createMapboxExpression(expr, spec);
    if (result.result !== 'success') {
        throw new Error(`Invalid maplibre spec expression: ${JSON.stringify(expr)} (${result.value})`);
    }
    return result.value;
}

export function isExpression(expr) {
    return isMapboxExpression(expr);
}

const interpolatedSymbols = {
    'lineWidth': 1,
    'lineStrokeWidth': 1,
    'lineDx': 1,
    'lineDy': 1,
    'lineOpacity': 1,
    'linePatternAnimSpeed': 1,
    'markerWidth': 1,
    'markerHeight': 1,
    'markerDx': 1,
    'markerDy': 1,
    'markerSpacing': 1,
    'markerOpacity': 1,
    'markerRotation': 1,
    'textWrapWidth': 1,
    'textSpacing': 1,
    'textSize': 1,
    'textHaloRadius': 1,
    'textHaloOpacity': 1,
    'textDx': 1,
    'textDy': 1,
    'textOpacity': 1,
    'textRotation': 1,
    'polygonOpacity': 1
};

export function isInterpolated(p) {
    return interpolatedSymbols[p];
}

const STRING_TYPES = {
    'markerPlacement': 1,
    'markerFile': 1,
    'mergeOnProperty': 1,
    'markerTextFit': 1,
    'markerType': 1,
    'markerHorizontalAlignment': 1,
    'markerVerticalAlignment': 1,
    'markerRotationAlignment': 1,
    'markerPitchAlignment': 1,
    'markerFillPatternFile': 1,
    'markerLinePatternFile': 1,
    'textName': 1,
    'textPlacement': 1,
    'textFaceName': 1,
    'textStyle': 1,
    'textHorizontalAlignment': 1,
    'textVerticalAlignment': 1,
    'textRotationAlignment': 1,
    'textPitchAlignment': 1,
    'lineJoin': 1,
    'lineCap': 1,
    'linePatternFile': 1,
    'polygonPatternFile': 1
};

const ARRAY_TYPES = {
    'lineDasharray': 1,
    'markerLineDasharray': 1,
    'uvScale': 1,
    'uvOffset': 1
};

export function getExpressionType(p) {
    if (STRING_TYPES[p]) {
        return 'string';
    } else if (isInterpolated(p)) {
        return 'number';
    } else if (ARRAY_TYPES[p]) {
        return 'array';
    } else {
        return 'color';
    }
}
