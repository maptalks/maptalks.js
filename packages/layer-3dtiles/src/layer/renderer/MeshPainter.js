import * as maptalks from 'maptalks';
import { reshader, vec3, vec4, mat3, mat4, quat, HighlightUtil } from '@maptalks/gl';
import { iterateMesh, iterateBufferData, getItemAtBufferData, setInstanceData, } from '../../common/GLTFHelpers';
import regionVert from './glsl/region.vert';
import regionFrag from './glsl/region.frag';
import pntsVert from './glsl/pnts.vert';
import pntsFrag from './glsl/pnts.frag';
import { toDegree, isFunction, isNil, extend, setColumn3, flatArr, isNumber } from '../../common/Util';
import { intersectsBox } from 'frustum-intersects';
import { basisTo2D, setTranslation, getTranslation, readBatchData } from '../../common/TileHelper';
// import { getKHR_techniques } from './s3m/S3MTechnique';


const { getTextureMagFilter, getTextureMinFilter, getTextureWrap, getMaterialType, getMaterialFormat, getPrimitive, getUniqueREGLBuffer } = reshader.REGLHelper;

const Y_TO_Z = [1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1];
const X_TO_Z = [0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 0, 1];

const { loginIBLResOnCanvas, logoutIBLResOnCanvas, getIBLResOnCanvas, getPBRUniforms } = reshader.pbr.PBRUtils;

const DEFAULT_POLYGON_OFFSET = {
    factor : 0,
    units : 0
};

const DEFAULT_MATERIAL_INFO = {
    specularStrength: 0,
    materialShininess: 1
};

const IDENTITY_SCALE = [1, 1, 1];
const IDENTITY_MATRIX = mat4.identity([]);
// const P0 = [], P1 = [];

const phongFilter = m => {
    return m.material instanceof reshader.PhongMaterial;
};

const StandardFilter = m => {
    return m.material instanceof reshader.pbr.StandardMaterial;
};

// const colorOff = [false, false, false, false];
// const colorOn = [true, true, true, true];

const TEMP_RTCCENTER = [];
const TEMP_CENTER = new maptalks.Coordinate(0, 0);
const TEMP_POINT = new maptalks.Point(0, 0);
const TEMP_POINT1 = new maptalks.Point(0, 0);
const TEMP_POINT2 = new maptalks.Point(0, 0);
const TEMP_OFFSET = [];
const TEMP_TRANSLATION = [];
const TEMP_MATRIX1 = [];
const TEMP_MATRIX2 = [];

const DEFAULT_SEMANTICS = {
    'POSITION': 'POSITION',
    'NORMAL': 'NORMAL',
    'TEXCOORD_0': 'TEXCOORD_0',
    'TEXCOORD_1': 'TEXCOORD_1',
    'COLOR_0': 'COLOR_0',
    'TANGENT': 'TANGENT',
    '_BATCHID': '_BATCHID',
};

export default class MeshPainter {
    constructor(regl, layer) {
        this._layer = layer;
        this._canvas = layer.getRenderer().canvas;
        this.pickingFBO = layer.getRenderer().pickingFBO;
        this._spatialReference = new maptalks.SpatialReference();
        this._regl = regl;
        this._renderer = new reshader.Renderer(regl);
        this._loading = {};
        this._regionMeshes = {};
        this._modelMeshes = {};
        this._pntsMeshes = {};
        this._i3dmMeshes = {};
        this._cmptMeshes = {};
        this._cachedGLTF = {};
        this._modelScene = new reshader.Scene();
        this._pntsScene = new reshader.Scene();
        this._i3dmScene = new reshader.Scene();
        this._regionScene = new reshader.Scene();
        this._resLoader = new reshader.ResourceLoader(regl.texture(2));
        this._bindedListener = this._onResourceLoad.bind(this);
        this._defaultMaterial = new reshader.PhongMaterial({
            'baseColorFactor' : [1, 1, 1, 1]
        });
        this._createShaders();
        this._khrTechniqueWebglManager = new reshader.KHRTechniquesWebglManager(this._regl, this._getExtraCommandProps(), this._resLoader);
        const map = this.getMap();
        if (map.altitudeToPoint) {
            this._heightScale = map.altitudeToPoint(100, map.getGLRes()) / 100;
        }
    }

    getI3DMMeshes() {
        return this._i3dmMeshes;
    }

    getPNTSMeshes() {
        return this._pntsMeshes;
    }

    getB3DMMeshes() {
        return this._modelMeshes;
    }

    getPaintedMeshes() {
        return this._paintedMeshes;
    }

    getMap() {
        return this._layer.getMap();
    }

    paint(tiles, leafs, parentContext) {
        // const testMesh = { bloom: 1 };
        // if (!parentContext.sceneFilter(testMesh)) {
        //     return;
        // }
        const renderTarget = parentContext && parentContext.renderTarget;
        const filter = parentContext && parentContext.sceneFilter;
        const map = this.getMap();
        if (!tiles.length || !map) {
            return null;
        }
        const uniforms = this._getUniformValues();
        const projViewMatrix = map.projViewMatrix;
        const services = this._layer.options.services;
        const oneMeshArray = [];
        const parentMeshes = [];
        const meshes = [];
        const pntsMeshes = [];
        const i3dmMeshes = [];

        const levelMap = this._getLevelMap(tiles);

        for (let i = 0, l = tiles.length; i < l; i++) {
            const node = tiles[i].data.node;
            let mesh = this._getMesh(node);
            if (!mesh) {
                continue;
            }
            if (this._cmptMeshes[node.id]) {
                mesh = this._cmptMeshes[node.id];
                mesh = flatArr(mesh);
            }
            // if (node._error > maxError) {
            //     continue;
            // }

            let polygonOffset = services[node._rootIdx].polygonOffset || DEFAULT_POLYGON_OFFSET;
            if (isFunction(polygonOffset)) {
                polygonOffset = polygonOffset();
            }
            // const ambientColor = services[node._rootIdx].ambientLight;
            if (!Array.isArray(mesh)) {
                oneMeshArray[0] = mesh;
                mesh = oneMeshArray;
            }
            for (let ii = 0, ll = mesh.length; ii < ll; ii++) {
                const magic = mesh[ii].properties.magic;
                if (magic === 'b3dm') {
                    if (mesh[ii].getBoundingBox && !intersectsBox(projViewMatrix, mesh[ii].getBoundingBox())) {
                        continue;
                    }
                    const { batchIdData, batchIdMap } = mesh[ii].geometry.properties;
                    if (batchIdData && batchIdMap) {
                        const rootIdx = mesh[ii].properties.node._rootIdx;
                        if (this._highlighted && this._highlighted[rootIdx]) {
                            HighlightUtil.highlightMesh(this._regl, mesh[ii], this._highlighted[rootIdx], this._highlightTimestamp, batchIdMap);
                        } else if (!this._highlighted || !this._highlighted[rootIdx]) {
                            HighlightUtil.highlightMesh(this._regl, mesh[ii], null, this._highlightTimestamp, batchIdMap);
                        }
                        HighlightUtil.showOnly(this._regl, mesh[ii], this._showOnlys && this._showOnlys[rootIdx], this._showOnlyTimeStamp, batchIdMap);
                    }
                    if (parentContext && parentContext.bloom && mesh[ii].properties.hlBloomMesh) {
                        mesh[ii].properties.hlBloomMesh.properties.depthFunc = 'always';
                        mesh[ii].properties.hlBloomMesh.properties.polygonOffset = polygonOffset;
                        meshes.push(mesh[ii].properties.hlBloomMesh);
                    }
                    meshes.push(mesh[ii]);
                } else if (magic === 'pnts') {
                    pntsMeshes.push(mesh[ii]);
                } else if (magic === 'i3dm') {
                    i3dmMeshes.push(mesh[ii]);
                }
                // mesh[ii].setUniform('level', tiles[i].selectionDepth);
                // mesh[ii].setUniform('id', node.id);
                // mesh[ii].setUniform('polygonOffset', polygonOffset);
                mesh[ii].properties.isLeaf = !!leafs[node.id];
                mesh[ii].properties.level = levelMap.get(node._level);
                mesh[ii].properties.polygonOffset = polygonOffset;
                // if (!Object.prototype.hasOwnProperty.call(mesh[ii].uniforms, 'ambientColor')) {
                //     Object.defineProperty(mesh[ii].uniforms, 'ambientColor', {
                //         enumerable: true,
                //         get: function () {
                //             if (ambientColor) {
                //                 return ambientColor;
                //             }
                //             return uniforms['ambientColor'];
                //         }
                //     });
                // }

                mesh[ii]._node = node;

                if (!leafs[node.id]) {
                    parentMeshes.push(mesh[ii]);
                }
                this._updateMaskDefines(mesh[ii]);
            }
        }

        // const testMesh = { bloom: 1 };
        // if (parentContext.sceneFilter(testMesh)) {
        // if (parentContext.bloom) {
        //     const bloomMeshes = meshes.filter(m => m.bloom);
        //     if (bloomMeshes.length) {
        //         meshes = bloomMeshes;
        //     }
        // }


        // meshes.sort(meshCompare);
        // console.log(meshes.map(m => m.properties.id));
        let drawCount = 0;
        const khrExludeFilter = this._khrTechniqueWebglManager.getExcludeFilter();
        drawCount += this._callShader(this._phongShader, uniforms, [filter, phongFilter, khrExludeFilter], renderTarget, parentMeshes, meshes, i3dmMeshes);
        drawCount += this._callShader(this._standardShader, uniforms, [filter, StandardFilter, khrExludeFilter], renderTarget, parentMeshes, meshes, i3dmMeshes);

        this._khrTechniqueWebglManager.forEachShader((shader, shaderFilter, uniformSemantics) => {
            const uniforms = this._getUniformValues(uniformSemantics);
            drawCount += this._callShader(shader, uniforms, [filter, shaderFilter], renderTarget, parentMeshes, meshes, i3dmMeshes);
        });
        this._pntsScene.setMeshes(pntsMeshes);
        const pntsUniforms = this._getPntsUniforms();
        drawCount += this._renderer.render(this._pntsShader, pntsUniforms, this._pntsScene, renderTarget && renderTarget.fbo);

        this._paintedMeshes = {
            pntsMeshes,
            i3dmMeshes,
            b3dmMeshes: meshes
        };

        return drawCount;
    }

    _callShader(shader, uniforms, filter, renderTarget, parentMeshes, meshes, i3dmMeshes) {
        shader.filter = filter.filter(fn => !!fn);


        uniforms['debug'] = false;
        // this._modelScene.sortFunction = this._sort.bind(this);
        // this._modelScene.setMeshes(meshes);

        // uniforms['debug'] = true;
        // uniforms['stencilEnable'] = false;
        // uniforms['cullFace'] = 'front';
        // uniforms['colorMask'] = colorOff;
        // this._renderer.render(shader, uniforms, this._modelScene, renderTarget && renderTarget.fbo);


        // uniforms['stencilEnable'] = true;
        uniforms['debug'] = false;
        // uniforms['cullFace'] = 'back';
        // uniforms['colorMask'] = colorOn;
        let drawCount = 0;
        this._modelScene.setMeshes(meshes);
        drawCount += this._renderer.render(shader, uniforms, this._modelScene, renderTarget && renderTarget.fbo);


        // uniforms['stencilEnable'] = true;

        this._i3dmScene.setMeshes(i3dmMeshes);
        drawCount += this._renderer.render(shader, uniforms, this._i3dmScene, renderTarget && renderTarget.fbo);
        return drawCount;
    }

    _sort(a, b) {
        // const cameraPosition = this.getMap().cameraPosition;
        // vec3.transformMat4(P0, a.geometry.boundingBox.getCenter(), a.localTransform);
        // vec3.transformMat4(P1, b.geometry.boundingBox.getCenter(), b.localTransform);
        // return vec3.dist(P1, cameraPosition) - vec3.dist(P0, cameraPosition);
        return b._node._cameraDistance - a._node._cameraDistance;
    }

    paintRegion(tiles, parentTiles, options, filter, renderTarget) {
        const map = this.getMap();
        if (!tiles.length && !parentTiles.length) {
            return;
        }
        const projViewMatrix = map.projViewMatrix;
        tiles = tiles.concat(parentTiles);

        const meshes = [];
        for (let i = 0, l = tiles.length; i < l; i++) {
            const node = tiles[i].node;
            const mesh = this._createRegionMesh(node);
            if (!mesh) {
                continue;
            }
            if (mesh.getBoundingBox && !intersectsBox(projViewMatrix, mesh.getBoundingBox())) {
                continue;
            }
            meshes.push(mesh);
        }
        this._regionShader.filter = filter;

        this._regionScene.setMeshes(meshes);
        const uniforms = this._getRegionUniforms(options);

        this._renderer.render(this._regionShader, uniforms, this._regionScene, renderTarget && renderTarget.fbo);
    }

    deleteTile(tileData) {
        const node = tileData.node;
        const id = node.id;
        this._disposeMesh(id);
    }

    _disposeMesh(id) {
        const regionMesh = this._regionMeshes[id];
        if (regionMesh) {
            regionMesh.geometry.dispose();
            regionMesh.dispose();
            delete this._regionMeshes[id];
        }
        const mesh = this._modelMeshes[id] || this._pntsMeshes[id] || this._i3dmMeshes[id] || this._cmptMeshes[id] || this._loading[id];
        if (this._cmptMeshes[id]) {
            this._disposeCMPT(id);
        } else if (mesh) {
            this._deleteOne(mesh);
            delete this._modelMeshes[id];
            delete this._pntsMeshes[id];
            delete this._i3dmMeshes[id];
            delete this._loading[id];
        }
    }

    _disposeCMPT(id) {
        let mesh = this._cmptMeshes[id];
        mesh = flatArr(mesh);
        for (let i = 0; i < mesh.length; i++) {
            const { id } = mesh[i].properties;
            this._disposeMesh(id);
        }
        delete this._cmptMeshes[id];
    }

    _deleteOne(mesh) {
        if (Array.isArray(mesh)) {
            for (let i = 0, l = mesh.length; i < l; i++) {
                this._deleteOne(mesh[i]);
            }
        } else {
            // clear showOnly and highlights
            HighlightUtil.showOnly(this._regl, mesh);
            HighlightUtil.highlightMesh(this._regl, mesh);
            const url = mesh.geometry.properties.url;
            if (!url) {
                mesh.geometry.dispose();
                if (mesh.material) {
                    mesh.material.dispose();
                }
            } else {
                const cached = this._cachedGLTF[url];
                if (cached) {
                    cached.refCount--;
                    if (cached.refCount <= 0) {
                        cached.geometry.dispose();
                        cached.material.dispose();
                        delete this._cachedGLTF[url];
                    }
                }
            }
            mesh.dispose();
        }
    }

    remove() {
        const layer = this._layer;
        logoutIBLResOnCanvas(layer.getRenderer().canvas, layer.getMap());
        for (const id in this._cmptMeshes) {
            this._disposeCMPT(id);
        }
        this._cmptMeshes = {};
        for (const id in this._modelMeshes) {
            this._disposeMesh(id);
        }
        this._modelMeshes = {};
        for (const id in this._pntsMeshes) {
            this._disposeMesh(id);
        }
        this._pntsMeshes = {};
        for (const id in this._i3dmMeshes) {
            this._disposeMesh(id);
        }
        this._i3dmMeshes = {};

        for (const id in this._loading) {
            this._disposeMesh(id);
        }
        this._loading = {};
        for (const id in this._regionMeshes) {
            this._disposeMesh(id);
        }
        this._regionMeshes = {};

        if (this._phongShader) {
            this._phongShader.dispose();
            delete this._phongShader;
        }
        if (this._standardShader) {
            this._standardShader.dispose();
            delete this._standardShader;
        }
        if (this._pntsShader) {
            this._pntsShader.dispose();
            delete this._pntsShader;
        }
        if (this._regionShader) {
            this._regionShader.dispose();
            delete this._regionShader;
        }

        this._khrTechniqueWebglManager.dispose();

        if (this.picking) {
            this.picking.dispose();
        }
    }

    _createRegionMesh(node) {
        if (!node.boundingVolume || !node.boundingVolume.region) {
            return null;
        }
        if (this._regionMeshes[node.id]) {
            return this._regionMeshes[node.id];
        }
        const region = node.boundingVolume.region;
        let min = new maptalks.Coordinate(toDegree(region[0]), toDegree(region[1])),
            max = new maptalks.Coordinate(toDegree(region[2]), toDegree(region[3]));
        min = this._coordToPoint(min);
        max = this._coordToPoint(max);
        const center = min.add(max)._multi(1 / 2);
        min._sub(center);
        max._sub(center);
        const heights = this._distanceToPoint(region[4], region[5]),
            bottom = heights.x,
            top = heights.y;
        const aPosition = [
            //top
            min.x, min.y, top,
            max.x, min.y, top,
            max.x, max.y, top,
            min.x, max.y, top,

            //bottom
            min.x, min.y, bottom,
            max.x, min.y, bottom,
            max.x, max.y, bottom,
            min.x, max.y, bottom,
        ];

        const indices = [
            //top
            0, 1, 1, 2, 2, 3, 3, 0,
            //side
            0, 4, 1, 5, 2, 6, 3, 7,
            //bottom
            4, 5, 5, 6, 6, 7, 7, 4
        ];

        const geometry = new reshader.Geometry(
            {
                aPosition
            },
            indices,
            0,
            {
                primitive : 'lines'
            }
        );
        geometry.generateBuffers(this._regl);
        const mesh = new reshader.Mesh(geometry);
        const modelMat = mat4.identity([]);
        mesh.setLocalTransform(mat4.translate(modelMat, modelMat, [center.x, center.y, 0]));
        this._regionMeshes[node.id] = mesh;
        return mesh;
    }

    _getMesh(node) {
        return this._modelMeshes[node.id] || this._pntsMeshes[node.id] || this._i3dmMeshes[node.id] || this._cmptMeshes[node.id];
    }

    has(node) {
        return this._getMesh(node) || this._loading[node.id];
    }

    createPntsMesh(data, id, node, cb) {
        if (this._pntsMeshes[id]) {
            const meshes = this._pntsMeshes[id];
            console.warn(`pnts mesh with id(${id}) was already created.`);
            cb(null, { id : id, mesh : meshes });
            return meshes;
        }
        const { pnts, featureTable, rootIdx } = data;
        const service = this._layer.options.services[rootIdx];
        const count = featureTable['POINTS_LENGTH'];

        const geometry = new reshader.Geometry(
            pnts,
            null,
            count,
            {
                primitive: 'points',
                positionAttribute: 'POSITION'
            }
        );
        geometry.generateBuffers(this._regl);
        const defines = {};
        if (pnts['POSITION']) {
            defines['HAS_POSITION'] = 1;
        } else if (pnts['POSITION_QUANTIZED']) {
            defines['HAS_POSITION_QUANTIZED'] = 1;
        }
        if (pnts['RGB']) {
            defines['HAS_RGB'] = 1;
        } else if (pnts['RGBA']) {
            defines['HAS_RGBA'] = 1;
        } else if (pnts['RGB565']) {
            defines['HAS_RGB565'] = 1;
        }
        if (pnts['NORMAL'] || pnts['NORMAL_OCT16P']) {
            defines['HAS_NORMAL'] = 1;
            if (pnts['NORMAL_OCT16P']) {
                defines['HAS_NORMAL_OCT16P'] = 1;
            }
        }
        if (data.featureTable['CONSTANT_RGBA']) {
            data.featureTable['CONSTANT_RGBA'] = data.featureTable['CONSTANT_RGBA'].map(c => c / 255);
        }

        const { rtcCenter, rtcCoord } = data;
        const scaleTransform = this._getTransform(TEMP_MATRIX1, rtcCoord);
        const localTransform = this._computeProjectedTransform([], node, rtcCenter, rtcCoord);
        mat4.multiply(localTransform, localTransform, scaleTransform);

        const options = this._layer.options.services[rootIdx];

        const mesh = new reshader.Mesh(geometry);
        mesh.properties.magic = 'pnts';
        mesh.properties.id = id;
        mesh.properties.node = node;
        mesh.properties.count = count;
        mesh.properties.batchTable = data.batchTable;
        mesh.properties.batchTableBin = data.batchTableBin;
        mesh.properties.serviceIndex = rootIdx;
        mesh.setDefines(defines);
        Object.defineProperty(mesh.uniforms, 'pointColor', {
            enumerable: true,
            get: function () {
                if (data.featureTable['CONSTANT_RGBA']) {
                    return data.featureTable['CONSTANT_RGBA'];
                }
                return options && options.pointColor || [1, 1, 1, 1];
            }
        });
        Object.defineProperty(mesh.uniforms, 'pointSize', {
            enumerable: true,
            get: function () {
                return options && options.pointSize || 2;
            }
        });
        Object.defineProperty(mesh.uniforms, 'pointOpacity', {
            enumerable: true,
            get: function () {
                return options && options.pointOpacity || 1;
            }
        });
        if (service.coordOffset) {
            const coordOffsetMatrix = this._computeCoordOffsetMatrix(node._rootIdx, rtcCoord);
            mat4.multiply(localTransform, coordOffsetMatrix, localTransform);
        }
        mesh.setLocalTransform(localTransform);
        this._pntsMeshes[id] = mesh;
        cb(null, { id: id, mesh: [mesh] });
        return [mesh];
    }


    createI3DMMesh(data, id, node, cb) {
        if (this._i3dmMeshes[id]) {
            const meshes = this._i3dmMeshes[id];
            console.warn(`i3dm mesh with id(${id}) was already created.`);
            if (!this._loading[id]) {
                cb(null, { id: id, mesh: meshes });
            }
            return meshes;
        }
        const service = this._layer.options.services[node._rootIdx];
        const upAxisTransform = this._getUpAxisTransform(node._upAxis);
        const { i3dm, featureTable, gltf, batchTable, batchTableBin, count } = data;
        const instanceCount = featureTable['INSTANCES_LENGTH'];

        const { rtcCenter, rtcCoord } = data;
        const localTransform = this._getTransform(TEMP_MATRIX1, rtcCoord);
        const projectedMatrix = this._computeProjectedTransform(TEMP_MATRIX2, node, rtcCenter, rtcCoord);
        mat4.multiply(localTransform, projectedMatrix, localTransform);

        const { POSITION, NORMAL_UP, NORMAL_RIGHT, SCALE, SCALE_NON_UNIFORM, INSTANCE_ROTATION } = i3dm;
        const instanceData = {
            'instance_vectorA': new Float32Array(instanceCount * 4),
            'instance_vectorB': new Float32Array(instanceCount * 4),
            'instance_vectorC': new Float32Array(instanceCount * 4)
        }

        const normalUp = new Float32Array(3);
        const normalRight = new Float32Array(3);
        const normalForward = [];
        const scaleItem = new Float32Array(1);
        const scaleNonUniform = new Float32Array(3);
        const rotationMat3 = [];
        const quaternion = [];
        const scale = [];
        const matrix = [];
        const instanceRotMat3 = new Float32Array(9);
        iterateBufferData(POSITION, (vertex, index) => {
            if (NORMAL_UP) {
                getItemAtBufferData(normalRight, NORMAL_RIGHT, index);
                getItemAtBufferData(normalUp, NORMAL_UP, index);
                vec3.cross(normalForward, normalRight, normalUp)
                vec3.normalize(normalForward, normalForward);
                setColumn3(rotationMat3, normalRight, 0);
                setColumn3(rotationMat3, normalUp, 1);
                setColumn3(rotationMat3, normalForward, 2);
                quat.fromMat3(quaternion, rotationMat3);
            } else if (INSTANCE_ROTATION) {
                getItemAtBufferData(instanceRotMat3, INSTANCE_ROTATION, index);
                quat.fromMat3(quaternion, instanceRotMat3);
            } else  {
                quat.identity(quaternion);
            }
            if (SCALE) {
                getItemAtBufferData(scaleItem, SCALE, index);
                vec3.set(scale, scaleItem[0], scaleItem[0], scaleItem[0]);
            } else if (SCALE_NON_UNIFORM) {
                getItemAtBufferData(scaleNonUniform, SCALE_NON_UNIFORM, index);
                vec3.set(scale, ...scaleNonUniform);
            } else {
                vec3.set(scale, 1, 1, 1);
            }

            mat4.fromRotationTranslationScale(matrix, quaternion, vertex, scale);

            setInstanceData(instanceData['instance_vectorA'], index, matrix, 0);
            setInstanceData(instanceData['instance_vectorB'], index, matrix, 1);
            setInstanceData(instanceData['instance_vectorC'], index, matrix, 2);

        });

        const instanceBuffers = {};
        // 所有mesh共享一个 instance buffer，以节省内存
        for (const p in instanceData) {
            instanceBuffers[p] = {
                buffer: this._regl.buffer({
                    dimension: instanceData[p].length / instanceCount,
                    data: instanceData[p]
                }),
                divisor: 1
            };
        }

        const shader = service.shader || 'pbr';
        let unreadyCount = 0;
        let ready = true;
        const meshes = [];
        iterateMesh(gltf, (gltfMesh, meshId, primId, gltf) => {
            const { geometry, material } = this._processGLTF(gltfMesh, meshId, primId, gltf, node, true, shader);
            if (material && !material.isReady()) {
                ready = false;
                unreadyCount++;
            }
            const mesh = new reshader.InstancedMesh(instanceBuffers, instanceCount, geometry, material);
            mesh.properties.magic = 'i3dm';
            mesh.properties.id = id;
            mesh.properties.count = count;
            mesh.properties.batchTable = batchTable;
            mesh.properties.batchTableBin = batchTableBin;
            mesh.properties.serviceIndex = node._rootIdx;
            const defines = this._getGLTFMeshDefines(gltfMesh, geometry, material, node._rootIdx, gltf);
            this._setWEB3DDecodeUniforms(mesh, gltfMesh.attributes);
            // GLTF模型默认y为up
            // https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#coordinate-system-and-units
            const nodeMatrix = mat4.identity([]);
            // mat4.multiply(mat, mat, node.matrix);
            if (gltfMesh.matrices && gltfMesh.matrices.length) {
                for (let i = 0; i < gltfMesh.matrices.length; i++) {
                    mat4.multiply(nodeMatrix, nodeMatrix, gltfMesh.matrices[i]);
                }
            }
            mat4.multiply(nodeMatrix, upAxisTransform, nodeMatrix);
            mesh.setPositionMatrix(nodeMatrix);
            let matrix;
            if (service.coordOffset) {
                const coordOffsetMatrix = this._computeCoordOffsetMatrix(node._rootIdx, rtcCoord);
                matrix = mat4.multiply([], coordOffsetMatrix, localTransform);
            } else {
                matrix = mat4.copy([], localTransform);
            }
            mesh.setLocalTransform(matrix);
            mesh.setDefines(defines);
            mesh.properties.polygonOffset = { offset: 0, factor: 0 };
            meshes.push(mesh);
            delete gltfMesh.attributes;
        });

        if (ready) {
            this._i3dmMeshes[id] = meshes;
            cb(null, { id: id, mesh: meshes });
        } else {
            this._loading[id] = { meshes: meshes, count: unreadyCount };
            meshes._callback = cb;
        }
        return meshes;
    }

    createB3DMMesh(data, id, node, cb) {
        if (this._modelMeshes[id] || this._loading[id]) {
            const meshes = this._modelMeshes[id];
            console.warn(`mesh with id(${id}) was already created.`);
            if (!this._loading[id]) {
                cb(null, { id: id, mesh: meshes });
            }
            return meshes;
        }
        let maxPrjExtent;
        if (node.maxExtent) {
            const extent = new maptalks.Extent(node.maxExtent).convertTo(c => this._pointToPrj(c));
            maxPrjExtent = [extent.xmin, extent.ymin, extent.xmax, extent.ymax];
        }


        const gltf = data.gltf;
        //for model matrix
        const { projCenter } = gltf.extensions['MAPTALKS_RTC'];
        const { rtcCoord, center: rtcCenter } = gltf.extensions['CESIUM_RTC'];

        const upAxisTransform = this._getUpAxisTransform(node._upAxis);
        let localTransform;
        if (gltf.asset && gltf.asset.sharePosition) {
            // position被共享的模型，只能采用basisTo2D来绘制
            // 电信的模型如tokyo.html中的模型
            localTransform = this._getTransform(TEMP_MATRIX1, rtcCoord);
        } else {
            localTransform = this._getB3DMTransform(TEMP_MATRIX1, rtcCoord, projCenter, node._rootIdx);
        }
        const service = this._layer.options.services[node._rootIdx];
        let shader = service.shader || 'pbr';
        if (gltf.materials) {
            for (let i = 0; i < gltf.materials.length; i++) {
                if (gltf.materials[i] && gltf.materials[i].extensions && gltf.materials[i].extensions['KHR_materials_unlit']) {
                    shader = service.shader = 'phong';
                    break;
                }
            }
        }

        const meshes = [];
        let unreadyCount = 0;
        let ready = true;

        iterateMesh(gltf, (gltfMesh, meshId, primId, gltf) => {
            const { geometry, material } = this._processGLTF(gltfMesh, meshId, primId, gltf, node, false, shader);
            if (material && !material.isReady()) {
                ready = false;
                unreadyCount++;
            }
            const mesh = new reshader.Mesh(geometry, material);
            mesh.properties.magic = 'b3dm';
            mesh.properties.id = id;
            mesh.properties.node = node;
            mesh.properties.batchTable = data.batchTable;
            mesh.properties.batchTableBin = data.batchTableBin;
            mesh.properties.count = data.featureTable['BATCH_LENGTH'];
            mesh.properties.serviceIndex = node._rootIdx;
            const defines = this._getGLTFMeshDefines(gltfMesh, geometry, material, node._rootIdx, gltf);
            mesh.setDefines(defines);
            const compressUniforms = gltfMesh.compressUniforms;
            if (compressUniforms) {
                for (const u in compressUniforms) {
                    mesh.setUniform(u, compressUniforms[u]);
                }
            }

            this._setWEB3DDecodeUniforms(mesh, gltfMesh.attributes);
            if (maxPrjExtent) {
                defines['USE_MAX_EXTENT'] = 1;
                mesh.setUniform('maxPrjExtent', maxPrjExtent);
                // mesh.setUniform('prjCenter', projCenter);
            }

            if (!Object.prototype.hasOwnProperty.call(mesh.uniforms, 'polygonOpacity')) {
                Object.defineProperty(mesh.uniforms, 'polygonOpacity', {
                    enumerable: true,
                    get: function () {
                        return isNumber(service.opacity) ? service.opacity : 1;
                    }
                });
            }


            // gltfMesh.matrices 已经在 layerWorker转换坐标时，加入计算了，所以这里不用再重复计算
            const nodeMatrix = mat4.identity([]);
            // mat4.multiply(mat, mat, node.matrix);
            if (gltf.asset.sharePosition && gltfMesh.matrices && gltfMesh.matrices.length) {
                for (let i = 0; i < gltfMesh.matrices.length; i++) {
                    mat4.multiply(nodeMatrix, nodeMatrix, gltfMesh.matrices[i]);
                }
            }

            // const coordOffsetMatrix = this._computeCoordOffsetMatrix(node._rootIdx, rtcCoord);
            // if (coordOffsetMatrix) {
            //     mat4.multiply(nodeMatrix, coordOffsetMatrix, nodeMatrix);
            // }

            if (gltf.asset.sharePosition) {
                const projectedMatrix = this._computeProjectedTransform(TEMP_MATRIX2, node, rtcCenter, rtcCoord);
                mat4.multiply(nodeMatrix, upAxisTransform, nodeMatrix);
                mat4.multiply(nodeMatrix, localTransform, nodeMatrix);
                mat4.multiply(nodeMatrix, projectedMatrix, nodeMatrix);
            } else {
                mat4.multiply(nodeMatrix, localTransform, nodeMatrix);
            }

            if (service.coordOffset) {
                const coordOffsetMatrix = this._computeCoordOffsetMatrix([], node._rootIdx, rtcCoord);
                mat4.multiply(nodeMatrix, coordOffsetMatrix, nodeMatrix);
            }

            mesh.setLocalTransform(nodeMatrix);
            meshes.push(mesh);
            delete gltfMesh.attributes;
        });

        if (ready) {
            this._modelMeshes[id] = meshes;
            cb(null, { id : id, mesh : meshes });
        } else {
            this._loading[id] = { meshes: meshes, count: unreadyCount };
            meshes._callback = cb;
        }
        return meshes;
    }

    _setWEB3DDecodeUniforms(mesh, attributes) {
        if (attributes && attributes['TEXCOORD_0'] && attributes['TEXCOORD_0'].extensions && attributes['TEXCOORD_0'].extensions['WEB3D_quantized_attributes']) {
            const decodeMatrix = attributes['TEXCOORD_0'].extensions['WEB3D_quantized_attributes'].decodeMatrix;
            mesh.setUniform('decodeMatrix', decodeMatrix);
        }
    }

    _computeProjectedTransform(out, node, rtcCenter, rtcCoord) {
        const map = this.getMap();
        const heightOffset = this._layer.options.services[node._rootIdx].heightOffset || 0;
        const centerCoord = new maptalks.Coordinate(rtcCoord);
        let heightScale;
        if (map.altitudeToPoint) {
            heightScale = this._heightScale;
        } else {
            heightScale = map.distanceToPointAtRes(100, 100, map.getGLRes(), centerCoord).y / 100;
        }
        const nodeTransform = node.matrix ? mat4.copy(out, node.matrix) : mat4.identity(out);
        if (rtcCenter) {
            const realCenter = vec3.transformMat4(TEMP_RTCCENTER, rtcCenter, nodeTransform);
            setTranslation(nodeTransform, realCenter, nodeTransform);
        }
        // const computedTransform = mat4.multiply([], nodeTransform, Y_TO_Z);
        const computedTransform = nodeTransform;
        const projection = map.getProjection();
        const glRes = map.getGLRes();
        const projectedTransform = basisTo2D(computedTransform, rtcCoord, computedTransform, projection, glRes, heightScale, heightOffset);
        const translation = getTranslation(TEMP_TRANSLATION, projectedTransform);

        let offset = this._layer.options['offset'];
        if (isFunction(offset)) {
            const center = this._layer._getNodeBox(node.id).center;
            offset = offset(center);
        }
        vec3.set(TEMP_OFFSET, offset[0], offset[1], 0);
        vec3.sub(translation, translation, TEMP_OFFSET);
        setTranslation(projectedTransform, translation, projectedTransform);
        return projectedTransform;

    }

    _computeCoordOffsetMatrix(out, rootIdx, center) {
        const service = this._layer.options.services[rootIdx];
        if (!service.coordOffset) {
            return null;
        }
        const map = this.getMap();
        const glRes = map.getGLRes();
        TEMP_CENTER.set(center[0], center[1]);
        const point0 = map.coordToPointAtRes(TEMP_CENTER, glRes, TEMP_POINT1);
        const coordOffset = service.coordOffset;
        const target = TEMP_CENTER.set(center[0] + coordOffset[0], center[1] + coordOffset[1]);
        const point1 = map.coordToPointAtRes(target, glRes, TEMP_POINT2);
        const dx = point1.x - point0.x;
        const dy = point1.y - point0.y;
        const heightScale = this._getHeightScale();

        const translation = vec3.set(TEMP_OFFSET, dx, dy, (coordOffset[2] || 0) * heightScale);
        const matrix = mat4.fromTranslation(out, translation);
        return matrix;
    }

    _getHeightScale() {
        const map = this.getMap();
        let heightScale;
        if (map.altitudeToPoint) {
            heightScale = this._heightScale;
        } else {
            heightScale = map.distanceToPointAtRes(100, 100, map.getGLRes(), TEMP_CENTER).y / 100;
        }
        return heightScale;
    }

    createCMPTMesh(data, id, node, cb) {
        if (this._cmptMeshes[id]) {
            const meshes = this._cmptMeshes[id];
            console.warn(`mesh with id(${id}) was already created.`);
            cb(null, { id: id, mesh: meshes });
            return meshes;
        }
        // if (node.content.uri !== 'NoLod_2.cmpt') {
        //     return [];
        // }
        const { content } = data;
        const meshes = [];
        for (let i = 0; i < content.length; i++) {
            const { magic } = content[i];
            const childId = id + '.' + i;
            if (magic === 'b3dm') {
                this.createB3DMMesh(content[i], childId, node, (err, { mesh }) => {
                    meshes.push(mesh);
                });
            } else if (magic === 'i3dm') {
                this.createI3DMMesh(content[i], childId, node, (err, { mesh }) => {
                    meshes.push(mesh);
                });
            } else if (magic === 'pnts') {
                this.createPntsMesh(content[i], childId, node, (err, { mesh }) => {
                    meshes.push(mesh);
                });
            } else if (magic === 'cmpt') {
                this.createCMPTMesh(content[i], childId, node, (err, { mesh }) => {
                    meshes.push(mesh);
                });
            }
        }
        this._cmptMeshes[id] = meshes;
        cb(null, { id: id, mesh: meshes });
        return meshes;
    }

    _getGLTFMeshDefines(gltfMesh, geometry, material, rootIdx, gltf) {
        const shader = this._layer.options.services[rootIdx].shader || 'pbr';
        const runShader = shader === 'phong' ? this._phongShader : this._standardShader;
        const defines = runShader.getGeometryDefines(geometry);
        if (gltf.asset && gltf.asset.generator === 'S3M') {
            this._appendS3MDefines(defines, geometry);
        }
        if (geometry.data.uvRegion) {
            defines['HAS_I3S_UVREGION'] = 1;
        }

        if (geometry.data[geometry.desc.normalAttribute]) {
            defines['VertexNormal'] = 1;
        }
        if (geometry.data[geometry.desc.color0Attribute]) {
            defines['VertexColor'] = 1;
        }
        if (geometry.data[geometry.desc.uv0Attribute]) {
            defines['TexCoord'] = 1;
        }
        if (geometry.data[geometry.desc.textureCoordMatrixAttribute]) {
            defines['HAS_TextureCoordMatrix'] = 1;
        }
        if (material.get('uTexture')) {
            defines['COMPUTE_TEXCOORD'] = 1;
        }
        if (material.get('uTexture2')) {
            defines['TexCoord2'] = 1;
        }
        if(this._layer._vertexCompressionType === 'MESHOPT') {
            defines['MeshOPT_Compress'] = 1;
        }
        if (this.hasIBL()) {
            defines['HAS_IBL_LIGHTING'] = 1;
        }
        if (gltfMesh.attributes && gltfMesh.attributes['TEXCOORD_0'] && gltfMesh.attributes['TEXCOORD_0'].extensions === 'WEB3D_quantized_attributes') {
            defines['HAS_WEB3D_quantized_attributes_TEXCOORD'] = 1;
        }
        const compressDefines = gltfMesh.compressDefines;
        extend(defines, compressDefines);
        return defines;
    }

    _updateMaskDefines(mesh) {
        const renderer = this._layer.getRenderer();
        if (renderer) {
            renderer.updateMaskDefines(mesh);
        }
    }

    _appendS3MDefines(defines, geometry) {
        if (geometry.data['aNormal']) {
            defines['VertexNormal'] = 1;
        }
        if (geometry.data['instanceId']) {
            defines['Instance'] = 1;
        }
        if (geometry.data['aTexCoord0']) {
            defines['TexCoord'] = 1;
        }
        if (geometry.data['aColor']) {
            defines['VertexColor'] = 1;
        }
        if (geometry.data['aTexCoord1']) {
            defines['TexCoord2'] = 1;
        }
        if (geometry.data['uv2']) {
            defines['InstanceBim'] = 1;
        }
    }

    _processGLTF(gltfMesh, meshId, primId, gltf, node, isI3DM, shader) {
        let isS3M = false;
        if (gltf.asset && gltf.asset.generator === 'S3M') {
            isS3M = true;
            // is a s3mType
            gltf.extensions = gltf.extensions || {};
            // gltf.extensions['KHR_techniques_webgl'] = getKHR_techniques(gltf.asset.s3mVersion);
        }
        const url = gltf.url + '-' + meshId + '-' + primId;
        if (this._cachedGLTF[url]) {
            this._cachedGLTF[url].refCount++;
            return this._cachedGLTF[url];
        }
        let material, geometry;
        //TODO 有些B3DM或I3DM里，多个 gltf.mesh 会共享同一个POSITION，MESH，TEXCOORD。
        // 效率更高的做法是为他们单独创建buffer后赋给Geometry
        // 程序中无需管理buffer的销毁，Geometry中会维护buffer的引用计数来管理buffer的销毁
        const matInfo = gltf.materials && gltf.materials[gltfMesh.material];
        const khrTechniquesWebgl = gltf.extensions && gltf.extensions['KHR_techniques_webgl'];
        if (khrTechniquesWebgl && matInfo.extensions && matInfo.extensions['KHR_techniques_webgl']) {
            // s3m.vert 和 s3m.frag 是用webgl 2写的，所以是s3m时，要开启webgl2
            const khrMesh = this._createTechniqueMesh(gltfMesh, gltf, isI3DM, isS3M);
            material = khrMesh.material;
            geometry = khrMesh.geometry;
            const service = this._layer.options.services[node._rootIdx];
            if (service['fillEmptyDataInMissingAttribute']) {
                geometry.desc.fillEmptyDataInMissingAttribute = true;
            }
        } else {
            geometry = this._createGeometry(gltfMesh, isI3DM, DEFAULT_SEMANTICS);
            const service =  this._layer.options.services[node._rootIdx];
            const ambientLight = service.ambientLight;
            let environmentExposure = service.environmentExposure;
            const materialInfo = service.material;
            const lights = this.getMap().getLightManager();
            const mapAmbient = lights && lights.getAmbientLight();
            if (ambientLight && (!mapAmbient || mapAmbient.color) && environmentExposure === undefined) {
                const ambientValue = mapAmbient && mapAmbient.color ? mapAmbient.color[0] : 0.2;
                // 老的ambientLight设置的兼容性代码
                environmentExposure = ambientLight[0] / ambientValue;
            }
            material = this._createMaterial(gltfMesh.material, gltf, shader, materialInfo || DEFAULT_MATERIAL_INFO, environmentExposure || 1);
        }

        if (material && !material.isReady()) {
            material._nodeId = node.id;
        } else if (!material) {
            material = this._defaultMaterial;
        }

        const gltfGeo = {
            refCount: 1,
            geometry, material
        };
        geometry.properties.url = url;
        this._cachedGLTF[url] = gltfGeo;
        return gltfGeo;
    }

    _createTechniqueMesh(gltfMesh, gltf, isI3DM, useWebGL2) {
        const { geometry, material } = this._khrTechniqueWebglManager.createMesh(gltfMesh, gltf, isI3DM, useWebGL2)
        return { geometry, material };
    }

    _createGeometry(gltfMesh, isI3DM, attributeSemantics) {
        const attributes = gltfMesh.attributes;
        const color0Name = 'COLOR_0';
        // 把Float32类型的color0改为uint8类型数组
        let batchIdData = attributes['_BATCHID'] && attributes['_BATCHID'].array;
        if (batchIdData) {
            if (batchIdData.byteOffset) {
                batchIdData = new batchIdData.constructor(batchIdData);
            }
        }
        if (attributes[color0Name]) {
            const colors =  attributes[color0Name].array || attributes[color0Name];
            if (colors instanceof Float32Array) {
                const color = new Uint8Array(colors.length);
                for (let i = 0; i < color.length; i++) {
                    color[i] = Math.round(colors[i] * 255);
                }
                if (attributes[color0Name].array) {
                    attributes[color0Name].array = color;
                    attributes[color0Name].componentType = 5121;
                } else {
                    attributes[color0Name] = color;
                }

            }
        }
        const attrs = {};
        for (const p in attributes) {
            const buffer = getUniqueREGLBuffer(this._regl, attributes[p], { dimension: attributes[p].itemSize });
            // 优先采用 attributeSemantics中定义的属性
            const name = attributeSemantics[p] || p;
            attrs[name] = { buffer };
            if (attributes[p].quantization) {
                attrs[name].quantization = attributes[p].quantization;
            }
            if (name === attributeSemantics['POSITION']) {
                attrs[name].array = attributes[p].array;
                attrs[name].min = attributes[p].min;
                attrs[name].max = attributes[p].max;
            }
        }
        // createColorArray(attrs);
        const indices = gltfMesh.indices ? (gltfMesh.indices.array ? gltfMesh.indices.array.slice() : gltfMesh.indices) : null;
        const geometry = new reshader.Geometry(
            attrs,
            indices,
            0,
            {
                positionAttribute: attributeSemantics['POSITION'],
                normalAttribute: attributeSemantics['NORMAL'],
                uv0Attribute: attributeSemantics['TEXCOORD_0'],
                uv1Attribute: attributeSemantics['TEXCOORD_1'],
                color0Attribute: attributeSemantics['COLOR_0'],
                tangentAttribute: attributeSemantics['TANGENT'],
                pickingIdAttribute: attributeSemantics['_BATCHID'],
                primitive: gltfMesh.mode === undefined ? 'triangles' : getPrimitive(gltfMesh.mode)
            }
        );
        if (batchIdData && indices) {
            geometry.properties.batchIdData = batchIdData;
            geometry.properties.batchIdMap = generateFeatureIndiceIndex(batchIdData, indices);
        }
        geometry.generateBuffers(this._regl, { excludeElementsInVAO: isI3DM });
        return geometry;
    }

    _getB3DMTransform(out, rtcCoord, projCenter, rootIdx) {
        const localTransform = mat4.identity(out);

        const map = this.getMap();
        TEMP_CENTER.x = projCenter[0];
        TEMP_CENTER.y = projCenter[1];
        const center = this._prjToPoint(TEMP_CENTER);
        const scale = this._getProjScale();
        // xy轴坐标是投影坐标，所以要乘以res
        const zoomScale = 1 / (map.getGLZoom ? map.getResolution(map.getGLZoom()) : map.getGLRes());
        TEMP_CENTER.x = rtcCoord[0];
        TEMP_CENTER.y = rtcCoord[1];
        // 高度坐标是米
        const heightScale = this._getHeightScale();
        // const heightScale = map.altitudeToPoint(100, map.getGLRes()) / 100;
        let offset = this._layer.options['offset'];
        if (isFunction(offset)) {
            offset = offset(TEMP_CENTER);
        }

        const heightOffset = this._layer.options.services[rootIdx].heightOffset || 0;
        vec3.set(TEMP_TRANSLATION, center.x - offset[0], center.y - offset[1], heightScale * projCenter[2] + heightScale * heightOffset);
        mat4.translate(localTransform, localTransform, TEMP_TRANSLATION);
        vec3.set(scale, zoomScale, zoomScale, heightScale);
        mat4.scale(localTransform, localTransform, scale);
        return localTransform;
    }

    _getTransform(out, rtcCoord) {
        // heightOffset 在 _computeProjectedTransform 中计算了，所以这里不用再重复计算。
        const localTransform = mat4.identity(out);
        const map = this.getMap();
        const scale = this._getProjScale();
        TEMP_CENTER.x = rtcCoord[0];
        TEMP_CENTER.y = rtcCoord[1];
        const zoomScale = map.distanceToPointAtRes(100, 100, map.getGLRes(), TEMP_CENTER);
        let heightScale;
        if (map.altitudeToPoint) {
            heightScale = this._heightScale;
        } else {
            heightScale = zoomScale.y / 100;
        }
        vec3.set(scale, zoomScale.x / 100 * 1.01, zoomScale.y / 100 * 1.01, heightScale);
        // const zScale = zoomScale.y / 100;
        // vec3.set(scale, zoomScale.x / 100, zoomScale.y / 100, zScale);
        mat4.scale(localTransform, localTransform, scale);
        return localTransform;
    }

    _createShaders() {

        const viewport = {
            x : 0,
            y : 0,
            width : () => {
                return this._canvas ? this._canvas.width : 1;
            },
            height : () => {
                return this._canvas ? this._canvas.height : 1;
            }
        };
        this._regionShader = new reshader.MeshShader({
            vert: regionVert,
            frag: regionFrag,
            uniforms : [
                'color',
                {
                    name: 'projViewModelMatrix',
                    type: 'function',
                    fn: (_, props) => {
                        return mat4.multiply([], props['projViewMatrix'], props['modelMatrix']);
                    }
                }
            ],
            extraCommandProps: {
                viewport
            }
        });

        const modelNormalMatrix = [];
        const projViewModelMatrix = [];
        this._pntsShader = new reshader.MeshShader({
            vert: pntsVert,
            frag: pntsFrag,
            uniforms: [
                {
                    name: 'projViewModelMatrix',
                    type: 'function',
                    fn: (_, props) => {
                        return mat4.multiply(projViewModelMatrix, props['projViewMatrix'], props['modelMatrix']);
                    }
                },
                {
                    name: 'modelNormalMatrix',
                    type: 'function',
                    fn: (_, props) => {
                        return mat3.fromMat4(modelNormalMatrix, props['modelMatrix']);
                    }
                }
            ],
            extraCommandProps: {
                viewport,
                blend: {
                    enable: true,
                    func: {
                        src: 'src alpha',
                        dst: 'one minus src alpha'
                    },
                    equation: 'add'
                },
                depth: {
                    enable: true,
                    range: [0, 1],
                    func: '<'
                }
            }
        });

        const extraCommandProps = this._getExtraCommandProps();

        this._phongShader = new reshader.PhongShader({
            extraCommandProps
        });

        this._standardShader = new reshader.pbr.StandardShader({
            extraCommandProps
            // uniforms : [
            //     'ambientLight',
            //     'baseColor',
            //     'debug',
            //     'linearColor',
            //     {
            //         name : 'projViewModelMatrix',
            //         type : 'function',
            //         fn : (context, props) => {
            //             return mat4.multiply([], props['projViewMatrix'], props['modelMatrix']);
            //         }
            //     },
            //     {
            //         name : 'maxExtent',
            //         type : 'function',
            //         fn : (context, props) => {
            //             const maxExtent = props['maxPrjExtent'],
            //                 prjCenter = props['prjCenter'];
            //             if (!maxExtent) {
            //                 return null;
            //             }
            //             const extent = [
            //                 maxExtent[0] - prjCenter[0], maxExtent[1] - prjCenter[1],
            //                 maxExtent[2] - prjCenter[0], maxExtent[3] - prjCenter[1],
            //             ];
            //             return extent;
            //         }
            //     }
            // ],

        });

        const layer = this._layer;
        loginIBLResOnCanvas(layer.getRenderer().canvas, this._regl, layer.getMap());

        this.picking = new reshader.FBORayPicking(
            this._renderer,
            {
                vert: this._standardShader.vert,
                extraCommandProps,
                uniforms: this._standardShader.uniforms,
                defines: {
                    'PICKING_MODE': 1,
                    'ENABLE_PICKING': 1,
                    'HAS_PICKING_ID': 1
                },
            },
            this.pickingFBO,
            this.getMap()
        );
        // this._modelShader.filter = mesh => {
        //     return mesh.material.isReady();
        // };
    }

    _getExtraCommandProps() {
        const viewport = {
            x : 0,
            y : 0,
            width : () => {
                return this._canvas ? this._canvas.width : 1;
            },
            height : () => {
                return this._canvas ? this._canvas.height : 1;
            }
        };
        return {
            viewport,
            // colorMask: (_, props) => {
            //     return props['colorMask'] || colorOn;
            // },
            cull : {
                enable: true/*,
                face: (_, props) => {
                    return props.cullFace || 'back';
                }*/
            },
            stencil: {
                enable: true,
                func: {
                    cmp: (_, props) => {
                        return props.meshProperties.isLeaf ? 'always' : '>=';
                    },
                    ref: (_, props) => {
                        return props.meshProperties.level;
                    },
                    // mask: 0xff
                },
                opFront: {
                    fail: 'keep',
                    zfail: 'keep',
                    zpass: 'replace'
                },
                opBack: {
                    fail: 'keep',
                    zfail: 'keep',
                    zpass: 'replace'
                }
            },
            depth: {
                enable: true,
                range: [0, 1],
                func: (_, props) => {
                    return props.meshProperties.depthFunc || '<';
                }
            },
            blend: {
                enable: true,
                func: {
                    src: 'src alpha',
                    dst: 'one minus src alpha'
                },
                equation: 'add'
            },
            polygonOffset: {
                enable: true,
                offset: (_, props) => {
                    return props.meshProperties.polygonOffset;
                }
            }
        };
    }

    _getRegionUniforms(options) {
        const map = this.getMap();
        return {
            projViewMatrix : map.projViewMatrix,
            color : options && options.color || [0, 1, 0]
        };
    }

    _getPntsUniforms(options) {
        const map = this.getMap();
        const lightManager = map.getLightManager();
        const directionalLight = lightManager && lightManager.getDirectionalLight() || {};
        const lightDir = directionalLight.direction || [1, 1, -1];
        const pointOpacity = options && options.pointOpacity || 1;
        return {
            projViewMatrix : map.projViewMatrix,
            pointOpacity,
            lightDir: vec3.normalize(lightDir, lightDir)
        };
    }

    _getUniformValues() {
        const map = this.getMap();
        const layer = this._layer;
        const canvas = layer.getRenderer().canvas;
        const { iblTexes, dfgLUT } = getIBLResOnCanvas(canvas);
        const uniforms = getPBRUniforms(map, iblTexes, dfgLUT);
        const renderer = this._layer.getRenderer();
        const maskUniforms = renderer.getMaskUniforms();
        extend(uniforms, {
            czm_lightDirectionEC: uniforms['light0_viewDirection'],
            lightSpecular: [1.0, 1.0, 1.0],
            viewMatrix: map.viewMatrix,
            projMatrix: map.projMatrix,
            projViewMatrix : map.projViewMatrix,
            outSize: [canvas.width, canvas.height],
            polygonFill: [1, 1, 1, 1],
            polygonOpacity: 1
        });
        extend(uniforms, maskUniforms);
        return uniforms;
    }

    _createMaterial(materialIndex, gltf, shader, materialInfo, environmentExposure) {
        const material = gltf.materials && gltf.materials[materialIndex];
        if (!material || !material.baseColorTexture && !material.pbrMetallicRoughness) {
            return null;
        }
        const matInfo = extend({}, materialInfo);
        if (material.baseColorTexture) {
            // GLTF 1.0
            const texInfo = gltf.textures[material.baseColorTexture.index];
            let texture;
            if (texInfo && !texInfo.image.color) {
                texture = this._getTexture(texInfo);
            }
            matInfo.baseColorFactor = texInfo && texInfo.image.color || material.baseColorFactor || [1, 1, 1, 1];
            if (texture) {
                matInfo['baseColorTexture'] = texture;
            }
        } else {
            // GLTF 2.0

            if (material.normalTexture) {
                const texture = this._getTexture(gltf.textures[material.normalTexture.index]);
                const normalMapFactor = material.normalTexture.scale || 1;
                matInfo.normalTexture = texture;
                matInfo.normalMapFactor = normalMapFactor;
            }
            if (material.occlusionTexture) {
                const texture = this._getTexture(gltf.textures[material.occlusionTexture.index]);
                const occlusionFactor = material.occlusionTexture.strength || 1;
                matInfo.occlusionTexture = texture;
                matInfo.occlusionFactor = occlusionFactor;
            }
            if (material.emissiveTexture) {
                const texture = this._getTexture(gltf.textures[material.emissiveTexture.index]);
                matInfo.emissiveTexture = texture;
            }
            if (material.emissiveFactor) {
                matInfo.emissiveFactor = material.emissiveFactor;
            }
            //TODO alphaMode, cutOff和doubleSided

            const pbrMetallicRoughness = material.pbrMetallicRoughness;
            if (pbrMetallicRoughness) {
                if (pbrMetallicRoughness.baseColorFactor) {
                    matInfo.baseColorFactor = pbrMetallicRoughness.baseColorFactor;
                }
                if (pbrMetallicRoughness.baseColorTexture && pbrMetallicRoughness.baseColorTexture.index !== undefined) {
                    const texInfo = gltf.textures[pbrMetallicRoughness.baseColorTexture.index];
                    if (texInfo.image && texInfo.image.color) {
                        matInfo.baseColorFactor = matInfo.baseColorFactor ? vec4.multiply(matInfo.baseColorFactor, matInfo.baseColorFactor, texInfo.image.color) : texInfo.image.color;
                    } else {
                        matInfo.baseColorTexture = this._getTexture(texInfo);
                        // 调用getREGLTexture以回收bitmap
                        matInfo.baseColorTexture.getREGLTexture(this._regl);
                    }
                }
                if (!isNil(pbrMetallicRoughness.metallicFactor)) {
                    matInfo.metallicFactor = pbrMetallicRoughness.metallicFactor;
                }
                if (!isNil(pbrMetallicRoughness.roughnessFactor)) {
                    matInfo.roughnessFactor = pbrMetallicRoughness.roughnessFactor;
                }
                if (material.metallicRoughnessTexture) {
                    const texture = this._getTexture(gltf.textures[material.metallicRoughnessTexture.index]);
                    matInfo.metallicRoughnessTexture = texture;
                }
            }
        }


        if (material.s3mMaterial) {
            return new reshader.Material(matInfo);
        }
        matInfo['environmentExposure'] = environmentExposure;
        if (material.extensions && material.extensions['KHR_materials_unlit']) {
            matInfo['environmentExposure'] = 1;
            matInfo.ambientColor = [1, 1, 1];
            matInfo['light0_diffuse'] = [0, 0, 0, 0];
            matInfo['lightSpecular'] = [0, 0, 0];
            return new reshader.PhongMaterial(matInfo);
        }
        matInfo.alphaTest = 0.99;

        let meshMaterial = new reshader.pbr.StandardMaterial(matInfo);
        if (shader === 'phong') {
            meshMaterial = reshader.PhongMaterial.convertFrom(meshMaterial);
        }
        const pbrMetallicRoughness = material.pbrMetallicRoughness;
        const extensions = pbrMetallicRoughness && pbrMetallicRoughness.baseColorTexture && pbrMetallicRoughness.baseColorTexture.extensions;
        if (extensions && extensions['KHR_texture_transform']) {
            meshMaterial.set('khr_offset', extensions['KHR_texture_transform'].offset || [0, 0]);
            meshMaterial.set('khr_rotation', extensions['KHR_texture_transform'].rotation || 0);
            meshMaterial.set('khr_scale', extensions['KHR_texture_transform'].scale || [1, 1]);
        }

        meshMaterial.once('complete', this._bindedListener);
        return meshMaterial;
    }

    _getTexture(texInfo) {
        // texInfo.image.color 表示图片被精简成了颜色
        const config = {
            type: texInfo.type ? getMaterialType(texInfo.type) : 'uint8',
            format: texInfo.format ? getMaterialFormat(texInfo.format) : 'rgba',
            flipY: !!texInfo.flipY
        };
        //gltf 2.0
        const image = texInfo.image;
        if (image.array) {
            config.data = image.array;
        } else if (image.mipmap) {
            config.mipmap = image.mipmap;
        }
        config.width = image.width;
        config.height = image.height;
        const sampler = texInfo.sampler || texInfo.texture && texInfo.texture.sampler;
        if (sampler) {
            if (sampler.magFilter) config['mag'] = getTextureMagFilter(sampler.magFilter);
            if (sampler.minFilter) config['min'] = getTextureMinFilter(sampler.minFilter);
            if (sampler.wrapS) config['wrapS'] = getTextureWrap(sampler.wrapS);
            if (sampler.wrapT) config['wrapT'] = getTextureWrap(sampler.wrapT);
        }

        return new reshader.Texture2D(config, this._resLoader);

    }

    _onResourceLoad({ target }) {
        const id = target._nodeId;
        const loading = this._loading[id];
        loading.count--;
        if (!loading.count) {
            const mesh = loading.meshes;
            this._modelMeshes[id] = mesh;
            delete this._loading[id];
            const cb = mesh._callback;
            delete mesh._callback;
            cb(null, { mesh: loading.meshes, id });
        }
    }

    // _unproject(pcoord) {
    //     const map = this.getMap();
    //     const sr = this._spatialReference;
    //     if (!maptalks.SpatialReference.equals(sr.toJSON(), map.getSpatialReference().toJSON())) {
    //         return map.getProjection().project(sr.getProjection().unproject(pcoord));
    //     } else {
    //         return pcoord;
    //     }
    // }

    _getProjScale() {
        return IDENTITY_SCALE;
    }

    _coordToPoint(c) {
        return this._layer._coordToPoint(c);
    }

    _distanceToPoint(x, y) {
        const map = this.getMap();
        if (map.getGLZoom) {
            return map.distanceToPoint(x, y, map.getGLZoom());
        } else {
            return map.distanceToPointAtRes(x, y, map.getGLRes());
        }
    }

    _pointToPrj(c) {
        const map = this.getMap();
        if (map.getGLZoom) {
            return map['_pointToPrj'](c, map.getGLZoom());
        } else {
            return map['_pointToPrjAtRes'](c, map.getGLRes());
        }
    }

    _prjToPoint(c) {
        const map = this.getMap();
        if (map.getGLZoom) {
            return map['_prjToPoint'](c, map.getGLZoom());
        } else {
            return map['_prjToPointAtRes'](c, map.getGLRes(), TEMP_POINT);
        }
    }

    _getUpAxisTransform(axis) {
        if (axis === 'Y') {
            return Y_TO_Z;
        } else if (axis === 'X') {
            return X_TO_Z;
        } else {
            return IDENTITY_MATRIX;
        }
    }

    pick(x, y, tolerance = 3) {
        const layer = this._layer;
        if (!layer || !layer.options['picking']) {
            return [];
        }
        if (!this.pickingFBO || !this.picking) {
            return [];
        }
        const map = this.getMap();
        const uniforms = this._getUniformValues();
        const picking = this.picking;
        picking.render(this._modelScene.getMeshes().filter(m => !m.bloom), uniforms, true);
        let picked = {};
        if (picking.getRenderedMeshes().length) {
            picked = picking.pick(x, y, tolerance, uniforms, {
                viewMatrix: map.viewMatrix,
                projMatrix: map.projMatrix,
                returnPoint: layer.options['pickingPoint']
            });
        }
        const { meshId, pickingId, point, coordinate } = picked;
        const mesh = (meshId === 0 || meshId) && picking.getMeshAt(meshId);
        if (!mesh || !mesh.geometry) {
            //有可能mesh已经被回收，geometry不再存在
            return [];
        }
        const props = mesh.properties;
        if (point && point.length) {
            point[0] = Math.round(point[0] * 1E5) / 1E5;
            point[1] = Math.round(point[1] * 1E5) / 1E5;
            point[2] = Math.round(point[2] * 1E5) / 1E5;
        }
        const data = {
            batchId: pickingId
        };
        if (layer.options['debug']) {
            data.debugInfo = props;
        }
        if (props && props.batchTable) {
            const { batchTable, batchTableBin, count } = props;
            const batchId = pickingId;

            for (const p in batchTable) {
                if (batchTable[p].byteOffset !== undefined) {
                    data[p] = readBatchData(batchTable[p], batchTableBin, count, batchId);
                } else {
                    data[p] = batchTable[p][batchId];
                }
            }
        }

        const result = {
            service: mesh.properties.serviceIndex,
            data,
            point,
            coordinate
        };
        return [result];

    }

    _getLevelMap(tiles) {
        let levels = new Set();
        for (let i = 0, l = tiles.length; i < l; i++) {
            const node = tiles[i].data.node;
            const mesh = this._getMesh(node);
            if (!mesh) {
                continue;
            }
            levels.add(node._level);
        }
        levels = Array.from(levels);
        levels.sort();
        const levelMap = new Map();
        const l = levels.length;
        for (let i = 0; i < l; i++) {
            levelMap.set(levels[i], i);
        }
        return levelMap;
    }

    highlight(highlights) {
        this._highlighted = highlights;
        const renderer = this._layer.getRenderer();
        this._highlightTimestamp = renderer.getFrameTimestamp();
        renderer.setToRedraw(true);
    }

    cancelAllHighlight() {
        this._highlighted = null;
        const renderer = this._layer.getRenderer();
        this._highlightTimestamp = renderer.getFrameTimestamp();
        renderer.setToRedraw(true);
    }

    showOnly(showOnlys) {
        this._showOnlys = showOnlys;
        const renderer = this._layer.getRenderer();
        this._showOnlyTimeStamp = renderer.getFrameTimestamp();
        renderer.setToRedraw(true);
    }

    cancelShowOnly() {
        this._showOnlys = null;
        const renderer = this._layer.getRenderer();
        this._showOnlyTimeStamp = renderer.getFrameTimestamp();
        renderer.setToRedraw(true);
    }

    _getCurrentBatchIDs() {
        if (!this._paintedMeshes) {
            return [];
        }
        const ids = {};
        const batchIds = [];
        for (const p in this._paintedMeshes) {
            const meshes = this._paintedMeshes[p];
            if (meshes) {
                for (let i = 0; i < meshes.length; i++) {
                    const mesh = meshes[i];
                    const geometry = mesh && mesh.geometry;
                    if (!mesh || !geometry) {
                        continue;
                    }
                    const serviceIndex = mesh.properties.serviceIndex;
                    if (!ids[serviceIndex]) {
                        ids[serviceIndex] = new Set();
                    }
                    const batchData = geometry.properties.batchIdData;
                    if (batchData) {
                        for (let ii = 0; ii < batchData.length; ii++) {
                            if (!ids[serviceIndex].has(batchData[ii])) {
                                batchIds.push({
                                    id: batchData[ii],
                                    service: serviceIndex
                                });
                                ids[serviceIndex].add(batchData[ii]);
                            }
                        }
                    }
                }
            }
        }
        return batchIds;
    }

    hasIBL() {
        const lightManager = this.getMap().getLightManager();
        const resource = lightManager && lightManager.getAmbientResource();
        return !!resource;
    }
}

// function createColorArray(attrs) {
//     const vertexCount = attrs[attributeSemantics['POSITION']].array.length;
//     const color = {
//         array: new Uint8Array(),

//     }
//     color.array.fill(255);
//     return color;
// }

// function meshCompare(a, b) {
//     let levelA = a.properties.level;
//     let levelB = b.properties.level;
//     if (!a.properties.isLeaf) {
//         levelA += 255;
//     }
//     if (!b.properties.isLeaf) {
//         levelB += 255;
//     }
//     if (levelA >= 255 && levelB >= 255) {
//         return levelB - levelA;
//     }
//     return levelA - levelB;
// }

// function meshCompare(a, b) {
//     return a.properties.node._cameraDistance - b.properties.node._cameraDistance;
// }

function generateFeatureIndiceIndex(featureIds, indices) {
    if (!indices) {
        return null;
    }
    const indiceIndex = new Map();
    for (let i = 0; i < indices.length; i++) {
        const idx = indices[i];
        const id = featureIds[idx];
        let index = indiceIndex.get(id);
        if (!index) {
            index = [];
            indiceIndex.set(id, index);
        }
        index.push(idx);
    }
    return indiceIndex;
}
