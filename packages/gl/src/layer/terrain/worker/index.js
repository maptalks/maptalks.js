import { Ajax } from '@maptalks/gltf-loader';
import "./zlib.min";
import { vec2, vec3 } from '@maptalks/reshader.gl';
import { createMartiniData } from '../util/martini';
import { ColorIn } from 'colorin';
// 保存当前的workerId，用于告知主线程结果回传给哪个worker
let workerId;

let BITMAP_CANVAS = null;
let BITMAP_CTX = null;
const TEMP_RGB = [0, 0, 0];
const DEFAULT_TILESIZE = [256, 256];

function checkBitMapCanvas() {
    try {
        if (!BITMAP_CANVAS) {
            BITMAP_CANVAS = new OffscreenCanvas(1, 1);
        }
    } catch (error) {
        console.error(error);
    }
}

const colorInCache = {};

const terrainRequests = {};

const terrainStructure = {
    width: 64,
    height: 64,
    elementsPerHeight: 3,
    heightOffset: -1000,
    exaggeration: 1.0,
    heightScale: 0.001,
    elementMultiplier: 256,
    stride: 4,
    skirtHeight: 0.002,
    skirtOffset: 0.01 //用于减少地形瓦片之间的缝隙
}
const requestHeaders = {
    'cesium_request_token': {
        'Accept': "application/json,*/*;q=0.01",
        'Accept-Encoding': 'gzip, deflate, br'
    },
    'tianditu': {
        'Accept-Encoding': 'gzip, deflate, br'
    },
    'cesium': {
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'application/vnd.quantized-mesh,application/octet-stream;q=0.9,*/*;q=0.01'
    },
    'mapbox': {
        'Accept': 'image/webp,*/*'
    }
};
requestHeaders['cesium-ion'] = requestHeaders['cesium'];
const maxShort = 32767;
let cesium_access_token = null;
let cesiumAccessTokenPromise = null;
function load(url, headers, origin) {
    const options = {
        method: 'GET',
        referrer: origin,
        headers
    };
    const promise = Ajax.getArrayBuffer(url, options);
    const controller = promise.xhr;
    terrainRequests[url] = controller;
    return promise.then(res => {
        delete terrainRequests[url];
        return res;
    });
}

function abort(url) {
    if (terrainRequests[url]) {
        terrainRequests[url].abort();
        delete terrainRequests[url];
    }
}

function createHeightMap(heightmap, terrainWidth/*, exag*/) {
    const width = terrainWidth, height = terrainWidth;
    const endRow = width + 1, endColum = height + 1;
    const elementsPerHeight = terrainStructure.elementsPerHeight;
    const heightOffset = terrainStructure.heightOffset;
    const exaggeration = 1;//terrainStructure.exaggeration || exag;
    const heightScale = terrainStructure.heightScale;
    const elementMultiplier = terrainStructure.elementMultiplier;
    const stride = 4;
    const skirtHeight = terrainStructure.skirtHeight;
    const heights = new Float32Array(endRow * endColum);
    let index = 0;
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < endRow; i++) {
        const row = i >= height ? height - 1 : i;
        for (let j = 0; j < endColum; j++) {
            const colum = j >= width ? width - 1 : j;
            let heightSample = 0;
            const terrainOffset = row * (width * stride) + colum * stride;
            for (let elementOffset = 0; elementOffset < elementsPerHeight; elementOffset++) {
                heightSample = (heightSample * elementMultiplier) + heightmap[terrainOffset + elementOffset];
            }
            heightSample = (heightSample * heightScale + heightOffset) * exaggeration;
            heightSample -= skirtHeight;
            heights[index] = heightSample;
            if (heightSample < min) {
                min = heightSample;
            }
            if (heightSample > max) {
                max = heightSample;
            }
            index++;
        }
    }
    return { data: heights, min, max };
}

function decZlibBuffer(zBuffer) {
    if (zBuffer.length < 1000) {
        return null;
    }
    //eslint-disable-next-line
    const inflate = new Zlib.Inflate(zBuffer);

    if (inflate) {
        return inflate.decompress();
    }
    return null;
}

function transformBuffer(zlibData) {
    const DataSize = 2;
    const dZlib = zlibData;
    const height_buffer = new ArrayBuffer(DataSize);
    const height_view = new DataView(height_buffer);

    const myW = terrainStructure.width;
    const myH = terrainStructure.height;
    const myBuffer = new Uint8Array(myW * myH * terrainStructure.stride);

    let i_height;
    let NN, NN_R;
    let jj_n, ii_n;
    for (let jj = 0; jj < myH; jj++) {
        for (let ii = 0; ii < myW; ii++) {
            jj_n = parseInt((149 * jj) / (myH - 1));
            ii_n = parseInt((149 * ii) / (myW - 1));
            if (DataSize === 4) {
                NN = DataSize * (jj_n * 150 + ii_n);
                height_view.setInt8(0, dZlib[NN]);
                height_view.setInt8(1, dZlib[NN + 1]);
                height_view.setInt8(2, dZlib[NN + 2]);
                height_view.setInt8(3, dZlib[NN + 3]);
                i_height = height_view.getFloat32(0, true);

            } else {
                NN = DataSize * (jj_n * 150 + ii_n);
                i_height = dZlib[NN] + (dZlib[NN + 1] * 256);
            }
            if (i_height > 10000 || i_height < -2000) {//低于海平面2000，高于地面10000
                i_height = 0;
            }
            NN_R = (jj * myW + ii) * 4;
            const i_height_new = (i_height + 1000) / terrainStructure.heightScale;
            const elementMultiplier = terrainStructure.elementMultiplier;
            myBuffer[NN_R] = i_height_new / (elementMultiplier * elementMultiplier);
            myBuffer[NN_R + 1] = (i_height_new - myBuffer[NN_R] * elementMultiplier * elementMultiplier) / elementMultiplier;
            myBuffer[NN_R + 2] = i_height_new - myBuffer[NN_R] * elementMultiplier * elementMultiplier - myBuffer[NN_R + 1] * elementMultiplier;
            myBuffer[NN_R + 3] = 255;
        }
    }
    return myBuffer;
}

function generateTiandituTerrain(buffer, terrainWidth) {
    const zBuffer = new Uint8Array(buffer);

    const dZlib = decZlibBuffer(zBuffer);
    if (!dZlib) {
        throw new Error(uint8ArrayToString(new Uint8Array(buffer)));
    }
    const heightBuffer = transformBuffer(dZlib);
    const heights = createHeightMap(heightBuffer, terrainWidth - 1);
    heights.width = heights.height = terrainWidth;
    return heights;
}


const textDecoder = new TextDecoder('utf-8');
function uint8ArrayToString(fileData) {
    return textDecoder.decode(fileData);
}

function zigZagDecode(value) {
    return (value >> 1) ^ -(value & 1);
}

function lerp(p, q, time) {
    return (1.0 - time) * p + time * q;
}

const POSITIONS = [];

function generateCesiumTerrain(buffer) {
    // cesium 格式说明：
    // https://www.cnblogs.com/oloroso/p/11080222.html
    let pos = 0;
    const cartesian3Elements = 3;
    // const boundingSphereElements = cartesian3Elements + 1;
    const cartesian3Length = Float64Array.BYTES_PER_ELEMENT * cartesian3Elements;
    // const boundingSphereLength =
    // Float64Array.BYTES_PER_ELEMENT * boundingSphereElements;
    const encodedVertexElements = 3;
    const encodedVertexLength =
        Uint16Array.BYTES_PER_ELEMENT * encodedVertexElements;
    const triangleElements = 3;
    let bytesPerIndex = Uint16Array.BYTES_PER_ELEMENT;

    const view = new DataView(buffer);
    pos += cartesian3Length;

    const minimumHeight = view.getFloat32(pos, true);
    pos += Float32Array.BYTES_PER_ELEMENT;
    const maximumHeight = view.getFloat32(pos, true);
    pos += Float32Array.BYTES_PER_ELEMENT;
    pos += cartesian3Length;
    const radius = view.getFloat64(pos, true);
    pos += Float64Array.BYTES_PER_ELEMENT;
    pos += cartesian3Length;

    const vertexCount = view.getUint32(pos, true);
    pos += Uint32Array.BYTES_PER_ELEMENT;
    const encodedVertexBuffer = new Uint16Array(buffer, pos, vertexCount * 3);
    pos += vertexCount * encodedVertexLength;

    if (vertexCount > 64 * 1024) {
        bytesPerIndex = Uint32Array.BYTES_PER_ELEMENT;
    }

    const uBuffer = encodedVertexBuffer.subarray(0, vertexCount);
    const vBuffer = encodedVertexBuffer.subarray(vertexCount, 2 * vertexCount);
    const heightBuffer = encodedVertexBuffer.subarray(
        vertexCount * 2,
        3 * vertexCount
    );

    zigZagDeltaDecode(uBuffer, vBuffer, heightBuffer);

    if (pos % bytesPerIndex !== 0) {
        pos += bytesPerIndex - (pos % bytesPerIndex);
    }

    const triangleCount = view.getUint32(pos, true);
    pos += Uint32Array.BYTES_PER_ELEMENT;
    const indices = vertexCount > 65536 ?
        new Uint32Array(buffer, pos, triangleCount * triangleElements) :
        new Uint16Array(buffer, pos, triangleCount * triangleElements);

    let highest = 0;
    const length = indices.length;
    for (let i = 0; i < length; ++i) {
        const code = indices[i];
        indices[i] = highest - code;
        if (code === 0) {
            ++highest;
        }
    }
    const terrain = {
        minimumHeight: minimumHeight,
        maximumHeight: maximumHeight,
        quantizedVertices: encodedVertexBuffer,
        indices: indices,
    };

    const quantizedVertices = terrain.quantizedVertices;
    const quantizedVertexCount = quantizedVertices.length / 3;
    const uBuffer_1 = quantizedVertices.subarray(0, quantizedVertexCount);
    const vBuffer_1 = quantizedVertices.subarray(
        quantizedVertexCount,
        2 * quantizedVertexCount
    );
    const heightBuffer_1 = quantizedVertices.subarray(
        quantizedVertexCount * 2,
        3 * quantizedVertexCount
    );
    const positions = POSITIONS;
    for (let i = 0; i < quantizedVertexCount; ++i) {
        const rawU = uBuffer_1[i];
        const rawV = vBuffer_1[i];

        const u = rawU / maxShort;
        const v = rawV / maxShort;
        const height = lerp(
            minimumHeight,
            maximumHeight,
            heightBuffer_1[i] / maxShort
        );
        positions[i * 3] = u;
        positions[i * 3 + 1] = (1 - v);
        positions[i * 3 + 2] = height;
    }
    return { positions, radius, min: minimumHeight, max: maximumHeight, indices }
}

const P0P1 = [];
const P1P2 = [];
const A = [];
const B = [];
const C = [];

class Triangle {
    constructor(positions, a, b, c, radius) {
        this.p0 = [];
        this.p1 = [];
        this.p2 = [];
        this.normal = [];
        this.min = [];
        this.max = [];
        this.set(positions, a, b, c, radius);
    }

    set(positions, a, b, c, radius) {
        this.radius = radius;
        let x = a * 3;
        let y = a * 3 + 1;
        let z = a * 3 + 2;
        this.p0[0] = positions[x] * radius;
        this.p0[1] = positions[y] * radius;
        this.p0[2] = positions[z];
        x = b * 3;
        y = b * 3 + 1;
        z = b * 3 + 2;
        this.p1[0] = positions[x] * radius;
        this.p1[1] = positions[y] * radius;
        this.p1[2] = positions[z];
        x = c * 3;
        y = c * 3 + 1;
        z = c * 3 + 2;
        this.p2[0] = positions[x] * radius;
        this.p2[1] = positions[y] * radius;
        this.p2[2] = positions[z];

        this.min[0] = Math.min(this.p0[0], this.p1[0], this.p2[0]);
        this.min[1] = Math.min(this.p0[1], this.p1[1], this.p2[1]);

        this.max[0] = Math.max(this.p0[0], this.p1[0], this.p2[0]);
        this.max[1] = Math.max(this.p0[1], this.p1[1], this.p2[1]);

        const p0p1 = vec3.sub(P0P1, this.p1, this.p0);
        const p1p2 = vec3.sub(P1P2, this.p2, this.p1);
        this.normal = vec3.normalize(this.normal, vec3.cross(this.normal, p0p1, p1p2));
    }

    contains(x, y) {
        if (x < this.min[0] || x > this.max[0] || y < this.min[1] || y > this.max[1]) {
            return false;
        }
        vec2.set(A, this.p0[0], this.p0[1]);
        vec2.set(B, this.p1[0], this.p1[1]);
        vec2.set(C, this.p2[0], this.p2[1]);
        const SABC = calTriangleArae(A[0], A[1], B[0], B[1], C[0], C[1]);
        const SPAC = calTriangleArae(x, y, A[0], A[1], C[0], C[1]);
        const SPAB = calTriangleArae(x, y, A[0], A[1], B[0], B[1]);
        const SPBC = calTriangleArae(x, y, B[0], B[1], C[0], C[1]);
        return SPAC + SPAB + SPBC - SABC <= 0.0001;
    }

    getHeight(x, y) {
        // https://stackoverflow.com/questions/18755251/linear-interpolation-of-three-3d-points-in-3d-space
        //z1 - ((x4-x1)*N.x + (y4-y1)*N.y)/ N.z
        const N = this.normal;
        return this.p0[2] - ((x - this.p0[0]) * N[0] + (y - this.p0[1]) * N[1]) / N[2];
    }
}

// 当前像素命中某三角形后，下一个像素也很可能会在该三角形中，可以节省一些循环
let preTriangle = null;
function findInTriangle(triangles, x, y) {
    if (preTriangle && preTriangle.contains(x, y)) {
        return preTriangle.getHeight(x, y);
    }
    for (let i = 0; i < triangles.length; i++) {
        if (triangles[i].contains(x, y)) {
            preTriangle = triangles[i];
            return triangles[i].getHeight(x, y);
        }
    }
    return 0;
}
const TRIANGLES = [];

function cesiumTerrainToHeights(cesiumTerrain, terrainWidth) {
    const { positions, min, max, indices, radius } = cesiumTerrain;
    const triangles = [];
    let index = 0;
    for (let i = 0; i < indices.length; i += 3) {
        let triangle = TRIANGLES[index];
        if (triangle) {
            triangle.set(positions, indices[i], indices[i + 1], indices[i + 2], radius * 2);
        } else {
            triangle = TRIANGLES[index] = new Triangle(positions, indices[i], indices[i + 1], indices[i + 2], radius * 2);
        }
        index++;
        triangles.push(triangle);
    }
    const heights = new Float32Array(terrainWidth * terrainWidth);
    index = 0;
    for (let i = 0; i < terrainWidth; i++) {
        for (let j = 0; j < terrainWidth; j++) {
            heights[index++] = findInTriangle(triangles, j / terrainWidth * radius * 2, i / terrainWidth * radius * 2);
        }
    }

    const result = { data: heights, min, max, width: terrainWidth, height: terrainWidth };

    return result;
}



function calTriangleArae(x1, y1, x2, y2, x3, y3) {
    return Math.abs(x1 * y2 + x2 * y3 + x3 * y1 - x1 * y3 - x2 * y1 - x3 * y2) * 0.5;
}

function zigZagDeltaDecode(uBuffer, vBuffer, heightBuffer) {
    const count = uBuffer.length;

    let u = 0;
    let v = 0;
    let height = 0;

    for (let i = 0; i < count; ++i) {
        u += zigZagDecode(uBuffer[i]);
        v += zigZagDecode(vBuffer[i]);

        uBuffer[i] = u;
        vBuffer[i] = v;

        if (heightBuffer) {
            height += zigZagDecode(heightBuffer[i]);
            heightBuffer[i] = height;
        }
    }
}

function generateMapboxTerrain(buffer) {
    const blob = new self.Blob([new Uint8Array(buffer)]);
    return self.createImageBitmap(blob);
}

function loadTerrain(params, cb) {
    const { url, origin, type, accessToken, terrainWidth, error, tileImage } = params;
    //custom loadTileImage and return mapbox terrain rgb data
    if (tileImage && tileImage.close) {
        const imageData = bitmapToImageData(tileImage);
        const terrainData = mapboxBitMapToHeights(imageData, terrainWidth);
        triangulateTerrain(error, terrainData, terrainWidth, tileImage, true, cb);
        return;
    }
    const headers = params.headers || requestHeaders[type];
    if (type === 'tianditu') {
        fetchTerrain(url, headers, type, terrainWidth, error, cb);
    } else if (type === 'cesium-ion') {
        const tokenUrl = params.cesiumIonTokenURL + accessToken;
        if (cesium_access_token) {
            fetchTerrain(url, headers, type, terrainWidth, error, cb);
        } else if (cesiumAccessTokenPromise) {
            cesiumAccessTokenPromise.then(() => {
                fetchTerrain(url, headers, type, terrainWidth, error, cb);
            });
        } else {
            cesiumAccessTokenPromise = fetch(tokenUrl, {
                responseType: "json",
                method: 'GET',
                referrer: origin,
                headers: {
                    Accept: "application/json,*/*;q=0.01",
                    'Accept-Encoding': 'gzip, deflate, br',
                },
            }).then(tkJson => {
                return tkJson.json();
            }).then(res => {
                cesium_access_token = res.accessToken;
                cesiumAccessTokenPromise = null;
            });
            cesiumAccessTokenPromise.then(() => {
                fetchTerrain(url, headers, type, terrainWidth, error, cb);
            });
        }
    } else if (type === 'cesium') {
        fetchTerrain(url, headers, type, terrainWidth, error, cb);
    } else if (type === 'mapbox') {
        fetchTerrain(url, headers, type, terrainWidth, error, cb);
    }
}

function fetchTerrain(url, headers, type, terrainWidth, error, cb) {
    if (type === 'cesium-ion') {
        headers['Authorization'] = 'Bearer ' + cesium_access_token;
    }
    load(url, headers, origin).then(res => {
        if (!res || res.message) {
            if (!res) {
                // aborted by user
                cb({ error: { canceled: true } });
            } else {
                cb({ empty: true, originalError: res });
            }
        } else {
            const buffer = res.data;
            let terrain = null;
            if (type === 'tianditu') {
                const terrainData = generateTiandituTerrain(buffer, terrainWidth);
                triangulateTerrain(error, terrainData, terrainWidth, null, true, cb);
            } else if (type === 'cesium-ion' || type === 'cesium') {
                terrain = generateCesiumTerrain(buffer);
                const terrainData = cesiumTerrainToHeights(terrain, terrainWidth);
                triangulateTerrain(error, terrainData, terrainWidth, null, true, cb);
            } else if (type === 'mapbox') {
                terrain = generateMapboxTerrain(buffer);
                terrain.then(imgBitmap => {
                    const imageData = bitmapToImageData(imgBitmap);
                    const terrainData = mapboxBitMapToHeights(imageData, terrainWidth);
                    triangulateTerrain(error, terrainData, terrainWidth, imgBitmap, true, cb);
                });
            }
        }
    }).catch(e => {
        delete terrainRequests[url];
        cb({ empty: true, originalError: e });
    });
}

/**https://github.com/FreeGIS/dem2terrain/blob/master/src/dem-encode.js
 * MapboxGL raster-dem 编码
 * @param {number} height 高程值
 * @returns {[number, number, number]}
 */
function mapboxEncode(height, out) {
    const value = Math.floor((height + 10000) * 10);
    const r = value >> 16;
    const g = value >> 8 & 0x0000FF;
    const b = value & 0x0000FF;
    if (out) {
        out[0] = r;
        out[1] = g;
        out[2] = b;
        return out;
    }
    return [r, g, b];
}

//terrain hegihts to image for texture
function heights2RGBImage(terrainData) {
    checkBitMapCanvas();
    if (!BITMAP_CANVAS) {
        return;
    }
    const { width, height, data } = terrainData;
    if (!width || !height || !data) {
        return;
    }
    try {
        let ctx = BITMAP_CANVAS.getContext('2d', { willReadFrequently: true });
        const imageData = ctx.createImageData(width, height);
        for (let i = 0, len = data.length; i < len; i++) {
            const height = data[i];
            const [r, g, b] = mapboxEncode(height, TEMP_RGB);
            const idx = 4 * i;
            imageData.data[idx] = r;
            imageData.data[idx + 1] = g;
            imageData.data[idx + 2] = b;
            imageData.data[idx + 3] = 255;
        }
        BITMAP_CANVAS.width = width;
        BITMAP_CANVAS.height = height;
        ctx = BITMAP_CANVAS.getContext('2d', { willReadFrequently: true });
        clearCanvas(ctx);
        ctx.putImageData(imageData, 0, 0);
        return BITMAP_CANVAS.transferToImageBitmap();

    } catch (error) {
        console.log(error);
    }
}


function triangulateTerrain(error, terrainData, terrainWidth, imageBitmap, hasSkirts, cb) {
    const mesh = createMartiniData(error / 2, terrainData.data, terrainWidth, hasSkirts);
    const transferables = [mesh.positions.buffer, mesh.texcoords.buffer, mesh.triangles.buffer];
    //tdt,cesium terrain etc
    if (!imageBitmap) {
        imageBitmap = heights2RGBImage(terrainData);
    }
    if (imageBitmap) {
        transferables.push(imageBitmap);
    }
    const data = { mesh };
    data.image = imageBitmap;
    data.data = terrainData;
    transferables.push(terrainData.data.buffer);
    cb(data, transferables);
}

function bitmapToImageData(imgBitmap) {
    const { width, height } = imgBitmap;
    // const pow = Math.floor(Math.log(width) / Math.log(2));
    // width = height = Math.pow(2, pow) + 1;

    // TODO 需要解决OffscreenCanvas的兼容性：不支持时，在主线程里获取imageData
    // const supportOffscreenCanvas = typeof OffscreenCanvas !== undefined;
    if (!BITMAP_CANVAS) {
        BITMAP_CANVAS = new OffscreenCanvas(1, 1);
        BITMAP_CTX = BITMAP_CANVAS.getContext('2d', { willReadFrequently: true });
    }

    BITMAP_CANVAS.width = width;
    BITMAP_CANVAS.height = height;
    BITMAP_CTX.drawImage(imgBitmap, 0, 0, width, height);
    return BITMAP_CTX.getImageData(0, 0, width, height);
}

function mapboxBitMapToHeights(imageData, terrainWidth) {
    const { data: imgData, width } = imageData;
    // const terrainWidth = width;

    let min = Infinity;
    let max = -Infinity;


    const heights = new Float32Array(terrainWidth * terrainWidth);
    const stride = Math.round(width / terrainWidth);

    for (let i = 0; i < terrainWidth; i++) {
        for (let j = 0; j < terrainWidth; j++) {
            const index = i + j * terrainWidth;
            let height = 0;

            let nullCount = 0;
            const tx = i;
            const ty = j;

            for (let k = 0; k < stride; k++) {
                for (let l = 0; l < stride; l++) {
                    let x = tx * stride + k;
                    let y = ty * stride + l;
                    if (y > width - 1) {
                        y = width - 1;
                    }
                    if (x > width - 1) {
                        x = width - 1;
                    }
                    const imageIndex = x + y * width;
                    const R = imgData[imageIndex * 4];
                    const G = imgData[imageIndex * 4 + 1];
                    const B = imgData[imageIndex * 4 + 2];
                    const A = imgData[imageIndex * 4 + 3];
                    if (A === 0) {
                        nullCount += 1;
                    } else {
                        height += -10000 + ((R * 256 * 256 + G * 256 + B) * 0.1);
                    }
                }
            }
            const count = (stride * stride - nullCount);
            height = height / (count || 1);
            if (height > max) {
                max = height;
            }
            if (height < min) {
                min = height;
            }
            heights[index] = height;
        }
    }
    return { data: heights, width: terrainWidth, height: terrainWidth, min, max };

}

function clearCanvas(ctx) {
    const canvas = ctx.canvas;
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
}

function colorTerrain(imgdata, colors) {
    const key = JSON.stringify(colors);
    if (!colorInCache[key]) {
        colorInCache[key] = new ColorIn(colors);
    }
    const ci = colorInCache[key];
    const data = imgdata.data;
    for (let i = 0, len = data.length; i < len; i += 4) {
        const R = data[i], G = data[i + 1], B = data[i + 2], A = data[i + 3];
        let height = 0;
        if (A !== 0) {
            //地形解码
            height = -10000 + ((R * 256 * 256 + G * 256 + B) * 0.1);
            height = Math.max(height, 0);
        }
        const [r, g, b] = ci.getColor(height);

        //根据不同的高度设置不同的颜色
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = 255;
    }
}

function createColorsTexture(data, colors, tileSize) {
    if (!colors || !Array.isArray(colors) || colors.length < 2) {
        return;
    }
    if (!data || !data.image) {
        return null;
    }
    let { width, height } = data.image;
    tileSize = tileSize || DEFAULT_TILESIZE;
    if (tileSize[0] !== width || tileSize[1] !== height) {
        width = tileSize[0];
        height = tileSize[1];
    }
    width *= 2;
    height *= 2;
    try {
        checkBitMapCanvas();
        if (!BITMAP_CANVAS) {
            return;
        }
        const canvas = BITMAP_CANVAS;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        clearCanvas(ctx);

        ctx.drawImage(data.image, 0, 0, width, height);
        // ctx.font = "bold 48px serif";
        // ctx.textAlign = 'center';
        // ctx.fillStyle = 'red';
        // ctx.fillText('1234', width / 2, height / 2);
        const imgdata = ctx.getImageData(0, 0, width, height);
        colorTerrain(imgdata, colors);
        return new Uint8Array(imgdata.data);

        // https://github.com/regl-project/regl/issues/573
        // ctx.putImageData(imgdata, 0, 0);
        // const image = canvas.transferToImageBitmap();
        // return image;
    } catch (error) {
        console.error(error);
    }

}

export const onmessage = function (message, postResponse) {
    const data = message.data;
    if (data.command === 'addLayer' || data.command === 'removeLayer') {
        // 保存当前worker的workerId。
        workerId = message.workerId;
        self.postMessage({ type: '<response>', actorId: data.actorId, workerId, params: 'ok', callback: message.callback });
    } else if (data.command === 'fetchTerrain') {
        //加载地形数据的逻辑
        const colors = (data.params || {}).colors;
        const tileSize = (data.params || {}).tileSize;
        loadTerrain(data.params, (data, transferables) => {
            const texture = createColorsTexture(data, colors, tileSize);
            if (texture) {
                data.colorsTexture = texture;
                transferables = transferables || [];
                transferables.push(texture.buffer);
            }
            postResponse(data.error, data, transferables);
        });
    } else if (data.command === 'abortTerrain') {
        //加载地形数据的逻辑
        abort(data.params.url, () => {
            postResponse(null, {}, []);
        });
    }
}

export const initialize = function () {
};
