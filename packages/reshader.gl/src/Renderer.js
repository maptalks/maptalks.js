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

        shader.setUniforms(uniforms || {});
        shader.setFramebuffer(framebuffer);
        if (scene) {
            const { opaques, transparents } = scene.getSortedMeshes();
            shader.draw(this.regl, opaques);
            shader.draw(this.regl, transparents);
        } else {
            shader.draw(this.regl);
        }
        return this;
    }

    clear(options) {
        this.regl.clear(options);
    }
}

export default Renderer;
