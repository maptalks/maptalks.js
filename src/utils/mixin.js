/**
 * implement of mixin
 * @author yellow 2017/5/8
 * @example 
 * class DistributedEdit extends mix(Loggable, Serializable) { }
 */
let copyProperties = function (target, source) {
    for (let key of Reflect.ownKeys(source)) {
        if (key !== "constructor"
            && key !== "prototype"
            && key !== "name"
        ) {
            let desc = Object.getOwnPropertyDescriptor(source, key);
            Object.defineProperty(target, key, desc);
        }
    }
}

let mix = function (...mixins) {
    class Mix { }

    for (let mixin of mixins) {
        copyProperties(Mix, mixin);
        copyProperties(Mix.prototype, mixin.prototype);
    }
    return Mix;
}