import { extend, isArray, isFunction } from "../common/Util";
import { GPUTexFormat, toTextureFormat } from "./common/ReglTranslator";
import GraphicsDevice from "./GraphicsDevice";

let arrayBuffer = new ArrayBuffer(1024 * 1024 * 4);
let flipYBuffer = new ArrayBuffer(1024 * 1024 * 4);

export default class GraphicsTexture {
    texture: GPUTexture;
    device: GraphicsDevice;
    config: any;
    //@internal
    gpuFormat: GPUTexFormat;
    version = 0;

    constructor(device: GraphicsDevice, config) {
        this.device = device;
        this.config = config;
        this.gpuFormat = toTextureFormat(config.format, config.type);
        this._updateTexture();
    }

    get width() {
        return this.texture && this.texture.width || this.config && this.config.width;
    }

    get height() {
        return this.texture && this.texture.height || this.config && this.config.height;
    }

    // called when minFilter or magFilter changed
    updateFilter() {
        if (this.texture) {
            this.version++;
        }
    }

    resize(width, height) {
        if (this.texture && this.texture.width === width && this.texture.height === height) {
            return;
        }
        this.config.width = width;
        this.config.height = height;
        this._updateTexture();
    }

    update(config) {
        extend(this.config, config);
        this.gpuFormat = toTextureFormat(this.config.format, this.config.type);
        this._updateTexture();
    }

    _updateTexture() {
        const config = this.config;
        const device = this.device.wgpu;
        if (this.texture) {
            this.version++;
            this.device.addToDestroyList(this.texture);
        }
        let texture: GPUTexture;
        {
            let width = isFunction(config.width) ? config.width() : config.width;
            let height = isFunction(config.height) ? config.height() : config.height;
            if (width === undefined || height === undefined) {
                const data = config.data;
                if (!data) {
                    width = height = 1;
                } else if (isArray(config.data)) {
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
                GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT;

            const options = {
                size: [width, height, 1],
                format,
                usage
            } as GPUTextureDescriptor;
            if (config.sampleCount) {
                options.sampleCount = config.sampleCount;
            }
            texture = device.createTexture(options);

            if (config.data) {
                if (isArray(config.data)) {
                    const data = config.data;
                    const isUint8 = !config.type || config.type === 'uint8';
                    let byteLength;
                    if (Array.isArray(data)) {
                        byteLength = isUint8 ? data.length : data.length * 4;
                    } else {
                        byteLength = data.byteLength;
                    }

                    const isRGBA = !config.format || config.format === 'rgba';
                    const isPremultipliedAlpha = isRGBA && config.premultiplyAlpha;

                    let dataToWrite;
                    if (isPremultipliedAlpha || Array.isArray(data)) {
                        if (arrayBuffer.byteLength < byteLength) {
                            arrayBuffer = new ArrayBuffer(byteLength);
                        }
                        if (isUint8) {
                            dataToWrite = new Uint8Array(arrayBuffer, 0, byteLength);
                        } else {
                            dataToWrite = new Float32Array(arrayBuffer, 0, byteLength / 4);
                        }
                    }

                    if (isPremultipliedAlpha) {
                        const ratio = isUint8 ? 255 : 1;
                        for (let i = 0; i < data.length; i += 4) {
                            const alpha = data[i + 3] / ratio;
                            dataToWrite[i] = data[i] * alpha;
                            dataToWrite[i + 1] = data[i + 1] * alpha;
                            dataToWrite[i + 2] = data[i + 2] * alpha;
                            dataToWrite[i + 3] = data[i + 3];
                        }
                    } else {
                        if (Array.isArray(data)) {
                            for (let i = 0; i < data.length; i++) {
                                dataToWrite[i] = data[i];
                            }
                        } else {
                            dataToWrite = data;
                        }
                    }
                    if (this.config.flipY) {
                        dataToWrite = flipY(dataToWrite, width, height, byteLength);
                    }
                    device.queue.writeTexture(
                        { texture: texture },
                        dataToWrite.buffer,
                        {
                            bytesPerRow: width * this.gpuFormat.bytesPerTexel
                        },
                        [width, height]
                    );
                } else {
                    device.queue.copyExternalImageToTexture(
                        { source: config.data, flipY: !!this.config.flipY },
                        { texture: texture, premultipliedAlpha: !!this.config.premultiplyAlpha },
                        [width, height]
                    );
                }

            }
        }
        this.texture = texture;
    }

    getView(descriptor?: GPUTextureViewDescriptor): GPUTextureView {
        return this.texture.createView(descriptor);
    }

    destroy() {
        if (this.texture) {
            this.texture.destroy();
            delete this.texture;
        }
    }
}

/**
 * 对Uint8Array图像数据进行垂直翻转
 * @param imageData - 原始图像数据
 * @param width - 图像宽度（像素）
 * @param height - 图像高度（像素）
 * @param bytesPerPixel - 每像素字节数（通常为3-RGB或4-RGBA）
 * @returns {Uint8Array} - 垂直翻转后的图像数据
 */
function flipY(imageData: Float32Array | Uint8Array, width: number, height: number, byteLength: number) {
    if (flipYBuffer.byteLength < arrayBuffer.byteLength) {
        flipYBuffer = new ArrayBuffer(arrayBuffer.byteLength);
    }
    const bytesPerPixel = imageData instanceof Float32Array ? 4 * 4 : 4;
    // 创建相同大小的新数组
    let flippedData;
    if (imageData instanceof Float32Array) {
        flippedData = new Float32Array(flipYBuffer, 0, byteLength / 4);
    } else {
        flippedData = new Uint8Array(flipYBuffer, 0, byteLength);
    }

    // 每行的字节数
    const rowBytes = width * bytesPerPixel;

    // 遍历每一行
    for (let y = 0; y < height; y++) {
        // 原始数据的行起始位置
        const originalRowStart = y * rowBytes;
        // 翻转后数据的行起始位置（从底部开始）
        const flippedRowStart = (height - 1 - y) * rowBytes;

        // 复制整行数据
        flippedData.set(
            imageData.subarray(originalRowStart, originalRowStart + rowBytes),
            flippedRowStart
        );
    }

    return flippedData;
}
