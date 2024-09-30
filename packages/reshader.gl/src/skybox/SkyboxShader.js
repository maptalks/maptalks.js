import skyboxData from './skybox.js';
import vert from './skybox.vert';
import frag from './skybox.frag';
import MeshShader from '../shader/MeshShader';
import Mesh from '../Mesh.js';
import Geometry from '../Geometry.js';

class SkyboxShader extends MeshShader {
    constructor() {
        const config = {
            vert,
            frag,
            extraCommandProps: {
                depth: {
                    enable : true,
                    range: [1, 1],
                    func : 'lequal'
                },
                viewport: {
                    x: 0,
                    y: 0,
                    width: (context, props) => { return props.resolution[0]; },
                    height: (context, props) => { return props.resolution[1]; },
                }
            }
        };
        super(config);
        this.version = 300;
    }

    /**
    * @param inputRGBM 输入的cubemap是否是rgbm格式
    * @param mode 模式，0： ambient模式， 1: lod模式
    */
    setMode(toneMapping, mode) {
        const defines = {};
        if (toneMapping) {
            defines['TONE_MAPPING'] = 1;
        }
        if (mode === 0) {
            defines['USE_AMBIENT'] = 1;
        }
        if (this._skyboxMesh) {
            this._skyboxMesh[0].setDefines(defines);
        } else {
            this._meshDefines = defines;
        }
        return this;
    }

    draw(regl) {
        if (!this._skyboxMesh) {
            this._createSkyboxMesh(regl);
        }
        return super.draw(regl, this._skyboxMesh);
    }

    _createSkyboxMesh(regl) {
        const geometry = new Geometry(
            {
                aPosition : new Int8Array(skyboxData.vertices)
            },
            null,
            skyboxData.vertices.length / 3
        );
        geometry.generateBuffers(regl);
        this._skyboxMesh = [new Mesh(geometry)];
        if (this._meshDefines) {
            this._skyboxMesh[0].setDefines(this._meshDefines);
            delete this._meshDefines;
        }
    }

    dispose() {
        if (this._skyboxMesh) {
            const mesh = this._skyboxMesh[0];
            mesh.geometry.dispose();
            mesh.dispose();
        }
        delete this._skyboxMesh;
        return super.dispose();
    }
}

export default SkyboxShader;
