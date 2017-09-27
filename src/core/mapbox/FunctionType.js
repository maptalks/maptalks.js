/*eslint-disable no-var, prefer-const*/
function createFunction(parameters, defaultType) {
    var fun;

    if (!isFunctionDefinition(parameters)) {
        fun = function () { return parameters; };
        fun.isFeatureConstant = true;
        fun.isZoomConstant = true;

    } else {
        var zoomAndFeatureDependent = parameters.stops && typeof parameters.stops[0][0] === 'object';
        var featureDependent = zoomAndFeatureDependent || parameters.property !== undefined;
        var zoomDependent = zoomAndFeatureDependent || !featureDependent;
        var type = parameters.type || defaultType || 'exponential';

        var innerFun;
        if (type === 'exponential') {
            innerFun = evaluateExponentialFunction;
        } else if (type === 'interval') {
            innerFun = evaluateIntervalFunction;
        } else if (type === 'categorical') {
            innerFun = evaluateCategoricalFunction;
        } else if (type === 'identity') {
            innerFun = evaluateIdentityFunction;
        } else {
            throw new Error('Unknown function type "' + type + '"');
        }

        if (zoomAndFeatureDependent) {
            var featureFunctions = {};
            var featureFunctionStops = [];
            for (let s = 0; s < parameters.stops.length; s++) {
                var stop = parameters.stops[s];
                if (featureFunctions[stop[0].zoom] === undefined) {
                    featureFunctions[stop[0].zoom] = {
                        zoom: stop[0].zoom,
                        type: parameters.type,
                        property: parameters.property,
                        stops: []
                    };
                }
                featureFunctions[stop[0].zoom].stops.push([stop[0].value, stop[1]]);
            }

            for (let z in featureFunctions) {
                featureFunctionStops.push([featureFunctions[z].zoom, createFunction(featureFunctions[z])]);
            }
            fun = function (zoom, feature) {
                return evaluateExponentialFunction({ stops: featureFunctionStops, base: parameters.base }, zoom)(zoom, feature);
            };
            fun.isFeatureConstant = false;
            fun.isZoomConstant = false;

        } else if (zoomDependent) {
            fun = function (zoom) {
                return innerFun(parameters, zoom);
            };
            fun.isFeatureConstant = true;
            fun.isZoomConstant = false;
        } else {
            fun = function (zoom, feature) {
                return innerFun(parameters, feature[parameters.property]);
            };
            fun.isFeatureConstant = false;
            fun.isZoomConstant = true;
        }
    }

    return fun;
}

function evaluateCategoricalFunction(parameters, input) {
    for (let i = 0; i < parameters.stops.length; i++) {
        if (input === parameters.stops[i][0]) {
            return parameters.stops[i][1];
        }
    }
    return parameters.stops[0][1];
}

function evaluateIntervalFunction(parameters, input) {
    for (var i = 0; i < parameters.stops.length; i++) {
        if (input < parameters.stops[i][0]) break;
    }
    return parameters.stops[Math.max(i - 1, 0)][1];
}

function evaluateExponentialFunction(parameters, input) {
    var base = parameters.base !== undefined ? parameters.base : 1;

    var i = 0;
    while (true) {
        if (i >= parameters.stops.length) break;
        else if (input <= parameters.stops[i][0]) break;
        else i++;
    }

    if (i === 0) {
        return parameters.stops[i][1];

    } else if (i === parameters.stops.length) {
        return parameters.stops[i - 1][1];

    } else {
        return interpolate(
            input,
            base,
            parameters.stops[i - 1][0],
            parameters.stops[i][0],
            parameters.stops[i - 1][1],
            parameters.stops[i][1]
        );
    }
}

function evaluateIdentityFunction(parameters, input) {
    return input;
}

function interpolate(input, base, inputLower, inputUpper, outputLower, outputUpper) {
    if (typeof outputLower === 'function') {
        return function () {
            var evaluatedLower = outputLower.apply(undefined, arguments);
            var evaluatedUpper = outputUpper.apply(undefined, arguments);
            return interpolate(input, base, inputLower, inputUpper, evaluatedLower, evaluatedUpper);
        };
    } else if (outputLower.length) {
        return interpolateArray(input, base, inputLower, inputUpper, outputLower, outputUpper);
    } else {
        return interpolateNumber(input, base, inputLower, inputUpper, outputLower, outputUpper);
    }
}

function interpolateNumber(input, base, inputLower, inputUpper, outputLower, outputUpper) {
    var difference =  inputUpper - inputLower;
    var progress = input - inputLower;

    var ratio;
    if (base === 1) {
        ratio = progress / difference;
    } else {
        ratio = (Math.pow(base, progress) - 1) / (Math.pow(base, difference) - 1);
    }

    return (outputLower * (1 - ratio)) + (outputUpper * ratio);
}

function interpolateArray(input, base, inputLower, inputUpper, outputLower, outputUpper) {
    var output = [];
    for (let i = 0; i < outputLower.length; i++) {
        output[i] = interpolateNumber(input, base, inputLower, inputUpper, outputLower[i], outputUpper[i]);
    }
    return output;
}

/**
 * Check if object is a definition of function type
 * @param  {Object}  obj object
 * @return {Boolean}
 * @memberOf MapboxUtil
 */
export function isFunctionDefinition(obj) {
    return obj && typeof obj === 'object' && (obj.stops || obj.property && obj.type === 'identity');
}

/**
 * Check if obj's properties has function definition
 * @param  {Object}  obj object to check
 * @return {Boolean}
 * @memberOf MapboxUtil
 */
export function hasFunctionDefinition(obj) {
    for (const p in obj) {
        if (isFunctionDefinition(obj[p])) {
            return true;
        }
    }
    return false;
}

export function interpolated(parameters) {
    return createFunction(parameters, 'exponential');
}


export function piecewiseConstant(parameters) {
    return createFunction(parameters, 'interval');
}

/**
 * Load function types defined in object
 * @param  {Object[]} parameters parameters
 * @return {Object}   loaded object
 * @memberOf MapboxUtil
 */
export function loadFunctionTypes(obj, argFn) {
    if (!obj) {
        return null;
    }
    var hit = false;
    if (Array.isArray(obj)) {
        var multResult = [],
            loaded;
        for (let i = 0; i < obj.length; i++) {
            loaded = loadFunctionTypes(obj[i], argFn);
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
            '__fn_types_loaded' : true
        },
        props = [],
        p;
    for (p in obj) {
        if (obj.hasOwnProperty(p)) {
            props.push(p);
        }
    }

    for (let i = 0, len = props.length; i < len; i++) {
        p = props[i];
        if (isFunctionDefinition(obj[p])) {
            hit = true;
            result['_' + p] = obj[p];
            (function (_p) {
                Object.defineProperty(result, _p, {
                    get: function () {
                        if (!this['__fn_' + _p]) {
                            this['__fn_' + _p] = interpolated(this['_' + _p]);
                        }
                        return this['__fn_' + _p].apply(this, argFn());
                    },
                    set: function (v) {
                        this['_' + _p] = v;
                    },
                    configurable: true,
                    enumerable: true
                });
            })(p);
        } else {
            result[p] = obj[p];
        }
    }
    return hit ? result : obj;
}

/**
 * Get external resources in the function type
 * @param  {Object} t Function type definition
 * @return {String[]}   resouces
 * @memberOf MapboxUtil
 */
export function getFunctionTypeResources(t) {
    if (!t || !t.stops) {
        return [];
    }
    const res = [];
    for (let i = 0, l = t.stops.length; i < l; i++) {
        res.push(t.stops[i][1]);
    }
    return res;
}
/*eslint-enable no-var, prefer-const*/
