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
        this._parentScene = new reshader.Scene();
        const pixels = new Uint8Array(16);
        pixels.fill(255);
        this._emptyTileTexture = this.regl.texture({
            width: 2,
            height: 2,
            data: pixels
        });
        this._resLoader = new reshader.ResourceLoader(this._emptyTileTexture);
    }

    getMap() {
        return this.layer.getMap();
    }

    startFrame() {
        if (!this.shader) {
            this.initShader();
        }
        this._leafScene.clear();
        this._parentScene.clear();
    }

    createTerrainMesh(tileInfo, terrainGeo, terrainImage) {
        const { positions, texcoords, triangles } = terrainGeo;
        const geo = new reshader.Geometry({
            aPosition: positions,
            aTexCoord: texcoords
        },
        triangles,
        0);

        geo.generateBuffers(this.regl);

        const mesh = new reshader.Mesh(geo);
        const emptyTexture = this.getEmptyTexture();
        mesh.setUniform('skin', emptyTexture);
        mesh.setUniform('heightTexture', terrainImage);
        mesh.setUniform('bias', 0);
        this.prepareMesh(mesh, tileInfo, terrainGeo);

        return mesh;
    }

    _getPositionMatrix() {
        const heightScale = this._getPointZ(100) / 100;
        const positionMatrix = mat4.identity([]);
        mat4.scale(positionMatrix, positionMatrix, [1, 1, heightScale]);
        return positionMatrix;
    }

    _getLocalTransform(tileInfo) {
        const map = this.getMap();
        const tileSize = this.layer.options['tileSize'];
        const terrainWidth = tileSize + 1;

        const scale = tileInfo.res / map.getGLRes();

        const terrainScale = (tileSize + 2) / terrainWidth;

        const { extent2d, offset } = tileInfo;
        vec3.set(V3, (extent2d.xmin - offset[0]) * scale, (tileInfo.extent2d.ymax - offset[1]) * scale, 0);
        const localTransform = mat4.identity([]);
        mat4.translate(localTransform, localTransform, V3);

        vec3.set(SCALE3, scale * terrainScale, scale * terrainScale, 1);
        mat4.scale(localTransform, localTransform, SCALE3);
        return localTransform;
    }

    prepareMesh(mesh, tileInfo, terrainGeo) {
        mesh.localTransform = this._getLocalTransform(tileInfo);
        mesh.positionMatrix = this._getPositionMatrix();
        const { triangles, numTrianglesWithoutSkirts } = terrainGeo;
        mesh.properties.skirtOffset = numTrianglesWithoutSkirts * 3;
        mesh.properties.skirtCount = triangles.length - numTrianglesWithoutSkirts * 3;
        mesh.properties.z = tileInfo.z;
    }

    addTerrainImage(tileInfo, tileImage, opacity) {
        const mesh = tileImage.terrainMesh;
        if (mesh && mesh.geometry && tileImage.skin) {
            mesh.setUniform('skin', tileImage.skin.color[0]);
            mesh.setUniform('opacity', opacity);
            const maxZoom = this.layer.getSpatialReference().getMaxZoom();
            const isLeaf = this.layer.getRenderer().drawingCurrentTiles === true;
            mesh.setUniform('stencilRef', isLeaf ? 0 : 1 + maxZoom - tileInfo.z);
            mesh.setUniform('debugColor', isLeaf ? [1, 1, 1, 1] : [1, 1, 1, 1]);
            if (isLeaf) {
                this._leafScene.addMesh(mesh);
            } else {
                this._parentScene.addMesh(mesh);
            }
        }
    }

    endFrame(context) {
        this.updateIBLDefines(this.shader);
        let renderCount = 0;

        const enableFading = this.layer.options['fadeAnimation'] && this.layer.options['fadeDuration'] > 0;

        const uniforms = this.getUniformValues();

        const fbo = this._getRenderFBO(context);
        uniforms.cullFace = 'front';
        uniforms.enableStencil = false;
        uniforms.colorMask = false;
        uniforms.depthMask = true;
        this.renderer.render(this.shader, uniforms, this._parentScene, fbo);

        //.绘制 parent 背面的 skirt，并开启颜色，避免下凹的地形（露出skirt时）会出现空白
        uniforms.colorMask = true;
        this._parentScene.meshes.forEach(m => {
            const { skirtOffset, skirtCount } = m.properties;
            // m.setUniform('opacity', 1);
            m.geometry.setDrawOffset(skirtOffset);
            if (m.getUniform('skin') === this._emptyTileTexture) {
                m.geometry.setDrawCount(0);
            } else {
                m.geometry.setDrawCount(skirtCount);
            }
        });
        this.renderer.render(this.shader, uniforms, this._parentScene, fbo);

        uniforms.enableStencil = true;
        uniforms.colorMask = true;
        uniforms.cullFace = 'back';

        this._parentScene.meshes.sort(terrainMeshCompare);

        if (enableFading) {
            // draw parent terrain surface，禁用深度值写入，作为叶子瓦片fading的背景
            uniforms.depthMask = false;
            this._parentScene.meshes.forEach(m => {
                const skirtOffset = m.properties.skirtOffset;
                m.geometry.setDrawOffset(0);
                m.geometry.setDrawCount(skirtOffset);
            });
            renderCount += this.renderer.render(this.shader, uniforms, this._parentScene, fbo);
            uniforms.depthMask = true;
        }

        // draw leafs terrain surface
        this._leafScene.meshes.forEach(m => {
            const skirtOffset = m.properties.skirtOffset;
            m.geometry.setDrawOffset(0);
            m.geometry.setDrawCount(skirtOffset);
        });
        renderCount += this.renderer.render(this.shader, uniforms, this._leafScene, fbo);

        // write parent terrain surface depth，因为上面已经绘制过，这里无需再次绘制
        if (enableFading) {
            uniforms.colorMask = false;
        }
        this.renderer.render(this.shader, uniforms, this._parentScene, fbo);

        // draw parent terrain skirts
        uniforms.colorMask = true;
        // this._parentScene.meshes.forEach(m => {
        //     const { skirtOffset, skirtCount } = m.properties;
        //     m.geometry.setDrawOffset(skirtOffset);
        //     if (m.getUniform('skin') === this._emptyTileTexture) {
        //         m.geometry.setDrawCount(0);
        //     } else {
        //         m.geometry.setDrawCount(skirtCount);
        //     }
        // });
        // renderCount += this.renderer.render(this.shader, uniforms, this._parentScene, fbo);

        // draw leafs skirts

        this._leafScene.meshes.forEach(m => {
            const { skirtOffset, skirtCount } = m.properties;
            m.setUniform('opacity', 1);
            m.geometry.setDrawOffset(skirtOffset);
            if (m.getUniform('skin') === this._emptyTileTexture) {
                m.geometry.setDrawCount(0);
            } else {
                m.geometry.setDrawCount(skirtCount);
            }
        });
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
        const projViewModelMatrix = [];
        this.shader = new reshader.MeshShader({
            vert,
            frag,
            uniforms: [
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

        const uniforms = {
            projViewMatrix,
            heightScale: 1
        };
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
