const EMPTY_UNIFORMS = {};
/**
 * A basic renderer to render meshes in fashion of forward rendering
 */
class Renderer {
    constructor(regl) {
        this.regl = regl;
    }

    render(shader, uniforms, scene, framebuffer) {
        //rendering of large number of lights can be accelarated by clip-space quadtree
        //https://stackoverflow.com/questions/30594511/webgl-fragment-shader-for-multiple-light-sources

        shader.setUniforms(uniforms || EMPTY_UNIFORMS);
        shader.setFramebuffer(framebuffer);
        let count = 0;
        if (scene) {
            const { opaques, transparents } = scene.getSortedMeshes();
            count += shader.draw(this.regl, opaques);
            count += shader.draw(this.regl, transparents);
        } else {
            count += shader.draw(this.regl);
        }
        return count;
    }

    clear(options) {
        this.regl.clear(options);
    }
}

export default Renderer;
