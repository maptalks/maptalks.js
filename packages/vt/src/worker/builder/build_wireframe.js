import { buildWireframe } from './Wireframe';

export default function (features, extent, symbol, dataConfig) {
    const frames = buildWireframe(features, extent, symbol.lineColor, symbol.lineOpacity, dataConfig);
    const { minAltitude, maxAltitude } = frames;
    delete frames.minAltitude;
    delete frames.maxAltitude;
    const buffers = [frames.aPosition.buffer, frames.indices.buffer, frames.aPickingId.buffer];
    const indices = frames.indices;
    delete frames.indices;
    return {
        data: {
            data: frames,
            properties: {
                minAltitude,
                maxAltitude
            },
            indices
        },
        buffers
    };
}
