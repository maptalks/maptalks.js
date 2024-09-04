import * as maptalks from 'maptalks';
import { reshader, vec3, vec4, mat3, mat4, quat, HighlightUtil, ContextUtil } from '@maptalks/gl';
import { iterateMesh, iterateBufferData, getItemAtBufferData, setInstanceData, } from '../../common/GLTFHelpers';
import pntsVert from './glsl/pnts.vert';
import pntsFrag from './glsl/pnts.frag';
import { isFunction, isNil, extend, setColumn3, flatArr, isNumber, normalizeColor } from '../../common/Util';
import { intersectsBox } from 'frustum-intersects';
import { basisTo2D, setTranslation, getTranslation, readBatchData } from '../../common/TileHelper';
import { isFunctionDefinition, interpolated } from '@maptalks/function-type';
// import { getKHR_techniques } from './s3m/S3MTechnique';


const { getTextureMagFilter, getTextureMinFilter, getTextureWrap, getMaterialType, getMaterialFormat, getPrimitive, getUniqueREGLBuffer } = reshader.REGLHelper;

const Y_TO_Z = [1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1];
const X_TO_Z = [0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 0, 1];

const { loginIBLResOnCanvas, logoutIBLResOnCanvas, getIBLResOnCanvas, getPBRUniforms } = reshader.pbr.PBRUtils;

const DEFAULT_POLYGON_OFFSET = {
    factor : 0,
    units : 0
};

const DEFAULT_POLYGONFILL = [1, 1, 1, 1], DEFAULT_HSV = [0, 0, 0];

const DEFAULT_MATERIAL_INFO = {
    specularStrength: 0,
    materialShininess: 1
};

const IDENTITY_SCALE = [1, 1, 1];
const IDENTITY_MATRIX = mat4.identity([]);
const EMPTY_TRANSLATION = [0, 0, 0];
const EMPTY_COORD_OFFSET = [0, 0];

const LIGHT_DIR = [];
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
const TEMP_TILE_ROT_QUAT = [];
const TEMP_SCALING = [];
const TEMP_TILE_SCALING_MAT = [];

const TEMP_TILE_TRANSFORM = [];
const TEMP_TRANSLATION_MAT = [];

const TEMP_SERVICE_MAT = [];

const TEMP_PROJ_SCALE = [];
const TEMP_DIST_SCALE = [];
const TEMP_DIST_TO_PROJ_SCALE = [];

const TEMP_MATRIX_SCALE = [];

const DEFAULT_SEMANTICS = {
    'POSITION': 'POSITION',
    'NORMAL': 'NORMAL',
    'TEXCOORD_0': 'TEXCOORD_0',
    'TEXCOORD_1': 'TEXCOORD_1',
    'COLOR_0': 'COLOR_0',
    'TANGENT': 'TANGENT',
    '_BATCHID': '_BATCHID',
};

const BOX_INDEX = [
    0, 1,
    1, 2,
    2, 3,
    3, 0,
    0, 4,
    1, 5,
    2, 6,
    3, 7,
    4, 5,
    5, 6,
    6, 7,
    7, 4,

    // center axis
    // 8, 9,
    // 8, 10,
    // 8, 11
];
const SPHERE_POS = generateSphere(100, 1);
const BOX_ROTATE = [0, 0, 0, 1], BOX_SCALE = [1, 1, 1];

export default class TileMeshPainter {
    constructor(regl, layer) {
        this._layer = layer;
        this._canvas = layer.getRenderer().canvas;
        this.pickingFBO = layer.getRenderer().pickingFBO;
        this._regl = regl;
        this._renderer = new reshader.Renderer(regl);
        this._loading = {};
        this._modelMeshes = {};
        this._pntsMeshes = {};
        this._i3dmMeshes = {};
        this._cmptMeshes = {};
        this._cachedGLTF = {};
        this._modelScene = new reshader.Scene();
        this._pntsScene = new reshader.Scene();
        this._i3dmScene = new reshader.Scene();
        this._boxScene = new reshader.Scene();
        this._resLoader = new reshader.ResourceLoader(regl.texture(2));
        this._bindedListener = this._onResourceLoad.bind(this);
        // this._defaultMaterial = new reshader.PhongMaterial({
        //     'baseColorFactor' : [1, 1, 1, 1]
        // });
        this._khrTechniqueWebglManager = new reshader.KHRTechniquesWebglManager(this._regl, this._getExtraCommandProps(), this._resLoader);
        const map = this.getMap();
        this._heightScale = map.altitudeToPoint(100, map.getGLRes()) / 100;
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

    paint(tiles, leafs, boxMeshes, parentContext) {
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
        const oneMeshArray = [];
        const parentMeshes = [];
        const meshes = [];
        const pntsMeshes = [];
        const i3dmMeshes = [];

        for (let i = 0, l = tiles.length; i < l; i++) {
            const node = tiles[i].data.node;
            let mesh = this._getMesh(node);
            if (!mesh) {
                continue;
            }
            const service = this._layer._getNodeService(node._rootIdx);
            const debugNodes = service.debugNodes;
            const heightOffset = service.heightOffset || 0;
            const coordOffset = service.coordOffset || EMPTY_COORD_OFFSET;
            if (this._cmptMeshes[node.id]) {
                mesh = this._cmptMeshes[node.id];
                mesh = flatArr(mesh);
            }
            // if (node._error > maxError) {
            //     continue;
            // }

            let polygonOffset = service.polygonOffset || DEFAULT_POLYGON_OFFSET;
            if (isFunction(polygonOffset)) {
                polygonOffset = polygonOffset();
            }
            // const ambientColor = service.ambientLight;
            if (!Array.isArray(mesh)) {
                oneMeshArray[0] = mesh;
                mesh = oneMeshArray;
            }
            for (let ii = 0, ll = mesh.length; ii < ll; ii++) {
                const magic = mesh[ii].properties.magic;
                if (mesh[ii].properties.heightOffset !== heightOffset || mesh[ii].properties.coordOffset[0] !== coordOffset[0] || mesh[ii].properties.coordOffset[1] !== coordOffset[1]) {
                    this._updateMeshLocalTransform(mesh[ii]);
                    mesh[ii]._originLocalTransform = mat4.copy([], mesh[ii].localTransform);
                }
                mesh[ii]._node = node;
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
                    if (debugNodes && debugNodes.length && debugNodes.indexOf(mesh[ii]._node.id) < 0) {
                        continue;
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
                // GroupGLLayer中，stencil默认值为0xFF，与GroupGLLayer保持一致
                mesh[ii].properties.selectionDepth = 255 - tiles[i].selectionDepth;
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

                if (!leafs[node.id]) {
                    parentMeshes.push(mesh[ii]);
                }
                this._updateMaskDefines(mesh[ii]);
                this._updateServiceMatrix(mesh[ii], node);
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
        ContextUtil.setIncludeUniformValues(uniforms, parentContext);
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
        // boxMeshes.forEach(mesh => {
        // this._updateBBoxMatrix(mesh);
        // });
        this._boxScene.setMeshes(boxMeshes);
        this._renderer.render(this._edgeShader, uniforms, this._boxScene, renderTarget && renderTarget.fbo);

        return drawCount;
    }

    prepareRender(context) {
        this._prepareShaders(context);
    }

    _prepareShaders(context) {
        if (context && context.states && context.states.includesChanged) {
            this._standardShader.dispose();
            delete this._standardShader;
            this._phongShader.dispose();
            delete this._phongShader;
        }
        this._createShaders(context);
    }

    // _updateBBoxMatrix(mesh) {
    //     const serviceTransform = this._layer._getServiceTransform(TEMP_BBOX_MAT, mesh.properties.node);
    //     mat4.multiply(mesh.localTransform, serviceTransform, mesh._originLocalTransform);
    // }

    _callShader(shader, uniforms, filter, renderTarget, parentMeshes, meshes, i3dmMeshes) {
        shader.filter = filter.filter(fn => !!fn);

        // this._modelScene.sortFunction = this._sort.bind(this);
        // this._modelScene.setMeshes(meshes);

        // uniforms['debug'] = true;
        // uniforms['stencilEnable'] = false;
        // uniforms['cullFace'] = 'front';
        // uniforms['colorMask'] = colorOff;
        // this._renderer.render(shader, uniforms, this._modelScene, renderTarget && renderTarget.fbo);


        // uniforms['stencilEnable'] = true;
        uniforms.stencilEnable = false;
        // uniforms['cullFace'] = 'back';
        // uniforms['colorMask'] = colorOn;
        const fbo = renderTarget && renderTarget.fbo;
        let drawCount = 0;

        const sceneMeshes = [];
        for (let i = 0; i < meshes.length; i++) {
            const { isLeaf, selectionDepth } = meshes[i].properties;
            if (isLeaf && selectionDepth === 255) {
                // 独立的叶子节点
                if (uniforms.stencilEnable) {
                    // 清除stencil，避免上一次分支绘制的stencil影响本次绘制
                    this._clearStencil(fbo);
                    // sceneMeshes中是某个分支下的非独立叶子节点 + 父亲节点
                    // 这种情况一般出现在某个分支的子节点不满足要求（没有下载下来或者error不符合设定），需要将父亲节点与子节点一起绘制
                    // 绘制分支下的非独立节点需要开启stencil，先绘制叶子节点，再绘制父亲节点，保证父节点的绘制不会覆盖掉子节点
                    this._modelScene.setMeshes(sceneMeshes);
                    drawCount += this._renderer.render(shader, uniforms, this._modelScene, fbo);
                    sceneMeshes.length = 0;
                    uniforms.stencilEnable = false;
                }
                sceneMeshes.push(meshes[i]);
            } else {
                // 某个分支下的非独立节点
                if (!uniforms.stencilEnable) {
                    // sceneMeshes中都是独立节点
                    // 关闭stencil直接绘制
                    this._modelScene.setMeshes(sceneMeshes);
                    drawCount += this._renderer.render(shader, uniforms, this._modelScene, fbo);
                    sceneMeshes.length = 0;
                    uniforms.stencilEnable = true;
                }
                sceneMeshes.push(meshes[i]);
            }
            if (i === meshes.length - 1) {
                if (uniforms.stencilEnable) {
                    this._clearStencil(fbo);
                }
                this._modelScene.setMeshes(sceneMeshes);
                drawCount += this._renderer.render(shader, uniforms, this._modelScene, fbo);
            }
        }
        // pick功能需要把meshes设置到modelScene中，为了避免pick逻辑出错，这里暂时只允许选择叶子节点
        //FIXME 因为父亲节点不在modelScene中，会出现父亲节点无法被选中的问题
        this._modelScene.setMeshes(meshes.filter(m => m.properties.isLeaf));

        // this._modelScene.setMeshes(meshes);
        // drawCount += this._renderer.render(shader, uniforms, this._modelScene, renderTarget && renderTarget.fbo);


        // uniforms['stencilEnable'] = true;

        this._i3dmScene.setMeshes(i3dmMeshes);
        drawCount += this._renderer.render(shader, uniforms, this._i3dmScene, renderTarget && renderTarget.fbo);
        return drawCount;
    }

    _clearStencil(fbo) {
        this._regl.clear({
            stencil: 0xFF,
            framebuffer: fbo
        });
    }

    getCurrentB3DMMeshes() {
        return this._modelScene.getMeshes();
    }

    getCurrentI3DMMeshes() {
        return this._i3dmScene.getMeshes();
    }

    _sort(a, b) {
        // const cameraPosition = this.getMap().cameraPosition;
        // vec3.transformMat4(P0, a.geometry.boundingBox.getCenter(), a.localTransform);
        // vec3.transformMat4(P1, b.geometry.boundingBox.getCenter(), b.localTransform);
        // return vec3.dist(P1, cameraPosition) - vec3.dist(P0, cameraPosition);
        return b._node._cameraDistance - a._node._cameraDistance;
    }

    deleteTile(tileData) {
        const node = tileData.node;
        if (node._boxMesh) {
            node._boxMesh.geometry.dispose();
            node._boxMesh.dispose();
            delete node._boxMesh;
        }
        const id = node.id;
        this._disposeMesh(id);
    }

    _disposeMesh(id) {
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
                if (cached && cached.refMeshes) {
                    cached.refMeshes.delete(mesh.uuid);
                    if (!cached.refMeshes.size) {
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

        if (this._edgeShader) {
            this._edgeShader.dispose();
            delete this._edgeShader;
        }

        this._khrTechniqueWebglManager.dispose();

        if (this.picking) {
            this.picking.dispose();
        }
    }

    _getMesh(node) {
        return this._modelMeshes[node.id] || this._pntsMeshes[node.id] || this._i3dmMeshes[node.id] || this._cmptMeshes[node.id];
    }

    has(node) {
        return this._getMesh(node) || this._loading[node.id];
    }

    _updateMeshLocalTransform(mesh) {
        const magic = mesh.properties.magic;
        if (magic === 'b3dm') {
            this._updateB3DMLocalMatrix(mesh);
        } else if (magic === 'i3dm') {
            this._updateI3DMLocalTransform(mesh);
        } else if (magic === 'pnts') {
            this._updatePNTSLocalTransform(mesh);
        }
    }

    createPntsMesh(data, id, node, cb) {
        if (this._pntsMeshes[id]) {
            const meshes = this._pntsMeshes[id];
            console.warn(`pnts mesh with id(${id}) was already created.`);
            cb(null, { id : id, mesh : meshes });
            return meshes;
        }
        const { pnts, featureTable, rootIdx, compressed_int16_params } = data;
        const count = featureTable['POINTS_LENGTH'];
        if (!pnts['BATCH_ID']) {
            pnts['BATCH_ID'] = new Uint8Array(count);
            pnts['BATCH_ID'].fill(0);
        }

        const geometry = new reshader.Geometry(
            pnts,
            null,
            count,
            {
                static: true,
                primitive: 'points',
                positionAttribute: 'POSITION',
                pickingIdAttribute: 'BATCH_ID'
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
        this._setCompressedInt16Defines(defines, compressed_int16_params);
        if (data.featureTable['CONSTANT_RGBA']) {
            data.featureTable['CONSTANT_RGBA'] = data.featureTable['CONSTANT_RGBA'].map(c => c / 255);
        }

        const { rtcCenter, rtcCoord, projCenter } = data;

        const service = this._layer._getNodeService(rootIdx);

        const mesh = new reshader.Mesh(geometry);
        mesh.properties.magic = 'pnts';
        mesh.properties.id = id;
        mesh.properties.node = node;
        mesh.properties.count = count;
        mesh.properties.batchTable = data.batchTable;
        mesh.properties.batchTableBin = data.batchTableBin;
        mesh.properties.serviceIndex = rootIdx;
        mesh.properties.rtcCoord = rtcCoord;
        mesh.properties.rtcCenter = rtcCenter;
        mesh.properties.projCenter = projCenter;
        mesh.setDefines(defines);
        mesh.setFunctionUniform('pointColor', function () {
            if (data.featureTable['CONSTANT_RGBA']) {
                return data.featureTable['CONSTANT_RGBA'];
            }
            return service && service.pointColor || [1, 1, 1, 1];
        });
        const map = this.getMap();
        let pointSizeValue = null;
        let pointSizeFn = null;

        mesh.setFunctionUniform('pointSize', function () {
            if (!service) {
                return 2;
            }
            if (isFunctionDefinition(service.pointSize)) {
                const key = JSON.stringify(service.pointSize);
                if (key !== pointSizeValue) {
                    pointSizeFn = interpolated(service.pointSize);
                    pointSizeValue = key;
                }
                const size = pointSizeFn(map.getZoom());
                return size;
            }
            return service.pointSize || 2;
        });

        let pointOpacityValue = null;
        let pointOpacityFn = null;

        mesh.setFunctionUniform('pointOpacity', function () {
            if (!service) {
                return 1;
            }
            if (isFunctionDefinition(service.pointOpacity)) {
                const key = JSON.stringify(service.pointOpacity);
                if (key !== pointOpacityValue) {
                    pointOpacityFn = interpolated(service.pointOpacity);
                    pointOpacityValue = key;
                }
                const opacity = pointOpacityFn(map.getZoom());
                return opacity;
            }
            return service.pointOpacity || 1;
        });
        this._setCompressedInt16Uniforms(mesh, compressed_int16_params);
        this._updatePNTSLocalTransform(mesh);
        mesh._originLocalTransform = mat4.copy([], mesh.localTransform);
        this._pntsMeshes[id] = mesh;
        cb(null, { id: id, mesh: [mesh] });
        return [mesh];
    }


    _updatePNTSLocalTransform(mesh) {
        const localTransform = mesh.localTransform || [];
        const { rtcCoord, node, projCenter } = mesh.properties;
        this._getB3DMTransform(localTransform, rtcCoord, projCenter, node._rootIdx);
        mesh.setLocalTransform(localTransform);
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
        const service = this._layer._getNodeService(node._rootIdx);
        const upAxisTransform = this._getUpAxisTransform(node._upAxis);
        const { i3dm, featureTable, gltf, batchTable, batchTableBin, count } = data;
        const instanceCount = featureTable['INSTANCES_LENGTH'];

        const { rtcCenter, rtcCoord, projCenter } = data;
        const projectedMatrix = this._computeProjectedTransform(TEMP_MATRIX2, node, rtcCenter, rtcCoord);
        setTranslation(projectedMatrix, EMPTY_TRANSLATION, projectedMatrix);

        const tileRotQuat = mat4.getRotation(TEMP_TILE_ROT_QUAT, projectedMatrix);
        quat.normalize(tileRotQuat, tileRotQuat);

        // quat.normalize(rotation, rotation);
        const scaling = mat4.getScaling(TEMP_SCALING, projectedMatrix);
        const tileScalingMat4 = mat4.fromScaling(TEMP_TILE_SCALING_MAT, scaling);

        const tileTransform = this._getI3DMTileTransform(TEMP_TILE_TRANSFORM, projCenter, node);

        const projScale = this._getProjScale(TEMP_PROJ_SCALE);
        const distScale = this._getDistanceScale(TEMP_DIST_SCALE, rtcCoord);
        const distToProjScale = vec3.div(TEMP_DIST_TO_PROJ_SCALE, distScale, projScale);
        const distToProjScaleTransform = mat4.fromScaling(TEMP_MATRIX_SCALE, distToProjScale);

        const { POSITION, NORMAL_UP, NORMAL_RIGHT, SCALE, SCALE_NON_UNIFORM } = i3dm;
        const instanceData = {
            'instance_vectorA': new Float32Array(instanceCount * 4),
            'instance_vectorB': new Float32Array(instanceCount * 4),
            'instance_vectorC': new Float32Array(instanceCount * 4),
            'aPickingId': new Uint16Array(instanceCount)
        };
        for (let i = 0; i < instanceCount; i++) {
            instanceData['aPickingId'][i] = i;
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
                quat.normalize(quaternion, quaternion);
                quat.multiply(quaternion, tileRotQuat, quaternion);
            } else {
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
        const gltfWeakResources = [];
        iterateMesh(gltf, (gltfMesh, meshId, primId, gltf) => {
            const gltfResource = this._processGLTF(gltfMesh, meshId, primId, gltf, node, true, shader, gltfWeakResources);
            const { geometry, material } = gltfResource;
            if (material && !material.isReady()) {
                ready = false;
                unreadyCount++;
            }
            const mesh = new reshader.InstancedMesh(instanceBuffers, instanceCount, geometry, material);
            if (!gltfResource.refMeshes) {
                gltfResource.refMeshes = new Set();
                gltfResource.refMeshes.add(mesh.uuid);
            }
            mesh.properties.magic = 'i3dm';
            mesh.properties.id = id;
            mesh.properties.count = count;
            mesh.properties.batchTable = batchTable;
            mesh.properties.batchTableBin = batchTableBin;
            mesh.properties.serviceIndex = node._rootIdx;
            mesh.properties.rtcCoord = rtcCoord;
            mesh.properties.rtcCenter = rtcCenter;
            mesh.properties.projCenter = projCenter;
            mesh.properties.node = node;
            const defines = this._getGLTFMeshDefines(gltfMesh, geometry, material, node._rootIdx, gltf);
            if (gltfMesh.compressed_int16_params) {
                this._setCompressedInt16Uniforms(mesh, gltfMesh.compressed_int16_params);
            }
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
            mat4.multiply(nodeMatrix, distToProjScaleTransform, nodeMatrix);
            // 如果没有 NORMAL_UP，需要把原来在 instance_vector 中计入的enu以及node上的transform应用在positionMatrix中
            if (!featureTable['EAST_NORTH_UP'] && !NORMAL_UP) {
                mat4.multiply(nodeMatrix, projectedMatrix, nodeMatrix);
            } else {
                mat4.multiply(nodeMatrix, tileScalingMat4, nodeMatrix);
            }
            mesh.setPositionMatrix(nodeMatrix);

            this._updateI3DMLocalTransform(mesh, tileTransform);
            mesh.setDefines(defines);
            mesh.properties.polygonOffset = { offset: 0, factor: 0 };
            meshes.push(mesh);
            delete gltfMesh.attributes;
            mesh._originLocalTransform = mat4.copy([], mesh.localTransform);
        });

        trimGLTFWeakResources(gltfWeakResources);

        if (ready) {
            this._i3dmMeshes[id] = meshes;
            cb(null, { id: id, mesh: meshes });
        } else {
            this._loading[id] = { meshes: meshes, count: unreadyCount };
            meshes._callback = cb;
        }
        return meshes;
    }

    _updateI3DMLocalTransform(mesh, tileTransform) {
        const { rtcCoord, node, projCenter } = mesh.properties;

        if (!tileTransform) {
            tileTransform = this._getI3DMTileTransform(TEMP_TILE_TRANSFORM, projCenter, node);
        }

        const service = this._layer._getNodeService(node._rootIdx);
        const matrix = mesh.localTransform || [];
        if (service.coordOffset) {
            const coordOffsetMatrix = this._computeCoordOffsetMatrix(TEMP_MATRIX2, node._rootIdx, rtcCoord);
            mat4.multiply(matrix, coordOffsetMatrix, tileTransform);
        } else {
            mat4.copy(matrix, tileTransform);
        }
        mesh.setLocalTransform(matrix);
        mesh.properties.heightOffset = service.heightOffset || 0;
        mesh.properties.coordOffset = service.coordOffset && service.coordOffset.slice(0) || EMPTY_COORD_OFFSET;
    }

    _getI3DMTileTransform(out, projCenter, node) {
        mat4.fromScaling(out, this._getProjScale(TEMP_PROJ_SCALE));
        const translation = this._getCenterTranslation(TEMP_TRANSLATION, projCenter, node._rootIdx);
        mat4.multiply(out, mat4.fromTranslation(TEMP_TRANSLATION_MAT, translation), out);
        return out;
    }

    createB3DMMesh(data, id, node, cb) {
        if (data.gltf) {
            data.gltf.transferables = null;
        }
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

        const isSharedPosition = gltf.asset.sharePosition;
        const upAxisTransform = this._getUpAxisTransform(node._upAxis);
        const tileTransform = this._getB3DMTileTransform(TEMP_TILE_TRANSFORM, isSharedPosition, rtcCoord, rtcCenter, projCenter, node);
        const service = this._layer._getNodeService(node._rootIdx);
        let shader = service.shader || 'pbr';
        if (service.unlit) {
            shader = 'phong';
        } else if (gltf.materials) {
            for (let i = 0; i < gltf.materials.length; i++) {
                if (gltf.materials[i] && gltf.materials[i].extensions && gltf.materials[i].extensions['KHR_materials_unlit']) {
                    shader = 'phong';
                    break;
                }
            }
        }

        const gltfWeakResources = [];
        const meshes = [];
        let unreadyCount = 0;
        let ready = true;

        iterateMesh(gltf, (gltfMesh, meshId, primId, gltf) => {
            const gltfResource = this._processGLTF(gltfMesh, meshId, primId, gltf, node, false, shader, gltfWeakResources);
            const { geometry, material } = gltfResource;
            if (material && !material.isReady()) {
                ready = false;
                unreadyCount++;
            }
            const mesh = new reshader.Mesh(geometry, material);
            if (!gltfResource.refMeshes) {
                gltfResource.refMeshes = new Set();
                gltfResource.refMeshes.add(mesh.uuid);
            }
            mesh.properties.magic = 'b3dm';
            mesh.properties.id = id;
            mesh.properties.node = node;
            if (data.batchTable) {
                mesh.properties.batchTable = data.batchTable;
                mesh.properties.batchTableBin = data.batchTableBin;
            }
            mesh.properties.count = data.featureTable && data.featureTable['BATCH_LENGTH'] || 0;
            mesh.properties.serviceIndex = node._rootIdx;
            const defines = this._getGLTFMeshDefines(gltfMesh, geometry, material, node._rootIdx, gltf);
            mesh.setDefines(defines);
            const compressUniforms = gltfMesh.compressUniforms;
            if (compressUniforms) {
                for (const u in compressUniforms) {
                    mesh.setUniform(u, compressUniforms[u]);
                }
            }
            if (gltfMesh.compressed_int16_params) {
                this._setCompressedInt16Uniforms(mesh, gltfMesh.compressed_int16_params);
            }
            this._setWEB3DDecodeUniforms(mesh, gltfMesh.attributes);
            if (maxPrjExtent) {
                defines['USE_MAX_EXTENT'] = 1;
                mesh.setUniform('maxPrjExtent', maxPrjExtent);
                // mesh.setUniform('prjCenter', projCenter);
            }

            if (!mesh.hasFunctionUniform('polygonOpacity')) {
                mesh.setFunctionUniform('polygonOpacity', function () {
                    return isNumber(service.opacity) ? service.opacity : 1;
                });
            }
            if (!mesh.hasFunctionUniform('polygonFill')) {
                mesh.setFunctionUniform('polygonFill',  function () {
                    return normalizeColor([], service.polygonFill || DEFAULT_POLYGONFILL);
                });
            }
            if (!mesh.material.hasFunctionUniform('hsv')) {
                mesh.material.setFunctionUniform('hsv', function () {
                    return service.hsv || DEFAULT_HSV;
                });
            }


            // gltfMesh.matrices 已经在 layerWorker转换坐标时，加入计算了，所以这里不用再重复计算
            const nodeMatrix = mat4.identity([]);
            // mat4.multiply(mat, mat, node.matrix);
            if (isSharedPosition && gltfMesh.matrices && gltfMesh.matrices.length) {
                for (let i = 0; i < gltfMesh.matrices.length; i++) {
                    mat4.multiply(nodeMatrix, nodeMatrix, gltfMesh.matrices[i]);
                }
            }

            if (isSharedPosition) {
                mat4.multiply(nodeMatrix, upAxisTransform, nodeMatrix);
            }

            // const coordOffsetMatrix = this._computeCoordOffsetMatrix(node._rootIdx, rtcCoord);
            // if (coordOffsetMatrix) {
            //     mat4.multiply(nodeMatrix, coordOffsetMatrix, nodeMatrix);
            // }
            mesh.properties.node = node;
            mesh.properties.projCenter = projCenter;
            mesh.properties.nodeMatrix = nodeMatrix;
            mesh.properties.isSharedPosition = isSharedPosition;
            mesh.properties.rtcCoord = rtcCoord;
            mesh.properties.rtcCenter = rtcCenter;

            this._updateB3DMLocalMatrix(mesh, tileTransform);
            meshes.push(mesh);
            delete gltfMesh.attributes;
            mesh._originLocalTransform = mat4.copy([], mesh.localTransform);
        });

        // trim indices/material images to save memories
        trimGLTFWeakResources(gltfWeakResources);

        if (ready) {
            this._modelMeshes[id] = meshes;
            cb(null, { id : id, mesh : meshes });
        } else {
            this._loading[id] = { meshes: meshes, count: unreadyCount };
            meshes._callback = cb;
        }
        return meshes;
    }

    _createBoxMesh(node) {
        const nodeBox = this._layer._getNodeBox(node.id);
        if (!nodeBox || node._boxMesh) {
            return;
        }
        let vertices, indices, translate, scale;
        if (nodeBox.obbox) { //region、box
            vertices = nodeBox.boxPosition;
            indices = BOX_INDEX;
            translate = nodeBox.boxCenter;
            scale = BOX_SCALE;
        } else if (nodeBox.sphereBox) { //sphere
            const sphereCenter = nodeBox.sphereBox[0], radius = nodeBox.sphereBox[1];
            vertices = SPHERE_POS.vertices;
            indices = SPHERE_POS.indices;
            translate = sphereCenter;
            scale = [radius, radius, radius];
        }
        const geometry = new reshader.Geometry({
            POSITION: vertices
        },
        indices,
        0,
        {
            primitive : 'lines',
            positionAttribute: 'POSITION'
        });
        const mesh = new reshader.Mesh(geometry, new reshader.Material({ lineColor: [0.8, 0.8, 0.1, 1.0], lineOpacity: 1 }));
        const localTransform = [];
        mat4.fromRotationTranslationScale(localTransform, BOX_ROTATE, translate, scale);
        mesh.localTransform = localTransform;
        mesh._originLocalTransform = mat4.copy([], localTransform);
        mesh.properties.node = node;
        node._boxMesh = mesh;
    }

    _deleteBoxMesh(node) {
        if (node._boxMesh) {
            node._boxMesh.geometry.dispose();
            node._boxMesh.dispose();
            delete node._boxMesh;
        }
    }

    _setCompressedInt16Uniforms(mesh, compressed_int16_params) {
        if (compressed_int16_params['POSITION']) {
            mesh.setUniform('compressedPositionRange', compressed_int16_params['POSITION']);
        }
        if (compressed_int16_params['TEXCOORD_0']) {
            mesh.setUniform('compressedTexcoordRange_0', compressed_int16_params['TEXCOORD_0']);
        }
        if (compressed_int16_params['TEXCOORD_1']) {
            mesh.setUniform('compressedTexcoordRange_1', compressed_int16_params['TEXCOORD_0']);
        }
        if (compressed_int16_params['NORMAL']) {
            mesh.setUniform('compressedNormalRange', compressed_int16_params['NORMAL']);
        }
        if (compressed_int16_params['TANGENT']) {
            mesh.setUniform('compressedTangentRange', compressed_int16_params['TANGENT']);
        }
        if (compressed_int16_params['compressed_ratio']) {
            mesh.setUniform('compressed_ratio', compressed_int16_params['compressed_ratio']);
        }
    }

    _updateB3DMLocalMatrix(mesh, tileTransform) {
        const { isSharedPosition, rtcCoord, rtcCenter, projCenter, nodeMatrix, node } = mesh.properties;
        if (!tileTransform) {
            tileTransform = this._getB3DMTileTransform(tileTransform || TEMP_TILE_TRANSFORM, isSharedPosition, rtcCoord, rtcCenter, projCenter, node)
        }

        const matrix = mesh.localTransform || mat4.identity([]);

        mat4.multiply(matrix, tileTransform, nodeMatrix);
        const service = this._layer._getNodeService(node._rootIdx);
        if (service.coordOffset) {
            const coordOffsetMatrix = this._computeCoordOffsetMatrix(TEMP_MATRIX2, node._rootIdx, rtcCoord);
            mat4.multiply(matrix, coordOffsetMatrix, matrix);
        }
        mesh.setLocalTransform(matrix);
        mesh.properties.heightOffset = service.heightOffset || 0;
        mesh.properties.coordOffset = service.coordOffset && service.coordOffset.slice(0) || EMPTY_COORD_OFFSET;
    }

    _getB3DMTileTransform(out, isSharedPosition, rtcCoord, rtcCenter, projCenter, node) {
        if (isSharedPosition) {
            // position被共享的模型，只能采用basisTo2D来绘制
            // 电信的模型如tokyo.html中的模型
            const distanceScale = this._getDistanceScale(TEMP_DIST_SCALE, rtcCoord);
            const localTransform = mat4.fromScaling(TEMP_MATRIX1, distanceScale);
            const projectedMatrix = this._computeProjectedTransform(TEMP_MATRIX2, node, rtcCenter, rtcCoord);
            mat4.multiply(out, projectedMatrix, localTransform);
        } else {
            this._getB3DMTransform(out, rtcCoord, projCenter, node._rootIdx);
        }
        return out;
    }

    _setWEB3DDecodeUniforms(mesh, attributes) {
        if (attributes && attributes['TEXCOORD_0'] && attributes['TEXCOORD_0'].extensions && attributes['TEXCOORD_0'].extensions['WEB3D_quantized_attributes']) {
            const decodeMatrix = attributes['TEXCOORD_0'].extensions['WEB3D_quantized_attributes'].decodeMatrix;
            mesh.setUniform('decodeMatrix', decodeMatrix);
        }
    }

    _computeProjectedTransform(out, node, rtcCenter, rtcCoord) {
        const map = this.getMap();
        const heightOffset = this._layer._getNodeService(node._rootIdx).heightOffset || 0;

        const nodeTransform = node.matrix ? mat4.copy(out, node.matrix) : mat4.identity(out);
        if (rtcCenter) {
            const realCenter = vec3.transformMat4(TEMP_RTCCENTER, rtcCenter, nodeTransform);
            setTranslation(nodeTransform, realCenter, nodeTransform);
        }
        // const computedTransform = mat4.multiply([], nodeTransform, Y_TO_Z);
        const computedTransform = nodeTransform;
        const projection = map.getProjection();
        const glRes = map.getGLRes();
        const projectedTransform = basisTo2D(computedTransform, rtcCoord, computedTransform, projection, glRes, this._heightScale, heightOffset);
        const translation = getTranslation(TEMP_TRANSLATION, projectedTransform);
        let offset = this._layer.options['offset'];
        if (isFunction(offset)) {
            const center = this._layer._getNodeBox(node.id).boxCoord;
            offset = offset.call(this._layer, center);
        }
        vec3.set(TEMP_OFFSET, offset[0], offset[1], 0);
        vec3.sub(translation, translation, TEMP_OFFSET);

        setTranslation(projectedTransform, translation, projectedTransform);
        return projectedTransform;

    }

    _computeCoordOffsetMatrix(out, rootIdx, center) {
        const service = this._layer._getNodeService(rootIdx);
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
        const heightScale = this._heightScale;

        const translation = vec3.set(TEMP_OFFSET, dx, dy, (coordOffset[2] || 0) * heightScale);
        const matrix = mat4.fromTranslation(out, translation);
        return matrix;
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
        const shader = this._layer._getNodeService(rootIdx).shader || 'pbr';
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
        defines['HAS_MIN_ALTITUDE'] = 1;
        defines['HAS_LAYER_OPACITY'] = 1;
        this._setCompressedInt16Defines(defines, gltfMesh.compressed_int16_params);
        const compressDefines = gltfMesh.compressDefines;
        extend(defines, compressDefines);
        return defines;
    }

    _setCompressedInt16Defines(defines, compressed_int16_params) {
        if (compressed_int16_params && Object.keys(compressed_int16_params).length > 0) {
            defines['HAS_COMPRESSED_INT16'] = 1;
            if (compressed_int16_params['POSITION']) {
                defines['HAS_COMPRESSED_INT16_POSITION'] = 1;
            }
            if (compressed_int16_params['TEXCOORD_0']) {
                defines['HAS_COMPRESSED_INT16_TEXCOORD_0'] = 1;
            }
            if (compressed_int16_params['TEXCOORD_1']) {
                defines['HAS_COMPRESSED_INT16_TEXCOORD_1'] = 1;
            }
            if (compressed_int16_params['NORMAL']) {
                defines['HAS_COMPRESSED_INT16_NORMAL'] = 1;
            }
            if (compressed_int16_params['TANGENT']) {
                defines['HAS_COMPRESSED_INT16_TANGENT'] = 1;
            }
            if (compressed_int16_params['compressed_ratio']) {
                defines['HAS_COMPRESSED_INT16_RATIO'] = 1;
            }
        }
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

    _processGLTF(gltfMesh, meshId, primId, gltf, node, isI3DM, shader, gltfWeakResources) {
        let isS3M = false;
        if (gltf.asset && gltf.asset.generator === 'S3M') {
            isS3M = true;
            // is a s3mType
            gltf.extensions = gltf.extensions || {};
            // gltf.extensions['KHR_techniques_webgl'] = getKHR_techniques(gltf.asset.s3mVersion);
        }
        const url = gltf.url + '-' + meshId + '-' + primId;
        if (this._cachedGLTF[url]) {
            return this._cachedGLTF[url];
        }
        gltfWeakResources.push(gltfMesh);
        let material, geometry;
        //TODO 有些B3DM或I3DM里，多个 gltf.mesh 会共享同一个POSITION，MESH，TEXCOORD。
        // 效率更高的做法是为他们单独创建buffer后赋给Geometry
        // 程序中无需管理buffer的销毁，Geometry中会维护buffer的引用计数来管理buffer的销毁
        const matInfo = gltf.materials && gltf.materials[gltfMesh.material];
        const khrTechniquesWebgl = gltf.extensions && gltf.extensions['KHR_techniques_webgl'];
        const service =  this._layer._getNodeService(node._rootIdx);
        if (khrTechniquesWebgl && matInfo.extensions && matInfo.extensions['KHR_techniques_webgl']) {
            // s3m.vert 和 s3m.frag 是用webgl 2写的，所以是s3m时，要开启webgl2
            const khrMesh = this._createTechniqueMesh(gltfMesh, gltf, isI3DM, isS3M);
            material = khrMesh.material;
            geometry = khrMesh.geometry;
            if (service['fillEmptyDataInMissingAttribute']) {
                geometry.desc.fillEmptyDataInMissingAttribute = true;
            }
        } else {
            geometry = this._createGeometry(gltfMesh, isI3DM, DEFAULT_SEMANTICS);
            const materialInfo = service.material;
            material = this._createMaterial(gltfMesh.material, gltf, shader, materialInfo || DEFAULT_MATERIAL_INFO, gltfWeakResources, service);
        }
        if (material) {
            material.setFunctionUniform('alphaTest', function () {
                const alphaTest = service['alphaTest'];
                if (!isNil(alphaTest)) {
                    return alphaTest;
                }
                return 0.1;
            });

            material.setFunctionUniform('environmentExposure', () => {
                // maptalks/issues#661
                const ambientLight = service.ambientLight;
                let environmentExposure = service.environmentExposure;
                const lights = this.getMap().getLightManager();
                const mapAmbient = lights && lights.getAmbientLight();
                if (ambientLight && (!mapAmbient || mapAmbient.color) && environmentExposure === undefined) {
                    const ambientValue = mapAmbient && mapAmbient.color ? mapAmbient.color[0] : 0.2;
                    // 老的ambientLight设置的兼容性代码
                    environmentExposure = ambientLight[0] / ambientValue;
                }
                return environmentExposure || 1;
            });
        }

        if (material && !material.isReady()) {
            material._nodeId = node.id;
        } else if (!material) {
            material = new reshader.PhongMaterial({
                'baseColorFactor' : [1, 1, 1, 1]
            });
        }

        const gltfGeo = {
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
                // static: true,
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

        const scale = this._getProjScale(IDENTITY_SCALE);
        this._getCenterTranslation(TEMP_TRANSLATION, projCenter, rootIdx);

        mat4.translate(localTransform, localTransform, TEMP_TRANSLATION);
        mat4.scale(localTransform, localTransform, scale);
        return localTransform;
    }

    _getCenterTranslation(out, projCenter, rootIdx) {
        const heightScale = this._heightScale
        TEMP_CENTER.x = projCenter[0];
        TEMP_CENTER.y = projCenter[1];
        const center = this._prjToPoint(TEMP_CENTER);
        let offset = this._layer.options['offset'];
        if (isFunction(offset)) {
            offset = offset.call(this._layer, TEMP_CENTER);
        }
        const heightOffset = this._layer._getNodeService(rootIdx).heightOffset || 0;
        vec3.set(out, center.x - offset[0], center.y - offset[1], heightScale * projCenter[2] + heightScale * heightOffset);
        return out;
    }

    _updateServiceMatrix(mesh, node) {
        const serviceTransform = this._layer._getServiceTransform(TEMP_SERVICE_MAT, node);
        mesh.localTransform = mat4.multiply(mesh.localTransform, serviceTransform, mesh._originLocalTransform);
    }

    _getDistanceScale(out, rtcCoord) {
        // heightOffset 在 _computeProjectedTransform 中计算了，所以这里不用再重复计算。
        const map = this.getMap();
        TEMP_CENTER.x = rtcCoord[0];
        TEMP_CENTER.y = rtcCoord[1];
        const zoomScale = map.distanceToPointAtRes(100, 100, map.getGLRes(), TEMP_CENTER);
        const heightScale = this._heightScale;
        vec3.set(out, zoomScale.x / 100, zoomScale.y / 100, heightScale);
        return out;
    }

    _createShaders(context) {
        if (this._standardShader) {
            return;
        }
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
                        src: 'one',
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

        const defines = {};
        const uniformDeclares = [];
        ContextUtil.fillIncludes(defines, uniformDeclares, context);
        const extraCommandProps = this._getExtraCommandProps();

        this._phongShader = new reshader.PhongShader({
            uniforms: uniformDeclares,
            defines,
            extraCommandProps
        });

        this._standardShader = new reshader.pbr.StandardShader({
            uniforms: uniformDeclares,
            defines,
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
        //用于绘制bbox
        this._edgeShader = new reshader.EdgeShader({ extraCommandProps: {
            viewport: {
                x : 0,
                y : 0,
                width : () => {
                    return this._canvas ? this._canvas.width : 1;
                },
                height : () => {
                    return this._canvas ? this._canvas.height : 1;
                }
            },
            blend: {
                enable: true,
                func: {
                    srcRGB: 'src alpha',
                    srcAlpha: 1,
                    dstRGB: 'one minus src alpha',
                    dstAlpha: 'one minus src alpha'
                },
                equation: 'add'
            }
        } });

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
        this._pntsPicking = new reshader.FBORayPicking(
            this._renderer,
            {
                vert: pntsVert,
                extraCommandProps,
                uniforms: this._pntsShader.uniforms,
                defines: {
                    'PICKING_MODE': 1,
                    'ENABLE_PICKING': 1,
                    'HAS_PICKING_ID': 1
                }
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
                enable: (_, props) => {
                    return props.stencilEnable;
                },
                func: {
                    cmp: '>=',
                    ref: (_, props) => {
                        return props.meshProperties.selectionDepth;
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
                    src: 1,
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

    _getPntsUniforms(options) {
        const map = this.getMap();
        const lightManager = map.getLightManager();
        const directionalLight = lightManager && lightManager.getDirectionalLight() || {};
        const lightDir = directionalLight.direction || [1, 1, -1];
        const pointOpacity = options && options.pointOpacity || 1;
        return {
            projViewMatrix : map.projViewMatrix,
            pointOpacity,
            lightDir: vec3.normalize(LIGHT_DIR, lightDir)
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
        uniforms.minAltitude = layer.options.altitude || 0;
        const inGroup = renderer.canvas.gl && renderer.canvas.gl.wrap;
        const layerOpacity = inGroup ? (layer.options.opacity || 0) : 1;
        uniforms.layerOpacity = layerOpacity;
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

    _createMaterial(materialIndex, gltf, shader, materialInfo, gltfWeakResources, service) {
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
                texture = this._getTexture(texInfo, gltfWeakResources);
            }
            matInfo.baseColorFactor = texInfo && texInfo.image.color || material.baseColorFactor || [1, 1, 1, 1];
            if (texture) {
                matInfo['baseColorTexture'] = texture;
            }
        } else {
            // GLTF 2.0

            if (material.normalTexture) {
                const texture = this._getTexture(gltf.textures[material.normalTexture.index], gltfWeakResources);
                if (texture) {
                    const normalMapFactor = material.normalTexture.scale || 1;
                    matInfo.normalTexture = texture;
                    matInfo.normalMapFactor = normalMapFactor;
                }
            }
            if (material.occlusionTexture) {
                const texture = this._getTexture(gltf.textures[material.occlusionTexture.index], gltfWeakResources);
                if (texture) {
                    const occlusionFactor = material.occlusionTexture.strength || 1;
                    matInfo.occlusionTexture = texture;
                    matInfo.occlusionFactor = occlusionFactor;
                }
            }
            if (material.emissiveTexture) {
                const texture = this._getTexture(gltf.textures[material.emissiveTexture.index], gltfWeakResources);
                if (texture) {
                    matInfo.emissiveTexture = texture;
                }
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
                    if (texInfo && texInfo.image && texInfo.image.color) {
                        matInfo.baseColorFactor = matInfo.baseColorFactor ? vec4.multiply(matInfo.baseColorFactor, matInfo.baseColorFactor, texInfo.image.color) : texInfo.image.color;
                    } else {
                        const texture = this._getTexture(texInfo, gltfWeakResources);
                        if (texture) {
                            matInfo.baseColorTexture = texture;
                            // 调用getREGLTexture以回收bitmap
                            matInfo.baseColorTexture.getREGLTexture(this._regl);
                        }
                    }
                }
                if (!isNil(pbrMetallicRoughness.metallicFactor)) {
                    matInfo.metallicFactor = pbrMetallicRoughness.metallicFactor;
                }
                if (!isNil(pbrMetallicRoughness.roughnessFactor)) {
                    matInfo.roughnessFactor = pbrMetallicRoughness.roughnessFactor;
                }
                if (material.metallicRoughnessTexture) {
                    const texture = this._getTexture(gltf.textures[material.metallicRoughnessTexture.index], gltfWeakResources);
                    if (texture) {
                        matInfo.metallicRoughnessTexture = texture;
                    }
                }
            }
        }


        if (material.s3mMaterial) {
            return new reshader.Material(matInfo);
        }
        // matInfo.alphaTest = 0.1;
        if (service.unlit || material.extensions && material.extensions['KHR_materials_unlit']) {
            matInfo.ambientColor = [1, 1, 1];
            matInfo['light0_diffuse'] = [0, 0, 0, 0];
            matInfo['lightSpecular'] = [0, 0, 0];
            const material = new reshader.PhongMaterial(matInfo);
            material.unlit = service.unlit === undefined || !!service.unlit;
            return material;
        }

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
        meshMaterial.doubleSided = !!(service.doubleSided || material.doubleSided);
        meshMaterial.once('complete', this._bindedListener);
        return meshMaterial;
    }

    _getTexture(texInfo, gltfWeakResources) {
        if (!texInfo) {
            return null;
        }
        // texInfo.image.color 表示图片被精简成了颜色
        const config = {
            type: texInfo.type ? getMaterialType(texInfo.type) : 'uint8',
            format: texInfo.format ? getMaterialFormat(texInfo.format) : 'rgba',
            flipY: !!texInfo.flipY
        };
        //gltf 2.0
        const image = texInfo.image;
        gltfWeakResources.push(image);
        if (image.array) {
            config.data = image.array;
        } else if (image.mipmap) {
            config.mipmap = image.mipmap;
        }
        if (!config.data && !config.mipmap) {
            return null;
        }
        config.width = image.width;
        config.height = image.height;
        // dxt 纹理要求高宽必须大于4，否则regl中检查会报错
        if (config.mipmap && (config.width < 4 || config.height < 4)) {
            return null;
        }
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

    _getProjScale(out) {
        const map = this.getMap();
        const zoomScale = 1 / map.getGLRes();
        // 高度坐标是米
        const heightScale = this._heightScale;
        out[0] = out[1] = zoomScale;
        out[2] = heightScale;
        return out;
    }

    _coordToPoint(c) {
        return this._layer._coordToPoint(c);
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
        const result = [];
        const uniforms = this._getUniformValues();
        const b3dm = this._pickMesh(this.picking, uniforms, this._modelScene, x, y, tolerance);
        if (b3dm) {
            result.push(b3dm);
        }
        const i3dm = this._pickMesh(this.picking, uniforms, this._i3dmScene, x, y, tolerance);
        if (i3dm) {
            result.push(i3dm);
        }
        const pntsUniforms = this._getPntsUniforms();
        const pnts = this._pickMesh(this._pntsPicking, pntsUniforms, this._pntsScene, x, y, tolerance);
        if (pnts) {
            result.push(pnts);
        }
        return result;

    }

    _pickMesh(picking, uniforms, scene, x, y, tolerance) {
        if (!scene.getMeshes().length) {
            return null;
        }
        const layer = this._layer;
        const map = this.getMap();

        picking.render(scene.getMeshes().filter(m => !m.bloom), uniforms, true);
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
            return null;
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
        const services = layer.options['services'];
        const service = services && services[mesh.properties.serviceIndex];
        if (service && service['debug']) {
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

        return {
            service: mesh.properties.serviceIndex,
            data,
            point,
            coordinate
        };
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

function trimGLTFWeakResources(gltfWeakResources) {
    for (let i = 0; i < gltfWeakResources.length; i++) {
        if (gltfWeakResources[i]) {
            if (gltfWeakResources[i].array) {
                gltfWeakResources[i].array = null;
            }
            if (gltfWeakResources[i].mipmap) {
                gltfWeakResources[i].mipmap = null;
            }
            if (gltfWeakResources[i].indices) {
                gltfWeakResources[i].indices = null;
            }
        }
    }
}

function generateSphere(count, radius) {
    const angle = Math.PI * 2 / count;
    const vertices = [];
    const indices = [];
    for (let i = 0; i <= count; i++) {
        const posX = Math.cos(angle * i) * radius;
        const posY = Math.sin(angle * i) * radius;
        const posZ = 0;
        vertices[i * 3] = posX;
        vertices[i * 3 + 1] = posY;
        vertices[i * 3 + 2] = posZ;
    }
    for (let i = count; i <= count * 2; i++) {
        const posY = Math.cos(angle * i) * radius;
        const posZ = Math.sin(angle * i) * radius;
        const posX = 0;
        vertices[i * 3] = posX;
        vertices[i * 3 + 1] = posY;
        vertices[i * 3 + 2] = posZ;
    }
    for (let i = count * 2; i <= count * 3; i++) {
        const posX = Math.cos(angle * i) * radius;
        const posZ = Math.sin(angle * i) * radius;
        const posY = 0;
        vertices[i * 3] = posX;
        vertices[i * 3 + 1] = posY;
        vertices[i * 3 + 2] = posZ;
    }
    const len = vertices.length / 3 - 1;
    for (let i = 0; i < len; i++) {
        if (i === count - 1  || i === count * 2 -1) {
            continue;
        }
        indices[i * 2] = i;
        indices[i * 2 + 1] = i + 1;
    }
    vertices.push(0, 0, 0);
    vertices.push(radius, 0, 0);
    vertices.push(0, radius, 0);
    vertices.push(0, 0, radius);
    indices.push(len + 1, len + 2);
    indices.push(len + 1, len + 3);
    indices.push(len + 1, len + 4);
    return { vertices, indices };
}
