import GraphicsDevice from './GraphicsDevice';
import GraphicsTexture from './GraphicsTexture';

export default class GraphicsFramebuffer {
    device: GraphicsDevice;
    options: any;
    //@internal
    colorTexture: GPUTexture;
    //@internal
    depthTexture: GPUTexture;
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

    _update() {
        let color = this.options.color || this.options.colors && this.options.colors[0];
        const { width, height } = this.options;
        this.width = width;
        this.height = height;
        if (!color) {
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

        const depthStencil = this.options.depthStencil;
        if (depthStencil === true) {
            depth = new GraphicsTexture(this.device, { width, height, format: 'depth stencil' });
        } else {
            if (depthStencil instanceof GraphicsTexture) {
                depth = depthStencil;
            } else {
                depth = new GraphicsTexture(this.device, depthStencil);
            }
        }
        this.colorTexture = color === 'undefined' ? null : color;
        this.depthTexture = depth;
        this._renderPass = {
            colorAttachments: [
                {
                    view: this.colorTexture && this.colorTexture.createView(), // Assigned later
                    clearValue: [0, 0, 0, 0],
                    loadOp: 'load',
                    storeOp: 'store',
                },
            ],
            depthStencilAttachment: {
                view: this.depthTexture.createView(),
                depthClearValue: 1.0,
                depthLoadOp: 'load',
                depthStoreOp: 'store',
                stencilReadOnly: false,
                stencilClearValue: 255,
                stencilLoadOp: 'load',
                stencilStoreOp: 'store',
            },
        };
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
            depthStencilAttachment.stencilLoadOp = this.stencilLoadOp || 'load';
            depthStencilAttachment.stencilClearValue = this.stencilClearValue || 0;
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
