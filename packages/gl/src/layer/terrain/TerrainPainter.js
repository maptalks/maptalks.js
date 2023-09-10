import  { extend } from '../util/util';
import { vec3, mat4 } from 'gl-matrix';
import * as reshader from '@maptalks/reshader.gl';

import vert from './glsl/terrain.vert';
import frag from './glsl/terrain.frag';

const FALSE_COLOR_MASK = [false, false, false, false];
const TRUE_COLOR_MASK = [true, true, true, true];

const V3 = [];
const SCALE3 = [];


class TerrainPainter {
    constructor(layer) {
        this.layer = layer;
        this.regl = layer.getRenderer().regl;
        this.renderer = new reshader.Renderer(this.regl);
        this._leafScene = new reshader.Scene();
        const pixels = new Uint8Array(16);
        pixels.fill(255);
        this._emptyTileTexture = this.regl.texture({
            width: 2,
            height: 2,
            data: pixels
        });
        this._resLoader = new reshader.ResourceLoader(this._emptyTileTexture);
    }

    setToRedraw() {
        this.layer.getRenderer().setToRedraw();
    }

    getMap() {
        return this.layer.getMap();
    }

    startFrame() {
        if (!this.shader) {
            this.initShader();
        }
        this._leafScene.clear();
    }

    createTerrainMesh(tileInfo, terrainGeo, terrainImage, mesh) {
        const { positions, texcoords, triangles } = terrainGeo;
        if (mesh) {
            mesh.geometry.updateData('aPosition', positions);
            mesh.geometry.updateData('aTexCoord', texcoords);
            mesh.geometry.setElements(triangles);
            // mesh.geometry.generateBuffers(this.regl);
        } else {
            const geo = new reshader.Geometry({
                aPosition: positions,
                aTexCoord: texcoords
            },
            triangles,
            0);
            mesh = new reshader.Mesh(geo, null, {
                disableVAO: true
            });
            geo.generateBuffers(this.regl);
        }
        if (!mesh.uniforms.skin) {
            const emptyTexture = this.getEmptyTexture();
            mesh.setUniform('skin', emptyTexture);
        }
        mesh.setUniform('heightTexture', terrainImage);
        mesh.setUniform('bias', 0);
        this._updateMaskDefines(mesh);
        this.prepareMesh(mesh, tileInfo, terrainGeo);
        return mesh;
    }

    _updateMaskDefines(mesh) {
        const renderer = this.layer.getRenderer();
        if (renderer) {
            renderer.updateMaskDefines(mesh);
        }
    }

    _getPositionMatrix(out) {
        const heightScale = this._getPointZ(100) / 100;
        const positionMatrix = mat4.identity(out);
        mat4.scale(positionMatrix, positionMatrix, [1, 1, heightScale]);
        return positionMatrix;
    }

    _getLocalTransform(out, tileInfo, terrainWidth) {
        const map = this.getMap();
        const layerOptions = this.layer.options;
        const tileSize = layerOptions['tileSize'];
        const scale = tileInfo.res / map.getGLRes();

        const terrainScale = tileSize / (terrainWidth - 1);

        const { extent2d, offset } = tileInfo;
        vec3.set(V3, (extent2d.xmin - offset[0]) * scale, (tileInfo.extent2d.ymax - offset[1]) * scale, 0);
        const localTransform = mat4.identity(out);
        mat4.translate(localTransform, localTransform, V3);

        vec3.set(SCALE3, scale * terrainScale, scale * terrainScale, 1);
        mat4.scale(localTransform, localTransform, SCALE3);
        return localTransform;
    }

    prepareMesh(mesh, tileInfo, terrainGeo) {
        const { triangles, numTrianglesWithoutSkirts, terrainWidth } = terrainGeo;
        mesh.localTransform = this._getLocalTransform(mesh.localTransform || [], tileInfo, terrainWidth);
        mesh.positionMatrix = this._getPositionMatrix(mesh.positionMatrix || []);
        mesh.properties.skirtOffset = numTrianglesWithoutSkirts * 3;
        mesh.properties.skirtCount = triangles.length - numTrianglesWithoutSkirts * 3;
        mesh.properties.z = tileInfo.z;
        mesh.properties.minHeight = terrainGeo.minHeight;
        mesh.properties.maxHeight = terrainGeo.maxHeight;
        mesh.properties.terrainWidth = terrainWidth;
        mesh.castShadow = false;
    }

    addTerrainImage(tileInfo, tileImage) {
        const mesh = tileImage.terrainMesh;
        if (mesh && mesh.geometry && tileImage.skin) {
            mesh.setUniform('skin', tileImage.skin.color[0]);
            mesh.setUniform('polygonOpacity', 1.0);
            const isLeaf = this.layer.getRenderer().drawingCurrentTiles === true;
            mesh.setUniform('debugColor', isLeaf ? [1, 1, 1, 1] : [1, 1, 1, 1]);
            this._leafScene.addMesh(mesh);
        }
    }

    endFrame(context) {
        this.updateIBLDefines(this.shader);
        let renderCount = 0;

        const uniforms = this.getUniformValues();

        const fbo = this._getRenderFBO(context);
        uniforms.cullFace = 'back';
        uniforms.enableStencil = false;
        uniforms.colorMask = true;
        uniforms.depthMask = true;

        renderCount += this.renderer.render(this.shader, uniforms, this._leafScene, fbo);
        return renderCount;
    }

    delete() {
        if (this.shader) {
            this.shader.dispose();
            delete this.shader;
        }
        if (this._emptyTileTexture) {
            this._emptyTileTexture.destroy();
            delete this._emptyTileTexture;
        }
    }

    initShader() {
        const projViewModelMatrix = [], modelViewMatrix = [];
        this.shader = new reshader.MeshShader({
            vert,
            frag,
            uniforms: [
                {
                    name: 'modelViewMatrix',
                    type: 'function',
                    fn: function (context, props) {
                        return mat4.multiply(modelViewMatrix, props['viewMatrix'], props['modelMatrix']);
                    }
                },
                {
                    name: 'projViewModelMatrix',
                    type: 'function',
                    fn: function (context, props) {
                        return mat4.multiply(projViewModelMatrix, props['projViewMatrix'], props['modelMatrix']);
                    }
                }
            ],
            extraCommandProps: this.getExtraCommandProps()
        });
    }

    getExtraCommandProps() {
        const canvas = this.layer.getRenderer().canvas;
        const extraCommandProps = {
            viewport: {
                x : 0,
                y : 0,
                width : () => {
                    return canvas ? canvas.width : 1;
                },
                height : () => {
                    return canvas ? canvas.height : 1;
                }
            },
            colorMask: (_, props) => {
                if (props['colorMask'] === false) {
                    return FALSE_COLOR_MASK;
                } else {
                    return TRUE_COLOR_MASK;
                }
            },
            stencil: {
                enable: (_, props) => {
                    return props.enableStencil;
                },
                func: {
                    cmp: () => {
                        return '<=';
                    },
                    ref: (context, props) => {
                        return props.stencilRef;
                    }
                },
                op: {
                    fail: 'keep',
                    zfail: 'keep',
                    zpass: 'replace'
                }
            },
            cull: {
                enable: true,
                face: (_, props) => {
                    return props['cullFace'];
                }
            },
            depth: {
                enable: true,
                mask: (_, props) => {
                    const depthMask = this.layer.options['depthMask'];
                    return depthMask && props['depthMask'];
                },
                func: this.layer.options['depthFunc'] || '<='
                // func: (_, props) => {
                //     if (props['depthFunc']) {
                //         return props['depthFunc'];
                //     }
                //     return this.layer.options['depthFunc'] || '<=';
                // },
            },
            blend: {
                enable: true,
                func: { src: this.layer.options.blendSrc, dst: this.layer.options.blendDst },
                equation: 'add'
            },
        };
        return extraCommandProps;
    }

    _getRenderFBO(context) {
        //优先采用不aa的fbo
        return context && context.renderTarget && context.renderTarget.fbo;
    }

    getUniformValues() {
        const map = this.getMap();
        const projViewMatrix = map.projViewMatrix;
        const renderer = this.layer.getRenderer();
        const maskUniforms = renderer.getMaskUniforms();
        const uniforms = {
            viewMatrix: map.viewMatrix,
            projMatrix: map.projMatrix,
            projViewMatrix,
            heightScale: 1
        };
        extend(uniforms, maskUniforms);
        return uniforms;
    }

    _getPointZ(height) {
        const map = this.layer.getMap();
        if (!map) {
            return null;
        }
        const altitude = map.altitudeToPoint(height, map.getGLRes());
        return altitude;
    }

    getEmptyTexture() {
        return this._emptyTileTexture;
    }

    hasIBL() {
        const lightManager = this.getMap().getLightManager();
        const resource = lightManager && lightManager.getAmbientResource();
        return !!resource;
    }

    updateIBLDefines(shader) {
        const shaderDefines = shader.shaderDefines;
        let updated = false;
        if (this.hasIBL()) {
            if (!shaderDefines[['HAS_IBL_LIGHTING']]) {
                shaderDefines['HAS_IBL_LIGHTING'] = 1;
                updated = true;
            }
        } else if (shaderDefines[['HAS_IBL_LIGHTING']]) {
            delete shaderDefines['HAS_IBL_LIGHTING'];
            updated = true;
        }
        if (updated) {
            shader.shaderDefines = shaderDefines;
        }
    }
}

export default TerrainPainter;

function terrainMeshCompare(m0, m1) {
    return m1.properties.z - m0.properties.z;
}
