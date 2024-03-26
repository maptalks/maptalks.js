import { loadFunctionTypes } from '@maptalks/function-type';
import { extend } from '../util/common';

/**
 * @classdesc
 * Utilities from mapbox or implementations of mapbox specifications. It is static and should not be initiated.
 * @class
 * @category core
 * @name MapboxUtil
 */

export * from '@maptalks/feature-filter';
export * from '@maptalks/function-type';

const arr = [],
    prop = {};
export function loadGeoSymbol(symbol, geo) {
    return loadFunctionTypes(symbol, () => {
        const map = geo.getMap();
        return set(arr, map ? map.getZoom() : 12,
            extend({},
                geo.getProperties(),
                setProp(prop, map && map.getBearing() || 0, map && map.getPitch() || 0, map ? map.getZoom() : 10)
            )
        );
    });
}

function set(arr: any[], a0: any, a1: any) {
    arr[0] = a0;
    arr[1] = a1;
    return arr;
}

function setProp(prop: any, b: number, p: number, z: number) {
    prop['{bearing}'] = b;
    prop['{pitch}'] = p;
    prop['{zoom}'] = z;
    return prop;
}
