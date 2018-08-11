import { reshader, mat4 } from '@maptalks/gl';

export default class StencilShadowPass {
    constructor(sceneConfig, renderer) {
        this.renderer = renderer;
        this.sceneConfig = sceneConfig;
        this._init();
    }

    _init() {
        this.debugShader = new reshader.MeshShader({
            vert : `
                attribute vec4 aPosition;
                uniform mat4 projectionViewModel;

                void main() {
                    gl_Position = projectionViewModel * aPosition;
                }
            `,
            frag : `
                void main() {
                    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
                }
            `,
            uniforms : [
                {
                    name : 'projectionViewModel',
                    type : 'function',
                    fn : function (context, props) {
                        const projectionViewModel = [];
                        mat4.multiply(projectionViewModel, props['view'], props['model']);
                        mat4.multiply(projectionViewModel, props['projection'], projectionViewModel);
                        return projectionViewModel;
                    }
                }
            ]
        });
    }

    createShadowVolume(data) {

        const shadow = new reshader.Geometry({
            aPosition : data.vertices
        }, data.indices);
        shadow.generateBuffers(this.renderer.regl);

        return [new reshader.Mesh(shadow)];
    }

    getUniforms(numOfDirLights) {
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
            return { fbo : null };
        }
        // console.log(scene.getMeshes());
        this.renderer.render(this.debugShader, uniforms, scene);
        return { fbo : null };
    }

    pass2() {}

    remove() {}
}
