import { buildWireframe } from './Wireframe';

export default function (features, dataConfig, extent) {
    const frames = buildWireframe(features, extent, dataConfig);
    const buffers = [frames.vertices.buffer, frames.indices.buffer, frames.featureIndexes.buffer];
    return {
        data : frames,
        buffers
    };
}
