// import VectorPack from './VectorPack';
import StyledVector from './StyledVector';
import VectorPack from './VectorPack';
import { interpolated, piecewiseConstant } from '@maptalks/function-type';
import Color from 'color';
import { isFnTypeSymbol } from '../style/Util';

// NOTE ON EXTRUDE SCALE:
// scale the extrusion vector so that the normal length is this value.
// contains the "texture" normals (-1..1). this is distinct from the extrude
// normals for line joins, because the x-value remains 0 for the texture
// normal array, while the extrude normal actually moves the vertex to create
// the acute/bevelled line join.
export const EXTRUDE_SCALE = 63;

/*
 * Sharp corners cause dashed lines to tilt because the distance along the line
 * is the same at both the inner and outer corners. To improve the appearance of
 * dashed lines we add extra points near sharp corners so that a smaller part
 * of the line is tilted.
 *
 * COS_HALF_SHARP_CORNER controls how sharp a corner has to be for us to add an
 * extra vertex. The default is 75 degrees.
 *
 * The newly created vertices are placed SHARP_CORNER_OFFSET pixels from the corner.
 */
// const COS_HALF_SHARP_CORNER = Math.cos(75 / 2 * (Math.PI / 180));
// const SHARP_CORNER_OFFSET = 15;



// The number of bits that is used to store the line distance in the buffer.
const LINE_DISTANCE_BUFFER_BITS = 16;

// We don't have enough bits for the line distance as we'd like to have, so
// use this value to scale the line distance (in tile units) down to a smaller
// value. This lets us store longer distances while sacrificing precision.
const LINE_DISTANCE_SCALE = 1;

// The maximum line distance, in tile units, that fits in the buffer.
const MAX_LINE_DISTANCE = Math.pow(2, LINE_DISTANCE_BUFFER_BITS) / LINE_DISTANCE_SCALE;

/**
 * 线类型数据，负责输入feature和symbol后，生成能直接赋给shader的arraybuffer
 * 设计上能直接在worker中执行
 * 其执行过程：
 * 1. 解析features（ vt 格式, geojson-vt的feature 或 geojson ）
 * 2. 根据 symbol 设置，设置每个 feature 的 symbol (dasharray或pattern)，生成 StyledLine
 * 3. 遍历 StyledLine, 生成
 */
export default class LinePack extends VectorPack {

    constructor(features, symbol, options) {
        super(features, symbol, options);
        if (isFnTypeSymbol('lineWidth', this.symbolDef)) {
            this._lineWidthFn = interpolated(this.symbolDef['lineWidth']);
        }
        if (isFnTypeSymbol('lineColor', this.symbolDef)) {
            this._colorFn = piecewiseConstant(this.symbolDef['lineColor']);
        }
    }

    createStyledVector(feature, symbol, options, iconReqs) {
        if (symbol['linePatternFile']) {
            iconReqs[symbol['linePatternFile']] = 'resize';
        }
        return new StyledVector(feature, symbol, options);
    }

    getFormat() {
        const format = [
            {
                type: Int16Array,
                width: this.positionSize,
                name: 'aPosition'
            },
            //当前点距离aPos的凸起方向
            {
                type: Int8Array,
                width: 2,
                name: 'aExtrude'
            },
            //当前点距离起点的距离
            {
                type: Uint16Array,
                width: 1,
                name: 'aLinesofar'
            }
        ];
        if (this._lineWidthFn) {
            format.push(
                {
                    type: Uint8Array,
                    width: 1,
                    name: 'aLineWidth'
                }
            );
        }
        if (this._colorFn) {
            format.push(
                {
                    type: Uint8Array,
                    width: 4,
                    name: 'aColor'
                }
            );
        }
        if (this.symbol['lineOffset']) {
            format.push(
                {
                    type: Int8Array,
                    width: 2,
                    name: 'aExtrudeOffset'
                }
            );
        }
        return format;
    }

    placeVector(line) {
        const symbol = line.symbol,
            join = symbol['lineJoin'] || 'miter', //bevel, miter, round
            cap = symbol['lineCap'] || 'butt', //butt, round, square
            miterLimit = 2,
            roundLimit = 1.05;
        const feature = line.feature,
            isPolygon = feature.type === 3, //POLYGON
            lines = feature.geometry;
        const elements = this.elements;
        if (isPolygon) {
            //Polygon时，需要遍历elements，去掉(filter)瓦片范围外的edge
            //所以this.elements只会存放当前line的elements，方便filter处理
            this.elements = [];
        }
        if (this._lineWidthFn) {
            // {
            //     lineWidth: {
            //         property: 'type',
            //         stops: [1, { stops: [[2, 3], [3, 4]] }]
            //     }
            // }
            this._feaLineWidth = this._lineWidthFn(this.options['zoom'], feature.properties) || 0;
        } else {
            this._feaLineWidth = this.symbol['lineWidth'];
        }
        if (this._colorFn) {
            this._feaColor = this._colorFn(this.options['zoom'], feature.properties) || [0, 0, 0, 0];
            if (!Array.isArray(this._feaColor)) {
                this._feaColor = Color(this._feaColor).array();
            }
            if (this._feaColor.length === 3) {
                this._feaColor.push(255);
            }
        }
        for (let i = 0; i < lines.length; i++) {
            //element offset when calling this.addElements in _addLine
            this.offset = this.data.length / this.formatWidth;
            let line = lines[i];
            if (!isPolygon) {
                line = this._filterLine(line);
            }
            this._addLine(line, feature, join, cap, miterLimit, roundLimit);
            if (isPolygon) {
                this._filterPolygonEdges(elements);
                this.elements = [];
            }
        }
        if (isPolygon) {
            this.elements = elements;
        }
    }

    _addLine(vertices, feature, join, cap, miterLimit, roundLimit) {
        const needExtraVertex = this.symbol['linePatternFile'] || hasDasharray(this.symbol['lineDasharray']);
        const tileRatio = this.options.tileRatio;
        //TODO overscaling的含义？
        const EXTENT = this.options.EXTENT;
        //     overscaling = 1;
        let lineDistances = null;
        //只有有gradient才会scaleDistance，把 linesofar 从实际距离转化到 0-2^15
        if (!!this.symbol['lineGradientProperty'] &&
            !!feature.properties &&
            feature.properties.hasOwnProperty('mapbox_clip_start') &&
            feature.properties.hasOwnProperty('mapbox_clip_end')) {
            lineDistances = {
                start: feature.properties.mapbox_clip_start,
                end: feature.properties.mapbox_clip_end,
                tileTotal: undefined
            };
        }



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

        if (lineDistances) {
            lineDistances.tileTotal = calculateFullDistance(vertices, first, len);
        }

        if (join === 'bevel') miterLimit = 1.05;

        // const sharpCornerOffset = SHARP_CORNER_OFFSET * (EXTENT / (512 * overscaling));

        const firstVertex = vertices[first];

        // we could be more precise, but it would only save a negligible amount of space
        // const segment = this.segments.prepareSegment(len * 10, this.layoutVertexArray, this.indexArray);

        this.distance = 0;
        this.vertexLength = 0;
        this.primitiveLength = 0;

        const beginCap = cap,
            endCap = isPolygon ? 'butt' : cap;
        let startOfLine = true;
        let currentVertex;
        let prevVertex;
        let nextVertex;
        let prevNormal;
        let nextNormal;
        let offsetA;
        let offsetB;

        // the last three vertices added
        this.e1 = this.e2 = this.e3 = -1;

        if (isPolygon) {
            currentVertex = vertices[len - 2];
            nextNormal = firstVertex.sub(currentVertex)._unit()._perp();
        }

        for (let i = first; i < len; i++) {

            nextVertex = isPolygon && i === len - 1 ?
                vertices[first + 1] : // if the line is closed, we treat the last vertex like the first
                vertices[i + 1]; // just the next vertex

            // if two consecutive vertices exist, skip the current one
            if (nextVertex && vertices[i].equals(nextVertex)) continue;

            if (nextNormal) prevNormal = nextNormal;
            if (currentVertex) prevVertex = currentVertex;

            currentVertex = vertices[i];

            // Calculate the normal towards the next vertex in this line. In case
            // there is no next vertex, pretend that the line is continuing straight,
            // meaning that we are just using the previous normal.
            nextNormal = nextVertex ? nextVertex.sub(currentVertex)._unit()._perp() : prevNormal;

            // If we still don't have a previous normal, this is the beginning of a
            // non-closed line, so we're doing a straight "join".
            prevNormal = prevNormal || nextNormal;

            // Determine the normal of the join extrusion. It is the angle bisector
            // of the segments between the previous line and the next line.
            // In the case of 180° angles, the prev and next normals cancel each other out:
            // prevNormal + nextNormal = (0, 0), its magnitude is 0, so the unit vector would be
            // undefined. In that case, we're keeping the joinNormal at (0, 0), so that the cosHalfAngle
            // below will also become 0 and miterLength will become Infinity.
            let joinNormal = prevNormal.add(nextNormal);
            if (joinNormal.x !== 0 || joinNormal.y !== 0) {
                joinNormal._unit();
            }
            /*  joinNormal     prevNormal
             *             ↖      ↑
             *                .________. prevVertex
             *                |
             * nextNormal  ←  |  currentVertex
             *                |
             *     nextVertex !
             *
             */

            // Calculate the length of the miter (the ratio of the miter to the width).
            // Find the cosine of the angle between the next and join normals
            // using dot product. The inverse of that is the miter length.
            const cosHalfAngle = joinNormal.x * nextNormal.x + joinNormal.y * nextNormal.y;
            const sinHalfAngle = Math.sqrt(1 - cosHalfAngle * cosHalfAngle);
            const tanHalfAngle = sinHalfAngle / cosHalfAngle;
            const miterLength = cosHalfAngle !== 0 ? 1 / cosHalfAngle : Infinity;

            // const isSharpCorner = cosHalfAngle < COS_HALF_SHARP_CORNER && prevVertex && nextVertex;
            // if (needExtraVertex) {

            // if (isSharpCorner && i > first) {
            //     const prevSegmentLength = currentVertex.dist(prevVertex);
            //     if (prevSegmentLength > 2 * sharpCornerOffset) {
            //         const newPrevVertex = currentVertex.sub(currentVertex.sub(prevVertex)._mult(sharpCornerOffset / prevSegmentLength)._round());
            //         this.distance += newPrevVertex.dist(prevVertex);
            //         this.addCurrentVertex(newPrevVertex, this.distance, prevNormal.mult(1), 0, 0, false, lineDistances);
            //         prevVertex = newPrevVertex;
            //     }
            // }
            // }

            // The join if a middle vertex, otherwise the cap.
            const middleVertex = prevVertex && nextVertex;
            let currentJoin = middleVertex ? join : nextVertex ? beginCap : endCap;

            if (middleVertex && currentJoin === 'round') {
                if (miterLength < roundLimit) {
                    currentJoin = 'miter';
                } else if (miterLength <= 2) {
                    currentJoin = 'fakeround';
                }
            }

            if (currentJoin === 'miter' && miterLength > miterLimit) {
                currentJoin = 'bevel';
            }

            if (currentJoin === 'bevel') {
                // The maximum extrude length is 128 / 63 = 2 times the width of the line
                // so if miterLength >= 2 we need to draw a different type of bevel here.
                if (miterLength > 2) currentJoin = 'flipbevel';

                // If the miterLength is really small and the line bevel wouldn't be visible,
                // just draw a miter join to save a triangle.
                if (miterLength < miterLimit) currentJoin = 'miter';
            }

            // Calculate how far along the line the currentVertex is
            if (prevVertex) this.distance += currentVertex.dist(prevVertex);
            let distanceChanged = false;
            if (i > first && i < len - 1) {
                //前一个端点在瓦片外时，额外增加一个端点，以免因为join和端点共用aPosition，瓦片内的像素会当做超出瓦片而被discard
                if (needExtraVertex || prevVertex && outOfExtent(prevVertex, EXTENT)) {
                    //back不能超过normal的x或者y，否则会出现绘制错误
                    const back = Math.min(prevNormal.mag() * tanHalfAngle, Math.abs(prevNormal.x), Math.abs(prevNormal.y));
                    const backDist = back * this._feaLineWidth / 2 * tileRatio;
                    if (backDist < this.distance) {
                        this.distance -= backDist;
                        distanceChanged = true;
                    }
                    //为了实现dasharray，需要在join前后添加两个新端点，以保证计算dasharray时，linesofar的值是正确的
                    this.addCurrentVertex(currentVertex, this.distance, prevNormal, -back, -back, false, lineDistances);
                }
            }

            if (currentJoin === 'miter') {

                joinNormal._mult(miterLength);
                // this.distance += this._feaLineWidth * tileRatio * sinHalfAngle;
                this.addCurrentVertex(currentVertex, this.distance, joinNormal, 0, 0, false, lineDistances);

            } else if (currentJoin === 'flipbevel') {
                // miter is too big, flip the direction to make a beveled join

                if (miterLength > 100) {
                    // Almost parallel lines
                    joinNormal = nextNormal.clone().mult(-1);

                } else {
                    const direction = prevNormal.x * nextNormal.y - prevNormal.y * nextNormal.x > 0 ? -1 : 1;
                    const bevelLength = miterLength * prevNormal.add(nextNormal).mag() / prevNormal.sub(nextNormal).mag();
                    joinNormal._perp()._mult(bevelLength * direction);
                }
                this.addCurrentVertex(currentVertex, this.distance, joinNormal, 0, 0, false, lineDistances);
                this.addCurrentVertex(currentVertex, this.distance, joinNormal.mult(-1), 0, 0, false, lineDistances);

            } else if (currentJoin === 'bevel' || currentJoin === 'fakeround') {
                const lineTurnsLeft = (prevNormal.x * nextNormal.y - prevNormal.y * nextNormal.x) > 0;
                const offset = -Math.sqrt(miterLength * miterLength - 1);
                if (lineTurnsLeft) {
                    offsetB = 0;
                    offsetA = offset;
                } else {
                    offsetA = 0;
                    offsetB = offset;
                }

                // Close previous segment with a bevel
                if (!startOfLine) {
                    this.addCurrentVertex(currentVertex, this.distance, prevNormal, offsetA, offsetB, false, lineDistances);
                }

                if (currentJoin === 'fakeround') {
                    // The join angle is sharp enough that a round join would be visible.
                    // Bevel joins fill the gap between segments with a single pie slice triangle.
                    // Create a round join by adding multiple pie slices. The join isn't actually round, but
                    // it looks like it is at the sizes we render lines at.

                    // Add more triangles for sharper angles.
                    // This math is just a good enough approximation. It isn't "correct".
                    const n = Math.floor((0.5 - (cosHalfAngle - 0.5)) * 8);
                    let approxFractionalJoinNormal;

                    for (let m = 0; m < n; m++) {
                        approxFractionalJoinNormal = nextNormal.mult((m + 1) / (n + 1))._add(prevNormal)._unit();
                        this.addPieSliceVertex(currentVertex, this.distance, approxFractionalJoinNormal, lineTurnsLeft, lineDistances);
                    }

                    this.addPieSliceVertex(currentVertex, this.distance, joinNormal, lineTurnsLeft, lineDistances);

                    for (let k = n - 1; k >= 0; k--) {
                        approxFractionalJoinNormal = prevNormal.mult((k + 1) / (n + 1))._add(nextNormal)._unit();
                        this.addPieSliceVertex(currentVertex, this.distance, approxFractionalJoinNormal, lineTurnsLeft, lineDistances);
                    }
                }

                // Start next segment
                if (nextVertex) {
                    this.addCurrentVertex(currentVertex, this.distance, nextNormal, -offsetA, -offsetB, false, lineDistances);
                }

            } else if (currentJoin === 'butt') {
                if (!startOfLine) {
                    // Close previous segment with a butt
                    this.addCurrentVertex(currentVertex, this.distance, prevNormal, 0, 0, false, lineDistances);
                }

                // Start next segment with a butt
                if (nextVertex) {
                    this.addCurrentVertex(currentVertex, this.distance, nextNormal, 0, 0, false, lineDistances);
                }

            } else if (currentJoin === 'square') {

                if (!startOfLine) {
                    // Close previous segment with a square cap
                    this.addCurrentVertex(currentVertex, this.distance, prevNormal, 1, 1, false, lineDistances);

                    // The segment is done. Unset vertices to disconnect segments.
                    this.e1 = this.e2 = -1;
                }

                // Start next segment
                if (nextVertex) {
                    this.addCurrentVertex(currentVertex, this.distance, nextNormal, -1, -1, false, lineDistances);
                }

            } else if (currentJoin === 'round') {

                if (!startOfLine) {
                    // Close previous segment with butt
                    this.addCurrentVertex(currentVertex, this.distance, prevNormal, 0, 0, false, lineDistances);

                    // Add round cap or linejoin at end of segment
                    this.addCurrentVertex(currentVertex, this.distance, prevNormal, 1, 1, true, lineDistances);

                    // The segment is done. Unset vertices to disconnect segments.
                    this.e1 = this.e2 = -1;
                }


                // Start next segment with a butt
                if (nextVertex) {
                    // Add round cap before first segment
                    this.addCurrentVertex(currentVertex, this.distance, nextNormal, -1, -1, true, lineDistances);

                    this.addCurrentVertex(currentVertex, this.distance, nextNormal, 0, 0, false, lineDistances);
                }
            }

            if ((needExtraVertex || nextVertex && outOfExtent(nextVertex, EXTENT)) &&
                i > first && i < len - 1) {
                //1. 为了实现dasharray，需要在join前后添加两个新端点，以保证计算dasharray时，linesofar的值是正确的
                //2. 后一个端点在瓦片外时，额外增加一个端点，以免因为join和端点共用aPosition，瓦片内的像素会当做超出瓦片而被discard
                //端点往前移动forward距离，以免新端点和lineJoin产生重叠
                const forward = Math.min(nextNormal.mag() * tanHalfAngle, Math.abs(nextNormal.x), Math.abs(nextNormal.y));
                this.addCurrentVertex(currentVertex, this.distance, nextNormal, forward, forward, false, lineDistances);
                if (distanceChanged) {
                    //抵消前一个extra端点时对distance的修改
                    this.distance -= prevNormal.mag() * tanHalfAngle * this._feaLineWidth / 2 * tileRatio;
                }
            }

            // if (!needExtraVertex && isSharpCorner && i < len - 1) {
            //     const nextSegmentLength = currentVertex.dist(nextVertex);
            //     if (nextSegmentLength > 2 * sharpCornerOffset) {
            //         const newCurrentVertex = currentVertex.add(nextVertex.sub(currentVertex)._mult(sharpCornerOffset / nextSegmentLength)._round());
            //         this.distance += newCurrentVertex.dist(currentVertex);
            //         this.addCurrentVertex(newCurrentVertex, this.distance, nextNormal.mult(1), 0, 0, false, lineDistances);
            //         currentVertex = newCurrentVertex;
            //     }
            // }

            startOfLine = false;
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
        distance, //: number,
        normal, //: Point,
        endLeft, //: number,
        endRight, //: number,
        round, //: boolean,
        distancesForScaling) {
        let extrude;
        // const layoutVertexArray = this.layoutVertexArray;
        // const indexArray = this.indexArray;
        const layoutVertexArray = this.data;
        if (distancesForScaling) {
            // For gradient lines, scale distance from tile units to [0, 2^15)
            distance = scaleDistance(distance, distancesForScaling);
        }

        extrude = normal.clone();
        if (endLeft) extrude._sub(normal.perp()._mult(endLeft));
        this.addLineVertex(layoutVertexArray, currentVertex, normal, extrude, round, false, distance);
        this.e3 = this.vertexLength++;
        if (this.e1 >= 0 && this.e2 >= 0) {
            this.addElements(this.e1, this.e2, this.e3);
        }
        this.e1 = this.e2;
        this.e2 = this.e3;

        extrude = normal.mult(-1);
        if (endRight) extrude._sub(normal.perp()._mult(endRight));
        this.addLineVertex(layoutVertexArray, currentVertex, normal.mult(-1), extrude, round, true, distance);
        this.e3 = this.vertexLength++;
        if (this.e1 >= 0 && this.e2 >= 0) {
            this.addElements(this.e1, this.e2, this.e3);
        }
        this.e1 = this.e2;
        this.e2 = this.e3;

        // There is a maximum "distance along the line" that we can store in the buffers.
        // When we get close to the distance, reset it to zero and add the vertex again with
        // a distance of zero. The max distance is determined by the number of bits we allocate
        // to `linesofar`.
        if (distance > MAX_LINE_DISTANCE && !distancesForScaling) {
            this.distance = 0;
            this.addCurrentVertex(currentVertex, this.distance, normal, endLeft, endRight, round, distancesForScaling);
        }
    }

    /**
     * Add a single new vertex and a triangle using two previous vertices.
     * This adds a pie slice triangle near a join to simulate round joins
     *
     * @param currentVertex the line vertex to add buffer vertices for
     * @param distance the distance from the beginning of the line to the vertex
     * @param extrude the offset of the new vertex from the currentVertex
     * @param lineTurnsLeft whether the line is turning left or right at this angle
     * @private
     */
    addPieSliceVertex(currentVertex, //: Point,
        distance, //: number,
        extrude, //: Point,
        lineTurnsLeft, //: boolean,
        distancesForScaling /* : ?Object */
    ) {
        extrude = extrude.mult(lineTurnsLeft ? -1 : 1);
        // const layoutVertexArray = this.layoutVertexArray;
        // const indexArray = this.indexArray;

        if (distancesForScaling) distance = scaleDistance(distance, distancesForScaling);

        this.addLineVertex(this.data, currentVertex, extrude, extrude, false, lineTurnsLeft, distance);
        this.e3 = this.vertexLength++;
        if (this.e1 >= 0 && this.e2 >= 0) {
            this.addElements(this.e1, this.e2, this.e3);
        }

        if (lineTurnsLeft) {
            this.e2 = this.e3;
        } else {
            this.e1 = this.e3;
        }
    }

    //参数会影响LineExtrusionPack中的addLineVertex方法
    addLineVertex(data, point, normal, extrude, round, up, linesofar) {
        linesofar *= LINE_DISTANCE_SCALE;
        const x = (point.x << 1) + (round ? 1 : 0);
        const y = (point.y << 1) + (up ? 1 : 0);
        data.push(x, y);
        if (this.positionSize === 3) {
            data.push(0);
        }
        data.push(
            // (direction + 2) * 4 + (round ? 1 : 0) * 2 + (up ? 1 : 0), //direction + 2把值从-1, 1 变成 1, 3
            EXTRUDE_SCALE * extrude.x,
            EXTRUDE_SCALE * extrude.y,
            linesofar
        );
        if (this._lineWidthFn) {
            //乘以2是为了解决 #190
            data.push(Math.round(this._feaLineWidth * 2));
        }
        if (this._colorFn) {
            data.push(...this._feaColor);
        }
        if (this.symbol['lineOffset']) {
            //添加 aExtrudeOffset 数据，用来在vert glsl中决定offset的矢量方向
            //vNormal.y在up时为1， 在down时为-1，vert中的计算逻辑如下：
            //offsetExtrude = (vNormal.y * (aExtrude - aExtrudeOffset) + aExtrudeOffset)
            if (up) {
                //up时，offsetExtrude = aExtrude
                data.push(0, 0);
            } else {
                //normal是该方法传入的normal参数
                //down时，offsetExtrude = aExtrude - normal - normal)，
                // 因为aExtrude和normal垂直，根据矢量减法，extrude - normal - normal = -extrude
                data.push(
                    EXTRUDE_SCALE * (extrude.x - normal.x),
                    EXTRUDE_SCALE * (extrude.y - normal.y),
                );
            }
        }
        this.maxPos = Math.max(this.maxPos, Math.abs(x) + 1, Math.abs(y) + 1);
    }

    addElements(e1, e2, e3) {
        super.addElements(this.offset + e1, this.offset + e2, this.offset + e3);
    }

    _filterPolygonEdges(elements) {
        const EXTENT = this.options['EXTENT'];
        const edges = this.elements;
        for (let i = 0; i < edges.length; i += 3) {
            if (!isClippedLineEdge(this.data, edges[i], edges[i + 1], this.formatWidth, EXTENT) &&
                !isClippedLineEdge(this.data, edges[i + 1], edges[i + 2], this.formatWidth, EXTENT)) {
                elements.push(edges[i], edges[i + 1], edges[i + 2]);
            }
        }
    }


    _filterLine(line) {
        if (line.length <= 1) {
            return line;
        }
        const filtered = [];
        const EXTENT = this.options['EXTENT'];
        let preOut = true;
        let i;
        for (i = 0; i < line.length - 1; i++) {
            const out = isOutSegment(line[i], line[i + 1], EXTENT);
            if (out && preOut) {
                continue;
            }
            filtered.push(line[i]);
            preOut = out;
        }
        if (!preOut) {
            filtered.push(line[i]);
        }
        return filtered;
    }
}

function isOutSegment(p0, p1, EXTENT) {
    return p0.x < 0 && p1.x < 0 || p0.x > EXTENT && p1.x > EXTENT ||
        p0.y < 0 && p1.y < 0 || p0.y > EXTENT && p1.y > EXTENT;
}

export function isClippedLineEdge(vertices, i0, i1, width, EXTENT) {
    const x0 = Math.floor(vertices[i0 * width] * 0.5), y0 = Math.floor(vertices[i0 * width + 1] * 0.5),
        x1 = Math.floor(vertices[i1 * width] * 0.5), y1 = Math.floor(vertices[i1 * width + 1] * 0.5);
    return x0 === x1 && (x0 < 0 || x0 > EXTENT) && y0 !== y1 ||
        y0 === y1 && (y0 < 0 || y0 > EXTENT) && x0 !== x1;
}


/**
 * Calculate the total distance, in tile units, of this tiled line feature
 *
 * @param {Array<Point>} vertices the full geometry of this tiled line feature
 * @param {number} first the index in the vertices array representing the first vertex we should consider
 * @param {number} len the count of vertices we should consider from `first`
 *
 * @private
 */
export function calculateFullDistance(vertices, first, len) {
    let currentVertex, nextVertex;
    let total = 0;
    for (let i = first; i < len - 1; i++) {
        currentVertex = vertices[i];
        nextVertex = vertices[i + 1];
        total += currentVertex.dist(nextVertex);
    }
    return total;
}

/**
 * Knowing the ratio of the full linestring covered by this tiled feature, as well
 * as the total distance (in tile units) of this tiled feature, and the distance
 * (in tile units) of the current vertex, we can determine the relative distance
 * of this vertex along the full linestring feature and scale it to [0, 2^15)
 *
 * @param {number} tileDistance the distance from the beginning of the tiled line to this vertex
 * @param {Object} stats
 * @param {number} stats.start the ratio (0-1) along a full original linestring feature of the start of this tiled line feature
 * @param {number} stats.end the ratio (0-1) along a full original linestring feature of the end of this tiled line feature
 * @param {number} stats.tileTotal the total distance, in tile units, of this tiled line feature
 *
 * @private
 */
function scaleDistance(tileDistance/* : number */, stats/* : Object */) {
    return ((tileDistance / stats.tileTotal) * (stats.end - stats.start) + stats.start) * (MAX_LINE_DISTANCE - 1);
}

function outOfExtent(vertex, EXTENT) {
    return vertex.x < 0 || vertex.x > EXTENT || vertex.y < 0 || vertex.y > EXTENT;
}

function hasDasharray(dash) {
    if (!Array.isArray(dash)) {
        return false;
    }
    for (let i = 0; i < dash.length; i++) {
        if (dash[i]) {
            return true;
        }
    }
    return false;
}
