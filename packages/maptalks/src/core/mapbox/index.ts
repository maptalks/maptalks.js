import { loadFunctionTypes, isFunctionDefinition, getFunctionTypeResources, interpolated, hasFunctionDefinition } from '@maptalks/function-type';
import { compileStyle, isFeatureFilter, createFilter, getFilterFeature } from '@maptalks/feature-filter';
import { extend } from '../util/common';

/**
 * @classdesc
 * Utilities from mapbox or implementations of mapbox specifications. It is static and should not be initiated.
 * @class
 * @category core
 * @name MapboxUtil
 */

// export * from '@maptalks/feature-filter';
export { loadFunctionTypes, isFunctionDefinition, getFunctionTypeResources, interpolated, hasFunctionDefinition }

const arr = [],
    prop = {};
export function loadGeoSymbol(symbol, geo): any {
    return loadFunctionTypes(symbol, () => {
        const map = geo.getMap();
        const bearing = map && map.getBearing() || 0;
        const pitch = map && map.getPitch();
        const zoom = map ? map.getZoom() : 10;
        let changed = false;
        geo._funTypeProperties = geo._funTypeProperties || {};
        //geo update properties,reset
        if (geo.propertiesDirty) {
            geo._funTypeProperties = {};
            geo.propertiesDirty = false;
            changed = true;
        } else {
            //map camera change
            const funTypeProperties = geo._funTypeProperties;
            changed = (funTypeProperties['{bearing}'] !== bearing || funTypeProperties['{pitch}'] !== pitch || funTypeProperties['{zoom}'] !== zoom);
        }
        let mergeProperties = geo._funTypeProperties;
        if (changed) {
            mergeProperties = extend(mergeProperties || {}, geo.getProperties(), setProp(prop, map && map.getBearing() || 0, map && map.getPitch() || 0, map ? map.getZoom() : 10));
        }
        return set(arr, map ? map.getZoom() : 12, mergeProperties);
    });
}

function set(arr: any, a0: any, a1: any): any {
    arr[0] = a0;
    arr[1] = a1;
    return arr;
}

function setProp(prop: any, b: any, p: any, z: any): any {
    prop['{bearing}'] = b;
    prop['{pitch}'] = p;
    prop['{zoom}'] = z;
    return prop;
}

export {
    compileStyle, isFeatureFilter, createFilter, getFilterFeature
}
