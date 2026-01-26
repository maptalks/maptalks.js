import { extend, isArray, isFunction } from "../common/Util";
import { GPUTexFormat, toTextureFormat } from "./common/ReglTranslator";
import GraphicsDevice from "./GraphicsDevice";

const arrayBuffer = new ArrayBuffer(1024 * 1024 * 4);
const flipYBuffer = new ArrayBuffer(1024 * 1024 * 4);

export default class GraphicsTexture {
    texture: GPUTexture;
    device: GraphicsDevice;
    config: any;
    //@internal
    gpuFormat: GPUTexFormat;
    version = 0;
    //@internal
    dirty: boolean;

    constructor(device: GraphicsDevice, config) {
        this.device = device;
        this.config = config;
        this.gpuFormat = toTextureFormat(config.format, config.type);
        this.dirty = false;
        this._updateTexture();
    }

    get width() {
        return this.texture && this.texture.width || this.config && this.config.width;
    }

    get height() {
        return this.texture && this.texture.height || this.config && this.config.height;
    }

    get arrayLayers() {
        return 1;
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
        this.dirty = true;
        this.config.width = width;
        this.config.height = height;
        this._updateTexture();
    }

    update(config) {
        if (this.texture) {
            this.dirty = this._isDirty(config);
        }
        const { width, height } = this._getSize(config);
        extend(this.config, config);
        this.config.width = width;
        this.config.height = height;
        this.gpuFormat = toTextureFormat(this.config.format, this.config.type);
        this._updateTexture();
    }

    _updateTexture() {
        const config = this.config;
        const { width, height } = this._getSize(config);
        const device = this.device.wgpu;
        if (this.dirty) {
            this.version++;
            this.device.addToDestroyList(this.texture);
            this.texture = null;
            this.dirty = false;
        }
        let texture: GPUTexture = this.texture;
        {

            const format = this.gpuFormat.format;
            const isDepth = format === 'depth24plus' || format === 'depth24plus-stencil8';
            const usage = isDepth ?
                GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT
                :
                GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT;

            const options = {
                size: [width, height, this.arrayLayers],
                format,
                usage,
                mipLevelCount: this.getMipLevelCount()
            } as GPUTextureDescriptor;
            if (config.sampleCount) {
                options.sampleCount = config.sampleCount;
            }
            texture = texture || device.createTexture(options);

            this.fillData(texture, width, height);
        }
        this.texture = texture;
    }

    _isDirty(newConfig) {
        if (!this.texture) {
            return false;
        }
        const { width, height } = this._getSize(newConfig);
        if (width !== this.texture.width) {
            return true;
        }
        if (height !== this.texture.height) {
            return true;
        }
        if (newConfig.format && newConfig.format !== this.config.format) {
            return true;
        }
        if (newConfig.type && newConfig.type !== this.config.type) {
            return true;
        }
        if (this.getMipLevelCount(newConfig.data) !== this.getMipLevelCount()) {
            return true;
        }
        return false;
    }

    _getSize(config) {
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
                width = data.videoWidth || data.width;
                height = data.videoHeight || data.height;
            }
        }
        return { width, height };
    }

    getMipLevelCount(data?) {
        data = data || this.config.data;
        if (data && data.mipmap) {
            return data.mipmap.length;
        }
        return 1;
    }

    fillData(texture, width, height) {
        const config = this.config;
        const origin = [0, 0, 0];
        if (config.data) {
            if (this.isArrayData(config.data)) {
                this.fillArrayData(texture, config.data, width, height, origin);
            } else {
                this.fillImageData(texture, config.data, width, height, origin);
            }
        }
    }

    fillImageData(texture, data, width, height, origin) {
        const device = this.device.wgpu;
        const flipY = !!this.config.flipY;
        const premultipliedAlpha = !!this.config.premultiplyAlpha;
        if (data.mipmap) {
            const mipmap = data.mipmap;
            for (let i = 0; i < mipmap.length; i++) {
                device.queue.copyExternalImageToTexture(
                    { source: mipmap[i], flipY },
                    { texture, premultipliedAlpha, mipLevel: i, origin },
                    [Math.max(1, width >> i), Math.max(1, height >> i)]
                );
            }
        } else {
            device.queue.copyExternalImageToTexture(
                { source: data, flipY },
                { texture: texture, premultipliedAlpha, origin },
                [width, height]
            );
        }

    }

    fillArrayData(texture, data, width, height, origin) {
        if (data.mipmap) {
            for (let i = 0; i < data.mipmap.length; i++) {
                this._fillMipmap(texture, i, data.mipmap[i], Math.max(1, texture.width >> i), Math.max(1, texture.width >> i), origin);
            }
        } else {
            this._fillMipmap(texture, 0, data, width, height, origin);
        }

    }

    _fillMipmap(texture, mipLevel, data, width, height, origin) {
        const device = this.device.wgpu;
        const dataToWrite = this.formatTextureArray(data, arrayBuffer, width, height);
        device.queue.writeTexture(
            { texture, mipLevel, origin },
            dataToWrite,
            {
                bytesPerRow: width * this.gpuFormat.bytesPerTexel
            },
            [width, height]
        );
    }

    formatTextureArray(data, arrayBuffer, width, height) {
        const config = this.config;
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
                arrayBuffer.resize(byteLength);
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
        return dataToWrite;
    }

    isArrayData(data) {
        if (!data.mipmap && !isArray(data)) {
            return false;
        }
        if ((data as any).mipmap) {
            return isArray((data as any).mipmap[0]);
        }
        return true;
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
        (flipYBuffer as any).resize(arrayBuffer.byteLength);
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
