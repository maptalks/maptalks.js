import * as reshader from '@maptalks/reshader.gl';
import TerrainPainter from './TerrainPainter';
import  { extend } from '../util/util';
import * as ContextUtil from '../util/context';

const { getIBLResOnCanvas, getPBRUniforms, loginIBLResOnCanvas, logoutIBLResOnCanvas } = reshader.pbr.PBRUtils;

const DEFAULT_MATERIAL = {
    baseColorFactor: [1, 1, 1, 1],
    emissiveFactor: [0, 0, 0],
    baseColorIntensity: 1,
    emitColorFactor: 1,
    roughnessFactor: 1,
    metallicFactor: 0,
    emitMultiplicative: 1,
    outputSRGB: 1,
    hsv: [0, 0, 0],
    contrast: 1,
    alphaTest: 0,
};

class TerrainLitPainter extends TerrainPainter {
    constructor(...args) {
        super(...args);
        this.createIBLTextures();
        this._matVer = 0;
    }

    updateMaterial(mat, matVer) {
        this._matVer = matVer;
        this._material = this._material || {};
        extend(this._material, mat);
        this.setToRedraw();
    }

    setMaterial(mat, matVer) {
        this._matVer = matVer;
        this._material = extend({}, DEFAULT_MATERIAL, mat);
        this.setToRedraw();
    }

    createIBLTextures() {
        const canvas = this.getMap().getRenderer().canvas;
        loginIBLResOnCanvas(canvas, this.regl, this.getMap());
        this.layer.fire('iblupdated');
    }

    disposeIBLTextures() {
        const canvas = this.getMap().getRenderer().canvas;
        logoutIBLResOnCanvas(canvas, this.getMap());
    }

    createTerrainMesh(tileInfo, terrainImage) {
        const { mesh: terrainGeo, image: heightTexture } = terrainImage;
        const { positions, texcoords, triangles, leftSkirtIndex, rightSkirtIndex, bottomSkirtIndex, numVerticesWithoutSkirts } = terrainGeo;
        const normals = new Int8Array(positions.length);
        for (let i = 2; i < normals.length; i += 3) {
            if (i < numVerticesWithoutSkirts * 3) {
                normals[i] = 1;
            } else if (i < leftSkirtIndex / 2 * 3) {
                normals[i - 2] = -1;
            } else if (i < rightSkirtIndex / 2 * 3) {
                normals[i - 2] = 1;
            } else if (i < bottomSkirtIndex / 2 * 3) {
                normals[i - 1] = -1;
            } else {
                // top
                normals[i - 1] = 1;
            }
        }
        const geo = new reshader.Geometry({
            aPosition: positions,
            aTexCoord: texcoords,
            aNormal: normals
        },
        triangles,
        0);

        // 共用端点时，法线值会出现错误，造成视觉上不连续，所以需要唯一化
        // 唯一化后，三角形数量不变，但端点数组大概会膨胀5倍以上
        // geo.buildUniqueVertex();
        // geo.createNormal();
        geo.createTangent();
        delete geo.data.aNormal;

        geo.generateBuffers(this.regl);

        let terrainHeightTexture;
        if (heightTexture) {
            terrainHeightTexture = this.regl.texture({
                width: heightTexture.width,
                height: heightTexture.height,
                data: heightTexture,
                min: 'linear',
                mag: 'linear'
            });
        } else {
            terrainHeightTexture = this.getEmptyTexture();
        }

        const emptyTexture = this.getEmptyTexture();
        const matInfo = extend({}, DEFAULT_MATERIAL, this.layer.options['material'] || {});
        matInfo.skinTexture = emptyTexture;
        matInfo.terrainHeightTexture = terrainHeightTexture;
        const material = new reshader.pbr.StandardMaterial(matInfo);
        const mesh = new reshader.Mesh(geo, material);
        mesh.properties.matVer = this._matVer;
        const defines = mesh.defines;
        defines['HAS_UV_FLIP'] = 1;
        defines['HAS_TERRAIN_NORMAL'] = 1;
        defines['HAS_MAP'] = 1;
        mesh.defines = defines;
        // mesh.setUniform('terrainTileResolution', tileInfo.res);
        this.prepareMesh(mesh, tileInfo, terrainImage);
        return mesh;
    }

    addTerrainImage(tileInfo, tileImage) {
        const mesh = tileImage.terrainMesh;
        if (mesh) {
            if (this._material && mesh.properties.matVer !== this._matVer) {
                for (const p in this._material) {
                    mesh.material.set(p, this._material[p]);
                }
                mesh.properties.matVer = this._matVer;
            }
            if (tileImage.skin) {
                mesh.material.set('skinTexture', tileImage.skin);
            }
            mesh.setUniform('polygonOpacity', 1.0);
            // const { skirtOffset, skirtCount } = mesh.properties;
            // mesh.geometry.setDrawOffset(skirtOffset);
            // mesh.geometry.setDrawCount(skirtCount);
            this._leafScene.addMesh(mesh);
        }
    }

    getUniformValues() {
        const map = this.getMap();
        // const layer = this.layer;
        const canvas = map.getRenderer().canvas;
        const { iblTexes, dfgLUT } = getIBLResOnCanvas(canvas);
        const uniforms = getPBRUniforms(map, iblTexes, dfgLUT);
        const tileSize = this.layer.getTileSize().width;
        const renderer = this.layer.getRenderer();
        const maskUniforms = renderer.getMaskUniforms();
        // const terrainHeightScale = this._getHeightScale();
        extend(uniforms, {
            viewMatrix: map.viewMatrix,
            projMatrix: map.projMatrix,
            projViewMatrix : map.projViewMatrix,
            outSize: [canvas.width, canvas.height],
            polygonFill: [1, 1, 1, 1],
            terrainHeightMapResolution: [tileSize, tileSize],
            terrainResolution: [canvas.width, canvas.height],
            // terrainHeightScale,
            terrainUnpackFactors: [6553.6, 25.6, 0.1, 10000.0]
        });
        extend(uniforms, maskUniforms);
        return uniforms;
    }


    initShader(context) {
        const defines = {};
        const uniformDeclares = [];
        ContextUtil.fillIncludes(defines, uniformDeclares, context);
        this.shader = new reshader.pbr.StandardShader({
            uniforms: uniformDeclares,
            defines,
            extraCommandProps: this.getExtraCommandProps()
        });
    }

    delete() {
        this.disposeIBLTextures();
        return super.delete();
    }
}

export default TerrainLitPainter;
