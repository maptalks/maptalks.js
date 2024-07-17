// import VectorPack from './VectorPack';
import StyledVector from './StyledVector';
import VectorPack from './VectorPack';
import { isNil, isNumber, getAltitudeToLocal, normalizeColor } from '../style/Util';
import clipLine from './util/clip_line';
import { isFunctionDefinition } from '@maptalks/function-type';
import Point from '@mapbox/point-geometry';
import Point3 from './point3/Point3';
import mergeLineFeatures from './util/merge_line_features';

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
export const LINE_DISTANCE_SCALE = 1;

// The maximum line distance, in tile units, that fits in the buffer.
const MAX_LINE_DISTANCE = Math.pow(2, LINE_DISTANCE_BUFFER_BITS) / LINE_DISTANCE_SCALE;


const TEMP_NORMAL_1 = new Point();
const TEMP_NORMAL_2 = new Point();
const TEMP_NORMAL_3 = new Point();
/**
 * 线类型数据，负责输入feature和symbol后，生成能直接赋给shader的arraybuffer
 * 设计上能直接在worker中执行
 * 其执行过程：
 * 1. 解析features（ vt 格式, geojson-vt的feature 或 geojson ）
 * 2. 根据 symbol 设置，设置每个 feature 的 symbol (dasharray或pattern)，生成 StyledLine
 * 3. 遍历 StyledLine, 生成
 */
export default class LinePack extends VectorPack {

    static mergeLineFeatures(features, symbolDef, fnTypes, zoom) {
        return mergeLineFeatures(features, symbolDef, fnTypes, zoom);
    }

    constructor(features, symbol, options) {
        super(features, symbol, options);
        let hasFeaDash = false;
        const { lineDasharrayFn, lineDashColorFn } = this._fnTypes;
        this.hasGradient = this.symbol['lineGradientProperty'];
        if (lineDasharrayFn) {
            hasFeaDash = hasFeatureDash(features, this.options.zoom, lineDasharrayFn);
            if (hasFeaDash) {
                this.dasharrayFn = lineDasharrayFn;
            }
        }
        this.hasDasharray = hasDasharray(this.symbol['lineDasharray']) || hasFeaDash;
        if ((this.hasDasharray) &&
            lineDashColorFn) {
            this.dashColorFn = lineDashColorFn;
        }

    }

    createStyledVector(feature, symbol, fnTypes, options, iconReqs) {
        const vector = new StyledVector(feature, symbol, fnTypes, options);
        const pattern = vector.getLineResource();
        if (!this.options['atlas'] && pattern) {
            iconReqs[pattern] = [0, 0];
        }
        return vector;
    }

    getFormat() {
        const { lineWidthFn, lineStrokeWidthFn, lineStrokeColorFn, lineColorFn, lineOpacityFn, lineDxFn, lineDyFn, linePatternAnimSpeedFn, linePatternGapFn } = this._fnTypes;
        const format = [
            ...this.getPositionFormat()
        ];
        if (this.iconAtlas || this.hasDasharray) {
            //为了减少attribute，round在etrudeX的第七位中，up在extrudeY的第七位中
            //extrudeZ存放normal distance
            format.push({
                type: Int8Array,
                width: 3,
                name: 'aExtrude'
            });
        } else {
            format.push({
                type: Int8Array,
                width: 2,
                name: 'aExtrude'
            });
        }
        format.push(
            //当前点距离起点的距离
            {
                type: this.options.positionType || Uint16Array,
                width: 1,
                name: 'aLinesofar'
            }
        );
        if (lineWidthFn) {
            format.push(
                {
                    type: Uint8Array,
                    width: 1,
                    name: 'aLineWidth'
                }
            );
        }
        if (lineStrokeWidthFn) {
            format.push(
                {
                    type: Uint8Array,
                    width: 1,
                    name: 'aLineStrokeWidth'
                }
            );
        }
        if (lineColorFn) {
            format.push(
                {
                    type: Uint8Array,
                    width: 4,
                    name: 'aColor'
                }
            );
        }
        if (lineStrokeColorFn) {
            format.push(
                {
                    type: Uint8Array,
                    width: 4,
                    name: 'aStrokeColor'
                }
            );
        }
        if (lineOpacityFn) {
            format.push(
                {
                    type: Uint8Array,
                    width: 1,
                    name: 'aOpacity'
                }
            );
        }
        // if (this.symbol['lineOffset']) {
        //     format.push(
        //         {
        //             type: Int8Array,
        //             width: 2,
        //             name: 'aExtrudeOffset'
        //         }
        //     );
        // }
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
        }
        if (lineDxFn || lineDyFn) {
            format.push({
                type: Int8Array,
                width: 2,
                name: 'aLineDxDy'
            });
        }
        if (linePatternAnimSpeedFn || linePatternGapFn) {
            format.push({
                type: Int8Array,
                width: 2,
                name: 'aLinePattern'
            });
        }
        // if (linePatternGapFn) {
        //     format.push({
        //         type: Uint8Array,
        //         width: 1,
        //         name: 'aLinePatternGap'
        //     });
        // }
        return format;
    }

    placeVector(line) {
        const { lineJoinFn, lineCapFn, lineWidthFn, lineHeightFn, lineStrokeWidthFn, lineStrokeColorFn,
            lineColorFn, lineOpacityFn,
            lineDxFn, lineDyFn, linePatternAnimSpeedFn, linePatternGapFn } = this._fnTypes;
        const symbol = this.symbol,
            miterLimit = 2,
            roundLimit = 1.05;
        const feature = line.feature,
            isPolygon = false;//feature.type === 3; //POLYGON
        const properties = feature.properties;
        const elements = this.elements;
        if (isPolygon) {
            //Polygon时，需要遍历elements，去掉(filter)瓦片范围外的edge
            //所以this.elements只会存放当前line的elements，方便filter处理
            this.elements = this._arrayPool.get();
        }
        let join = symbol['lineJoin'] || 'miter', cap = symbol['lineCap'] || 'butt';
        if (lineJoinFn) {
            join = lineJoinFn(this.options['zoom'], properties) || 'miter'; //bevel, miter, round
        }
        if (lineCapFn) {
            cap = lineCapFn(this.options['zoom'], properties) || 'butt'; //bevel, miter, round
        }
        if (lineWidthFn) {
            // {
            //     lineWidth: {
            //         property: 'type',
            //         stops: [1, { stops: [[2, 3], [3, 4]] }]
            //     }
            // }
            let lineWidth = lineWidthFn(this.options['zoom'], properties);
            if (isFunctionDefinition(lineWidth)) {
                this.dynamicAttrs['aLineWidth'] = 1;
                lineWidth = 4;
            }
            if (isNil(lineWidth)) {
                lineWidth = 4;
            }
            this.feaLineWidth = +lineWidth;
        } else {
            this.feaLineWidth = +symbol['lineWidth'];
        }
        if (lineHeightFn) {
            let lineHeight = lineHeightFn(this.options['zoom'], properties);
            if (isFunctionDefinition(lineHeight)) {
                this.dynamicAttrs['aLineHeight'] = 1;
            }
            if (isNil(lineHeight)) {
                lineHeight = this.feaLineWidth;
            }
            this.feaLineHeight = +lineHeight;
        } else {
            this.feaLineHeight = +symbol['lineHeight'] || this.feaLineWidth;
        }
        if (lineStrokeWidthFn) {
            // {
            //     lineStrokeWidth: {
            //         property: 'type',
            //         stops: [1, { stops: [[2, 3], [3, 4]] }]
            //     }
            // }
            let lineStrokeWidth = lineStrokeWidthFn(this.options['zoom'], properties);
            if (isFunctionDefinition(lineStrokeWidth)) {
                this.dynamicAttrs['aLineStrokeWidth'] = 1;
                lineStrokeWidth = 0;
            }
            if (isNil(lineStrokeWidth)) {
                lineStrokeWidth = 0;
            }
            this.feaLineStrokeWidth = lineStrokeWidth;
        } else {
            this.feaLineStrokeWidth = symbol['lineStrokeWidth'] || 0;
        }
        if (lineColorFn) {
            // 为了支持和linePattern合成，把默认lineColor设为白色
            this.feaColor = lineColorFn(this.options['zoom'], properties) || [255, 255, 255, 255];
            if (isFunctionDefinition(this.feaColor)) {
                this.dynamicAttrs['aColor'] = 1;
                // 说明是identity返回的仍然是个fn-type，fn-type-util.js中会计算刷新，这里不用计算
                this.feaColor = [0, 0, 0, 0];
            } else {
                this.feaColor = normalizeColor([], this.feaColor);
            }
        }
        if (lineStrokeColorFn) {
            this.feaStrokeColor = lineStrokeColorFn(this.options['zoom'], properties) || [0, 0, 0, 255];
            if (isFunctionDefinition(this.feaStrokeColor)) {
                this.dynamicAttrs['aStrokeColor'] = 1;
                // 说明是identity返回的仍然是个fn-type，fn-type-util.js中会计算刷新，这里不用计算
                this.feaStrokeColor = [0, 0, 0, 0];
            } else {
                this.feaStrokeColor = normalizeColor([], this.feaStrokeColor);
            }
        }
        if (lineOpacityFn) {
            let opacity = lineOpacityFn(this.options['zoom'], properties);
            if (isFunctionDefinition(opacity)) {
                this.dynamicAttrs['aOpacity'] = 1;
                opacity = 1;
            }
            if (isNil(opacity)) {
                opacity = 1;
            }
            this.feaOpacity = 255 * opacity;
        }
        if (this.dasharrayFn) {
            let dasharray = this.dasharrayFn(this.options['zoom'], properties) || [0, 0, 0, 0];
            if (isFunctionDefinition(dasharray)) {
                this.dynamicAttrs['aDasharray'] = 1;
                dasharray = [0, 0, 0, 0];
            }
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
            let dashColor = (this.dashColorFn ? this.dashColorFn(this.options['zoom'], properties) : this.symbol['lineDashColor']) || [0, 0, 0, 0];
            if (isFunctionDefinition(dashColor)) {
                this.dynamicAttrs['aDashColor'] = 1;
                // 说明是identity返回的仍然是个fn-type，fn-type-util.js中会计算刷新，这里不用计算
                dashColor = [0, 0, 0, 0];
            }
            dashColor = normalizeColor([], dashColor);
            this.feaDashColor = dashColor;
        }

        if (this.iconAtlas) {
            const res = line.getLineResource();
            const image = this.iconAtlas.glyphMap[res];
            this.feaTexInfo = this.feaTexInfo || [0, 0, 0, 0];
            if (image) {
                const { tl, displaySize } = this.iconAtlas.positions[res];
                // fuzhenn/maptalks-ide#2778
                // uvStart增大一个像素，uvSize缩小一个像素，避免插值造成的缝隙
                this.feaTexInfo[0] = tl[0] + 1;
                this.feaTexInfo[1] = tl[1] + 1;
                //uvSize - 1.0 是为了把256宽实际存为255，这样可以用Uint8Array来存储宽度为256的值
                this.feaTexInfo[2] = displaySize[0] - 3;
                this.feaTexInfo[3] = displaySize[1] - 3;
            } else {
                this.feaTexInfo[0] = this.feaTexInfo[1] = this.feaTexInfo[2] = this.feaTexInfo[3] = 0;
            }
        }
        if (lineDxFn) {
            let dx = lineDxFn(this.options['zoom'], properties);
            if (isFunctionDefinition(dx)) {
                this.dynamicAttrs['aLineDxDy'] = 1;
                // 说明是identity返回的仍然是个fn-type，fn-type-util.js中会计算刷新，这里不用计算
                dx = 0;
            }
            if (isNil(dx)) {
                dx = 0;
            }
            this.feaLineDx = dx;
        }
        if (lineDyFn) {
            let dy = lineDyFn(this.options['zoom'], properties);
            if (isFunctionDefinition(dy)) {
                this.dynamicAttrs['aLineDxDy'] = 1;
                // 说明是identity返回的仍然是个fn-type，fn-type-util.js中会计算刷新，这里不用计算
                dy = 0;
            }
            if (isNil(dy)) {
                dy = 0;
            }
            this.feaLineDy = dy;
        }
        if (linePatternAnimSpeedFn) {
            let speed = linePatternAnimSpeedFn(this.options['zoom'], properties);
            if (isFunctionDefinition(speed)) {
                this.dynamicAttrs['aLinePatternAnimSpeed'] = 1;
                // 说明是identity返回的仍然是个fn-type，fn-type-util.js中会计算刷新，这里不用计算
                speed = 0;
            }
            if (isNil(speed)) {
                speed = 0;
            }
            if (speed !== 0) {
                this.properties['hasPatternAnim'] = 1;
            }
            this.feaPatternAnimSpeed = speed;
        }
        if (linePatternGapFn) {
            let gap = linePatternGapFn(this.options['zoom'], properties);
            if (isFunctionDefinition(gap)) {
                this.dynamicAttrs['aLinePatternGap'] = 1;
                // 说明是identity返回的仍然是个fn-type，fn-type-util.js中会计算刷新，这里不用计算
                gap = 0;
            }
            if (isNil(gap)) {
                gap = 0;
            }
            this.feaLinePatternGap = gap;
        }
        const extent = this.options.EXTENT;
        let lines = feature.geometry;
        if (extent !== Infinity) {
            lines = [];
            const ring = [];
            for (let i = 0; i < feature.geometry.length; i++) {
                ring[0] = feature.geometry[i];
                //增加1个像素，因为要避免lineJoin刚好处于边界时的构造错误
                const segs = clipLine(ring, -1, -1, extent + 1, extent + 1);
                if (feature.type === 3 && segs.length > 1) {
                    // 第一段第一个坐标与最后一段最后一个坐标相同时，说明是多边形被切分后的第一段和最后一段，则把这两个线段做合并，并删除最后一段
                    const firstseg = segs[0];
                    const lastseg = segs[segs.length - 1];
                    if (equalPoint(firstseg[0], lastseg[lastseg.length - 1])) {
                        segs[0] = lastseg.concat(firstseg.slice(1));
                        segs.length = segs.length - 1;
                    }
                }
                lines.push(...segs);
            }

        }
        const positionSize = this.needAltitudeAttribute() ? 2 : 3;
        for (let i = 0; i < lines.length; i++) {
            //element offset when calling this.addElements in _addLine
            this.offset = this.data.aPosition.getLength() / positionSize;
            const line = lines[i];
            // 把polygon clip后的边框当作line来渲染
            this._addLine(line, feature, join, cap, miterLimit, roundLimit);
            if (isPolygon) {
                this._filterPolygonEdges(elements);
                this.elements = this._arrayPool.get();
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
        const hasPattern = this._hasPattern() || hasDasharray(this.feaDash) || hasDasharray(this.symbol['lineDasharray']);

        const isTube = this.options['isTube'];
        if (isTube) {
            vertices = vertices.map(v => new Point3(v));
        }
        this.overscaling = 1;
        // const tileRatio = this.options.tileRatio;
        //TODO overscaling的含义？
        const EXTENT = this.options.EXTENT;

        this.distance = 0;
        this.scaledDistance = 0;
        this.totalDistance = 0;
        this.prevVertex = null;
        if (!!this.symbol['lineGradientProperty'] && !!feature.properties &&
            isNumber(feature.properties['mapbox_clip_start']) &&
            isNumber(feature.properties['mapbox_clip_end'])) {

            this.clipStart = +feature.properties['mapbox_clip_start'];
            this.clipEnd = +feature.properties['mapbox_clip_end'];

            // Calculate the total distance, in tile units, of this tiled line feature
            for (let i = 0; i < vertices.length - 1; i++) {
                this.totalDistance += vertices[i].dist(vertices[i + 1]);
            }
            this.updateScaledDistance();
        }/* else if (!!feature.properties &&
            hasOwn(feature.properties, 'mapbox_clip_start') &&
            hasOwn(feature.properties, 'mapbox_clip_end')) {

            this.clipStart = +feature.properties['mapbox_clip_start'];
            this.clipEnd = +feature.properties['mapbox_clip_end'];

            for (let i = 0; i < vertices.length - 1; i++) {
                this.totalDistance += vertices[i].dist(vertices[i + 1]);
            }
            this.updateClipStartDistance();
            this.totalDistance = 0;
            this.updateScaledDistance();
        }*/

        // 被剪切过的Polygon当作普通line来处理，clipped是在clip_line中判定的
        const isPolygon = feature.type === 3 && !vertices.clipped; //POLYGON

        // If the line has duplicate vertices at the ends, adjust start/length to remove them.
        let len = vertices.length;
        while (len >= 2 && equalPoint(vertices[len - 1], vertices[len - 2])) {
            len--;
        }
        let first = 0;
        while (first < len - 1 && equalPoint(vertices[first], vertices[first + 1])) {
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
            primitiveLength: 0,
            currentNormal: null
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

        this.ensureDataCapacity(join, len, 360, 2);

        for (let i = first; i < len; i++) {

            nextVertex = i === len - 1 ?
                (isPolygon ? vertices[first + 1] : undefined) : // if it's a polygon, treat the last vertex like the first
                vertices[i + 1]; // just the next vertex

            // if two consecutive vertices exist, skip the current one
            if (nextVertex && equalPoint(vertices[i], nextVertex)) continue;

            if (nextNormal) prevNormal = nextNormal;
            if (currentVertex) prevVertex = currentVertex;

            currentVertex = vertices[i];
            // 当xy相同，只有高度不同时，则添加一个像素的偏移，保证normal等能正确计算，但视觉上没有差别
            if (nextVertex && currentVertex.x === nextVertex.x && currentVertex.y === nextVertex.y) {
                currentVertex.x += 0.0001;
            }

            // Calculate the normal towards the next vertex in this line. In case
            // there is no next vertex, pretend that the line is continuing straight,
            // meaning that we are just using the previous normal.
            nextNormal = nextVertex ? nextVertex.sub(currentVertex)._unit()._perp() : prevNormal;
            if (prevVertex) {
                segment.dir = currentVertex.sub(prevVertex)._unit();
            } else {
                segment.dir = nextVertex.sub(currentVertex)._unit();
            }

            // If we still don't have a previous normal, this is the beginning of a
            // non-closed line, so we're doing a straight "join".
            prevNormal = prevNormal || nextNormal;
            segment.currentNormal = prevNormal;

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

            if (!isTube && isSharpCorner && i > first) {
                const prevSegmentLength = currentVertex.dist(prevVertex);
                if (prevSegmentLength > 2 * sharpCornerOffset) {
                    const newPrevVertex = currentVertex.sub(currentVertex.sub(prevVertex)._mult(sharpCornerOffset / prevSegmentLength)._round());
                    newPrevVertex.z = currentVertex.z;
                    this.updateDistance(prevVertex, newPrevVertex);
                    this.addCurrentVertex(newPrevVertex, prevNormal, 0, 0, segment);
                    prevVertex = newPrevVertex;
                }
            }

            // The join if a middle vertex, otherwise the cap.
            const middleVertex = prevVertex && nextVertex;
            segment.middleVertex = middleVertex;
            let currentJoin = middleVertex ? join : isPolygon ? 'butt' : cap;

            if (middleVertex && currentJoin === 'round') {
                if (miterLength < roundLimit) {
                    currentJoin = 'miter';
                } else if (miterLength <= 2) {
                    currentJoin = 'fakeround';
                }
            }


            if (currentJoin === 'miter' && miterLength > miterLimit && !isTube) {
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

            // if (i > first && i < len - 1 || isPolygon && i === len - 1) {
            //     //前一个端点在瓦片外时，额外增加一个端点，以免因为join和端点共用aPosition，瓦片内的像素会当做超出瓦片而被discard
            //     if (hasPattern/* || prevVertex && isOut(prevVertex, EXTENT)*/) {
            //         //back不能超过normal的x或者y，否则会出现绘制错误
            //         const back = this.feaJoinPatternMode ? 0 : -prevNormal.mag() * cosHalfAngle;
            //         //为了实现dasharray，需要在join前后添加两个新端点，以保证计算dasharray时，linesofar的值是正确的
            //         this.addCurrentVertex(currentVertex, prevNormal, back, back, segment);
            //         this._inLineJoin = 1;
            //     }
            // }

            if (currentJoin === 'miter') {
                if (isTube) {
                    this.addCurrentVertex(currentVertex, prevNormal, 0, 0, segment);
                    segment.dir = nextVertex.sub(currentVertex)._unit();
                    this.addCurrentVertex(currentVertex, nextNormal, 0, 0, segment);
                } else {
                    joinNormal._mult(miterLength);
                    this.addCurrentVertex(currentVertex, joinNormal, 0, 0, segment);

                    if (hasPattern) {
                        // mitter两边的normal distance值不同，所以需要增加一个新端点
                        segment.currentNormal = nextNormal;
                        this.addCurrentVertex(currentVertex, joinNormal, 0, 0, segment);
                    }
                }
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
                    segment.currentNormal = nextNormal;
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

            if (!isTube && isSharpCorner && i < len - 1) {
                const nextSegmentLength = currentVertex.dist(nextVertex);
                if (nextSegmentLength > 2 * sharpCornerOffset) {
                    const newCurrentVertex = currentVertex.add(nextVertex.sub(currentVertex)._mult(sharpCornerOffset / nextSegmentLength)._round());
                    newCurrentVertex.z = currentVertex.z;
                    this.updateDistance(currentVertex, newCurrentVertex);
                    this.addCurrentVertex(newCurrentVertex, nextNormal, 0, 0, segment);
                    currentVertex = newCurrentVertex;
                }
            }

            // if ((hasPattern || nextVertex && isOut(nextVertex, EXTENT)) &&
            // if (i > first && i < len - 1 || isPolygon && i === first) {
            //     if (hasPattern) {
            //         delete this._inLineJoin;
            //         //1. 为了实现dasharray，需要在join前后添加两个新端点，以保证计算dasharray时，linesofar的值是正确的
            //         //2. 后一个端点在瓦片外时，额外增加一个端点，以免因为join和端点共用aPosition，瓦片内的像素会当做超出瓦片而被discard
            //         //端点往前移动forward距离，以免新端点和lineJoin产生重叠
            //         const forward = this.feaJoinPatternMode ? 0 : nextNormal.mag() * cosHalfAngle;
            //         this.addCurrentVertex(currentVertex, nextNormal, forward, forward, segment);
            //     }
            // }
        }
    }

    ensureDataCapacity(join, vertexCount, approxAngle, halfVertexCount) {
        const n = join === 'round' ? Math.round(approxAngle / DEG_PER_TRIANGLE) - 1: 0;
        // 6: max count of addCurrentVertex
        // n: fakeround's addCurrentVertex
        // 2: addCurrentVertex = 2 * addHalfVertex
        super.ensureDataCapacity((6 + n) * halfVertexCount, vertexCount)
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
        let leftNormalDistance = 0;
        let rightNormalDistance = 0;
        if (segment.middleVertex) {
            TEMP_NORMAL_1.x = leftX;
            TEMP_NORMAL_1.y = leftY;
            TEMP_NORMAL_2.x = rightX;
            TEMP_NORMAL_2.y = rightY;
            const segLeftNormal = segment.currentNormal;
            // debugger
            leftNormalDistance = getNormalDistance(segLeftNormal, TEMP_NORMAL_1);
            if (endLeft === 0 && endRight === 0) {
                // endLeft和endRight为0时，rightNormalDistance一定是-leftNormalDistance
                // miter时能保证计算正确
                rightNormalDistance = -leftNormalDistance;
            } else {
                // miter时 rightNormalDistance 的计算是错误的
                const segRightNormal = TEMP_NORMAL_3;
                segRightNormal.x = segLeftNormal.x;
                segRightNormal.y = segLeftNormal.y;
                segRightNormal._mult(-1);
                rightNormalDistance = getNormalDistance(segRightNormal, TEMP_NORMAL_2);
            }
        }
        this.addHalfVertex(p, leftX, leftY, round, false, endLeft, segment, leftNormalDistance);
        this.addHalfVertex(p, rightX, rightY, round, true, -endRight, segment, rightNormalDistance);

        if (!this.prevVertex || !equalPoint(p, this.prevVertex)) {
            this.prevVertex = p;
        }
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

    addHalfVertex({ x, y, z }, extrudeX, extrudeY, round, up, dir, segment, normalDistance) {
        // scale down so that we can store longer distances while sacrificing precision.
        const linesofar = this.scaledDistance * LINE_DISTANCE_SCALE;

        this.fillData(this.data, x, y, z || 0, extrudeX, extrudeY, round, up, linesofar, normalDistance);

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
    fillData(data, x, y, altitude, extrudeX, extrudeY, round, up, linesofar, normalDistance) {
        const { lineWidthFn, lineStrokeWidthFn, lineStrokeColorFn, lineColorFn, lineOpacityFn, lineDxFn, lineDyFn, linePatternAnimSpeedFn, linePatternGapFn } = this._fnTypes;
        // debugger
        // if (this.options.center) {
        //     // data.aPosition.push(x, y, 0);
        //     this.fillPosition(data, x, y, altitude);
        // } else {
        //     // x = (x << 1) + (round ? 1 : 0);
        //     // y = (y << 1) + (up ? 1 : 0);
        //     this.fillPosition(data, x, y, altitude);
        //     // data.aPosition.push(x, y, 0);
        // }
        this.fillPosition(data, x, y, altitude);
        let aExtrudeX = EXTRUDE_SCALE * extrudeX;
        // 牺牲一些extrude的精度 1/63，把round和up存在extrude中
        // 用最后一位存round
        aExtrudeX = (Math.sign(aExtrudeX) || 1) * (((Math.floor(Math.abs(aExtrudeX)) >> 1) << 1) + (+round));
        let aExtrudeY = EXTRUDE_SCALE * extrudeY;
        // 用最后一位存up
        aExtrudeY = (Math.sign(aExtrudeY) || 1) * (((Math.floor(Math.abs(aExtrudeY)) >> 1) << 1) + (+up));

        let index = data.aExtrude.currentIndex;
        data.aExtrude[index++] = aExtrudeX;
        data.aExtrude[index++] = aExtrudeY;

        if (this.iconAtlas || this.hasDasharray) {
            data.aExtrude[index++] = EXTRUDE_SCALE * normalDistance;
        }
        data.aExtrude.currentIndex = index;

        index = data.aLinesofar.currentIndex;
        data.aLinesofar[index++] = linesofar;
        data.aLinesofar.currentIndex = index;

        if (lineWidthFn) {
            //乘以2是为了解决 #190
            index = data.aLineWidth.currentIndex;
            data.aLineWidth[index++] = Math.round(this.feaLineWidth * 2);
            data.aLineWidth.currentIndex = index;
        }
        if (lineStrokeWidthFn) {
            //乘以2是为了解决 #190
            index = data.aLineStrokeWidth.currentIndex;
            data.aLineStrokeWidth[index++] = Math.round(this.feaLineStrokeWidth * 2);
            data.aLineStrokeWidth.currentIndex = index;
        }
        if (lineColorFn) {
            index = data.aColor.currentIndex;
            data.aColor[index++] = this.feaColor[0];
            data.aColor[index++] = this.feaColor[1];
            data.aColor[index++] = this.feaColor[2];
            data.aColor[index++] = this.feaColor[3];
            data.aColor.currentIndex = index;
        }
        if (lineStrokeColorFn) {
            index = data.aStrokeColor.currentIndex;
            data.aStrokeColor[index++] = this.feaStrokeColor[0];
            data.aStrokeColor[index++] = this.feaStrokeColor[1];
            data.aStrokeColor[index++] = this.feaStrokeColor[2];
            data.aStrokeColor[index++] = this.feaStrokeColor[3];
            data.aStrokeColor.currentIndex = index;
        }
        if (lineOpacityFn) {
            index = data.aOpacity.currentIndex;
            data.aOpacity[index++] = this.feaOpacity;
            data.aOpacity.currentIndex = index;
        }
        if (this.dasharrayFn) {
            index = data.aDasharray.currentIndex;
            data.aDasharray[index++] = this.feaDash[0];
            data.aDasharray[index++] = this.feaDash[1];
            data.aDasharray[index++] = this.feaDash[2];
            data.aDasharray[index++] = this.feaDash[3];
            data.aDasharray.currentIndex = index;
        }
        if (this.dashColorFn) {
            index = data.aDashColor.currentIndex;
            data.aDashColor[index++] = this.feaDashColor[0];
            data.aDashColor[index++] = this.feaDashColor[1];
            data.aDashColor[index++] = this.feaDashColor[2];
            data.aDashColor[index++] = this.feaDashColor[3];
            data.aDashColor.currentIndex = index;
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
            index = data.aTexInfo.currentIndex;
            data.aTexInfo[index++] = this.feaTexInfo[0];
            data.aTexInfo[index++] = this.feaTexInfo[1];
            data.aTexInfo[index++] = this.feaTexInfo[2];
            data.aTexInfo[index++] = this.feaTexInfo[3];
            data.aTexInfo.currentIndex = index;
        }
        if (lineDxFn || lineDyFn) {
            index = data.aLineDxDy.currentIndex;
            data.aLineDxDy[index++] = this.feaLineDx || 0;
            data.aLineDxDy[index++] = this.feaLineDy || 0;
            data.aLineDxDy.currentIndex = index;
        }
        // if (lineDyFn) {
        //     data.aLineDy.push(this.feaLineDy);
        // }
        if (linePatternAnimSpeedFn || linePatternGapFn) {
            index = data.aLinePattern.currentIndex;
            data.aLinePattern[index++] = (this.feaPatternAnimSpeed || 0) * 127;
            data.aLinePattern[index++] = (this.feaLinePatternGap || 0) * 10;
            data.aLinePattern.currentIndex = index;
        }
        // if (linePatternGapFn) {
        //     // 0 - 25.5
        //     data.aLinePatternGap.push(this.feaLinePatternGap * 10);
        // }
        this.maxPos = Math.max(this.maxPos, Math.abs(x) + 1, Math.abs(y) + 1);
    }

    addElements(e1, e2, e3) {
        super.addElements(this.offset + e1, this.offset + e2, this.offset + e3);
    }

    _filterPolygonEdges(elements) {
        const EXTENT = this.options['EXTENT'];
        const edges = this.elements;
        const positionSize = 3;
        for (let i = 0; i < edges.length; i += 3) {
            if (EXTENT === Infinity || !isClippedLineEdge(this.data.aPosition, edges[i], edges[i + 1], positionSize, EXTENT) &&
                !isClippedLineEdge(this.data.aPosition, edges[i + 1], edges[i + 2], positionSize, EXTENT)) {
                // elements.push(edges[i], edges[i + 1], edges[i + 2]);
                let index = elements.currentIndex;
                elements[index++] = edges[i];
                elements[index++] = edges[i + 1];
                elements[index++] = edges[i + 2];
                elements.currentIndex = index;
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
        if (this.options['isTube']) {
            const d = prev.dist(next);
            const altitudeToLocal = getAltitudeToLocal(this.options);
            const dz = altitudeToLocal * (next.z - prev.z);
            this.distance += Math.sqrt(d * d + dz * dz);
        } else {
            this.distance += prev.dist(next);
        }

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

    // updateClipStartDistance() {
    //     this.distance = this.clipStart * this.totalDistance / (this.clipEnd - this.clipStart);
    // }
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
        const properties = features[i].properties;
        const hasDash = fn(zoom, properties);
        if (hasDash) {
            return true;
        }
    }
    return false;
}

const ORIGINZERO = new Point(0, 0);

function getNormalDistance(perp, normal) {
    const x = perp.mag();
    const z = normal.mag();
    const perpAngle = perp.angleTo(ORIGINZERO);
    const normalAngle = normal.angleTo(ORIGINZERO);
    const sign = Math.sign(normalAngle - perpAngle);
    return sign * Math.sqrt(z * z - x * x);
}

function equalPoint(p1, p2) {
    return p1.equals(p2) && p1.z === p2.z;
}
