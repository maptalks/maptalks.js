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

    constructor(device, options) {
        this.device = device;
        this.options = options;
        this._update();
    }

    get color() {
        return [this.colorTexture];
    }

    resize(width, height) {
        //TODO implement GraphicsFramebuffer resize
    }

    _update() {
        let color = this.options.colors && this.options.colors[0] || this.options.color;
        let width, height;
        if (color) {
            width = color.width;
            height = color.height;
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
            color = new GraphicsTexture(this.device, color);
        }
        let depth = this.options.depth;
        if (depth) {
            if (depth === true) {
                depth = new GraphicsTexture(this.device, { width, height, format: 'depth' });
            } else {
                if (!(depth instanceof GraphicsTexture)) {
                    depth = new GraphicsTexture(this.device, depth);
                }
            }
        }
        // we assume depth and depthStencil won't be used at the same time
        const depthStencil = this.options.depthStencil;
        if (depthStencil) {
            if (depthStencil === true) {
                depth = new GraphicsTexture(this.device, { width, height, format: 'depth stencil' });
            } else {
                if (depthStencil instanceof GraphicsTexture) {
                    depth = depthStencil;
                } else {
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
        if (colorAttachment) {
            colorAttachment.loadOp = this.colorLoadOp || 'load';
            colorAttachment.clearValue = this.colorClearValue || [0, 0, 0, 0];
        }
        if (depthStencilAttachment) {
            depthStencilAttachment.depthLoadOp = this.depthLoadOp || 'load';
            depthStencilAttachment.depthClearValue = this.depthClearValue || 1;
            if (this.depthTexture.gpuFormat.isDepthStencil) {
                depthStencilAttachment.stencilLoadOp = this.stencilLoadOp || 'load';
                depthStencilAttachment.stencilClearValue = this.stencilClearValue || 0;
            }

        }
        this._resetClearOptions();
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

    _resetClearOptions() {
        this.colorLoadOp = null;
        this.colorClearValue = null;
        this.depthLoadOp = null;
        this.depthClearValue = null;
        this.stencilLoadOp = null;
        this.stencilClearValue = null;
    }

    destroy() {
        if (this.colorTexture) {
            this.colorTexture.destroy();
            delete this.colorTexture;
        }
        if (this.depthTexture) {
            this.depthTexture.destroy();
            delete this.depthTexture;
        }
    }
}
