import { reshader, mat4 } from '@maptalks/gl';

export default class StencilShadowPass {
    constructor(sceneConfig, renderer) {
        this.renderer = renderer;
        this.sceneConfig = sceneConfig;
        this._init();
    }

    _init() {
        this.debugShader = new reshader.MeshShader({
            vert: `
                attribute vec4 aPosition;
                uniform mat4 projViewModelMatrix;

                void main() {
                    gl_Position = projViewModelMatrix * aPosition;
                }
            `,
            frag: `
                void main() {
                    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
                }
            `,
            uniforms: [
                {
                    name: 'projViewModelMatrix',
                    type: 'function',
                    fn: function (context, props) {
                        const projViewModelMatrix = [];
                        mat4.multiply(projViewModelMatrix, props['viewMatrix'], props['modelMatrix']);
                        mat4.multiply(projViewModelMatrix, props['projMatrix'], projViewModelMatrix);
                        return projViewModelMatrix;
                    }
                }
            ]
        });
    }

    createShadowVolume(data) {

        const shadow = new reshader.Geometry({
            aPosition: data.vertices
        }, data.indices);
        shadow.generateBuffers(this.renderer.device);

        return [new reshader.Mesh(shadow)];
    }

    getUniforms(/* numOfDirLights */) {
        return [];
    }

    getDefines() {
        return {};
    }

    pass1({
        scene,
        uniforms
    }) {
        if (!scene.meshes.length) {
            return { fbo: null };
        }
        // console.log(scene.getMeshes());
        this.renderer.render(this.debugShader, uniforms, scene);
        return { fbo: null };
    }

    pass2() {}

    delete() {}
}
