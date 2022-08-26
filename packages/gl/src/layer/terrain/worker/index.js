import { Ajax } from '@maptalks/gltf-loader';
import "./zlib.min";
import Martini from '@mapbox/martini';
// 保存当前的workerId，用于告知主线程结果回传给哪个worker
let workerId;
const offscreenCanvas = new OffscreenCanvas(514, 514);
const offscreenCanvasContext = offscreenCanvas.getContext('2d');

const terrainStructure = {
    width: 64,
    height: 64,
    elementsPerHeight: 3,
    heightOffset: -1000,
    exaggeration: 1.0,
    heightScale: 0.001,
    elementMultiplier: 256,
    stride: 4,
    skirtHeight: 0.1,
    skirtOffset: 0.05 //用于减少地形瓦片之间的缝隙
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
const maxShort = 32767;
let access_token = null;
function load(url, headers, origin) {
    const options = {
        method: 'GET',
        referrer: origin,
        headers
    };
    return Ajax.getArrayBuffer(url, options);
}

function createHeightMap(heightmap/*, exag*/) {
    const width = terrainStructure.width, height = terrainStructure.height;
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
    for (let i = 0; i < endRow; i++) {
        const row = i >= height ? height - 1 : i;
        for(let j = 0; j < endColum; j++) {
            const colum = j >= width ? width - 1 : j;
            let heightSample = 0;
            const terrainOffset = row * (width * stride) + colum * stride;
            for (let elementOffset = 0; elementOffset < elementsPerHeight; elementOffset++) {
                heightSample = (heightSample * elementMultiplier) + heightmap[terrainOffset + elementOffset];
            }
            heightSample = (heightSample * heightScale + heightOffset) * exaggeration;
            heightSample -= skirtHeight;
            heights[index] = heightSample;
            index++;
        }
    }
    return heights;
}

function decZlibBuffer(zBuffer) {
    if (zBuffer.length < 1000) {
         return;
    }
    const inflate = new Zlib.Inflate(zBuffer);

    if (inflate) {
        return inflate.decompress();
    }
}

function transformBuffer(zlibData){
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

function generateTiandituTerrain(buffer) {
    const view = new DataView(buffer);
    const zBuffer = new Uint8Array(view.byteLength);
    let index = 0;
    while (index < view.byteLength) {
        zBuffer[index] = view.getUint8(index, true);
        index++;
    }
    //解压数据
    const dZlib = decZlibBuffer(zBuffer);
    const heightBuffer = transformBuffer(dZlib);
    const heights = createHeightMap(heightBuffer);
    return heights;
}

function zigZagDecode(value) {
  return (value >> 1) ^ -(value & 1);
}

function lerp(p, q, time) {
  return (1.0 - time) * p + time * q;
}

function generateCesiumTerrain(buffer) {
  let pos = 0;
  const cartesian3Elements = 3;
  const boundingSphereElements = cartesian3Elements + 1;
  const cartesian3Length = Float64Array.BYTES_PER_ELEMENT * cartesian3Elements;
  const boundingSphereLength =
    Float64Array.BYTES_PER_ELEMENT * boundingSphereElements;
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
  pos += boundingSphereLength;
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
  const indices = vertexCount > 65536 ? new Uint32Array(buffer, pos, triangleCount * triangleElements) : new Uint16Array(buffer, pos, triangleCount * triangleElements);

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
  const positions = new Float32Array(quantizedVertexCount * 3);
  const uvs = new Float32Array(quantizedVertexCount * 2);
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
    uvs[i * 2] = u;
    uvs[i * 2 + 1] = 1 - v;
    positions[i * 3] = (u * 256);
    positions[i * 3 + 1] = (-(1 - v) * 256);
    positions[i * 3 + 2] = height;
  }
  return { positions, texcoords: uvs, triangles: indices}
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
    const blob = new self.Blob([new Uint8Array(buffer)], {type: 'image/png'});
    return self.createImageBitmap(blob);
}

function loadTerrain(params, cb) {
    const { url, origin, type, accessToken, terrainWidth } = params;
    if (type === 'tianditu') {
        fetchTerrain(url, type, terrainWidth, cb);
    } else if (type === 'cesium') {
        const tokenUrl = 'https://api.cesium.com/v1/assets/1/endpoint?access_token=' + accessToken;
        if (access_token) {
            fetchTerrain(url, type, terrainWidth, cb);
        } else {
            fetch(tokenUrl, {
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
                access_token = res.accessToken;
                fetchTerrain(url, type, terrainWidth, cb);
            });
        }
    } else if (type === 'mapbox') {
        fetchTerrain(url, type, terrainWidth, cb);
    }
}

function fetchTerrain(url, type, terrainWidth, cb) {
    let headers = requestHeaders[type];
    if (type === 'cesium') {
        // headers['Authorization'] = 'Bearer ' + access_token;
        headers = {
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept': 'application/vnd.quantized-mesh,application/octet-stream;q=0.9,*/*;q=0.01',
            'Authorization': 'Bearer ' + access_token
        }
    }
    load(url, headers, origin).then(res => {
        if (res.message) {
            cb({ error: res});
        } else {
            const buffer = res.data;
            let terrain = null;
            if (type === 'tianditu') {
                terrain = generateTiandituTerrain(buffer);
                //martini顶点计算方式:https://github.com/mapbox/martini/issues/5
                const mesh = createMartiniData(terrain, terrainWidth);
                cb({ data: terrain, mesh }, res.transferables);
            } else if (type === 'cesium') {
              terrain = generateCesiumTerrain(buffer);
              const transferables = [terrain.positions.buffer, terrain.texcoords.buffer, terrain.triangles.buffer];
              cb(terrain, transferables)
            } else if (type === 'mapbox') {
                terrain = generateMapboxTerrain(buffer);
                terrain.then(imgBitmap => {
                    const terrainData = mapboxBitMapToHeights(imgBitmap, terrainWidth);
                    const mesh = createMartiniData(terrainData.data, terrainWidth);
                    const transferables = [terrainData.data.buffer, mesh.positions.buffer, mesh.texcoords.buffer, mesh.triangles.buffer];

                    cb({ data: terrainData, mesh }, transferables);
                });
            }
        }
    }).catch(e => {
        cb({ error: e});
    });
}
function mapboxBitMapToHeights(imgBitmap, terrainWidth) {
    const { width, height } = imgBitmap;
    // const pow = Math.floor(Math.log(width) / Math.log(2));
    // width = height = Math.pow(2, pow) + 1;

    offscreenCanvas.width = width;
    offscreenCanvas.height = height;
    offscreenCanvasContext.drawImage(imgBitmap, 0, 0, width, height);
    // const terrainWidth = width;

    const imgData = offscreenCanvasContext.getImageData(0, 0, width, height).data;
    const heights = new Float32Array(terrainWidth * terrainWidth);

    const stride = Math.floor(Math.log(width) / Math.LN2) / Math.floor(Math.log(terrainWidth) / Math.LN2);

    for (let i = 0; i < terrainWidth; i++) {
        for (let j = 0; j < terrainWidth; j++) {
            const index = i + j * terrainWidth;
            let height = 0;

            let nullCount = 0;
            for (let k = 0; k < stride; k++) {
                for (let l = 0; l < stride; l++) {
                    const x = i * stride + k;
                    const y = j * stride + l;
                    const imageIndex = x + y * terrainWidth * stride;
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
            heights[index] = height;
        }
    }
    // debugger
    // const terrainData = createMartiniData(heights, terrainWidth);
    // offscreenCanvasContext.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
    return { data: heights, /*terrainData, */width, height };

}

function createMartiniData(heights, width) {
    const martini = new Martini(width);
    const terrainTile = martini.createTile(heights);
    const mesh = terrainTile.getMesh(0.1);
    const { triangles, vertices } = mesh;
    const positions = [], texcoords = [];
    const skirtOffset = terrainStructure.skirtOffset;
    for (let i = 0; i < vertices.length / 2; i++) {
        const x = vertices[i * 2], y = vertices[i * 2 + 1];
        positions.push(x * (4 + skirtOffset));
        positions.push(-y * (4 + skirtOffset));
        positions.push(heights[y * width + x]);
        texcoords.push(x / width);
        texcoords.push(y / width);
    }
    const terrain = { positions: new Float32Array(positions), texcoords: new Float32Array(texcoords), triangles };
    return terrain;
}

export const onmessage = function (message, postResponse) {
    const data = message.data;
    if (data.command === 'addLayer' || data.command === 'removeLayer') {
        // 保存当前worker的workerId。
        workerId = message.workerId;
        self.postMessage({type: '<response>', actorId: data.actorId, workerId, params: 'ok', callback: message.callback });
    } else if (data.command === 'createTerrainMesh') {
        const terrain = createMartiniData(data.params.heights, data.params.width);
        const transferables = [ terrain.positions.buffer, terrain.texcoords.buffer, terrain.triangles.buffer ];
        postResponse(null, { terrain }, transferables);
    } else if (data.command === 'fetchTerrain') {
        //加载地形数据的逻辑
        loadTerrain(data.params, (data, transferables) => {
            postResponse(data.error, data, transferables);
        });
    }
}

export const initialize = function () {
};
