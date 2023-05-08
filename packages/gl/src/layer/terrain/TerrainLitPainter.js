import * as reshader from '@maptalks/reshader.gl';
import TerrainPainter from './TerrainPainter';
import  { extend } from '../util/util';

const { getIBLResOnCanvas, getPBRUniforms, loginIBLResOnCanvas, logoutIBLResOnCanvas } = reshader.pbr.PBRUtils;

class TerrainLitPainter extends TerrainPainter {
    constructor(...args) {
        super(...args);
        this.createIBLTextures();
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

    createTerrainMesh(tileInfo, terrainGeo) {
        const { positions, texcoords, triangles } = terrainGeo;
        const geo = new reshader.Geometry({
            aPosition: positions,
            aTexCoord: texcoords
        },
        triangles,
        0);
        let old = geo.getVertexCount();
        geo.buildUniqueVertex();
        console.log(old, geo.getVertexCount());
        geo.createNormal();
        geo.createTangent();

        geo.generateBuffers(this.regl);

        const emptyTexture = this.getEmptyTexture();
        const material = new reshader.pbr.StandardMaterial({
            baseColorFactor: [1, 1, 0, 1],
            metallicFactor: 0,
            roughnessFactor: 0,
            skinTexture: emptyTexture
        });
        const mesh = new reshader.Mesh(geo, material);
        const defines = mesh.defines;
        defines['HAS_UV_FLIP'] = 1;
        mesh.defines = defines;
        this.prepareMesh(mesh, tileInfo, terrainGeo);
        return mesh;
    }

    addTerrainImage(tileInfo, tileImage, opacity) {
        const mesh = tileImage.terrainMesh;
        if (mesh && tileImage.skin) {
            mesh.material.set('skinTexture', tileImage.skin.color[0]);
            mesh.material.set('polygonOpacity', opacity);
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

    getUniformValues() {
        const map = this.getMap();
        // const layer = this.layer;
        const canvas = map.getRenderer().canvas;
        const { iblTexes, dfgLUT } = getIBLResOnCanvas(canvas);
        const uniforms = getPBRUniforms(map, iblTexes, dfgLUT);
        // const renderer = this.layer.getRenderer();
        // const maskUniforms = renderer.getMaskUniforms();
        extend(uniforms, {
            viewMatrix: map.viewMatrix,
            projMatrix: map.projMatrix,
            projViewMatrix : map.projViewMatrix,
            outSize: [canvas.width, canvas.height],
            polygonFill: [1, 1, 1, 1],
            polygonOpacity: 1
        });
        // extend(uniforms, maskUniforms);
        return uniforms;
    }


    initShader() {
        this.shader = new reshader.pbr.StandardShader({
            extraCommandProps: this.getExtraCommandProps()
        });
    }

    delete() {
        this.disposeIBLTextures();
        return super.delete();
    }
}

export default TerrainLitPainter;
