import { vec4, mat4 } from 'gl-matrix';
import * as maptalks from 'maptalks';

const INDEX_KEY = '__batchRayCastGrid';
const EPSILON = 1e-10;
const NULL_ALTITUDES = [];
const TEMP_VEC4 = [0, 0, 0, 1];
const TEMP_PT = { x: 0, y: 0 };
// 自适应网格参数：目标每格约 CELL_TARGET 个三角形，控制查询阶段的求交次数
const CELL_TARGET = 4;
const MIN_GRID = 8;
const MAX_GRID = 64;

// maptalks 3dtiles/pnts 的 Int16 量化解码，与 draco_decode.vert / LayerWorker.decodeFloat32 保持一致
function decodeInt16(value, min, max) {
    const v = value >= 32768.0 ? -(65536.0 - value) / 32768.0 : value / 32767.0;
    return (v + 1.0) * (max - min) / 2.0 + min;
}

/**
 * 获取 mesh 的 Int16 量化顶点解码参数（3dtiles/pnts 压缩协议）。
 * mesh.uniforms['compressedPositionRange'] 为 [min, max]，
 * mesh.uniforms['compressed_ratio'] 在 4326 投影下对 POSITION 的 x/y 预放大系数。
 * @private
 */
function getDecodeParams(mesh) {
    const uniforms = mesh.uniforms;
    if (!uniforms) {
        return null;
    }
    const range = uniforms['compressedPositionRange'];
    if (!range || range.length < 2) {
        return null;
    }
    return { range: range, ratio: uniforms['compressed_ratio'] || 1 };
}

/**
 * 若 positions 为 Int16/Uint16 量化数组，解码为 float32 局部坐标；
 * 否则原样返回。压缩时 x/y 乘了 compressed_ratio，解码时需反向除以。
 * @private
 */
function decodePositions(positions, decodeParams) {
    const type = positions.constructor.name;
    if (type !== 'Int16Array' && type !== 'Uint16Array') {
        return positions;
    }
    const min = decodeParams.range[0], max = decodeParams.range[1];
    const ratio = decodeParams.ratio;
    const out = new Float32Array(positions.length);
    for (let i = 0; i < positions.length; i++) {
        let v = decodeInt16(positions[i], min, max);
        if (ratio > 1 && i % 3 !== 2) {
            v /= ratio;
        }
        out[i] = v;
    }
    return out;
}

/**
 * mesh.localTransform / mesh.positionMatrix 可能是数组，也可能是惰性函数（gltf-lit 每次调用返回矩阵）。
 * @private
 */
function getMatrixValue(m) {
    if (typeof m === 'function') {
        return m();
    }
    return m || null;
}

/**
 * 从 instancedData 的 instance_vectorA/B/C 构建实例矩阵（列主序，与 instance.vert 的 instance_getAttributeMatrix 一致）。
 *
 * GLTFMixin.setInstanceData 把源矩阵的第 col 列存入 instance_vector[A/B/C] 的第 i 个 vec4：
 *   A=(matrix[0],matrix[4],matrix[8],matrix[12])、B=(matrix[1],matrix[5],...)、C=(matrix[2],matrix[6],...)
 * instance.vert 按列主序组装：
 *   第0列=(A.x,B.x,C.x,0)  第1列=(A.y,B.y,C.y,0)  第2列=(A.z,B.z,C.z,0)  第3列=(A.w,B.w,C.w,1)
 * 即第 j 列的第 i 个分量 = 第 i 个数组的第 j 个元素，数值上等于源矩阵。
 * 若把 A 整体当作一列（A.x,A.y,A.z,A.w）则得到的是源矩阵的转置，会导致 gltf-lit 完全无法命中。
 * @private
 */
function buildInstanceMat(out, inst, idx) {
    const off = idx * 4;
    const A = inst['instance_vectorA'], B = inst['instance_vectorB'], C = inst['instance_vectorC'];
    out[0] = A[off];
    out[1] = B[off];
    out[2] = C[off];
    out[3] = 0;
    out[4] = A[off + 1];
    out[5] = B[off + 1];
    out[6] = C[off + 1];
    out[7] = 0;
    out[8] = A[off + 2];
    out[9] = B[off + 2];
    out[10] = C[off + 2];
    out[11] = 0;
    out[12] = A[off + 3];
    out[13] = B[off + 3];
    out[14] = C[off + 3];
    out[15] = 1;
    return out;
}

/**
 * 局部坐标 → 世界坐标。
 *
 * altitudeM 为海拔（米）时走海拔分支：局部 z 不参与矩阵，世界 z 直接用海拔换算；
 * 与官方 RayCaster._toWorldPosition 语义一致，vt 建筑/地形的顶点 z 存的是海拔，不能与 xy 一起做矩阵变换。
 * @private
 */
function toWorldPosition(out, map, px, py, pz, altitudeM, matrix) {
    if (maptalks.Util.isNumber(altitudeM)) {
        out[0] = matrix[0] * px + matrix[4] * py + matrix[12];
        out[1] = matrix[1] * px + matrix[5] * py + matrix[13];
        out[2] = map.altitudeToPoint(altitudeM, map.getGLRes());
    } else {
        TEMP_VEC4[0] = px;
        TEMP_VEC4[1] = py;
        TEMP_VEC4[2] = pz;
        TEMP_VEC4[3] = 1;
        vec4.transformMat4(TEMP_VEC4, TEMP_VEC4, matrix);
        out[0] = TEMP_VEC4[0];
        out[1] = TEMP_VEC4[1];
        out[2] = TEMP_VEC4[2];
    }
    return out;
}

/**
 * 构建 mesh 的三角形索引缓存（与矩阵/分辨率无关的不变部分）：
 * - positions：局部坐标（3dtiles 已做 Int16 量化解码；gltf-lit 为 gltf 模型本地坐标）
 * - triIndices：三角形顶点索引
 * - altitudes：海拔属性（vt 建筑/地形）
 *
 * 只依赖 geometry 对象，瓦片重新加载（geometry 变化）时才重建。
 * @private
 */
function buildGrid(mesh, decodeParams) {
    const geometry = mesh.geometry;
    if (!geometry || !geometry.desc) {
        return null;
    }
    const desc = geometry.desc;
    // 只索引三角形 mesh；线/点/文本等非三角形几何（如矢量瓦片中的线要素、图标）无法用于垂直求交
    const primitive = desc.primitive || 'triangles';
    if (primitive !== 'triangles') {
        return null;
    }
    const positions = geometry.data[desc.positionAttribute] && geometry.data[desc.positionAttribute].array;
    const indices = geometry.indices;
    if (!positions || !positions.length || !indices || !indices.length || indices.length % 3 !== 0) {
        return null;
    }
    // gltf-lit（InstancedMesh）：geometry 是共享的 gltf 模型本地坐标，每个要素一个实例，
    // 实例变换在 mesh.insContext.instanceData.instance_vectorA/B/C 中（原始数组，GLTFMixin 设置；
    // mesh.instancedData 中是 regl buffer，无法读回），渲染时经 instance_getAttributeMatrix 组合
    const instancedData = mesh.insContext && mesh.insContext.instanceData;
    const instanced = !!(instancedData && instancedData['instance_vectorA']);
    const instanceCount = instanced ? Math.floor(instancedData['instance_vectorA'].length / 4) : 0;
    // 3dtiles/pnts 的 POSITION 可能是 Int16 量化顶点，需先解码为 float32 局部坐标
    //（渲染 shader 在乘模型矩阵前也会做同样的解码，见 draco_decode.vert）
    const decodedPositions = decodeParams ? decodePositions(positions, decodeParams) : positions;
    const dim = desc.positionSize || 3;
    const triCount = Math.floor(indices.length / 3);

    const triIndices = new Uint32Array(triCount * 3);
    for (let t = 0; t < triCount; t++) {
        const offset = t * 3;
        const a = indices[offset], b = indices[offset + 1], c = indices[offset + 2];
        // 索引越界说明该 mesh 数据异常（如非三角形拓扑），跳过以免 NaN 传播
        if (a * dim + 2 >= decodedPositions.length || b * dim + 2 >= decodedPositions.length || c * dim + 2 >= decodedPositions.length) {
            return null;
        }
        triIndices[offset] = a;
        triIndices[offset + 1] = b;
        triIndices[offset + 2] = c;
    }

    // instanced mesh（gltf-lit）渲染时直接用 POSITION.z 做高度（见 standard.vert getPosition），
    // 不走海拔分支，即使数据带 aAltitude 也忽略
    const altitudes = !instanced && desc.altitudeAttribute && geometry.data[desc.altitudeAttribute] && geometry.data[desc.altitudeAttribute].array || NULL_ALTITUDES;
    const grid = {
        positions: decodedPositions,
        altitudes,
        useAltitude: !instanced && altitudes.length > 0,
        dim,
        triIndices,
        // 矢量瓦片（vt）mesh：tileTransform 对 y 取反，顶面在 GL 世界空间绕序朝下，不能做背面剔除
        isVt: !!(geometry.properties && geometry.properties.tileExtent !== undefined),
        instanced,
        instanceCount,
        vertexCount: Math.floor(decodedPositions.length / dim)
    };
    if (instanced) {
        // gltf-lit 不展开实例：模型局部 AABB（与矩阵/实例无关，跨查询缓存）。
        // 查询时把点经实例逆矩阵变换到局部空间做三角形求交（见 test 中 inst 分支的说明）
        grid.modelAABB = computeAABB(decodedPositions, dim);
    }
    mesh[INDEX_KEY] = { geometry, grid, decodeParams };
    return grid;
}

/**
 * 计算顶点数组（stride=dim）的 3D 包围盒。
 * @private
 */
function computeAABB(positions, dim) {
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (let i = 0; i < positions.length; i += dim) {
        const x = positions[i], y = positions[i + 1], z = positions[i + 2];
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        if (z < minZ) minZ = z;
        if (z > maxZ) maxZ = z;
    }
    return { minX, minY, minZ, maxX, maxY, maxZ };
}

/**
 * 按三角形 zMax 降序重排三角形（顶点索引与平行元数据数组同步重排）。
 * 查询循环中命中高度只会被更高者覆盖，排序后遇到 triZMax <= bestHeight 即可提前终止整个 cell。
 * @private
 */
function sortTrisByZDesc(triIndices, triZMax, triMeta) {
    const triCount = triIndices.length / 3;
    if (triCount < 2) {
        return { triIndices, triZMax, triMeta };
    }
    const order = new Uint32Array(triCount);
    for (let i = 0; i < triCount; i++) {
        order[i] = i;
    }
    order.sort((a, b) => triZMax[b] - triZMax[a]);
    const newIdx = new Uint32Array(triIndices.length);
    const newZ = new Float32Array(triCount);
    let newMeta = triMeta;
    if (triMeta) {
        newMeta = new Array(triCount);
    }
    for (let i = 0; i < triCount; i++) {
        const t = order[i];
        newIdx[i * 3] = triIndices[t * 3];
        newIdx[i * 3 + 1] = triIndices[t * 3 + 1];
        newIdx[i * 3 + 2] = triIndices[t * 3 + 2];
        newZ[i] = triZMax[t];
        if (triMeta) {
            newMeta[i] = triMeta[t];
        }
    }
    return { triIndices: newIdx, triZMax: newZ, triMeta: newMeta };
}

/**
 * 用顶点坐标（stride 个分量/顶点）构建 2D 均匀网格索引。
 * 网格密度随三角形数量自适应（目标每格约 CELL_TARGET 个三角形），x/y 轴独立 cell 尺寸。
 * @param {Float32Array} wpos - 顶点数组
 * @param {Uint32Array} triIndices - 三角形顶点索引
 * @param {Number} stride - 每个顶点的分量数
 * @param {Float32Array} [triZMax] - 可选，各三角形 zMax（与 triIndices 顺序一致）；提供时计算 cellMaxZ 用于整格提前剔除
 * @private
 */
function buildWorldGrid(wpos, triIndices, stride, triZMax) {
    const vCount = wpos.length / stride;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let i = 0; i < vCount; i++) {
        const x = wpos[i * stride], y = wpos[i * stride + 1];
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
    }
    if (!isFinite(minX) || !isFinite(minY) || minX === maxX || minY === maxY) {
        return null;
    }
    const triCount = triIndices.length / 3;
    const gridSize = Math.min(MAX_GRID, Math.max(MIN_GRID, Math.ceil(Math.sqrt(triCount / CELL_TARGET))));
    const cellX = (maxX - minX) / gridSize || 1;
    const cellY = (maxY - minY) / gridSize || 1;
    const cells = [];
    const emptyCell = [];
    for (let c = 0; c < gridSize * gridSize; c++) {
        cells.push(emptyCell);
    }
    const cellMaxZ = triZMax ? new Float32Array(gridSize * gridSize) : null;
    if (cellMaxZ) {
        cellMaxZ.fill(-Infinity);
    }
    for (let t = 0; t < triCount; t++) {
        const offset = t * 3;
        const a = triIndices[offset] * stride, b = triIndices[offset + 1] * stride, c = triIndices[offset + 2] * stride;
        const ax = wpos[a], ay = wpos[a + 1];
        const bx = wpos[b], by = wpos[b + 1];
        const cx = wpos[c], cy = wpos[c + 1];
        const triMinX = Math.min(ax, bx, cx);
        const triMinY = Math.min(ay, by, cy);
        const triMaxX = Math.max(ax, bx, cx);
        const triMaxY = Math.max(ay, by, cy);
        const gx0 = Math.max(0, Math.floor((triMinX - minX) / cellX));
        const gy0 = Math.max(0, Math.floor((triMinY - minY) / cellY));
        const gx1 = Math.min(gridSize - 1, Math.floor((triMaxX - minX) / cellX));
        const gy1 = Math.min(gridSize - 1, Math.floor((triMaxY - minY) / cellY));
        for (let gy = gy0; gy <= gy1; gy++) {
            for (let gx = gx0; gx <= gx1; gx++) {
                const cellIndex = gy * gridSize + gx;
                const cell = cells[cellIndex];
                if (cell === emptyCell) {
                    cells[cellIndex] = [t];
                } else {
                    cell.push(t);
                }
                if (cellMaxZ && triZMax[t] > cellMaxZ[cellIndex]) {
                    cellMaxZ[cellIndex] = triZMax[t];
                }
            }
        }
    }
    return {
        minX,
        minY,
        maxX,
        maxY,
        cellX,
        cellY,
        gridSize,
        cells,
        cellMaxZ
    };
}

/**
 * 用实例世界 AABB 构建 2D 均匀网格索引（gltf-lit 粗筛，避免逐点遍历全部实例）。
 * @param {Float32Array} aabbs - count×8：[minX,minY,minZ,maxX,maxY,maxZ,0,0]
 * @private
 */
function buildInstanceGrid(aabbs, count, minX, minY, maxX, maxY) {
    if (!isFinite(minX) || !isFinite(minY) || minX === maxX || minY === maxY) {
        return null;
    }
    const gridSize = Math.min(MAX_GRID, Math.max(MIN_GRID, Math.ceil(Math.sqrt(count / CELL_TARGET))));
    const cellX = (maxX - minX) / gridSize || 1;
    const cellY = (maxY - minY) / gridSize || 1;
    const cells = [];
    const emptyCell = [];
    for (let c = 0; c < gridSize * gridSize; c++) {
        cells.push(emptyCell);
    }
    const cellMaxZ = new Float32Array(gridSize * gridSize);
    cellMaxZ.fill(-Infinity);
    for (let i = 0; i < count; i++) {
        const off = i * 8;
        const gx0 = Math.max(0, Math.floor((aabbs[off] - minX) / cellX));
        const gy0 = Math.max(0, Math.floor((aabbs[off + 1] - minY) / cellY));
        const gx1 = Math.min(gridSize - 1, Math.floor((aabbs[off + 3] - minX) / cellX));
        const gy1 = Math.min(gridSize - 1, Math.floor((aabbs[off + 4] - minY) / cellY));
        const zMax = aabbs[off + 5];
        for (let gy = gy0; gy <= gy1; gy++) {
            for (let gx = gx0; gx <= gx1; gx++) {
                const cellIndex = gy * gridSize + gx;
                const cell = cells[cellIndex];
                if (cell === emptyCell) {
                    cells[cellIndex] = [i];
                } else {
                    cell.push(i);
                }
                if (zMax > cellMaxZ[cellIndex]) {
                    cellMaxZ[cellIndex] = zMax;
                }
            }
        }
    }
    return {
        minX,
        minY,
        maxX,
        maxY,
        cellX,
        cellY,
        gridSize,
        cells,
        cellMaxZ
    };
}

/**
 * 射线与三角形求交（Möller–Trumbore，模型局部空间）。
 * 局部空间是 GL 世界空间经实例逆矩阵变换而来，世界射线 (0,0,-1) 在局部为斜射线。
 *
 * 不做背面剔除：gltf 模型绕序多样，且同一三角形的正/背面命中点相同，
 * 取最高命中 z 即模型顶面，底面/侧面的命中高度更低，不会覆盖。
 * @returns {Number|null} 局部射线参数 t（世界 z = startZ - t），未命中返回 null
 * @private
 */
function intersectTriangleLocal(positions, triIndices, triIndex, dim, ox, oy, oz, dx, dy, dz) {
    const offset = triIndex * 3;
    const a = triIndices[offset] * dim, b = triIndices[offset + 1] * dim, c = triIndices[offset + 2] * dim;
    const ax = positions[a], ay = positions[a + 1], az = positions[a + 2];
    const bx = positions[b], by = positions[b + 1], bz = positions[b + 2];
    const cx = positions[c], cy = positions[c + 1], cz = positions[c + 2];

    const e1x = bx - ax, e1y = by - ay, e1z = bz - az;
    const e2x = cx - ax, e2y = cy - ay, e2z = cz - az;
    // p = dir × e2
    const px = dy * e2z - dz * e2y;
    const py = dz * e2x - dx * e2z;
    const pz = dx * e2y - dy * e2x;
    const det = e1x * px + e1y * py + e1z * pz;
    if (det > -EPSILON && det < EPSILON) {
        return null;
    }
    const invDet = 1 / det;
    const tx = ox - ax, ty = oy - ay, tz = oz - az;
    const u = (tx * px + ty * py + tz * pz) * invDet;
    if (u < 0 || u > 1) {
        return null;
    }
    const qx = ty * e1z - tz * e1y;
    const qy = tz * e1x - tx * e1z;
    const qz = tx * e1y - ty * e1x;
    const v = (dx * qx + dy * qy + dz * qz) * invDet;
    if (v < 0 || u + v > 1) {
        return null;
    }
    const t = (e2x * qx + e2y * qy + e2z * qz) * invDet;
    if (t < 0) {
        return null;
    }
    return t;
}

/**
 * 垂直向下射线（GL 世界空间 (0,0,-1)）与三角形求交（顶点世界坐标查表，无矩阵运算）。
 * @param {boolean} cullBackface - 是否剔除朝下/竖直的三角形（3dtiles/模型剔除；vt 顶面绕序朝下，不剔除）
 * @returns {Number|null} 命中点世界 z（取最高的命中），未命中返回 null
 * @private
 */
function intersectTriangleWorld(wpos, triIndices, triIndex, px, py, startZ, cullBackface) {
    const offset = triIndex * 3;
    const a = triIndices[offset] * 3, b = triIndices[offset + 1] * 3, c = triIndices[offset + 2] * 3;
    const ax = wpos[a], ay = wpos[a + 1], az = wpos[a + 2];
    const bx = wpos[b], by = wpos[b + 1], bz = wpos[b + 2];
    const cx = wpos[c], cy = wpos[c + 1], cz = wpos[c + 2];

    // 2D 点是否在三角形投影内（重心坐标）
    const v0x = bx - ax, v0y = by - ay;
    const v1x = cx - ax, v1y = cy - ay;
    const v2x = px - ax, v2y = py - ay;
    const dot00 = v0x * v0x + v0y * v0y;
    const dot01 = v0x * v1x + v0y * v1y;
    const dot02 = v0x * v2x + v0y * v2y;
    const dot11 = v1x * v1x + v1y * v1y;
    const dot12 = v1x * v2x + v1y * v2y;
    const invDenom = dot00 * dot11 - dot01 * dot01;
    if (invDenom === 0) {
        return null;
    }
    const u = (dot11 * dot02 - dot01 * dot12) / invDenom;
    const v = (dot00 * dot12 - dot01 * dot02) / invDenom;
    if (u < 0 || v < 0 || u + v > 1) {
        return null;
    }

    // 法线 z 分量（GL 世界空间），背面剔除：
    // - 3dtiles/模型（cullBackface=true）剔除朝下/竖直三角形，避免命中模型底面与墙面
    // - vt 建筑（cullBackface=false）的顶面在 GL 空间绕序朝下（瓦片坐标 y 翻转），不剔除，
    //   取最高命中 z 自然得到顶面
    const nz = v0x * v1y - v0y * v1x;
    if (cullBackface && nz <= EPSILON) {
        return null;
    }

    // 垂直向下射线 z 求解（数字稳定化：直接解平面方程，避免大数相减）
    const nx = v0y * (cz - az) - (bz - az) * v1y;
    const ny = (bz - az) * v1x - v0x * (cz - az);
    const d = nx * ax + ny * ay + nz * az;
    const hitZ = nz !== 0 ? (d - nx * px - ny * py) / nz : 0;
    if (hitZ >= startZ) {
        return null;
    }
    return hitZ;
}

/**
 * 批量垂直向下查询 mesh 表面高度。
 *
 * 预处理阶段对每个 mesh 只做一次顶点世界坐标变换并建立世界空间 2D 网格索引，
 * 查询阶段所有点共享该索引，避免对同一顶点反复做矩阵变换（数量级性能优化）。
 * @param {maptalks.Coordinate[]} coordinates - 经纬度坐标数组
 * @param {Object[]} meshes - mesh 数组（各图层 getAnalysisMeshes 收集）
 * @param {maptalks.Map} map - 地图
 * @returns {Array} 结果数组，每一项为 { coordinate, height, mesh } 或 null
 */
function test(coordinates, meshes, map) {
    const results = [];
    const glRes = map.getGLRes();
    const startZ = map.altitudeToPoint(200000, glRes);

    // 预处理：
    // - 非 instanced mesh（3dtiles/建筑/地形）按背面剔除策略分组合并，展开成世界坐标三角形，
    //   每组合并成一个世界空间 2D 网格 → 每个点只需一次网格定位
    // - instanced mesh（gltf-lit）收集全部实例（逆矩阵 + 世界 AABB + 模型局部三角形），合并成一个实例网格
    const triGroups = [];
    const instances = [];
    for (let m = 0; m < meshes.length; m++) {
        const mesh = meshes[m];
        const cached = mesh[INDEX_KEY];
        const decodeParams = getDecodeParams(mesh);
        const grid = cached && cached.geometry === mesh.geometry && cached.decodeParams && cached.decodeParams.range === decodeParams.range
            ? cached.grid : buildGrid(mesh, decodeParams);
        if (!grid) {
            continue;
        }
        if (grid.instanced) {
            // gltf-lit（InstancedMesh）：不展开实例，仅对每个实例计算组合矩阵的逆矩阵与世界 AABB，
            // 查询时把点变换到模型局部空间做三角形求交（避免 count × 模型顶点数级别的展开）
            const inst = mesh.insContext.instanceData;
            const count = grid.instanceCount;
            const lt = getMatrixValue(mesh.localTransform) || mat4.create();
            const pm = getMatrixValue(mesh.positionMatrix) || mat4.create();
            const M = mat4.create(), im = mat4.create();
            const aabb = grid.modelAABB;
            for (let i = 0; i < count; i++) {
                buildInstanceMat(im, inst, i);
                // 渲染顶点链：world = localTransform × instanceMat × positionMatrix × POSITION
                mat4.multiply(M, lt, im);
                mat4.multiply(M, M, pm);
                const invM = mat4.invert(mat4.create(), M);
                // 模型局部 AABB 的 8 个角点变换到世界，得到实例世界 AABB（含 zMax 用于高度提前剔除）
                let cminX = Infinity, cminY = Infinity, cminZ = Infinity, cmaxX = -Infinity, cmaxY = -Infinity, cmaxZ = -Infinity;
                const xs = [aabb.minX, aabb.maxX], ys = [aabb.minY, aabb.maxY], zs = [aabb.minZ, aabb.maxZ];
                for (let xi = 0; xi < 2; xi++) {
                    for (let yi = 0; yi < 2; yi++) {
                        for (let zi = 0; zi < 2; zi++) {
                            TEMP_VEC4[0] = xs[xi];
                            TEMP_VEC4[1] = ys[yi];
                            TEMP_VEC4[2] = zs[zi];
                            TEMP_VEC4[3] = 1;
                            vec4.transformMat4(TEMP_VEC4, TEMP_VEC4, M);
                            if (TEMP_VEC4[0] < cminX) cminX = TEMP_VEC4[0];
                            if (TEMP_VEC4[1] < cminY) cminY = TEMP_VEC4[1];
                            if (TEMP_VEC4[2] < cminZ) cminZ = TEMP_VEC4[2];
                            if (TEMP_VEC4[0] > cmaxX) cmaxX = TEMP_VEC4[0];
                            if (TEMP_VEC4[1] > cmaxY) cmaxY = TEMP_VEC4[1];
                            if (TEMP_VEC4[2] > cmaxZ) cmaxZ = TEMP_VEC4[2];
                        }
                    }
                }
                instances.push({
                    mesh,
                    invM,
                    positions: grid.positions,
                    triIndices: grid.triIndices,
                    triCount: Math.floor(grid.triIndices.length / 3),
                    dim: grid.dim,
                    minX: cminX, minY: cminY, maxX: cmaxX, maxY: cmaxY, zMax: cmaxZ
                });
            }
            continue;
        }
        // 非 instanced：展开顶点世界坐标
        const matrix = mat4.multiply([], mesh.localTransform || mat4.create(), mesh.positionMatrix || mat4.create());
        const positions = grid.positions, altitudes = grid.altitudes;
        const dim = grid.dim, useAltitude = grid.useAltitude;
        const vcount = Math.floor(positions.length / dim);
        const wpos = new Float32Array(vcount * 3);
        for (let v = 0; v < vcount; v++) {
            toWorldPosition(wpos.subarray(v * 3, v * 3 + 3), map,
                positions[v * dim], positions[v * dim + 1], positions[v * dim + 2],
                useAltitude ? altitudes[v] / 100 : undefined, matrix);
        }
        const cullBackface = !useAltitude && !grid.isVt;
        let group = null;
        for (let g = 0; g < triGroups.length; g++) {
            if (triGroups[g].cullBackface === cullBackface) {
                group = triGroups[g];
                break;
            }
        }
        if (!group) {
            group = { cullBackface, parts: [] };
            triGroups.push(group);
        }
        group.parts.push({
            wpos,
            triIndices: grid.triIndices,
            vCount: vcount,
            triCount: Math.floor(grid.triIndices.length / 3),
            mesh
        });
    }

    // 每组（背面剔除策略一致）合并三角形，按 zMax 降序排序后构建一个世界空间网格
    const prepared = [];
    for (let g = 0; g < triGroups.length; g++) {
        const group = triGroups[g];
        let totalV = 0, totalTri = 0;
        for (let i = 0; i < group.parts.length; i++) {
            totalV += group.parts[i].vCount;
            totalTri += group.parts[i].triCount;
        }
        if (!totalTri) {
            continue;
        }
        const wpos = new Float32Array(totalV * 3);
        const triIndices = new Uint32Array(totalTri * 3);
        const triMesh = new Array(totalTri);
        let vOff = 0, tOff = 0;
        for (let i = 0; i < group.parts.length; i++) {
            const part = group.parts[i];
            wpos.set(part.wpos, vOff * 3);
            for (let t = 0; t < part.triCount; t++) {
                triIndices[tOff * 3] = part.triIndices[t * 3] + vOff;
                triIndices[tOff * 3 + 1] = part.triIndices[t * 3 + 1] + vOff;
                triIndices[tOff * 3 + 2] = part.triIndices[t * 3 + 2] + vOff;
                triMesh[tOff] = part.mesh;
                tOff++;
            }
            vOff += part.vCount;
        }
        // 三角形 zMax + 降序排序（cell 内可提前终止）
        const triZMax = new Float32Array(totalTri);
        for (let t = 0; t < totalTri; t++) {
            const o = t * 3;
            const a = triIndices[o] * 3, b = triIndices[o + 1] * 3, c = triIndices[o + 2] * 3;
            triZMax[t] = Math.max(wpos[a + 2], wpos[b + 2], wpos[c + 2]);
        }
        const sorted = sortTrisByZDesc(triIndices, triZMax, triMesh);
        const wgrid = buildWorldGrid(wpos, sorted.triIndices, 3, sorted.triZMax);
        if (!wgrid) {
            continue;
        }
        prepared.push({ type: 'tri', wgrid, wpos, triIndices: sorted.triIndices, triZMax: sorted.triZMax, triMesh: sorted.triMeta, cullBackface: group.cullBackface });
    }

    // 全部 gltf-lit 实例合并成一个世界 AABB 网格
    if (instances.length) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        const aabbs = new Float32Array(instances.length * 8);
        for (let i = 0; i < instances.length; i++) {
            const inst = instances[i];
            const off = i * 8;
            aabbs[off] = inst.minX;
            aabbs[off + 1] = inst.minY;
            aabbs[off + 2] = inst.zMax;
            aabbs[off + 3] = inst.maxX;
            aabbs[off + 4] = inst.maxY;
            aabbs[off + 5] = inst.zMax;
            if (inst.minX < minX) minX = inst.minX;
            if (inst.minY < minY) minY = inst.minY;
            if (inst.maxX > maxX) maxX = inst.maxX;
            if (inst.maxY > maxY) maxY = inst.maxY;
        }
        const instanceGrid = buildInstanceGrid(aabbs, instances.length, minX, minY, maxX, maxY);
        if (instanceGrid) {
            prepared.push({ type: 'inst', instanceGrid, instances, aabbs });
        }
    }

    // 查询：每个点共享已构建的合并网格索引，每点仅做 1 次三角形网格定位 + 1 次实例网格定位
    for (let i = 0; i < coordinates.length; i++) {
        const coord = coordinates[i];
        // 复用临时对象做坐标变换，避免每点分配 Coordinate/Point
        map.coordinateToPointAtRes(coord, glRes, TEMP_PT);
        const cwX = TEMP_PT.x, cwY = TEMP_PT.y;
        let bestHeight = -Infinity;
        let bestMesh = null;
        for (let p = 0; p < prepared.length; p++) {
            const item = prepared[p];
            if (item.type === 'inst') {
                // gltf-lit：实例 AABB 网格粗筛 → 实例 zMax 高度剔除 → 实例逆矩阵把点变换到模型局部空间 → 局部三角形求交
                const ig = item.instanceGrid;
                if (cwX < ig.minX || cwX > ig.maxX || cwY < ig.minY || cwY > ig.maxY) {
                    continue;
                }
                const igx = Math.min(ig.gridSize - 1, Math.max(0, Math.floor((cwX - ig.minX) / ig.cellX)));
                const igy = Math.min(ig.gridSize - 1, Math.max(0, Math.floor((cwY - ig.minY) / ig.cellY)));
                const icellIndex = igy * ig.gridSize + igx;
                // 该格内所有实例的最高点都不超过当前 bestHeight → 整格跳过
                if (ig.cellMaxZ[icellIndex] <= bestHeight) {
                    continue;
                }
                const icell = ig.cells[icellIndex];
                if (!icell || !icell.length) {
                    continue;
                }
                const aabbs = item.aabbs;
                for (let k = 0; k < icell.length; k++) {
                    const idx = icell[k];
                    const aOff = idx * 8;
                    if (cwX < aabbs[aOff] || cwX > aabbs[aOff + 3]
                        || cwY < aabbs[aOff + 1] || cwY > aabbs[aOff + 4]
                        || aabbs[aOff + 5] <= bestHeight) {
                        continue;
                    }
                    const inst = item.instances[idx];
                    const invM = inst.invM;
                    // 点变换到模型局部空间（射线起点 startZ）。
                    // 注意：实例矩阵可能带倾斜（存在非对角耦合项），200km 高空起点的 startZ
                    // 经逆矩阵变换会把局部 XY 放大到模型包围盒之外——这是正常的，不能据此剔除。
                    // 世界射线 (0,0,-1) 变换到局部空间的射线
                    const lx = invM[0] * cwX + invM[4] * cwY + invM[8] * startZ + invM[12];
                    const ly = invM[1] * cwX + invM[5] * cwY + invM[9] * startZ + invM[13];
                    const lz = invM[2] * cwX + invM[6] * cwY + invM[10] * startZ + invM[14];
                    const dx = -invM[8];
                    const dy = -invM[9];
                    const dz = -invM[10];
                    // 模型局部三角形数少（通常 < 100），且能走到这里的点极少（实例世界
                    // 投影面积远小于查询区域），直接对全部局部三角形求交即可
                    for (let t = 0; t < inst.triCount; t++) {
                        const tLocal = intersectTriangleLocal(inst.positions, inst.triIndices, t, inst.dim,
                            lx, ly, lz, dx, dy, dz);
                        if (tLocal !== null) {
                            const hitZ = startZ - tLocal;
                            if (hitZ > bestHeight) {
                                bestHeight = hitZ;
                                bestMesh = inst.mesh;
                            }
                        }
                    }
                }
                continue;
            }
            const wg = item.wgrid;
            if (cwX < wg.minX || cwX > wg.maxX || cwY < wg.minY || cwY > wg.maxY) {
                continue;
            }
            const gx = Math.min(wg.gridSize - 1, Math.max(0, Math.floor((cwX - wg.minX) / wg.cellX)));
            const gy = Math.min(wg.gridSize - 1, Math.max(0, Math.floor((cwY - wg.minY) / wg.cellY)));
            const cellIndex = gy * wg.gridSize + gx;
            // 该格内所有三角形都不超过当前 bestHeight → 整格跳过
            if (wg.cellMaxZ[cellIndex] <= bestHeight) {
                continue;
            }
            const cell = wg.cells[cellIndex];
            if (!cell || !cell.length) {
                continue;
            }
            const triZMax = item.triZMax;
            for (let t = 0; t < cell.length; t++) {
                // 三角形按 zMax 降序，首个不高于 bestHeight 的三角形之后全部无效
                if (triZMax[cell[t]] <= bestHeight) {
                    break;
                }
                const hitZ = intersectTriangleWorld(item.wpos, item.triIndices, cell[t], cwX, cwY, startZ, item.cullBackface);
                if (hitZ !== null && hitZ > bestHeight) {
                    bestHeight = hitZ;
                    bestMesh = item.triMesh[cell[t]];
                }
            }
        }

        if (bestHeight !== -Infinity) {
            results.push({
                coordinate: coord,
                height: map.pointAtResToAltitude(bestHeight, glRes),
                mesh: bestMesh
            });
        } else {
            results.push(null);
        }
    }
    return results;
}

export default {
    test,
    // 供调试使用
    buildGrid,
    getDecodeParams,
    decodePositions
};
