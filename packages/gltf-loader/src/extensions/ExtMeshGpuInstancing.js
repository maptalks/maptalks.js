// EXT_mesh_gpu_instancing extension
// https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Vendor/EXT_mesh_gpu_instancing

export const EXT_MESH_GPU_INSTANCING = 'EXT_mesh_gpu_instancing';

/**
 * Check if node contains EXT_mesh_gpu_instancing extension
 * @param {Object} nodeJSON - glTF node JSON object
 * @returns {Object|undefined} Extension data
 */
export function getGpuInstancingExtension(nodeJSON) {
    return nodeJSON?.extensions?.[EXT_MESH_GPU_INSTANCING];
}

/**
 * Get all accessor indices that need to be loaded from GPU instancing extension
 * @param {Object} instancingExt - EXT_mesh_gpu_instancing extension object
 * @returns {Array<{name: string, accessorIndex: number}>} Array of accessor information
 */
export function collectInstancingAccessors(instancingExt) {
    if (!instancingExt?.attributes) {
        return [];
    }

    return Object.entries(instancingExt.attributes).map(([name, accessorIndex]) => ({
        name,
        accessorIndex
    }));
}
