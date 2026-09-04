import * as reshader from '../../reshader';
import { vec4 } from 'gl-matrix';
import VideoProjectionShader from './VideoProjectionShader.js';
import VideoProjectionDepthShader from './VideoProjectionDepthShader.js';
import VideoProjectionFrustumShader from './VideoProjectionFrustumShader.js';
import { normalizeColor } from '../util/util.js';

const RESOLUTION = 2048;

/**
 * 视频投影渲染器：
 * 1. 将场景网格以投影相机视角渲染为深度贴图（shadow mapping）
 * 2. 全屏合成：用投影矩阵把主相机 NDC 重建的点投影到投影相机空间，
 *    与深度贴图比较做遮挡剔除，叠加视频颜色
 */
class VideoProjectionPainter {
    constructor(regl, layer) {
        this._regl = regl;
        this._layer = layer;
        this._init();
    }

    _init() {
        this.renderer = new reshader.Renderer(this._regl);
        const layerRenderer = this._layer.getRenderer();
        const viewport = this._viewport = {
            x: 0,
            y: 0,
            width: () => {
                return layerRenderer.canvas ? layerRenderer.canvas.width : 1;
            },
            height: () => {
                return layerRenderer.canvas ? layerRenderer.canvas.height : 1;
            }
        };
        this._fbo = this._regl.framebuffer({
            color: this._regl.texture({
                width: 1,
                height: 1,
                wrap: 'clamp',
                mag: 'linear',
                min: 'linear'
            }),
            depth: true
        });
        // ping-pong 合成 FBO：多个投影依次合成时避免同一 FBO 既采样又渲染
        this._fbo2 = this._regl.framebuffer({
            color: this._regl.texture({
                width: 1,
                height: 1,
                wrap: 'clamp',
                mag: 'linear',
                min: 'linear'
            }),
            depth: true
        });
        this._depthSize = RESOLUTION;
        const depthViewport = {
            x: 0,
            y: 0,
            width: () => this._depthSize,
            height: () => this._depthSize
        };
        this._depthShader = new VideoProjectionDepthShader(depthViewport);
        this._shader = new VideoProjectionShader(viewport);
        this._frustumShader = new VideoProjectionFrustumShader({
            viewport: {
                x: 0,
                y: 0,
                width: () => {
                    return layerRenderer.canvas ? layerRenderer.canvas.width : 1;
                },
                height: () => {
                    return layerRenderer.canvas ? layerRenderer.canvas.height : 1;
                }
            },
            depth: {
                enable: true,
                //只做深度测试，不写入深度，避免影响后续后处理
                mask: false,
                func: '<='
            },
            blend: {
                enable: true,
                func: {
                    src: 'src alpha',
                    dst: 'one minus src alpha'
                },
                equation: 'add'
            }
        });
        this._frustumScene = new reshader.Scene();
        this._scene = new reshader.Scene();
    }

    getMap() {
        return this._layer && this._layer.getMap();
    }

    paint(tex, depthTex, layers) {
        const projections = this._layer && this._layer._videoProjectionList;
        if (!projections || !projections.length) {
            return tex;
        }
        this._resize();
        let result = tex;
        let target = this._fbo;
        for (let i = 0; i < projections.length; i++) {
            const projection = projections[i];
            if (!projection.isEnable()) {
                continue;
            }
            result = this._renderProjection(result, depthTex, layers, projection, target);
            // ping-pong：下一投影的渲染目标与上一投影的采样源不同
            target = target === this._fbo ? this._fbo2 : this._fbo;
        }
        return result;
    }

    _renderProjection(tex, depthTex, layers, projection, fbo) {
        const map = this.getMap();
        if (!map) {
            return tex;
        }
        const videoTexture = projection.getVideoTexture(this._regl);
        if (!videoTexture) {
            return tex;
        }
        const projViewMatrix = projection.getProjViewMatrix(map);
        const depthFBO = this._getProjectionDepthFBO(projection);
        const meshes = this._getMeshes(layers);
        this._renderDepth(meshes, projViewMatrix, depthFBO, projection);

        // WebGPU 下主场景深度纹理在开启 antialias 时是 MSAA 深度纹理，
        // 合成 shader 需用 textureLoad 采样，通过 HAS_MULTISAMPLED define 区分
        const defines = {};
        if (depthTex && depthTex.texture && depthTex.texture.sampleCount > 1) {
            defines['HAS_MULTISAMPLED'] = 1;
        }
        this._shader.setDefines(defines);

        const uniforms = {
            sceneMap: tex,
            sceneDepthTex: depthTex,
            projectorDepthMap: depthFBO.color[0],
            videoTexture,
            projectorClipMatrix: projection.getProjectorClipMatrix(map),
            opacity: projection.options.opacity == null ? 1 : projection.options.opacity,
            intensity: projection.options.intensity == null ? 1 : projection.options.intensity,
            projBias: projection.options.projBias == null ? 0.001 : projection.options.projBias,
            edgeFeather: projection.options.edgeFeather == null ? 0 : projection.options.edgeFeather,
            cropRect: vec4.set([], projection.options.cropRect[0], projection.options.cropRect[1], projection.options.cropRect[2], projection.options.cropRect[3]),
            quadHomography: projection.getQuadHomography(),
            frustumColor: normalizeColor([], projection.options.frustumColor || [1, 0, 0, 1]),
            textureSize: depthTex ? [depthTex.width, depthTex.height] : [1, 1]
        };
        try {
            this.renderer.render(this._shader, uniforms, null, fbo);
        } catch (e) {
            console.error('[video-projection] composite render error:', e);
            throw e;
        }
        return fbo;
    }

    _renderDepth(meshes, projViewMatrix, depthFBO, projection) {
        if (!meshes.length) {
            return;
        }
        this._scene.setMeshes(meshes);
        const params = projection.getCameraParams();
        this.renderer.clear({
            color: [0, 0, 0, 1],
            depth: 1,
            framebuffer: depthFBO
        });
        this.renderer.render(this._depthShader, {
            projViewMatrix,
            minAltitude: 0,
            logDepthBufFC: 2.0 / (Math.log(params.far + 1.0) / Math.LN2)
        }, this._scene, depthFBO);
    }

    _getProjectionDepthFBO(projection) {
        const size = projection.options.depthSize || RESOLUTION;
        if (projection._depthFBO) {
            if (projection._depthFBO.width !== size || projection._depthFBO.height !== size) {
                projection._depthFBO.resize(size, size);
            }
            return projection._depthFBO;
        }
        projection._depthFBO = this._regl.framebuffer({
            color: this._regl.texture({
                width: size,
                height: size,
                wrap: 'clamp',
                mag: 'nearest',
                min: 'nearest'
            }),
            depth: true
        });
        return projection._depthFBO;
    }

    _getMeshes(layers) {
        let meshes = [];
        for (let i = 0; i < layers.length; i++) {
            const layer = layers[i];
            const renderer = layer && layer.getRenderer();
            if (!renderer || !renderer.getAnalysisMeshes || !layer.isVisible()) {
                continue;
            }
            const renderMeshes = renderer.getAnalysisMeshes();
            renderMeshes.forEach(mesh => {
                mesh.setUniform('useAnalysis', 1);
            });
            meshes = meshes.concat(renderMeshes);
        }
        const layerRenderer = this._layer.getRenderer();
        if (layerRenderer && layerRenderer._groundPainter) {
            meshes = meshes.concat(layerRenderer._groundPainter.getRenderMeshes());
        }
        return meshes;
    }

    /**
     * 绘制投影视锥体线框（叠加到主场景 FBO，参与深度测试，被遮挡部分不显示）
     * 线框用三角形展开实现，支持任意线宽（WebGL lineWidth 通常仅支持 1px）
     */
    renderFrustum(fbo) {
        const projections = this._layer && this._layer._videoProjectionList;
        if (!projections || !projections.length) {
            return;
        }
        const map = this.getMap();
        if (!map) {
            return;
        }
        for (let i = 0; i < projections.length; i++) {
            const projection = projections[i];
            if (!projection.isEnable() || !projection.options.showFrustum) {
                continue;
            }
            const positions = projection.getFrustumWorldVertices(map);
            if (!positions || !positions.length) {
                continue;
            }
            // 12 条线段 -> 每段 4 顶点（两条线段宽度带）+ 索引
            const vertexCount = positions.length / 3;
            const segmentCount = vertexCount / 2;
            const lineVertexCount = segmentCount * 4;
            const linePositions = new Float32Array(lineVertexCount * 3);
            const lineNexts = new Float32Array(lineVertexCount * 3);
            const lineSides = new Float32Array(lineVertexCount);
            const elements = new Uint16Array(segmentCount * 6);
            for (let s = 0; s < segmentCount; s++) {
                const p0 = s * 6;
                const p1 = s * 6 + 3;
                const base = s * 4;
                // 顶点：p0/-1, p1/-1, p0/+1, p1/+1
                linePositions[base * 3] = positions[p0];
                linePositions[base * 3 + 1] = positions[p0 + 1];
                linePositions[base * 3 + 2] = positions[p0 + 2];
                linePositions[(base + 1) * 3] = positions[p1];
                linePositions[(base + 1) * 3 + 1] = positions[p1 + 1];
                linePositions[(base + 1) * 3 + 2] = positions[p1 + 2];
                linePositions[(base + 2) * 3] = positions[p0];
                linePositions[(base + 2) * 3 + 1] = positions[p0 + 1];
                linePositions[(base + 2) * 3 + 2] = positions[p0 + 2];
                linePositions[(base + 3) * 3] = positions[p1];
                linePositions[(base + 3) * 3 + 1] = positions[p1 + 1];
                linePositions[(base + 3) * 3 + 2] = positions[p1 + 2];
                lineNexts[base * 3] = positions[p1];
                lineNexts[base * 3 + 1] = positions[p1 + 1];
                lineNexts[base * 3 + 2] = positions[p1 + 2];
                lineNexts[(base + 1) * 3] = positions[p0];
                lineNexts[(base + 1) * 3 + 1] = positions[p0 + 1];
                lineNexts[(base + 1) * 3 + 2] = positions[p0 + 2];
                lineNexts[(base + 2) * 3] = positions[p1];
                lineNexts[(base + 2) * 3 + 1] = positions[p1 + 1];
                lineNexts[(base + 2) * 3 + 2] = positions[p1 + 2];
                lineNexts[(base + 3) * 3] = positions[p0];
                lineNexts[(base + 3) * 3 + 1] = positions[p0 + 1];
                lineNexts[(base + 3) * 3 + 2] = positions[p0 + 2];
                lineSides[base] = -1;
                lineSides[base + 1] = -1;
                lineSides[base + 2] = 1;
                lineSides[base + 3] = 1;
                elements[s * 6] = base;
                elements[s * 6 + 1] = base + 1;
                elements[s * 6 + 2] = base + 2;
                elements[s * 6 + 3] = base + 2;
                elements[s * 6 + 4] = base + 1;
                elements[s * 6 + 5] = base + 3;
            }
            let geometry = projection._frustumGeometry;
            // indexed 几何：count 为索引数量
            if (!geometry || geometry.count !== elements.length) {
                if (geometry && geometry.dispose) {
                    geometry.dispose();
                }
                geometry = projection._frustumGeometry = new reshader.Geometry({
                    aPosition: linePositions,
                    aNext: lineNexts,
                    aSide: lineSides
                }, elements, elements.length, { primitive: 'triangles' });
                if (this._regl.wgpu) {
                    // WebGPU 下需要先生成 GPU 顶点/索引缓冲
                    geometry.generateBuffers(this._regl);
                }
            } else {
                if (this._regl.wgpu) {
                    // WebGPU：复用已生成的 GPU 缓冲，直接上传新顶点数据（线框每帧更新）
                    const gpuBuffers = geometry.data;
                    const uploads = [
                        [gpuBuffers.aPosition, linePositions],
                        [gpuBuffers.aNext, lineNexts],
                        [gpuBuffers.aSide, lineSides]
                    ];
                    for (let u = 0; u < uploads.length; u++) {
                        const wrapper = uploads[u][0];
                        const arr = uploads[u][1];
                        if (wrapper && wrapper.buffer) {
                            this._regl.wgpu.queue.writeBuffer(wrapper.buffer, 0, arr.buffer, 0, arr.byteLength);
                        }
                    }
                    geometry._incrVersion();
                } else {
                    geometry.data.aPosition = linePositions;
                    geometry.data.aNext = lineNexts;
                    geometry.data.aSide = lineSides;
                    // 强制重建 regl 缓冲与 VAO（索引不变，无需重建）
                    geometry._reglData = null;
                    if (geometry._vao) {
                        for (const key in geometry._vao) {
                            geometry._vao[key].dirty = true;
                        }
                    }
                    geometry._incrVersion();
                }
            }
            let mesh = projection._frustumMesh;
            // Mesh 没有 setGeometry 接口，geometry 对象被复用且缓冲原地更新；
            // 仅当 mesh 不存在或持有的 geometry 已重建时，才需要重建 mesh
            if (!mesh || mesh._geometry !== geometry) {
                if (mesh && mesh.dispose) {
                    mesh.dispose();
                }
                mesh = projection._frustumMesh = new reshader.Mesh(geometry, null, {
                    castShadow: false,
                    transparent: true
                });
            }
            this._frustumScene.setMeshes([mesh]);
            const color = normalizeColor([], projection.options.frustumColor || [1, 0, 0, 1]);
            const layerRenderer = this._layer.getRenderer();
            this.renderer.render(this._frustumShader, {
                projViewMatrix: map.projViewMatrix,
                uColor: color,
                uLineWidth: projection.options.frustumLineWidth == null ? 1 : projection.options.frustumLineWidth,
                uViewportHeight: layerRenderer.canvas ? layerRenderer.canvas.height : 1
            }, this._frustumScene, fbo);
        }
    }

    _hasVideoProjection() {
        const projections = this._layer && this._layer._videoProjectionList;
        if (!projections) {
            return false;
        }
        for (let i = 0; i < projections.length; i++) {
            if (projections[i].isEnable()) {
                return true;
            }
        }
        return false;
    }

    //视频播放时需要持续重绘
    isAnimating() {
        const projections = this._layer && this._layer._videoProjectionList;
        if (!projections) {
            return false;
        }
        for (let i = 0; i < projections.length; i++) {
            if (projections[i].isAnimating()) {
                return true;
            }
        }
        return false;
    }

    _resize() {
        const layerRenderer = this._layer.getRenderer();
        const width = layerRenderer.canvas ? layerRenderer.canvas.width : 1;
        const height = layerRenderer.canvas ? layerRenderer.canvas.height : 1;
        if (this._fbo && (this._fbo.width !== width || this._fbo.height !== height)) {
            this._fbo.resize(width, height);
        }
        if (this._fbo2 && (this._fbo2.width !== width || this._fbo2.height !== height)) {
            this._fbo2.resize(width, height);
        }
    }

    dispose() {
        const projections = this._layer && this._layer._videoProjectionList;
        if (projections) {
            projections.forEach(projection => {
                if (projection._depthFBO) {
                    projection._depthFBO.destroy && projection._depthFBO.destroy();
                    delete projection._depthFBO;
                }
                if (projection._frustumGeometry) {
                    projection._frustumGeometry.dispose && projection._frustumGeometry.dispose();
                    delete projection._frustumGeometry;
                }
                if (projection._frustumMesh) {
                    projection._frustumMesh.dispose && projection._frustumMesh.dispose();
                    delete projection._frustumMesh;
                }
                projection.dispose && projection.dispose();
            });
        }
        if (this._fbo) {
            this._fbo.destroy && this._fbo.destroy();
        }
        if (this._fbo2) {
            this._fbo2.destroy && this._fbo2.destroy();
        }
        if (this._shader) {
            this._shader.dispose && this._shader.dispose();
        }
        if (this._depthShader) {
            this._depthShader.dispose && this._depthShader.dispose();
        }
        if (this._frustumShader) {
            this._frustumShader.dispose && this._frustumShader.dispose();
        }
    }
}

export default VideoProjectionPainter;
