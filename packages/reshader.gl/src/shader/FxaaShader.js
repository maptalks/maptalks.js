import QuadShader from './QuadShader.js';
import vert from './glsl/fxaa.vert';
import frag from './glsl/fxaa.frag';

class FxaaShader extends QuadShader {
    constructor() {
        super({
            vert, frag,
            uniforms : ['textureSource', 'resolution']
        });
    }

    getMeshCommand(regl, mesh) {
        if (!this.commands['fxaa']) {
            this.commands['fxaa'] = this.createREGLCommand(
                regl,
                null,
                mesh.getAttributes(),
                null,
                mesh.getElements()
            );
        }
        return this.commands['fxaa'];
    }
}

export default FxaaShader;
