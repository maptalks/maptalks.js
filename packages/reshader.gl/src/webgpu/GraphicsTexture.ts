import { isArray } from "../common/Util";
import { GPUTexFormat, toTextureFormat } from "./common/ReglTranslator";
import GraphicsDevice from "./GraphicsDevice";

export default class GraphicsTexture {
    texture: GPUTexture;
    device: GraphicsDevice;
    config: any;
    //@internal
    _bindGroups: GPUBindGroup[] = [];
    //@internal
    gpuFormat: GPUTexFormat;

    constructor(device: GraphicsDevice, config) {
        this.device = device;
        this.config = config;
        this.gpuFormat = toTextureFormat(config.format, config.type);
        this.update(this.config);
    }

    update(config) {
        const device = this.device.wgpu;
        if (this.texture) {
            this.texture.destroy();
            if (this._bindGroups.length) {
                for (let i = 0; i < this._bindGroups.length; i++) {
                    (this._bindGroups[i] as any).outdated = true;
                }
                this._bindGroups = [];
            }
        }
        let texture: GPUTexture;
        {
            let width = config.width;
            let height = config.height;
            if (width === undefined || height === undefined) {
                const data = config.data;
                if (isArray(config.data)) {
                    const length = config.data.length;
                    width = Math.sqrt(length / 4);
                    height = width;
                } else {
                    width = data.width;
                    height = data.height;
                }
            }
            const format = this.gpuFormat.format;
            const isDepth = format === 'depth24plus' || format === 'depth24plus-stencil8';
            const usage = isDepth ?
                GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT
                :
                GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT;

            texture = device.createTexture({
                size: [width, height, 1],
                format,
                usage
            });
            if (config.data) {
                if (isArray(config.data)) {
                    let data =config.data;
                    if (Array.isArray(config.data)) {
                        data = new Float32Array(data);
                    }
                    device.queue.writeTexture(
                        { texture: texture },
                        data.buffer,
                        {},
                        [width, height]
                    );
                } else {
                    device.queue.copyExternalImageToTexture(
                        { source: config.data },
                        { texture: texture },
                        [width, height]
                    );
                }
            }
        }
        this.texture = texture;
    }

    getView() {
        return this.texture.createView();
    }

    addBindGroup(bindGroup) {
        this._bindGroups.push(bindGroup);
    }

    destroy() {
        if (this.texture) {
            this.texture.destroy();
            delete this.texture;
        }
        delete this._bindGroups;
    }
}
