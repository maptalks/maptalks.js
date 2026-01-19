import { isNil } from '../common/Util';
import GraphicsDevice from './GraphicsDevice';
import GraphicsTexture from './GraphicsTexture';

export default class GraphicsFramebuffer {
    device: GraphicsDevice;
    options: any;
    //@internal
    colorTexture: GraphicsTexture;
    //@internal
    depthTexture: GraphicsTexture;
    //@internal
    _renderPass: GPURenderPassDescriptor;
    width: number;
    height: number;
    //@internal
    colorLoadOp: GPULoadOp;
    //@internal
    colorClearValue: number[];
    //@internal
    depthLoadOp: GPULoadOp;
    //@internal
    depthClearValue: number;
    //@internal
    stencilLoadOp: GPULoadOp;
    //@internal
    stencilClearValue: number;
    //@internal
    _ownColor: boolean;
    //@internal
    _ownDepthTexture: boolean;
    //@internal
    _cmdKey: string;
    //@internal
    _destroyed: boolean;

    constructor(device, options) {
        this.device = device;
        this.options = options;
        this._update();
    }

    get color() {
        return [this.colorTexture];
    }

    resize(width, height) {
        if (this.colorTexture && width === this.colorTexture.width && height === this.colorTexture.height) {
            return;
        }
        this.options.width = width;
        this.options.height = height;
        this.width = width;
        this.height = height;
        if (this.colorTexture) {
            this.colorTexture.resize(width, height);
        }
        if (this.depthTexture) {
            this.depthTexture.resize(width, height);
        }
        if (this._renderPass) {
            const colorAttachment = this._renderPass.colorAttachments[0];
            if (colorAttachment && colorAttachment.view && this.colorTexture) {
                colorAttachment.view = this.colorTexture.getView();
            }
            const depthAttchment = this._renderPass.depthStencilAttachment;
            if (depthAttchment && depthAttchment.view && this.depthTexture) {
                depthAttchment.view = this.depthTexture.getView();
            }
        }
    }

    getCommandKey() {
        if (this._cmdKey) {
            return this._cmdKey;
        }
        const colorTexture = this.colorTexture;
        const depthTexture = this.depthTexture;
        let key = '';
        if (colorTexture) {
            key += `${colorTexture.gpuFormat.format}-${colorTexture.config.sampleCount};`;
        }
        if (depthTexture) {
            key += `${depthTexture.gpuFormat.format};`;
        }
        this._cmdKey = key;
        return key;
    }

    _update() {
        let color = this.options.colors && this.options.colors[0] || this.options.color;
        const colorFormat = this.options.colorFormat;
        const colorType = this.options.colorType;
        let width, height;
        if (color) {
            width = color.width;
            height = color.height;
        } else if (colorFormat || colorType) {
            color = true;
        }
        if (!isNil(this.options.width)) {
            width = this.options.width;
        }
        if (!isNil(this.options.height)) {
            height = this.options.height;
        }
        this.width = width;
        this.height = height;
        if (color && !(color instanceof GraphicsTexture)) {
            if (color === true) {
                color = {
                    width,
                    height
                };
            }
            if (!color.width) {
                color.width = width;
            }
            if (!color.height) {
                color.height = height;
            }
            if (!color.format) {
                color.format = colorFormat || 'rgba';
            }
            if (!color.type) {
                color.type = colorType || 'uint8';
            }
            this._ownColor = true;
            color = new GraphicsTexture(this.device, color);
        }
        let depth = this.options.depth;
        if (depth) {
            if (depth === true) {
                this._ownDepthTexture = true;
                depth = new GraphicsTexture(this.device, { width, height, format: 'depth' });
            } else {
                if (!(depth instanceof GraphicsTexture)) {
                    this._ownDepthTexture = true;
                    depth = new GraphicsTexture(this.device, depth);
                }
            }
        }
        // we assume depth and depthStencil won't be used at the same time
        const depthStencil = this.options.depthStencil;
        if (depthStencil) {
            if (depthStencil === true) {
                this._ownDepthTexture = true;
                depth = new GraphicsTexture(this.device, { width, height, format: 'depth stencil' });
            } else {
                if (depthStencil instanceof GraphicsTexture) {
                    depth = depthStencil;
                } else {
                    this._ownDepthTexture = true;
                    depth = new GraphicsTexture(this.device, depthStencil);
                }
            }
        }

        this.colorTexture = color;
        this.depthTexture = depth;
        this._renderPass = {
            colorAttachments: []
        };
        if (color !== null) {
            this._renderPass.colorAttachments[0] = {
                view: this.colorTexture && this.colorTexture.getView(), // Assigned later
                clearValue: [0, 0, 0, 0],
                loadOp: 'load',
                storeOp: 'store',
            };
        }
        if (depth) {
            const depthAttchment = this._renderPass.depthStencilAttachment = {
                view: this.depthTexture.getView(),
                depthClearValue: 1,
                depthLoadOp: 'load',
                depthStoreOp: 'store'
            } as GPURenderPassDepthStencilAttachment;
            if (depth.gpuFormat.isDepthStencil) {
                depthAttchment.stencilReadOnly = false;
                depthAttchment.stencilClearValue = 0;
                depthAttchment.stencilLoadOp = 'load';
                depthAttchment.stencilStoreOp = 'store';
            }
        }
    }

    getRenderPassDescriptor() {
        const colorAttachment = this._renderPass.colorAttachments[0];
        const depthStencilAttachment = this._renderPass.depthStencilAttachment;
        let width, height;
        if (!this.colorTexture) {
            // a default texture view
            const colorTexture = this.device.context.getCurrentTexture();
            width = colorTexture.width;
            height = colorTexture.height;
            colorAttachment.view = colorTexture.createView();
            colorAttachment.view.label = 'default canvas view';
        }
        if (colorAttachment) {
            colorAttachment.loadOp = this.colorLoadOp || 'load';
            colorAttachment.clearValue = this.colorClearValue || [0, 0, 0, 0];
        }
        if (depthStencilAttachment) {
            depthStencilAttachment.depthLoadOp = this.depthLoadOp || 'load';
            depthStencilAttachment.depthClearValue = this.depthClearValue || 1;
            const depthTexture = this.depthTexture;
            if (depthTexture && depthTexture.gpuFormat.isDepthStencil) {
                depthStencilAttachment.stencilLoadOp = this.stencilLoadOp || 'load';
                depthStencilAttachment.stencilClearValue = this.stencilClearValue || 0;
            }
            if (depthTexture && width && height && (depthTexture.width !== width || depthTexture.height !== height)) {
                // depth texture size may be not consistent with canvas
                depthTexture.resize(width, height);
                depthStencilAttachment.view = depthTexture.getView();
            }
        }
        this.resetClearOptions();
        return this._renderPass;
    }

    setClearOptions(options) {
        if (options.color) {
            this.colorLoadOp = 'clear';
            this.colorClearValue = options.color;
        }
        if (options.depth) {
            this.depthLoadOp = 'clear';
            this.depthClearValue = options.depth;
        }
        if (options.stencil) {
            this.stencilLoadOp = 'clear';
            this.stencilClearValue = options.stencil;
        }
    }

    resetClearOptions() {
        this.colorLoadOp = null;
        this.colorClearValue = null;
        this.depthLoadOp = null;
        this.depthClearValue = null;
        this.stencilLoadOp = null;
        this.stencilClearValue = null;
    }

    destroy() {
        if (this._ownColor && this.colorTexture) {
            this.colorTexture.destroy();
            delete this.colorTexture;
        }
        if (this._ownDepthTexture && this.depthTexture) {
            this.depthTexture.destroy();
            delete this.depthTexture;
            delete this._ownDepthTexture;
        }
        this._destroyed = true;
    }

    isDestroyed() {
        return !!this._destroyed;
    }
}
