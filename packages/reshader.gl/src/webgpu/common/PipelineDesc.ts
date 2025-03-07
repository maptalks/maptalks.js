import { isFunction, isNil } from "../../common/Util";
import GraphicsFramebuffer from "../GraphicsFramebuffer";
import { toGPUCompareFunction, toTopology, toGPUBlendFactor } from "./ReglTranslator";

// Pipeline states we cared
export default class PipelineDescriptor {
    depthBias?: number;
    depthBiasSlopeScale?: number;
    depthCompare?: GPUCompareFunction;
    depthWriteEnabled?: boolean;

    stencilFrontCompare?: GPUCompareFunction;
    stencilFrontPassOp?: GPUStencilOperation;

    blendAlphaSrc?: GPUBlendFactor;
    blendAlphaDst?: GPUBlendFactor;
    blendColorSrc?: GPUBlendFactor;
    blendColorDst?: GPUBlendFactor;

    cullMode?: GPUCullMode;
    frontFace?: GPUFrontFace;
    topology?: GPUPrimitiveTopology;

    readFromREGLCommand(commandProps: any, mesh, uniformValues, fbo: GraphicsFramebuffer) {
        if (!commandProps) {
            commandProps = {};
        }
        const material = mesh.getMaterial();
        let doubleSided = false;
        if (material) {
            doubleSided = material.doubleSided;
        }
        const primitive = mesh.geometry.desc.primitive;
        this.topology = toTopology(primitive);

        const depthEnabled = !fbo || !!fbo.depthTexture;
        const stencilEnabled = !fbo || fbo.depthTexture.gpuFormat.isDepthStencil;

        let depthBias, depthBiasSlopeScale;
        if (depthEnabled && commandProps.polygonOffset && isEnable(commandProps.polygonOffset.enable, uniformValues)) {
            depthBias = 0;
            depthBiasSlopeScale = 0;
            const offsetProps = commandProps.polygonOffset.offset;
            if (offsetProps && !isNil(offsetProps.units)) {
                depthBias = isFunction(offsetProps.units) && offsetProps.units(null, uniformValues) || offsetProps.units;
            }
            if (offsetProps && !isNil(offsetProps.factor)) {
                depthBiasSlopeScale = isFunction(offsetProps.factor) && offsetProps.factor(null, uniformValues) || offsetProps.factor;
            }
        }
        this.depthBias = depthBias;
        this.depthBiasSlopeScale = depthBiasSlopeScale;

        let depthCompare: GPUCompareFunction = 'always';
        let depthWriteEnable = false;
        const depthProps = commandProps.depth;
        if (depthEnabled && depthProps && isEnable(depthProps.enable, uniformValues)) {
            depthCompare = 'less';
            if (depthProps.func) {
                const depthFunc = isFunction(depthProps.func) && depthProps.func(null, uniformValues) || depthProps.func;
                depthCompare = toGPUCompareFunction(depthFunc);
            }

            depthWriteEnable = true;
            if (!isNil(depthProps.mask)) {
                const maskFunc = isFunction(depthProps.mask) && depthProps.mask(null, uniformValues) || depthProps.mask;
                depthWriteEnable = !!maskFunc;
            }

            //TODO where is depth range?
        }
        this.depthCompare = depthCompare;
        this.depthWriteEnabled = depthWriteEnable;

        let stencilFrontCompare, stencilFrontPassOp;
        const stencilProps = commandProps.stencil;
        if (stencilEnabled && stencilProps && isEnable(stencilProps.enable, uniformValues)) {
            if (stencilProps.op) {
                // 目前还没遇到op是函数的情况，所以可以直接读取
                stencilFrontPassOp = stencilProps.op.zpass;
            }

            if (stencilProps.func) {
                const stencilFunc = isFunction(stencilProps.func) && stencilProps.func(null, uniformValues) || stencilProps.func;
                stencilFrontCompare = toGPUCompareFunction(stencilFunc);
            }
        }
        this.stencilFrontCompare = stencilFrontCompare;
        this.stencilFrontPassOp = stencilFrontPassOp;

        let blendAlphaSrc, blendAlphaDst;
        let blendColorSrc, blendColorDst;
        const blendProps = commandProps.blend;
        if (blendProps && isEnable(blendProps.enable, uniformValues)) {
            if (blendProps.func) {
                if (blendProps.src) {
                    const blendSrc = isFunction(blendProps.src) && blendProps.src(null, uniformValues) || blendProps.src;
                    blendAlphaSrc = toGPUBlendFactor(blendSrc);
                    blendColorSrc = blendAlphaSrc;
                }
                if (blendProps.dst) {
                    const blendDst = isFunction(blendProps.dst) && blendProps.dst(null, uniformValues) || blendProps.dst;
                    blendAlphaDst = toGPUBlendFactor(blendDst);
                    blendColorDst = blendAlphaDst;
                }
                if (blendProps.srcAlpha) {
                    const blendSrcAlpha = isFunction(blendProps.srcAlpha) && blendProps.srcAlpha(null, uniformValues) || blendProps.srcAlpha;
                    blendAlphaSrc = toGPUBlendFactor(blendSrcAlpha);
                }
                if (blendProps.srcRGB) {
                    const blendSrcRGB = isFunction(blendProps.srcRGB) && blendProps.srcRGB(null, uniformValues) || blendProps.srcRGB;
                    blendColorSrc = toGPUBlendFactor(blendSrcRGB);
                }
                if (blendProps.dstAlpha) {
                    const blendDstAlpha = isFunction(blendProps.dstAlpha) && blendProps.dstAlpha(null, uniformValues) || blendProps.dstAlpha;
                    blendAlphaDst = toGPUBlendFactor(blendDstAlpha);
                }
                if (blendProps.dstRGB) {
                    const blendDstRGB = isFunction(blendProps.dstRGB) && blendProps.dstRGB(null, uniformValues) || blendProps.dstRGB;
                    blendColorDst = toGPUBlendFactor(blendDstRGB);
                }
            }
        }
        this.blendAlphaDst = blendAlphaDst;
        this.blendAlphaSrc = blendAlphaSrc;
        this.blendColorDst = blendColorDst;
        this.blendColorSrc = blendColorSrc;

        let cullMode: GPUCullMode = 'none';
        if (!doubleSided) {
            const cullProps = commandProps.cull;
            if (cullProps && isEnable(cullProps.enable, uniformValues)) {
                cullMode = 'back';
                if (cullProps.face) {
                    cullMode = isFunction(cullProps.face) && cullProps.face(null, uniformValues) || cullProps.face;
                }
            }
        }
        this.cullMode = cullMode;

        // frontFace不存在函数的情况，所以可以直接读取
        this.frontFace = commandProps.frontFace;

        //TODO mesh中buffer的组织方式也需要考虑进来
    }

    getSignatureKey() {
        return (this.depthBias || 0) + '-' + (this.depthBiasSlopeScale || 0) + '-' + (this.depthCompare || 0) + '-' + (this.depthWriteEnabled || 0) +
            (this.stencilFrontCompare || 0) + '-' + (this.stencilFrontPassOp || 0) +
            (this.blendAlphaSrc || 0) + '-' + (this.blendAlphaDst || 0) + '-' + (this.blendColorSrc || 0) + '-' + (this.blendColorDst || 0) +
            (this.cullMode || 0) + '-' + (this.frontFace || 0) + '-' + (this.topology || 0);
    }
}

function isEnable(enable, props) {
    if (!isFunction(enable)) {
        return !!enable;
    }
    enable = enable(null, props);
    return !!enable;
}
