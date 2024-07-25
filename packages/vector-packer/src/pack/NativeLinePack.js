import VectorPack from './VectorPack';
import { isClippedEdge } from './util/util';

// The number of bits that is used to store the line distance in the buffer.
const LINE_DISTANCE_BUFFER_BITS = 16;

// We don't have enough bits for the line distance as we'd like to have, so
// use this value to scale the line distance (in tile units) down to a smaller
// value. This lets us store longer distances while sacrificing precision.
const LINE_DISTANCE_SCALE = 1;

// The maximum line distance, in tile units, that fits in the buffer.
const MAX_LINE_DISTANCE = Math.pow(2, LINE_DISTANCE_BUFFER_BITS) / LINE_DISTANCE_SCALE;

/**
 * gl Native Line类型数据，负责输入feature和symbol后，生成能直接赋给shader的arraybuffer
 * 设计上能直接在worker中执行
 * 其执行过程：
 * 1. 解析features（ vt 格式, geojson-vt的feature 或 geojson ）
 * 2. 根据 symbol 设置，设置每个 feature 的 symbol (dasharray或pattern)，生成 StyledLine
 * 3. 遍历 StyledLine, 生成
 */
export default class NativeLinePack extends VectorPack {

    getFormat() {
        return [
            ...this.getPositionFormat()
            //当前点距离起点的距离
            // {
            //     type: Uint16Array,
            //     width: 1,
            //     name: 'aLinesofar'
            // }
            //TODO 动态color
        ];
    }

    placeVector(line) {
        // debugger
        const feature = line.feature,
            isPolygon = feature.type === 3, //POLYGON
            lines = feature.geometry;
        const elements = this.elements;
        if (isPolygon) {
            this.elements = this._arrayPool.get();
        }
        const positionSize = this.needAltitudeAttribute() ? 2 : 3;
        for (let i = 0; i < lines.length; i++) {
            //element offset when calling this.addElements in _addLine
            this.offset = this.data.aPosition.getLength() / positionSize;
            this._addLine(lines[i], feature);
            if (isPolygon) {
                //去掉polygon在瓦片范围外的边
                this._filterPolygonEdges(elements);
                this.elements = this._arrayPool.get();
            }
        }
        if (isPolygon) {
            this.elements = elements;
        }
    }

    _addLine(vertices, feature) {
        const isPolygon = feature.type === 3; //POLYGON

        // If the line has duplicate vertices at the ends, adjust start/length to remove them.
        let len = vertices.length;
        while (len >= 2 && vertices[len - 1].equals(vertices[len - 2])) {
            len--;
        }
        let first = 0;
        while (first < len - 1 && vertices[first].equals(vertices[first + 1])) {
            first++;
        }

        // Ignore invalid geometry.
        if (len < (isPolygon ? 3 : 2)) return;


        this.distance = 0;
        this.vertexLength = 0;
        this.primitiveLength = 0;

        let currentVertex;
        let prevVertex;
        let nextVertex;

        // the last three vertices added
        this.e1 = this.e2 = this.e3 = -1;

        if (isPolygon) {
            currentVertex = vertices[len - 2];
        }

        for (let i = first; i < len; i++) {

            nextVertex = isPolygon && i === len - 1 ?
                vertices[first + 1] : // if the line is closed, we treat the last vertex like the first
                vertices[i + 1]; // just the next vertex

            // if two consecutive vertices exist, skip the current one
            if (nextVertex && vertices[i].equals(nextVertex)) continue;

            if (currentVertex) prevVertex = currentVertex;

            currentVertex = vertices[i];


            // Calculate how far along the line the currentVertex is
            if (prevVertex) this.distance += currentVertex.dist(prevVertex);

            this.addCurrentVertex(currentVertex, this.distance);
        }
    }

    /**
     * Add two vertices to the buffers.
     *
     * @param {Object} currentVertex the line vertex to add buffer vertices for
     * @param {number} distance the distance from the beginning of the line to the vertex
     * @param {number} endLeft extrude to shift the left vertex along the line
     * @param {number} endRight extrude to shift the left vertex along the line
     * @param {boolean} round whether this is a round cap
     * @private
     */
    addCurrentVertex(currentVertex, //: Point,
        distance) {
        const e = this.vertexLength++;
        this.addLineVertex(this.data, currentVertex, distance);
        if (e >= 1) {
            this.addElements(e - 1, e);
        }
        if (distance > MAX_LINE_DISTANCE) {
            this.distance = 0;
            this.addCurrentVertex(currentVertex, this.distance);
        }
    }

    addLineVertex(data, point) {
        this.fillPosition(
            data,
            point.x,
            point.y,
            point.z || 0
        );
        this.maxPos = Math.max(this.maxPos, Math.abs(point.x), Math.abs(point.y));
    }

    addElements(e1, e2) {
        this.maxIndex = Math.max(this.maxIndex, this.offset + e1, this.offset + e2);
        let index = this.elements.currentIndex;
        this.elements[index++] = this.offset + e1;
        this.elements[index++] = this.offset + e2;
        this.elements.currentIndex = index;
    }

    _filterPolygonEdges(elements) {
        const EXTENT = this.options['EXTENT'],
            edges = this.elements;
        const count = edges.getLength();
        for (let i = 0; i < count; i += 2) {
            if (!isClippedEdge(this.data.aPosition, edges[i], edges[i + 1], 3, EXTENT)) {
                // elements.push(edges[i], edges[i + 1]);
                let index = elements.currentIndex;
                elements[index++] = edges[i];
                elements[index++] = edges[i + 1];
                elements.currentIndex = index;
            }
        }
    }

}
