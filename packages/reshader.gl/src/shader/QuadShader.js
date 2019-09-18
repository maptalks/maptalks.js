import MeshShader from './MeshShader.js';
import Mesh from '../Mesh.js';
import Geometry from '../Geometry.js';

const quadVertices = new Float32Array([
    // positions
    -1.0,  1.0, 0.0,
    -1.0, -1.0, 0.0,
    1.0,  1.0, 0.0,
    1.0,  1.0, 0.0,
    -1.0, -1.0, 0.0,
    1.0, -1.0, 0.0,
]);
const quadTexcoords = new Float32Array([
    0.0, 1.0,
    0.0, 0.0,
    1.0, 1.0,
    1.0, 1.0,
    0.0, 0.0,
    1.0, 0.0,
]);

class QuadShader extends MeshShader {
    draw(regl) {
        if (!this._quadMesh) {
            this._createQuadMesh(regl);
        }
        return super.draw(regl, this._quadMesh);
    }

    getMeshCommand(regl) {
        if (!this.commands['quad']) {
            this.commands['quad'] = this.createREGLCommand(
                regl,
                null,
                this._quadMesh[0].getAttributes(),
                null,
                this._quadMesh[0].getElements()
            );
        }
        return this.commands['quad'];
    }

    _createQuadMesh(regl) {
        const geometry = new Geometry(
            {
                aPosition : quadVertices,
                aTexCoord : quadTexcoords
            },
            null,
            quadVertices.length / 3,
            {
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
