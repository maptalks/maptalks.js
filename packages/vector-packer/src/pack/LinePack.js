// import VectorPack from './VectorPack';
import StyledVector from './StyledVector';
import VectorPack from './VectorPack';
import { interpolated, piecewiseConstant } from '@maptalks/function-type';
import Color from 'color';
import { isNil, isFnTypeSymbol } from '../style/Util';
import clipLine from './util/clip_line';

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
const COS_HALF_SHARP_CORNER = Math.cos(75 / 2 * (Math.PI / 180));
const SHARP_CORNER_OFFSET = 15;

// Angle per triangle for approximating round line joins.
const DEG_PER_TRIANGLE = 20;

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
        if (isFnTypeSymbol('lineJoin', this.symbolDef)) {
            this.lineJoinFn = piecewiseConstant(this.symbolDef['lineJoin']);
        }
        if (isFnTypeSymbol('lineCap', this.symbolDef)) {
            this.lineCapFn = piecewiseConstant(this.symbolDef['lineCap']);
        }
        if (isFnTypeSymbol('lineWidth', this.symbolDef)) {
            this.lineWidthFn = interpolated(this.symbolDef['lineWidth']);
        }
        if (isFnTypeSymbol('lineGapWidth', this.symbolDef)) {
            this.lineGapWidthFn = interpolated(this.symbolDef['lineGapWidth']);
        }
        if (isFnTypeSymbol('lineColor', this.symbolDef)) {
            this.colorFn = piecewiseConstant(this.symbolDef['lineColor']);
        }
        if (isFnTypeSymbol('linePatternFile', this.symbolDef)) {
            this.patternFn = piecewiseConstant(this.symbolDef['linePatternFile']);
        }
        if (isFnTypeSymbol('lineOpacity', this.symbolDef)) {
            this.opacityFn = piecewiseConstant(this.symbolDef['lineOpacity']);
        }
        let hasFeaDash = false;
        if (isFnTypeSymbol('lineDasharray', this.symbolDef)) {
            const fn = piecewiseConstant(this.symbolDef['lineDasharray']);
            hasFeaDash = hasFeatureDash(features, this.options.zoom, fn);
            if (hasFeaDash) {
                this.dasharrayFn = fn;
            }
        }
        if ((hasDasharray(this.symbol['lineDasharray']) || hasFeaDash) &&
            isFnTypeSymbol('lineDashColor', this.symbolDef)) {
            this.dashColorFn = piecewiseConstant(this.symbolDef['lineDashColor']);
        }
        if (isFnTypeSymbol('lineJoinPatternMode', this.symbolDef)) {
            this.joinPatternModeFn = piecewiseConstant(this.symbolDef['lineJoinPatternMode']);
        }
        if (isFnTypeSymbol('lineDx', this.symbolDef)) {
            this.lineDxFn = interpolated(this.symbolDef['lineDx']);
        }
        if (isFnTypeSymbol('lineDy', this.symbolDef)) {
            this.lineDyFn = interpolated(this.symbolDef['lineDy']);
        }
        if (isFnTypeSymbol('linePatternAnimSpeed', this.symbolDef)) {
            this.linePatternAnimSpeedFn = interpolated(this.symbolDef['linePatternAnimSpeed']);
        }
        if (isFnTypeSymbol('linePatternGap', this.symbolDef)) {
            this.linePatternGapFn = interpolated(this.symbolDef['linePatternGap']);
        }
    }

    createStyledVector(feature, symbol, options, iconReqs) {
        const vector = new StyledVector(feature, symbol, options);
        let pattern = symbol['linePatternFile'];
        if (this.patternFn) {
            const properties = feature && feature.properties || {};
            properties['$layer'] = feature.layer;
            properties['$type'] = feature.type;
            pattern = this.patternFn(options['zoom'], properties);
            delete properties['$layer'];
            delete properties['$type'];
        }
        if (!this.options['atlas'] && pattern) {
            iconReqs[pattern] = 1;
        }
        if (pattern) {
            vector.setResource(pattern);
        }
        return vector;
    }

    getFormat() {
        const format = [
            {
                type: Int16Array,
                width: 3,
                name: 'aPosition'
            }
        ];
        if (this.options.center) {
            format.push({
                type: Uint8Array,
                width: 1,
                name: 'aUp'
            });
        }
        format.push(
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
        );
        if (this.lineWidthFn) {
            format.push(
                {
                    type: Uint8Array,
                    width: 1,
                    name: 'aLineWidth'
                }
            );
        }
        if (this.lineGapWidthFn) {
            format.push(
                {
                    type: Uint8Array,
                    width: 1,
                    name: 'aLineGapWidth'
                }
            );
        }
        if (this.colorFn) {
            format.push(
                {
                    type: Uint8Array,
                    width: 4,
                    name: 'aColor'
                }
            );
        }
        if (this.opacityFn) {
            format.push(
                {
                    type: Uint8Array,
                    width: 1,
                    name: 'aOpacity'
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
        if (this.dasharrayFn) {
            format.push(
                {
                    type: Uint8Array,
                    width: 4,
                    name: 'aDasharray'
                }
            );
        }
        if (this.dashColorFn) {
            format.push(
                {
                    type: Uint8Array,
                    width: 4,
                    name: 'aDashColor'
                }
            );
        }
        if (this.iconAtlas) {
            const max = this.getIconAtlasMaxValue();
            format.push({
                type: max > 255 ? Uint16Array : Uint8Array,
                width: 4,
                name: 'aTexInfo'
            });

            format.push({
                type: Uint8Array,
                width: 1,
                name: 'aJoin'
            });
        }
        if (this.lineDxFn) {
            format.push({
                type: Int8Array,
                width: 1,
                name: 'aLineDx'
            });
        }
        if (this.lineDyFn) {
            format.push({
                type: Int8Array,
                width: 1,
                name: 'aLineDy'
            });
        }
        if (this.linePatternAnimSpeedFn) {
            format.push({
                type: Int8Array,
                width: 1,
                name: 'aLinePatternAnimSpeed'
            });
        }
        if (this.linePatternGapFn) {
            format.push({
                type: Uint8Array,
                width: 1,
                name: 'aLinePatternGap'
            });
        }
        return format;
    }

    placeVector(line) {
        const symbol = this.symbol,
            miterLimit = 2,
            roundLimit = 1.05;
        const feature = line.feature,
            isPolygon = feature.type === 3; //POLYGON
        const elements = this.elements;
        if (isPolygon) {
            //Polygon时，需要遍历elements，去掉(filter)瓦片范围外的edge
            //所以this.elements只会存放当前line的elements，方便filter处理
            this.elements = [];
        }
        let join = symbol['lineJoin'] || 'miter', cap = symbol['lineCap'] || 'butt';
        if (this.lineJoinFn) {
            join = this.lineJoinFn(this.options['zoom'], feature.properties) || 'miter'; //bevel, miter, round
        }
        if (this.lineCapFn) {
            cap = this.lineCapFn(this.options['zoom'], feature.properties) || 'butt'; //bevel, miter, round
        }
        if (this.lineWidthFn) {
            // {
            //     lineWidth: {
            //         property: 'type',
            //         stops: [1, { stops: [[2, 3], [3, 4]] }]
            //     }
            // }
            let lineWidth = this.lineWidthFn(this.options['zoom'], feature.properties);
            if (isNil(lineWidth)) {
                lineWidth = 4;
            }
            this.feaLineWidth = lineWidth;
        } else {
            this.feaLineWidth = symbol['lineWidth'];
        }
        if (this.lineGapWidthFn) {
            // {
            //     lineGapWidth: {
            //         property: 'type',
            //         stops: [1, { stops: [[2, 3], [3, 4]] }]
            //     }
            // }
            let lineGapWidth = this.lineGapWidthFn(this.options['zoom'], feature.properties);
            if (isNil(lineGapWidth)) {
                lineGapWidth = 0;
            }
            this.feaLineGapWidth = lineGapWidth;
        } else {
            this.feaLineGapWidth = symbol['lineGapWidth'] || 0;
        }
        if (this.colorFn) {
            this.feaColor = this.colorFn(this.options['zoom'], feature.properties) || [0, 0, 0, 255];
            if (!Array.isArray(this.feaColor)) {
                this.feaColor = Color(this.feaColor).array();
            } else {
                this.feaColor = this.feaColor.map(c => c * 255);
            }
            if (this.feaColor.length === 3) {
                this.feaColor.push(255);
            }
        }
        if (this.opacityFn) {
            let opacity = this.opacityFn(this.options['zoom'], feature.properties);
            if (isNil(opacity)) {
                opacity = 1;
            }
            this.feaOpacity = 255 * opacity;
        }
        if (this.dasharrayFn) {
            let dasharray = this.dasharrayFn(this.options['zoom'], feature.properties) || [0, 0, 0, 0];
            if (dasharray.length < 4) {
                const old = dasharray;
                if (dasharray.length === 1) {
                    dasharray = [old[0], old[0], old[0], old[0]];
                } else if (dasharray.length === 2) {
                    dasharray = [old[0], old[1], old[0], old[1]];
                } else if (dasharray.length === 3) {
                    dasharray = [old[0], old[1], old[2], old[2]];
                }
            }
            this.feaDash = dasharray;
        }
        if (this.dashColorFn) {
            let dashColor = (this.dashColorFn ? this.dashColorFn(this.options['zoom'], feature.properties) : this.symbol['lineDashColor']) || [0, 0, 0, 0];
            if (!Array.isArray(dashColor)) {
                dashColor = Color(dashColor).array();
            } else {
                dashColor = dashColor.map(c => c * 255);
            }
            if (dashColor.length === 3) {
                dashColor.push(255);
            }
            this.feaDashColor = dashColor;
        }

        if (this.iconAtlas) {
            const res = line.getResource();
            const image = this.iconAtlas.glyphMap[res];
            this.feaTexInfo = this.feaTexInfo || [0, 0, 0, 0];
            if (image) {
                const { tl, displaySize } = this.iconAtlas.positions[res];
                this.feaTexInfo[0] = tl[0];
                this.feaTexInfo[1] = tl[1];
                //uvSize - 1.0 是为了把256宽实际存为255，这样可以用Uint8Array来存储宽度为256的值
                this.feaTexInfo[2] = displaySize[0] - 1;
                this.feaTexInfo[3] = displaySize[1] - 1;
            } else {
                this.feaTexInfo[0] = this.feaTexInfo[1] = this.feaTexInfo[2] = this.feaTexInfo[3] = 0;
            }
            //feaJoinPatternMode为1时，把join部分用uvStart的像素代替
            if (this.joinPatternModeFn) {
                this.feaJoinPatternMode = this.joinPatternModeFn(this.options['zoom'], feature.properties) || 0;
            } else {
                this.feaJoinPatternMode = symbol['lineJoinPatternMode'] || 0;
            }
        }
        if (this.lineDxFn) {
            let dx = this.lineDxFn(this.options['zoom'], feature.properties);
            if (isNil(dx)) {
                dx = 0;
            }
            this.feaLineDx = dx;
        }
        if (this.lineDyFn) {
            let dy = this.lineDyFn(this.options['zoom'], feature.properties);
            if (isNil(dy)) {
                dy = 0;
            }
            this.feaLineDy = dy;
        }
        if (this.linePatternAnimSpeedFn) {
            let speed = this.linePatternAnimSpeedFn(this.options['zoom'], feature.properties);
            if (isNil(speed)) {
                speed = 0;
            }
            if (speed !== 0) {
                this.properties['hasPatternAnim'] = 1;
            }
            this.feaPatternAnimSpeed = speed;
        }
        if (this.linePatternGapFn) {
            let gap = this.linePatternGapFn(this.options['zoom'], feature.properties);
            if (isNil(gap)) {
                gap = 0;
            }
            this.feaLinePatternGap = gap;
        }
        const extent = this.options.EXTENT;
        //增加1个像素，因为要避免lineJoin刚好处于边界时的构造错误
        let lines = feature.geometry;
        if (extent !== Infinity && feature.type !== 3) {
            lines = clipLine(feature.geometry, -1, -1, extent + 1, extent + 1);
        }
        for (let i = 0; i < lines.length; i++) {
            //element offset when calling this.addElements in _addLine
            this.offset = this.data.length / this.formatWidth;
            const line = lines[i];
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

    _hasPattern() {
        return this.iconAtlas && this.feaTexInfo[2] && this.feaTexInfo[3];
    }

    _addLine(vertices, feature, join, cap, miterLimit, roundLimit) {
        const needExtraVertex = this._hasPattern() || hasDasharray(this.feaDash) || hasDasharray(this.symbol['lineDasharray']);
        this.overscaling = 1;
        // const tileRatio = this.options.tileRatio;
        //TODO overscaling的含义？
        const EXTENT = this.options.EXTENT;


        this.distance = 0;
        this.scaledDistance = 0;
        this.totalDistance = 0;

        if (!!this.symbol['lineGradientProperty'] && !!feature.properties &&
            feature.properties.hasOwnProperty('mapbox_clip_start') &&
            feature.properties.hasOwnProperty('mapbox_clip_end')) {

            this.clipStart = +feature.properties['mapbox_clip_start'];
            this.clipEnd = +feature.properties['mapbox_clip_end'];

            // Calculate the total distance, in tile units, of this tiled line feature
            for (let i = 0; i < vertices.length - 1; i++) {
                this.totalDistance += vertices[i].dist(vertices[i + 1]);
            }
            this.updateScaledDistance();
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

        if (join === 'bevel') miterLimit = 1.05;

        const sharpCornerOffset = this.overscaling <= 16 ?
            SHARP_CORNER_OFFSET * EXTENT / (512 * this.overscaling) :
            0;

        // we could be more precise, but it would only save a negligible amount of space
        // const segment = this.segments.prepareSegment(len * 10, this.layoutVertexArray, this.indexArray);
        const segment = {
            vertexLength: 0,
            primitiveLength: 0
        };

        let currentVertex;
        let prevVertex;
        let nextVertex;
        let prevNormal;
        let nextNormal;

        // the last two vertices added
        this.e1 = this.e2 = -1;

        if (isPolygon) {
            currentVertex = vertices[len - 2];
            nextNormal = vertices[first].sub(currentVertex)._unit()._perp();
        }

        for (let i = first; i < len; i++) {

            nextVertex = i === len - 1 ?
                (isPolygon ? vertices[first + 1] : undefined) : // if it's a polygon, treat the last vertex like the first
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

            // calculate cosines of the angle (and its half) using dot product
            const cosAngle = prevNormal.x * nextNormal.x + prevNormal.y * nextNormal.y;
            const cosHalfAngle = joinNormal.x * nextNormal.x + joinNormal.y * nextNormal.y;

            // Calculate the length of the miter (the ratio of the miter to the width)
            // as the inverse of cosine of the angle between next and join normals
            const miterLength = cosHalfAngle !== 0 ? 1 / cosHalfAngle : Infinity;

            // approximate angle from cosine
            const approxAngle = 2 * Math.sqrt(2 - 2 * cosHalfAngle);

            const isSharpCorner = cosHalfAngle < COS_HALF_SHARP_CORNER && prevVertex && nextVertex;
            const lineTurnsLeft = prevNormal.x * nextNormal.y - prevNormal.y * nextNormal.x > 0;

            if (!needExtraVertex && isSharpCorner && i > first) {
                const prevSegmentLength = currentVertex.dist(prevVertex);
                if (prevSegmentLength > 2 * sharpCornerOffset) {
                    const newPrevVertex = currentVertex.sub(currentVertex.sub(prevVertex)._mult(sharpCornerOffset / prevSegmentLength)._round());
                    this.updateDistance(prevVertex, newPrevVertex);
                    this.addCurrentVertex(newPrevVertex, prevNormal, 0, 0, segment);
                    prevVertex = newPrevVertex;
                }
            }

            // The join if a middle vertex, otherwise the cap.
            const middleVertex = prevVertex && nextVertex;
            let currentJoin = middleVertex ? join : isPolygon ? 'butt' : cap;

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
            if (prevVertex) this.updateDistance(prevVertex, currentVertex);

            if (i > first && i < len - 1 || isPolygon && i === len - 1) {
                //前一个端点在瓦片外时，额外增加一个端点，以免因为join和端点共用aPosition，瓦片内的像素会当做超出瓦片而被discard
                if (needExtraVertex/* || prevVertex && isOut(prevVertex, EXTENT)*/) {
                    //back不能超过normal的x或者y，否则会出现绘制错误
                    const back = this.feaJoinPatternMode ? 0 : -prevNormal.mag() * cosHalfAngle;
                    //为了实现dasharray，需要在join前后添加两个新端点，以保证计算dasharray时，linesofar的值是正确的
                    this.addCurrentVertex(currentVertex, prevNormal, back, back, segment);
                    this._inLineJoin = 1;
                }
            }

            if (currentJoin === 'miter') {

                joinNormal._mult(miterLength);
                this.addCurrentVertex(currentVertex, joinNormal, 0, 0, segment);

            } else if (currentJoin === 'flipbevel') {
                // miter is too big, flip the direction to make a beveled join

                if (miterLength > 100) {
                    // Almost parallel lines
                    joinNormal = nextNormal.mult(-1);

                } else {
                    const bevelLength = miterLength * prevNormal.add(nextNormal).mag() / prevNormal.sub(nextNormal).mag();
                    joinNormal._perp()._mult(bevelLength * (lineTurnsLeft ? -1 : 1));
                }
                this.addCurrentVertex(currentVertex, joinNormal, 0, 0, segment);
                this.addCurrentVertex(currentVertex, joinNormal.mult(-1), 0, 0, segment);

            } else if (currentJoin === 'bevel' || currentJoin === 'fakeround') {
                const offset = -Math.sqrt(miterLength * miterLength - 1);
                const offsetA = lineTurnsLeft ? offset : 0;
                const offsetB = lineTurnsLeft ? 0 : offset;

                // Close previous segment with a bevel
                if (prevVertex) {
                    this.addCurrentVertex(currentVertex, prevNormal, offsetA, offsetB, segment);
                }

                if (currentJoin === 'fakeround') {
                    // The join angle is sharp enough that a round join would be visible.
                    // Bevel joins fill the gap between segments with a single pie slice triangle.
                    // Create a round join by adding multiple pie slices. The join isn't actually round, but
                    // it looks like it is at the sizes we render lines at.

                    // pick the number of triangles for approximating round join by based on the angle between normals
                    const n = Math.round((approxAngle * 180 / Math.PI) / DEG_PER_TRIANGLE);

                    for (let m = 1; m < n; m++) {
                        let t = m / n;
                        if (t !== 0.5) {
                            // approximate spherical interpolation https://observablehq.com/@mourner/approximating-geometric-slerp
                            const t2 = t - 0.5;
                            const A = 1.0904 + cosAngle * (-3.2452 + cosAngle * (3.55645 - cosAngle * 1.43519));
                            const B = 0.848013 + cosAngle * (-1.06021 + cosAngle * 0.215638);
                            t = t + t * t2 * (t - 1) * (A * t2 * t2 + B);
                        }
                        const extrude = nextNormal.sub(prevNormal)._mult(t)._add(prevNormal)._unit()._mult(lineTurnsLeft ? -1 : 1);
                        this.addHalfVertex(currentVertex, extrude.x, extrude.y, false, lineTurnsLeft, 0, segment);
                    }
                }

                if (nextVertex) {
                    // Start next segment
                    this.addCurrentVertex(currentVertex, nextNormal, -offsetA, -offsetB, segment);
                }

            } else if (currentJoin === 'butt') {
                this.addCurrentVertex(currentVertex, joinNormal, 0, 0, segment); // butt cap

            } else if (currentJoin === 'square') {
                const offset = prevVertex ? 1 : -1; // closing or starting square cap
                this.addCurrentVertex(currentVertex, joinNormal, offset, offset, segment);

            } else if (currentJoin === 'round') {

                if (prevVertex) {
                    // Close previous segment with butt
                    this.addCurrentVertex(currentVertex, prevNormal, 0, 0, segment);

                    // Add round cap or linejoin at end of segment
                    this.addCurrentVertex(currentVertex, prevNormal, 1, 1, segment, true);
                }
                if (nextVertex) {
                    // Add round cap before first segment
                    this.addCurrentVertex(currentVertex, nextNormal, -1, -1, segment, true);

                    // Start next segment with a butt
                    this.addCurrentVertex(currentVertex, nextNormal, 0, 0, segment);
                }
            }

            if (!needExtraVertex && isSharpCorner && i < len - 1) {
                const nextSegmentLength = currentVertex.dist(nextVertex);
                if (nextSegmentLength > 2 * sharpCornerOffset) {
                    const newCurrentVertex = currentVertex.add(nextVertex.sub(currentVertex)._mult(sharpCornerOffset / nextSegmentLength)._round());
                    this.updateDistance(currentVertex, newCurrentVertex);
                    this.addCurrentVertex(newCurrentVertex, nextNormal, 0, 0, segment);
                    currentVertex = newCurrentVertex;
                }
            }

            // if ((needExtraVertex || nextVertex && isOut(nextVertex, EXTENT)) &&
            if (i > first && i < len - 1 || isPolygon && i === first) {
                if (needExtraVertex) {
                    delete this._inLineJoin;
                    //1. 为了实现dasharray，需要在join前后添加两个新端点，以保证计算dasharray时，linesofar的值是正确的
                    //2. 后一个端点在瓦片外时，额外增加一个端点，以免因为join和端点共用aPosition，瓦片内的像素会当做超出瓦片而被discard
                    //端点往前移动forward距离，以免新端点和lineJoin产生重叠
                    const forward = this.feaJoinPatternMode ? 0 : nextNormal.mag() * cosHalfAngle;
                    this.addCurrentVertex(currentVertex, nextNormal, forward, forward, segment);
                }
            }
        }
    }

    /**
     * Add two vertices to the buffers.
     *
     * @param p the line vertex to add buffer vertices for
     * @param normal vertex normal
     * @param endLeft extrude to shift the left vertex along the line
     * @param endRight extrude to shift the left vertex along the line
     * @param segment the segment object to add the vertex to
     * @param round whether this is a round cap
     * @private
     */
    addCurrentVertex(p, normal, endLeft, endRight, segment, round = false) {
        // left and right extrude vectors, perpendicularly shifted by endLeft/endRight
        const leftX = normal.x + normal.y * endLeft;
        const leftY = normal.y - normal.x * endLeft;
        const rightX = -normal.x + normal.y * endRight;
        const rightY = -normal.y - normal.x * endRight;

        this.addHalfVertex(p, leftX, leftY, round, false, endLeft, segment);
        this.addHalfVertex(p, rightX, rightY, round, true, -endRight, segment);

        // There is a maximum "distance along the line" that we can store in the buffers.
        // When we get close to the distance, reset it to zero and add the vertex again with
        // a distance of zero. The max distance is determined by the number of bits we allocate
        // to `linesofar`.
        if (this.distance > MAX_LINE_DISTANCE / 2 && this.totalDistance === 0) {
            this.distance = 0;
            this.updateScaledDistance();
            this.addCurrentVertex(p, normal, endLeft, endRight, segment, round);
        }
    }

    addHalfVertex({ x, y }, extrudeX, extrudeY, round, up, dir, segment) {
        // scale down so that we can store longer distances while sacrificing precision.
        const linesofar = this.scaledDistance * LINE_DISTANCE_SCALE;

        this.fillData(this.data, x, y, extrudeX, extrudeY, round, up, linesofar);

        const e = segment.vertexLength++;
        if (this.e1 >= 0 && this.e2 >= 0) {
            // this.indexArray.emplaceBack(this.e1, this.e2, e);
            this.addElements(this.e1, this.e2, e);
            segment.primitiveLength++;
        }
        if (up) {
            this.e2 = e;
        } else {
            this.e1 = e;
        }
    }

    //参数会影响LineExtrusionPack中的addLineVertex方法
    fillData(data, x, y, extrudeX, extrudeY, round, up, linesofar) {
        if (this.options.center) {
            data.push(x, y, 0);
            data.push(round * 2 + up); //aUp
        } else {
            x = (x << 1) + (round ? 1 : 0);
            y = (y << 1) + (up ? 1 : 0);
            data.push(x, y, 0);
        }

        data.push(
            // (direction + 2) * 4 + (round ? 1 : 0) * 2 + (up ? 1 : 0), //direction + 2把值从-1, 1 变成 1, 3
            EXTRUDE_SCALE * extrudeX,
            EXTRUDE_SCALE * extrudeY,
            linesofar
        );
        if (this.lineWidthFn) {
            //乘以2是为了解决 #190
            data.push(Math.round(this.feaLineWidth * 2));
        }
        if (this.lineGapWidthFn) {
            //乘以2是为了解决 #190
            data.push(Math.round(this.feaLineGapWidth * 2));
        }
        if (this.colorFn) {
            data.push(...this.feaColor);
        }
        if (this.opacityFn) {
            data.push(this.feaOpacity);
        }
        if (this.dasharrayFn) {
            data.push(...this.feaDash);
        }
        if (this.dashColorFn) {
            data.push(...this.feaDashColor);
        }
        // if (this.symbol['lineOffset']) {
        //     //添加 aExtrudeOffset 数据，用来在vert glsl中决定offset的矢量方向
        //     //vNormal.y在up时为1， 在down时为-1，vert中的计算逻辑如下：
        //     //offsetExtrude = (vNormal.y * (aExtrude - aExtrudeOffset) + aExtrudeOffset)
        //     if (up) {
        //         //up时，offsetExtrude = aExtrude
        //         data.push(0, 0);
        //     } else {
        //         //normal是该方法传入的normal参数
        //         //down时，offsetExtrude = aExtrude - normal - normal)，
        //         // 因为aExtrude和normal垂直，根据矢量减法，extrude - normal - normal = -extrude
        //         data.push(
        //             EXTRUDE_SCALE * (extrudeX - normal.x),
        //             EXTRUDE_SCALE * (extrudeY - normal.y),
        //         );
        //     }
        // }
        if (this.iconAtlas) {
            data.push(...this.feaTexInfo);

            data.push(this._inLineJoin && this.feaJoinPatternMode ? 1 : 0);
        }
        if (this.lineDxFn) {
            data.push(this.feaLineDx);
        }
        if (this.lineDyFn) {
            data.push(this.feaLineDy);
        }
        if (this.linePatternAnimSpeedFn) {
            data.push(this.feaPatternAnimSpeed * 127);
        }
        if (this.linePatternGapFn) {
            // 0 - 25.5
            data.push(this.feaLinePatternGap * 10);
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
            if (EXTENT === Infinity || !isClippedLineEdge(this.data, edges[i], edges[i + 1], this.formatWidth, EXTENT) &&
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

    updateDistance(prev, next) {
        this.distance += prev.dist(next);
        this.updateScaledDistance();
    }

    updateScaledDistance() {
        // Knowing the ratio of the full linestring covered by this tiled feature, as well
        // as the total distance (in tile units) of this tiled feature, and the distance
        // (in tile units) of the current vertex, we can determine the relative distance
        // of this vertex along the full linestring feature and scale it to [0, 2^15)
        this.scaledDistance = this.totalDistance > 0 ?
            (this.clipStart + (this.clipEnd - this.clipStart) * this.distance / this.totalDistance)  * (MAX_LINE_DISTANCE - 1) :
            this.distance;
    }
}

function isOutSegment(p0, p1, EXTENT) {
    if (EXTENT === Infinity) {
        return false;
    }
    return p0.x < 0 && p1.x < 0 || p0.x > EXTENT && p1.x > EXTENT ||
        p0.y < 0 && p1.y < 0 || p0.y > EXTENT && p1.y > EXTENT;
}

function isClippedLineEdge(vertices, i0, i1, width, EXTENT) {
    if (EXTENT === Infinity) {
        return false;
    }
    const x0 = Math.floor(vertices[i0 * width] * 0.5), y0 = Math.floor(vertices[i0 * width + 1] * 0.5),
        x1 = Math.floor(vertices[i1 * width] * 0.5), y1 = Math.floor(vertices[i1 * width + 1] * 0.5);
    return x0 === x1 && (x0 < 0 || x0 > EXTENT) && y0 !== y1 ||
        y0 === y1 && (y0 < 0 || y0 > EXTENT) && x0 !== x1;
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

function hasFeatureDash(features, zoom, fn) {
    for (let i = 0; i < features.length; i++) {
        if (fn(zoom, features[i].properties)) {
            return true;
        }
    }
    return false;
}
