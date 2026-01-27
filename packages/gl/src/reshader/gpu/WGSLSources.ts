export const WGSL_KEY = 'maptalks_wgsl_sources';

const sources = {};

export function getWGSLSource(name) {
    return sources[name];
}

export function registerWGSLSource(name, source) {
    if (sources[name]) {
        throw new Error('WGSL source ' + name + ' has been registered already.');
    }
    return sources[name] = source;
}

const getGlobal = function () {
    if (typeof globalThis !== 'undefined') { return globalThis; }
    if (typeof self !== 'undefined') { return self; }
    if (typeof window !== 'undefined') { return window; }
    throw new Error('unable to locate global object');
};

getGlobal()[WGSL_KEY] = sources;
