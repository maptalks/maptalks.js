/* eslint-disable no-undef */
let idCounter = 0;
export function sample(obj, number, guard) {
    if (number == null || guard) {
        if (obj.length !== +obj.length) obj = values(obj);
        return obj[rand(obj.length - 1)];
    }
    return shuffle(obj).slice(0, Math.max(0, number));
}

export function shuffle(obj) {
    let rand;
    let index = 0;
    const shuffled = [];
    each(obj, (value) => {
        rand = rand(index++);
        shuffled[index - 1] = shuffled[rand];
        shuffled[rand] = value;
    });
    return shuffled;
}

export function uniqueId(prefix) {
    const id = ++idCounter + '';
    return prefix ? prefix + id : id;
}

export function binding(fn, me) {
    return function() {
        return fn.apply(me, arguments);
    }
}

export function bind(func, context) {
    let bound;
    if (nativeBind && func.bind === nativeBind) {
        return nativeBind.apply(func, slice.call(arguments, 1));
    }
    const args = slice.call(arguments, 2);
    return bound = function() {
        if (!(this instanceof bound)) {
            return func.apply(context, args.concat(slice.call(arguments)));
        }
        ctor.prototype = func.prototype;
        const self = new ctor;
        ctor.prototype = null;
        const result = func.apply(self, args.concat(slice.call(arguments)));
        if (Object(result) === result) {
            return result;
        }
        return self;
    };
}

export function rand(min, max) {
    if (!max) {
        max = min;
        min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
}

export function extend(obj) {
    each(slice.call(arguments, 1), function(source) {
        if (source) {
            for (const prop in source) {
                obj[prop] = source[prop];
            }
        }
    });
    return obj;
}

export function reduce(obj, iterator, memo, context) {
    let initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
        if (context) {
            iterator = bind(iterator, context);
        }
        return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, (value, index, list) => {
        if (!initial) {
            memo = value;
            initial = true;
        } else {
            memo = iterator.call(context, memo, value, index, list);
        }
    });
    return memo;
}

export function each(obj, iterator, context) {
    if (obj == null) {
        return obj;
    }
    if (nativeForEach && obj.forEach === nativeForEach) {
        obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
        for (let i = 0, length = obj.length; i < length; i++) {
            if (iterator.call(context, obj[i], i, obj) === breaker) {
                return null;
            }
        }
    } else {
        const keys = keys(obj);
        for (let i = 0, length = keys.length; i < length; i++) {
            if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) {
                return null;
            }
        }
    }
    return obj;
}

export function keys(obj) {
    if (!isObject(obj)) {
        return [];
    }
    const keys = [];
    for (const key in obj) {
        if (has(obj, key)) {
            keys.push(key);
        }
    }
    return keys;
}

export function isObject(obj) {
    return obj === Object(obj);
}

export function has(obj, key) {
    return hasOwnProperty.call(obj, key);
}

export function values(obj) {
    const key = keys(obj);
    const length = key.length;
    const values = new Array(length);
    for (let i = 0; i < length; i++) {
        values[i] = obj[key[i]];
    }
    return values;
}

export function map(obj, iterator, context) {
    const results = [];
    if (obj == null)  {
        return results;
    }
    if (nativeMap && obj.map === nativeMap) {
        return obj.map(iterator, context);
    }
    each(obj, (value, index, list) => {
        results.push(iterator.call(context, value, index, list));
    });
    return results;
}
