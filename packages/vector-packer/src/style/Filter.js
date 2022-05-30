import { createFilter } from '@maptalks/feature-filter';
import { expression, featureFilter as createExpressionFilter } from '@mapbox/mapbox-gl-style-spec';
import { extend, isNil } from './Util';
const { isExpressionFilter } = expression;

export function compileStyle(styles) {
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
            return feature => {
                for (let i = 0; i < filterFns.length; i++) {
                    if (filterFns[i](feature)) {
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
        return feature => {
            return check(feature) && filterFn(feature);
        };
    }
    if (isExpressionFilter(filterValue)) {
        let expression = createExpressionFilter(filterValue);
        expression = expression && expression.filter;
        const filterFn = feature => {
            return expression && expression(EVALUATION_PARAM, feature);
        };
        return filterFn;
    } else {
        return createFilter(filterValue);
    }
}
