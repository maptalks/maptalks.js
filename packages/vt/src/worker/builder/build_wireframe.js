import { buildWireframe } from './Wireframe';

export default function (features, dataConfig, extent) {
    const frames = buildWireframe(features, extent, dataConfig);
    const buffers = [frames.aPosition.buffer, frames.indices.buffer, frames.aPickingId.buffer];
    const indices = frames.indices;
    delete frames.indices;
    return {
        data : {
            data: frames,
            indices
        },
        buffers
    };
}
