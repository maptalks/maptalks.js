import MeshShader from './MeshShader.js';
import Mesh from '../Mesh.js';
import Geometry from '../Geometry.js';
import vert from './glsl/quad.vert';

const quadVertices = new Int8Array([
    // positions
    -1.0,  1.0,
    -1.0, -1.0,
    1.0,  1.0,
    1.0,  1.0,
    -1.0, -1.0,
    1.0, -1.0,
]);
const quadTexcoords = new Uint8Array([
    0.0, 1.0,
    0.0, 0.0,
    1.0, 1.0,
    1.0, 1.0,
    0.0, 0.0,
    1.0, 0.0,
]);

class QuadShader extends MeshShader {
    constructor(config) {
        config.vert = config.vert || vert;
        config.extraCommandProps = config.extraCommandProps || {};
        if (!config.extraCommandProps.depth) {
            //disable depth
            config.extraCommandProps.depth = {
                enable: false,
                mask: false
            };
        }
        if (!config.extraCommandProps.stencil) {
            //disable stencil
            config.extraCommandProps.stencil = {
                enable: false
            };
        }
        super(config);
    }

    draw(regl) {
        if (!this._quadMesh) {
            this._createQuadMesh(regl);
        }
        return super.draw(regl, this._quadMesh);
    }

    getMeshCommand(regl) {
        const keys = this.dkey || '';
        if (!this.commands[keys + '_quad']) {
            this.commands[keys + '_quad'] = this.createMeshCommand(
                regl,
                null,
                this._quadMesh[0].getElements()
            );
        }
        return this.commands[keys + '_quad'];
    }

    _createQuadMesh(regl) {
        const geometry = new Geometry(
            {
                aPosition : quadVertices,
                aTexCoord : quadTexcoords
            },
            null,
            quadVertices.length / 2,
            {
                positionSize: 2,
                primitive : 'triangles'
            }
        );
        geometry.generateBuffers(regl);
        this._quadMesh = [new Mesh(geometry)];
    }

    dispose() {
        if (this._quadMesh) {
            const mesh = this._quadMesh[0];
            mesh.geometry.dispose();
            mesh.dispose();
        }
        delete this._quadMesh;
        return super.dispose();
    }
}

export default QuadShader;
