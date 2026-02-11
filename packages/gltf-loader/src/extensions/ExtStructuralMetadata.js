// EXT_structural_metadata extension
// https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_structural_metadata

export const EXT_STRUCTURAL_METADATA = 'EXT_structural_metadata';

/**
 * Extract EXT_structural_metadata extension data from gltf
 * Returns data structure needed for constructing the plugin
 *
 * @param {Object} gltf - Original gltf json
 * @param {Array} buffers - ArrayBuffer array of property table data (indexed by bufferView)
 * @param {String} rootPath - Root path where gltf file is located
 * @param {Object} fetchOptions - Fetch request options
 * @param {Function} urlModifier - URL modifier function
 * @returns {Promise<Object|null>} Extension data, including schema, propertyTables, buffers
 */
export async function getStructuralMetadataData(gltf, buffers, rootPath, fetchOptions, urlModifier, fetchSchema) {
    const ext = gltf?.extensions?.[EXT_STRUCTURAL_METADATA];
    if (!ext) {
        return null;
    }

    // If schemaUri exists, request external schema
    if (ext.schemaUri) {
        let url = ext.schemaUri;
        // Handle relative path
        if (!url.includes('://') && !url.startsWith('blob:')) {
            url = rootPath + url;
        }
        const schema = await fetchSchema(url, fetchOptions, urlModifier);
        return {
            schema,
            propertyTables: ext.propertyTables || [],
            buffers
        };
    }

    // Use inline schema directly
    return {
        schema: ext.schema,
        propertyTables: ext.propertyTables || [],
        buffers
    };
}

/**
 * Collect bufferView indices that need to be loaded for propertyTables
 *
 * @param {Array} propertyTables - Array of property table definitions
 * @returns {Set} Set of bufferView indices to load
 */
export function collectPropertyTableBufferViews(propertyTables) {
    const bufferViewsToLoad = new Set();
    if (!propertyTables) {
        return bufferViewsToLoad;
    }

    for (const table of propertyTables) {
        const props = table.properties;
        if (!props) {
            continue;
        }
        for (const prop of Object.values(props)) {
            if (prop.values !== undefined) bufferViewsToLoad.add(prop.values);
            if (prop.arrayOffsets !== undefined) bufferViewsToLoad.add(prop.arrayOffsets);
            if (prop.stringOffsets !== undefined) bufferViewsToLoad.add(prop.stringOffsets);
        }
    }

    return bufferViewsToLoad;
}
