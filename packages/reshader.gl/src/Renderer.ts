import REGL, { Uniforms } from "@maptalks/regl";
import Scene from "./Scene";
import GraphicsDevice from "./webgpu/GraphicsDevice";

const EMPTY_UNIFORMS = {};
/**
 * A basic renderer to render meshes in fashion of forward rendering
 */
class Renderer {
    device: any

    constructor(device: any) {
        if (device.device) {
            this.device = new GraphicsDevice(device.device, device.context);
        } else {
            this.device = device;
        }
    }

    render(shader, uniforms: Uniforms, scene: Scene, framebuffer: REGL.Framebuffer) {
        //rendering of large number of lights can be accelarated by clip-space quadtree
        //https://stackoverflow.com/questions/30594511/webgl-fragment-shader-for-multiple-light-sources

        shader.setUniforms(uniforms || EMPTY_UNIFORMS);
        shader.setFramebuffer(framebuffer);
        let count = 0;
        if (scene) {
            const { opaques, transparents } = scene.getSortedMeshes();
            count += shader.draw(this.device, uniforms, opaques);
            count += shader.draw(this.device, uniforms, transparents);
        } else {
            count += shader.draw(this.device, uniforms);
        }
        return count;
    }

    clear(options: REGL.ClearOptions) {
        this.device.clear(options);
    }
}

export default Renderer;
