import  { extend, hasOwn } from '../util/util';
import * as ContextUtil from '../util/context';
import { vec3, mat4 } from '@maptalks/reshader.gl';
import * as reshader from '@maptalks/reshader.gl';
import { EMPTY_TERRAIN_GEO } from './TerrainTileUtil.js';

import vert from './glsl/terrain.vert';
import frag from './glsl/terrain.frag';

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
        this._createEmptyTerrainGeo();
    }

    setToRedraw() {
        this.layer.getRenderer().setToRedraw();
    }

    getMap() {
        return this.layer.getMap();
    }

    startFrame(context) {
        if (context && context.states && context.states.includesChanged) {
            this.shader.dispose();
            delete this.shader;
        }
        if (!this.shader) {
            this.initShader(context);
        }
        this._leafScene.clear();
    }

    createTerrainMesh(tileInfo, terrainImage) {
        const { mesh: terrainGeo, image: heightTexture } = terrainImage;
        let mesh = terrainImage.terrainMesh;
        const { positions, texcoords, triangles, empty } = terrainGeo;
        if (mesh && mesh.geometry !== this._emptyTerrainGeometry) {
            mesh.geometry.updateData('aPosition', positions);
            mesh.geometry.updateData('aTexCoord', texcoords);
            mesh.geometry.setElements(triangles);
        } else {
            const geo = empty ? this._emptyTerrainGeometry : new reshader.Geometry({
                aPosition: positions,
                aTexCoord: texcoords
            },
            triangles,
            0);
            if (mesh) {
                mesh.geometry = geo;
            } else {
                mesh = new reshader.Mesh(geo, null, {
                    disableVAO: true
                });
                geo.generateBuffers(this.regl);
            }
        }
        if (!mesh.uniforms.skin) {
            const emptyTexture = this.getEmptyTexture();
            mesh.setUniform('skin', emptyTexture);
        }

        mesh.setUniform('heightTexture', heightTexture);
        this.prepareMesh(mesh, tileInfo, terrainImage);
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
        const tileSize = this.layer.getTileSize().width;
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

    prepareMesh(mesh, tileInfo, terrainImage) {
        if (!mesh.isValid()) {
            return;
        }
        const { mesh: terrainGeo } = terrainImage;
        this._updateMaskDefines(mesh);
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
        if (!hasOwn(mesh.uniforms, 'minAltitude')) {
            Object.defineProperty(mesh.uniforms, 'minAltitude', {
                enumerable: true,
                get: () => {
                    return terrainImage.minAltitude || 0;
                }
            });
        }
    }

    addTerrainImage(tileInfo, tileImage) {
        const mesh = tileImage.terrainMesh;
        if (mesh && mesh.geometry && tileImage.skin) {
            mesh.setUniform('skin', tileImage.skin.color[0]);
            mesh.setUniform('polygonOpacity', 1.0);
            // const { skirtOffset, skirtCount } = mesh.properties;
            // mesh.geometry.setDrawOffset(skirtOffset);
            // mesh.geometry.setDrawCount(skirtCount);
            this._leafScene.addMesh(mesh);
        }
    }

    endFrame(context) {
        this.updateIBLDefines(this.shader);
        let renderCount = 0;

        const uniforms = this.getUniformValues();

        const fbo = this._getRenderFBO(context);
        this.shader.filter = context && context.sceneFilter;
        ContextUtil.setIncludeUniformValues(uniforms, context);
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
        if (this._emptyTerrainGeometry) {
            this._emptyTerrainGeometry.dispose();
            delete this._emptyTerrainGeometry;
        }
    }

    deleteMesh(terrainMesh) {
        if (!terrainMesh) {
            return;
        }
        const geo = terrainMesh.geometry;
        terrainMesh.dispose();
        if (geo !== this._emptyTerrainGeometry) {
            geo.dispose();
        }
    }

    initShader(context) {
        const projViewModelMatrix = [], modelViewMatrix = [];
        const defines = {};
        const uniformDeclares = [];
        ContextUtil.fillIncludes(defines, uniformDeclares, context);
        this.shader = new reshader.MeshShader({
            vert,
            frag,
            uniforms: uniformDeclares.concat([
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
            ]),
            defines,
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
            stencil: {
                enable: false
            },
            cull: {
                enable: true,
                face: 'back'
            },
            depth: {
                enable: true,
                mask: () => {
                    const depthMask = this.layer.options['depthMask'];
                    return !!depthMask;
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

    _createEmptyTerrainGeo() {
        const emptyTerrainGeo = EMPTY_TERRAIN_GEO;
        const { positions, texcoords, triangles } = emptyTerrainGeo;
        this._emptyTerrainGeometry = new reshader.Geometry({
            aPosition: positions,
            aTexCoord: texcoords
        },
        triangles,
        0);
        this._emptyTerrainGeometry.generateBuffers(this.regl);
    }
}

export default TerrainPainter;

// function terrainMeshCompare(m0, m1) {
//     return m1.properties.z - m0.properties.z;
// }


