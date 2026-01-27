// EXT_mesh_features extension
// https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_mesh_features

export const EXT_MESH_FEATURES = 'EXT_mesh_features';

/**
 * Get EXT_mesh_features extension data from primitive
 * @param {Object} primJSON - glTF primitive JSON object
 * @returns {Object|undefined} Extension data
 */
export function getMeshFeaturesExtension(primJSON) {
    return primJSON?.extensions?.[EXT_MESH_FEATURES];
}

/**
 * @deprecated Use getMeshFeaturesExtension instead
 */
export const hasMeshFeaturesExtension = getMeshFeaturesExtension;
