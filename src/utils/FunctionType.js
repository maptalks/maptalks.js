(function ()  {

    function createFunction(parameters, defaultType) {
        var fun;

        if (!isFunctionDefinition(parameters)) {
            fun = function() { return parameters; };
            fun.isFeatureConstant = true;
            fun.isZoomConstant = true;

        } else {
            var zoomAndFeatureDependent = typeof parameters.stops[0][0] === 'object';
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
            } else {
                throw new Error('Unknown function type "' + type + '"');
            }

            if (zoomAndFeatureDependent) {
                var featureFunctions = {};
                var featureFunctionStops = [];
                for (var s = 0; s < parameters.stops.length; s++) {
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

                for (var z in featureFunctions) {
                    featureFunctionStops.push([featureFunctions[z].zoom, createFunction(featureFunctions[z])]);
                }
                fun = function(zoom, feature) {
                    return evaluateExponentialFunction({ stops: featureFunctionStops, base: parameters.base }, zoom)(zoom, feature);
                };
                fun.isFeatureConstant = false;
                fun.isZoomConstant = false;

            } else if (zoomDependent) {
                fun = function(zoom) {
                    return innerFun(parameters, zoom);
                };
                fun.isFeatureConstant = true;
                fun.isZoomConstant = false;
            } else {
                fun = function(zoom, feature) {
                    return innerFun(parameters, feature[parameters.property]);
                };
                fun.isFeatureConstant = false;
                fun.isZoomConstant = true;
            }
        }

        return fun;
    }

    function evaluateCategoricalFunction(parameters, input) {
        for (var i = 0; i < parameters.stops.length; i++) {
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


    function interpolate(input, base, inputLower, inputUpper, outputLower, outputUpper) {
        if (typeof outputLower === 'function') {
            return function() {
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
        for (var i = 0; i < outputLower.length; i++) {
            output[i] = interpolateNumber(input, base, inputLower, inputUpper, outputLower[i], outputUpper[i]);
        }
        return output;
    }

    function isFunctionDefinition(value) {
        return value && typeof value === 'object' && value.stops;
    }


    maptalks.Util.isFunctionDefinition = isFunctionDefinition;

    maptalks.Util.interpolated = function(parameters) {
        return createFunction(parameters, 'exponential');
    };

    maptalks.Util['piecewise-constant'] = function(parameters) {
        return createFunction(parameters, 'interval');
    };

    maptalks.Util.loadFunctionTypes = function (obj, argFn) {
        if (!obj) {
            return null;
        }
        var hit = false;
        if (maptalks.Util.isArray(obj)) {
            var multResult = [],
                loaded;
            for (var i = 0; i < obj.length; i++) {
                loaded = maptalks.Util.loadFunctionTypes(obj[i], argFn);
                if (!loaded) {
                    multResult.push(obj[i]);
                } else {
                    multResult.push(loaded);
                    hit = true;
                }
            }
            return hit ? multResult : null;
        }
        var result = {},
            props = [], p;
        for (p in obj) {
            if (obj.hasOwnProperty(p)) {
                props.push(p);
            }
        }

        for (var i = 0, len = props.length; i < len; i++) {
            p = props[i];
            if (maptalks.Util.isFunctionDefinition(obj[p])) {
                hit = true;
                result['_' + p] = obj[p];
                (function (_p) {
                    Object.defineProperty(result, _p, {
                        get: function () {
                            if (!this['__fn_' + _p]) {
                                this['__fn_' + _p] = maptalks.Util.interpolated(this['_' + _p]);
                            }
                            return this['__fn_' + _p].apply(this, argFn());
                        },
                        set: function (v) {
                            this['_' + _p] = v;
                        },
                        configurable : true,
                        enumerable : true
                    });
                })(p);
            } else {
                result[p] = obj[p];
            }
        }
        return hit ? result : null;
    };

    maptalks.Util.getFunctionTypeResources = function (t) {
        if (!t || !t.stops) {
            return null;
        }
        var res = [];
        for (var i = 0, l = t.stops.length; i < l; i++) {
            res.push(t.stops[i][1]);
        }
        return res;
    }

})();
