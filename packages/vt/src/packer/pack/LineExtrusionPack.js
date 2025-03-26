import { default as LinePack, EXTRUDE_SCALE }  from './LinePack';
// import { vec3, vec4 } from 'gl-matrix';
import { buildNormals } from '@maptalks/tbn-packer';
import { getPosArrayType } from './util/array';
import { getFeaAltitudeAndHeight } from './util/util';

const ALTITUDE_SCALE = 32767;

export default class LineExtrusionPack extends LinePack {

    constructor(features, symbol, options) {
        super(features, symbol, options);
        this._hasALineHeight = options.altitudeProperty;
    }

    getFormat() {
        const { lineColorFn, lineWidthFn } = this._fnTypes;
        const maxZValue = Math.max(Math.abs(this.maxPosZ), Math.abs(this.minPosZ));
        const positionCTOR = maxZValue >= Math.pow(2, 15) ? Float32Array : Int16Array;
        const format = [
            {
                type: positionCTOR,
                width: 3,
                name: 'aPosition'
            },
            {
                type: Uint16Array,
                width: 1,
                name: 'aLinesofar'
            },
            {
                type: Uint8Array,
                width: 1,
                name: 'aUp'
            },
            {
                type: Int16Array,
                width: 3,
                name: 'aExtrudedPosition'
            },
            {
                type: Int8Array,
                width: 2,
                name: 'aExtrude'
            },
        ];
        if (lineColorFn) {
            format.push(
                {
                    type: Uint8Array,
                    width: 4,
                    name: 'aColor'
                }
            );
        }
        if (lineWidthFn) {
            format.push(
                {
                    type: Uint8Array,
                    width: 1,
                    name: 'aLineWidth'
                }
            );
        }
        if (this._hasALineHeight) {
            format.push(
                {
                    type: Float32Array,
                    width: 1,
                    name: 'aLineHeight'
                }
            );
        }
        return format;
    }

    placeVector(line) {
        const feature = line.feature;
        if (this._hasALineHeight) {
            const { altitudeScale, altitudeProperty, defaultAltitude, heightProperty, defaultHeight, minHeightProperty } = this.options;
            const { altitude, height } = getFeaAltitudeAndHeight(feature, altitudeScale, altitudeProperty, defaultAltitude, heightProperty, defaultHeight, minHeightProperty);
            this.feaAltitude = altitude;
            this.feaMinHeight = (altitude - height) / altitude * ALTITUDE_SCALE;
            if (altitude > this.maxAltitude) {
                this.maxAltitude = altitude;
            }
        }
        return super.placeVector(line);
    }

    needAltitudeAttribute() {
        return false;
    }

    _addLine(vertices, feature, join, cap, miterLimit, roundLimit) {
        const positionSize = 3;
        const prevCount = this.data.aPosition.getLength() / positionSize;

        super._addLine(vertices, feature, join, cap, miterLimit, roundLimit);
        const currentCount = this.data.aPosition.getLength() / positionSize;
        const end0 = this.data.aPosition.getLength() / positionSize - this.offset;
        const isPolygon = feature.type === 3; //POLYGON)
        // debugger
        const generateSide = this.options['side'] !== false;
        if (!isPolygon && end0 > 0 && generateSide) {
            const generateTop = this.options['top'] !== false;
            const topLength = generateTop ? 1 : 0;
            const sideLenth = 4;
            const vertexLength = topLength + sideLenth;
            // const length = this.data.length;
            //封闭两端
            //在data末尾补充首尾两端的端点

            //line开始时顶点顺序: down0, down0-底, up0, up0-底
            let count = (this.data.aPosition.getLength() / positionSize);
            for (const p in this.data) {
                const arr = this.data[p];
                const width = arr.getLength() / count;
                let index = arr.currentIndex;
                for (let i = 0; i < width; i++) {
                    arr[index++] = arr[prevCount * width + width * 3 + i];
                    // arr.push(arr[prevCount * width + width * 3 + i]);
                }
                arr.currentIndex = index;
            }

            //down0
            count = (this.data.aPosition.getLength() / positionSize);
            for (const p in this.data) {
                const arr = this.data[p];
                const width = arr.getLength() / count;
                let index = arr.currentIndex;
                for (let i = 0; i < width; i++) {
                    // arr.push(arr[prevCount * width + width * vertexLength + i]);
                    arr[index++] = arr[prevCount * width + width * vertexLength + i];
                }
                arr.currentIndex = index;
            }

            //down1
            count = (this.data.aPosition.getLength() / positionSize);
            for (const p in this.data) {
                const arr = this.data[p];
                const width = arr.getLength() / count;
                let index = arr.currentIndex;
                for (let i = 0; i < width; i++) {
                    // arr.push(arr[prevCount * width + width * (vertexLength + 3) + i]);
                    arr[index++] = arr[prevCount * width + width * (vertexLength + 3) + i];
                }
                arr.currentIndex = index;
            }


            //第一个up0的第二条数据(没人用),down0, up1
            super.addElements(topLength + 1, end0 + 1, end0);
            //up1, down0, dow1
            super.addElements(end0, end0 + 1, end0 + 2);

            const end1 = this.data.aPosition.getLength() / positionSize - this.offset;

            //line结束的顶点顺序: down1, down1底, up1, up1底
            //up1底
            count = (this.data.aPosition.getLength() / positionSize);
            for (const p in this.data) {
                const arr = this.data[p];
                const width = arr.getLength() / count;
                let index = arr.currentIndex;
                for (let i = 0; i < width; i++) {
                    // arr.push(arr[currentCount * width - width + i]);
                    arr[index++] = arr[currentCount * width - width + i];
                }
                arr.currentIndex = index;
            }


            //down1底
            count = (this.data.aPosition.getLength() / positionSize);
            for (const p in this.data) {
                const arr = this.data[p];
                const width = arr.getLength() / count;
                let index = arr.currentIndex;
                for (let i = 0; i < width; i++) {
                    // arr.push(arr[currentCount * width - vertexLength * width - width + i]);
                    arr[index++] = arr[currentCount * width - vertexLength * width - width + i];
                }
                arr.currentIndex = index;
            }

            //down1
            count = (this.data.aPosition.getLength() / positionSize);
            for (const p in this.data) {
                const arr = this.data[p];
                const width = arr.getLength() / count;
                let index = arr.currentIndex;
                for (let i = 0; i < width; i++) {
                    // arr.push(arr[currentCount * width - vertexLength * width - 3 * width + i]);
                    arr[index++] = arr[currentCount * width - vertexLength * width - 3 * width + i];
                }
                arr.currentIndex = index;
            }

            //up1底，(addLine中添加的没人用的up1), down1底
            super.addElements(end1, end0 - 3, end1 + 1);
            //(addLine中添加的没人用的up1), down1， down1底
            super.addElements(end0 - 3, end1 + 2, end1 + 1);

        }
    }

    fillData(data, x, y, altitude, extrudeX, extrudeY, round, up, linesofar) {
        const generateTop = this.options['top'] !== false;
        const generateSide = this.options['side'] !== false;

        const tileScale = this.options['EXTENT'] / this.options['tileSize'];
        const lineWidth = this.feaLineWidth || this.symbol['lineWidth'] / 2 * tileScale;

        const aExtrudeX = EXTRUDE_SCALE * extrudeX;
        const aExtrudeY = EXTRUDE_SCALE * extrudeY;
        //只用于计算uv和tangent
        const extrudedPointX = lineWidth * extrudeX + x;
        const extrudedPointY = lineWidth * extrudeY + y;
        this._fillTop(data, x, y, extrudeX, extrudeY, round, up, linesofar, extrudedPointX, extrudedPointY, aExtrudeX, aExtrudeY);

        if (generateSide) {
            if (generateTop) {
                this._fillTop(data, x, y, extrudeX, extrudeY, round, up, linesofar, extrudedPointX, extrudedPointY, aExtrudeX, aExtrudeY);
            }
            this._fillTop(data, x, y, extrudeX, extrudeY, round, up, linesofar, extrudedPointX, extrudedPointY, aExtrudeX, aExtrudeY);

            this._fillBottom(data, x, y, extrudeX, extrudeY, round, up, linesofar, extrudedPointX, extrudedPointY, aExtrudeX, aExtrudeY);
            this._fillBottom(data, x, y, extrudeX, extrudeY, round, up, linesofar, extrudedPointX, extrudedPointY, aExtrudeX, aExtrudeY);
        }

        this.maxPos = Math.max(this.maxPos, Math.abs(x), Math.abs(y));
    }

    _fillTop(data, x, y, extrudeX, extrudeY, round, up, linesofar, extrudedPointX, extrudedPointY, aExtrudeX, aExtrudeY) {
        const { lineColorFn, lineWidthFn } = this._fnTypes;
        // data.aPosition.push(x, y, ALTITUDE_SCALE);
        let index = data.aPosition.currentIndex;
        data.aPosition[index++] = x;
        data.aPosition[index++] = y;
        data.aPosition[index++] = ALTITUDE_SCALE;
        data.aPosition.currentIndex = index;

        // data.aLinesofar.push(linesofar);
        index = data.aLinesofar.currentIndex;
        data.aLinesofar[index++] = linesofar;
        data.aLinesofar.currentIndex = index;

        // data.aUp.push(+up);
        index = data.aUp.currentIndex;
        data.aUp[index++] = +up;
        data.aUp.currentIndex = index;

        // data.aExtrudedPosition.push(extrudedPointX, extrudedPointY, 1);
        index = data.aExtrudedPosition.currentIndex;
        data.aExtrudedPosition[index++] = extrudedPointX;
        data.aExtrudedPosition[index++] = extrudedPointY;
        data.aExtrudedPosition[index++] = 1;
        data.aExtrudedPosition.currentIndex = index;

        // data.aExtrude.push(aExtrudeX, aExtrudeY);
        index = data.aExtrude.currentIndex;
        data.aExtrude[index++] = aExtrudeX;
        data.aExtrude[index++] = aExtrudeY;
        data.aExtrude.push(aExtrudeX, aExtrudeY);
        if (lineColorFn) {
            // data.aColor.push(...this.feaColor);
            index = data.aColor.currentIndex;
            data.aColor[index++] = this.feaColor[0];
            data.aColor[index++] = this.feaColor[1];
            data.aColor[index++] = this.feaColor[2];
            data.aColor[index++] = this.feaColor[3];
            data.aColor.currentIndex = index;
        }
        if (lineWidthFn) {
            //乘以2是为了解决 #190
            // data.aLineWidth.push(Math.round(this.feaLineWidth * 2));
            index = data.aLineWidth.currentIndex;
            data.aLineWidth[index++] = Math.round(this.feaLineWidth * 2);
            data.aLineWidth.currentIndex = index;
        }
        if (this._hasALineHeight) {
            // data.aLineHeight.push(this.feaAltitude);
            index = data.aLineHeight.currentIndex;
            data.aLineHeight[index++] = this.feaAltitude;
            data.aLineHeight.currentIndex = index;
        }
    }

    _fillBottom(data, x, y, extrudeX, extrudeY, round, up, linesofar, extrudedPointX, extrudedPointY, aExtrudeX, aExtrudeY) {
        const { lineColorFn, lineWidthFn } = this._fnTypes;
        // data.aPosition.push(x, y, this.feaMinHeight || 0);
        let index = data.aPosition.currentIndex;
        data.aPosition[index++] = x;
        data.aPosition[index++] = y;
        data.aPosition[index++] = this.feaMinHeight || 0;
        data.aPosition.currentIndex = index;

        // data.aLinesofar.push(linesofar);
        index = data.aLinesofar.currentIndex;
        data.aLinesofar[index++] = linesofar;
        data.aLinesofar.currentIndex = index;

        // data.aUp.push(+up);
        index = data.aUp.currentIndex;
        data.aUp[index++] = +up;
        data.aUp.currentIndex = index;

        // data.aExtrudedPosition.push(extrudedPointX, extrudedPointY, 1);
        index = data.aExtrudedPosition.currentIndex;
        data.aExtrudedPosition[index++] = extrudedPointX;
        data.aExtrudedPosition[index++] = extrudedPointY;
        data.aExtrudedPosition[index++] = 1;
        data.aExtrudedPosition.currentIndex = index;

        // data.aExtrude.push(aExtrudeX, aExtrudeY);
        index = data.aExtrude.currentIndex;
        data.aExtrude[index++] = aExtrudeX;
        data.aExtrude[index++] = aExtrudeY;
        data.aExtrude.push(aExtrudeX, aExtrudeY);

        if (lineColorFn) {
            // data.aColor.push(...this.feaColor);
            index = data.aColor.currentIndex;
            data.aColor[index++] = this.feaColor[0];
            data.aColor[index++] = this.feaColor[1];
            data.aColor[index++] = this.feaColor[2];
            data.aColor[index++] = this.feaColor[3];
            data.aColor.currentIndex = index;
        }
        if (lineWidthFn) {
            //乘以2是为了解决 #190
            // data.aLineWidth.push(Math.round(this.feaLineWidth * 2));
            index = data.aLineWidth.currentIndex;
            data.aLineWidth[index++] = Math.round(this.feaLineWidth * 2);
            data.aLineWidth.currentIndex = index;
        }
        if (this._hasALineHeight) {
            // data.aLineHeight.push(this.feaAltitude);
            index = data.aLineHeight.currentIndex;
            data.aLineHeight[index++] = this.feaAltitude;
            data.aLineHeight.currentIndex = index;
        }
    }

    //2020-40-25之前版本用到的方法
    // addLineVertex(data, point, normal, extrude, round, up, linesofar) {
    //     // debugger
    //     const tileScale = this.options['EXTENT'] / this.options['tileSize'];
    //     const lineWidth = this.feaLineWidth || this.symbol['lineWidth'] / 2 * tileScale;

    //     const aExtrudeX = EXTRUDE_SCALE * extrude.x;
    //     const aExtrudeY = EXTRUDE_SCALE * extrude.y;
    //     //只用于计算uv和tangent
    //     const extrudedPoint = new Point(lineWidth * extrude.x, lineWidth * extrude.y)._add(point);
    //     // const height = this.symbol['lineHeight'];

    //     data.push(point.x, point.y, 1, linesofar, +up, extrudedPoint.x, extrudedPoint.y, 1, aExtrudeX, aExtrudeY);
    //     if (this.colorFn) {
    //         data.push(...this.feaColor);
    //     }
    //     if (this.lineWidthFn) {
    //         //乘以2是为了解决 #190
    //         data.push(Math.round(this.feaLineWidth * 2));
    //     }
    //     if (this.heightFn) {
    //         data.push(this.feaHeight);
    //     }
    //     data.push(point.x, point.y, 0, linesofar, +up, extrudedPoint.x, extrudedPoint.y, 0, aExtrudeX, aExtrudeY);
    //     if (this.colorFn) {
    //         data.push(...this.feaColor);
    //     }
    //     if (this.lineWidthFn) {
    //         //乘以2是为了解决 #190
    //         data.push(Math.round(this.feaLineWidth * 2));
    //     }
    //     if (this.heightFn) {
    //         data.push(this.feaHeight);
    //     }

    //     this.maxPos = Math.max(this.maxPos, Math.abs(point.x), Math.abs(point.y));
    // }

    addElements(e1, e2, e3) {
        const generateTop = this.options['top'] !== false;
        const generateSide = this.options['side'] !== false;
        const topLength = generateTop ? 1 : 0;
        const sideLenth = generateSide ? 4 : 0;
        const length = topLength + sideLenth;

        const offset = this.offset;
        //顶点插入的顺序是 1. down0, up0, down1, 2. up0, down1, up1
        //    up0  ____  up1
        //  down0 |____| down1
        // const { vertexLength } = this;
        //*2 是因为不同于 LinePack, LineExtrusionPack 在addLineVertex方法中会为每个端点插入两个vertex (0和height)
        e1 *= length;
        e2 *= length;
        e3 *= length;
        const up = this.data.aUp[(offset + e3) + 4];
        if (up) {
            //2020-04-23 mapbox-gl-js新的lineBucket修改了e1,e2,e3的顺序，所以这里e1和e2交换了位置
            if (generateTop) {
                //顶点的添加顺序：up0, down1, up1
                super.addElements(e2, e1, e3);
            }
            if (generateSide) {
                const offset = generateTop ? 1 : 0;
                //侧面按顺时针(因为在背面)
                //up0, up1, up1-底
                super.addElements(e2 + offset, e3 + offset, e3 + offset + 2);
                // console.log(this.data.length / formatWidth, e2 + offset, e3 + offset, e3 + offset + 2);
                //up0, up1-底, up0-底
                super.addElements(e2 + offset + 1, e3 + offset + 1 + 2, e2 + offset + 1 + 2);
                // console.log(this.data.length / formatWidth, e2 + offset + 1, e3 + offset + 1 + 2, e2 + offset + 1 + 2);
            }
        } else {
            //参数中的顺序down0, up0, down1
            if (generateTop) {
                //添加的顺序(变成逆时针): down0, down1, up0
                super.addElements(e1, e3, e2);
            }
            if (generateSide) {
                const offset = (generateTop ? 1 : 0);
                //down0, down0-底， down1
                super.addElements(e1 + offset, e1 + offset + 2, e3 + offset);
                // console.log(this.data.length / formatWidth, e1 + offset, e1 + offset + 2, e3 + offset);
                //down0-底， down1-底， down1
                super.addElements(e1 + offset + 1 + 2, e3 + offset + 1 + 2, e3 + offset + 1);
                // console.log(this.data.length / formatWidth, e1 + offset + 1 + 2, e3 + offset + 1 + 2, e3 + offset + 1);
            }
        }
    }

    createDataPack(vectors, scale) {
        this.maxAltitude = 0;
        // debugger
        const pack = super.createDataPack(vectors, scale);
        if (!pack) {
            return pack;
        }
        const { data, indices } = pack;
        const format = this.getFormat();
        const description = format.reduce((accumulator, currentValue) => {
            accumulator[currentValue.name] = {
                size: currentValue.width
            };
            return accumulator;
        }, {});
        description.aPickingId = { size: 1 };
        const { aExtrudedPosition, aPosition, aLinesofar, aUp, aExtrude,
            aColor, aLineHeight, aLineWidth } = data;
        const arrays = {};
        const normals = buildNormals(aExtrudedPosition, indices);
        //因为line的三角形旋转方向是反的，所以normal的结果需要取反
        let simpleNormal = true;
        for (let i = 0; i < normals.length; i++) {
            normals[i] = -normals[i];
            if (normals[i] % 1 !== 0) {
                simpleNormal = false;
            }
        }
        let uvs;
        let tangents;
        if (this.options['top'] !== false && this.symbol['material'] && hasTexture(this.symbol['material'])) {
            //只给顶面顶点生成uv坐标
            uvs = buildUVS(aExtrudedPosition, aLinesofar, aUp);

            // tangents = buildTangents(aExtrudedPosition, normals, uvs, indices);
            // tangents = createQuaternion(normals, tangents);
        }
        arrays['aPosition'] = aPosition;
        if (tangents) {
            arrays['aTexCoord0'] = new Float32Array(uvs);
            arrays['aTangent'] = tangents;
        } else {
            if (uvs) {
                arrays['aTexCoord0'] = new Float32Array(uvs);
            }
            //只有side需要aNormal
            arrays['aNormal'] = simpleNormal ? new Int8Array(normals) : new Float32Array(normals);
        }
        arrays['aPickingId'] = data.aPickingId;
        arrays['aExtrude'] = aExtrude;
        if (aColor) {
            arrays['aColor'] = aColor;
        }
        if (aLineWidth) {
            arrays['aLineWidth'] = aLineWidth;
        }
        if (aLineHeight) {
            const ArrType = getPosArrayType(this.maxAltitude);
            arrays['aLineHeight'] = new ArrType(aLineHeight);
        }
        const buffers = [];
        for (const p in arrays) {
            buffers.push(arrays[p].buffer);
        }
        pack.data = arrays;
        pack.buffers = buffers;

        // const indices0 = indices.subarray(33, 36);
        // const arrays0 = {};
        // const count = data.aPosition.length / positionSize;
        // for (const p in arrays) {
        //     const size = arrays[p].length / count;
        //     const shortened = new arrays[p].constructor(size * 3);
        //     for (let i = 0; i < indices0.length; i++) {
        //         const idx = indices0[i];
        //         for (let ii = 0; ii < size; ii++) {
        //             shortened[i * size + ii] = arrays[p][idx * size + ii];
        //         }
        //     }
        //     arrays0[p] = shortened;
        // }
        // pack.data = arrays0;
        // pack.indices = new Uint8Array([0, 1, 2]);
        // debugger

        return pack;
    }
}

function buildUVS(vertexes, aLinesofar, ups) {
    const TWIDTH = 256;
    // let maxUv = -Infinity;
    const uvs = [];
    for (let i = 0; i < vertexes.length; i += 3) {
        const dist = aLinesofar[i / 3];

        const up = ups[i / 3];
        if (up) {
            uvs.push(dist / TWIDTH, 1);
        } else {
            uvs.push(dist / TWIDTH, 0);
        }
    }
    return uvs;
}

// function createQuaternion(normals, tangents) {
//     const aTangent = new Float32Array(tangents.length);
//     const t = [], n = [], q = [];
//     for (let i = 0; i < tangents.length; i += 4) {
//         const ni = i / 4 * 3;
//         vec3.set(n, normals[ni], normals[ni + 1], normals[ni + 2]);
//         vec4.set(t, tangents[i], tangents[i + 1], tangents[i + 2], tangents[i + 3]);
//         packTangentFrame(q, n, t);
//         vec4.copy(aTangent.subarray(i, i + 4), q);
//     }
//     return aTangent;
// }

function hasTexture(material) {
    for (const p in material) {
        if (p.indexOf('Texture') >= 0 && material[p]) {
            return true;
        }
    }
    return false;
}
