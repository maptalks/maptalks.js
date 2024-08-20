import { interpolated, isFunctionDefinition } from '@maptalks/function-type';
import { isExpression, createExpression, getExpressionType } from './Filter.js';
import { hasOwn } from './Util';

const feature = {};
const featureState = {};
const availableImages = [];
/**
 * Load function types defined in object
 * @param  {Object[]} parameters parameters
 * @return {Object}   loaded object
 * @memberOf MapboxUtil
 */
export function loadSymbolFnTypes(obj, argFn) {
    if (!obj) {
        return null;
    }
    var hit = false;
    if (Array.isArray(obj)) {
        var multResult = [],
            loaded;
        for (let i = 0; i < obj.length; i++) {
            loaded = loadSymbolFnTypes(obj[i], argFn);
            if (!loaded) {
                multResult.push(obj[i]);
            } else {
                multResult.push(loaded);
                hit = true;
            }
        }
        return hit ? multResult : obj;
    }
    var result = {
            '__fn_types_loaded': true
        };
    const props = [];
    for (const p in obj) {
        if (hasOwn(obj, p)) {
            props.push(p);
        }
    }

    const buildFn = function (p) {
        Object.defineProperty(result, p, {
            get: function () {
                if (!this['__fn_' + p]) {
                    this['__fn_' + p] = interpolated(this['_' + p]);
                }
                return this['__fn_' + p].apply(this, argFn());
            },
            set: function (v) {
                this['_' + p] = v;
            },
            configurable: true,
            enumerable: true
        });
    };

    const params = {};
    const buildExprFn = function (p, type) {
        Object.defineProperty(result, p, {
            get: function () {
                if (!this['__fn_' + p]) {
                    this['__fn_' + p] = createExpression(this['_' + p], type);
                }
                const zoom = argFn()[0];
                params.zoom = zoom;
                try {
                    return this['__fn_' + p].evaluateWithoutErrorHandling(params, feature, featureState, null, availableImages);
                } catch (err) {
                    return null;
                }

            },
            set: function (v) {
                this['_' + p] = v;
            },
            configurable: true,
            enumerable: true
        });
    };

    for (let i = 0, len = props.length; i < len; i++) {
        const p = props[i];
        if (isFunctionDefinition(obj[p])) {
            hit = true;
            result['_' + p] = obj[p];
            buildFn(p);
        } else if (isExpression(obj[p])) {
            hit = true;
            const type = getExpressionType(p);
            result['_' + p] = obj[p];
            buildExprFn(p, type);
        } else {
            result[p] = obj[p];
        }
    }
    return hit ? result : obj;
}
