/*!
 * Codes from mapbox-gl-js
 * github.com/mapbox/mapbox-gl-js
 * MIT License
 */

/*
 * The maximum size of a vertex array. This limit is imposed by WebGL's 16 bit addressing of vertex buffers.
 */
const MAX_VERTEX_ARRAY_LENGTH = Math.pow(2, 16) - 1;

export default class SegmentVector {

    constructor(segments = []) {
        this.segments = segments;
    }

    prepareSegment(numVertices, layoutVertexArray, indexArray) {
        let segment = this.segments[this.segments.length - 1];
        if (!segment || segment.vertexLength + numVertices > MAX_VERTEX_ARRAY_LENGTH) {
            segment = {
                vertexOffset: layoutVertexArray.length,
                primitiveOffset: indexArray.length,
                vertexLength: 0,
                primitiveLength: 0
            };
            this.segments.push(segment);
        }
        return segment;
    }

    get() {
        return this.segments;
    }
}
