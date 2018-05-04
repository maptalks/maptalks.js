/**
 * A basic renderer to render meshes in fashion of forward rendering
 */
class Renderer {
    constructor(regl) {
        this.regl = regl;
    }

    render(shader, contextUniforms, scene, framebuffer) {
        //rendering of large number of lights can be accelarated by clip-space quadtree
        //https://stackoverflow.com/questions/30594511/webgl-fragment-shader-for-multiple-light-sources

        for (const p in contextUniforms) {
            shader.contextUniform(p, contextUniforms[p]);
        }
        if (framebuffer) {
            shader.setFramebuffer(framebuffer);
        }
        if (scene) {
            const { opaques, transparents } = scene.getMeshes();
            shader.draw(this.regl, opaques);
            shader.draw(this.regl, transparents);
        } else {
            shader.draw(this.regl);
        }
        return this;
    }

    clear() {
        this.regl.clear();
    }
}

export default Renderer;
