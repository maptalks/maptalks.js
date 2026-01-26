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
    writeMask?: number;
    functionProps?: any[];

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
        const stencilEnabled = !fbo || fbo.depthTexture && fbo.depthTexture.gpuFormat.isDepthStencil;

        // 保存函数类型的command prop，用于在getShaderCommandKey中检查缓存的command key是否失效
        this.functionProps = [];

        let depthBias, depthBiasSlopeScale;
        // depthBias
        if (depthEnabled && commandProps.polygonOffset && isEnable(commandProps.polygonOffset.enable, uniformValues)) {
            if (!this.topology.startsWith('triangle')) {
                // depthBias for line and point primitive must be 0
                // https://github.com/gpuweb/gpuweb/issues/4729
                depthBias = 0;
                depthBiasSlopeScale = 0;
            } else {
                const offsetProps = commandProps.polygonOffset.offset;
                if (isFunction(offsetProps)) {
                    const offset = offsetProps(null, uniformValues);
                    depthBias = offset.units;
                    depthBiasSlopeScale = offset.factor;
                    this.functionProps.push({ func: (_, props) => { return offsetProps(null, props).units; }, v: depthBias });
                    this.functionProps.push({ func: (_, props) => { return offsetProps(null, props).factor; }, v: depthBiasSlopeScale });
                } else {
                    if (offsetProps && !isNil(offsetProps.units)) {
                        if (isFunction(offsetProps.units)) {
                            depthBias = offsetProps.units(null, uniformValues);
                            this.functionProps.push({ func: offsetProps.units, v: depthBias });
                        } else {
                            depthBias = offsetProps.units;
                        }
                    }
                    if (offsetProps && !isNil(offsetProps.factor)) {
                        if (isFunction(offsetProps.factor)) {
                            depthBiasSlopeScale = offsetProps.factor(null, uniformValues);
                            this.functionProps.push({ func: offsetProps.factor, v: depthBiasSlopeScale });
                        } else {
                            depthBiasSlopeScale = offsetProps.factor;
                        }
                    }
                }

            }
        }
        this.depthBias = depthBias;
        this.depthBiasSlopeScale = depthBiasSlopeScale;

        let depthCompare: GPUCompareFunction = 'less';
        let depthWriteEnable = true;
        const depthProps = commandProps.depth;
        if (depthEnabled && depthProps && isEnable(depthProps.enable, uniformValues)) {
            if (depthProps.func) {
                let depthFunc = depthProps.func;
                if (isFunction(depthProps.func)) {
                    depthFunc = depthFunc(null, uniformValues);
                    this.functionProps.push({ func: depthProps.func, v: depthFunc });
                }
                depthCompare = toGPUCompareFunction(depthFunc);
            }

            depthWriteEnable = true;
            if (!isNil(depthProps.mask)) {
                if (isFunction(depthProps.mask)) {
                    depthWriteEnable = depthProps.mask(null, uniformValues);
                    this.functionProps.push({ func: depthProps.mask, v: depthWriteEnable });
                } else {
                    depthWriteEnable = !!depthProps.mask;
                }
            }
            //TODO where is depth range?
        }
        this.depthCompare = depthCompare;
        this.depthWriteEnabled = depthWriteEnable;

        let stencilFrontCompare: GPUCompareFunction = 'always';
        let stencilFrontPassOp: GPUStencilOperation = 'keep';
        const stencilProps = commandProps.stencil;
        if (stencilEnabled && stencilProps && isEnable(stencilProps.enable, uniformValues)) {
            if (stencilProps.op) {
                // 目前还没遇到op是函数的情况，所以可以直接读取
                stencilFrontPassOp = stencilProps.op.zpass;
                if (isFunction(stencilFrontPassOp)) {
                    const stencilFrontPassOpFn = stencilFrontPassOp as any;
                    stencilFrontPassOp = stencilFrontPassOpFn(null, uniformValues);
                    this.functionProps.push({ func: stencilProps.op.zpass, v: stencilFrontPassOp });
                }
            }

            if (stencilProps.func) {
                let stencilCmp = stencilProps.func.cmp;
                if (!stencilCmp) {
                    stencilCmp = 'always';
                }
                let stencilFunc = stencilCmp;
                if (isFunction(stencilFunc)) {
                    stencilFunc = stencilCmp(null, uniformValues);
                    this.functionProps.push({ func: stencilCmp, v: stencilFunc });
                }
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
                const blendFunc = blendProps.func;
                if (blendFunc.src) {
                    let blendSrc = blendFunc.src;
                    if (isFunction(blendFunc.src)) {
                        blendSrc = blendFunc.src(null, uniformValues);
                        this.functionProps.push({ func: blendFunc.src, v: blendSrc });
                    }
                    blendAlphaSrc = toGPUBlendFactor(blendSrc);
                    blendColorSrc = blendAlphaSrc;
                }
                if (blendFunc.dst) {
                    let blendDst = blendFunc.dst;
                    if (isFunction(blendFunc.dst)) {
                        blendDst = blendFunc.dst(null, uniformValues);
                        this.functionProps.push({ func: blendFunc.dst, v: blendDst });
                    }
                    blendAlphaDst = toGPUBlendFactor(blendDst);
                    blendColorDst = blendAlphaDst;
                }
                if (blendFunc.srcAlpha) {
                    let blendSrcAlpha = blendFunc.srcAlpha;
                    if (isFunction(blendFunc.srcAlpha)) {
                        blendSrcAlpha = blendFunc.srcAlpha(null, uniformValues) ||
                        this.functionProps.push({ func: blendFunc.srcAlpha, v: blendSrcAlpha });
                    }
                    blendAlphaSrc = toGPUBlendFactor(blendSrcAlpha);
                }
                if (blendFunc.srcRGB) {
                    let blendSrcRGB = blendFunc.srcRGB;
                    if (isFunction(blendFunc.srcRGB)) {
                        blendSrcRGB = blendFunc.srcRGB(null, uniformValues) ||
                        this.functionProps.push({ func: blendFunc.srcRGB, v: blendSrcRGB });
                    }
                    blendColorSrc = toGPUBlendFactor(blendSrcRGB);
                }
                if (blendFunc.dstAlpha) {
                    let blendDstAlpha = blendFunc.dstAlpha;
                    if (isFunction(blendFunc.dstAlpha)) {
                        blendDstAlpha = blendFunc.dstAlpha(null, uniformValues) ||
                        this.functionProps.push({ func: blendFunc.dstAlpha, v: blendDstAlpha });
                    }
                    blendAlphaDst = toGPUBlendFactor(blendDstAlpha);
                }
                if (blendFunc.dstRGB) {
                    let blendDstRGB = blendFunc.dstRGB;
                    if (isFunction(blendFunc.dstRGB)) {
                        blendDstRGB = blendFunc.dstRGB(null, uniformValues) ||
                        this.functionProps.push({ func: blendFunc.dstRGB, v: blendDstRGB });
                    }
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
                    cullMode = cullProps.face;
                    if (isFunction(cullProps.face)) {
                        cullMode = cullProps.face(null, uniformValues) ||
                        this.functionProps.push({ func: cullProps.face, v: cullMode });
                    }
                }
            }
        }
        this.cullMode = cullMode;

        // frontFace不存在函数的情况，所以可以直接读取
        this.frontFace = commandProps.frontFace;

        let colorMask = commandProps.colorMask;
        if (colorMask) {
            if (isFunction(colorMask)) {
                colorMask = colorMask(null, uniformValues);
                this.functionProps.push({ func: commandProps.colorMask, v: colorMask });
            }
            let writeMask = 0;
            if (colorMask[0]) {
                writeMask |= GPUColorWrite.RED;
            }
            if (colorMask[1]) {
                writeMask |= GPUColorWrite.GREEN;
            }
            if (colorMask[2]) {
                writeMask |= GPUColorWrite.BLUE;
            }
            if (colorMask[3]) {
                writeMask |= GPUColorWrite.ALPHA;
            }
            this.writeMask = writeMask;
        }

        //TODO mesh中buffer的组织方式也需要考虑进来
    }

    generateValuesKey(values) {
        return values.map((v) => { return Array.isArray(v) ? v.join() : v; }).join('-');
    }

    getFnValuesKey() {
        return this.generateValuesKey(this.functionProps.map(item => item.v));
    }

    getSignatureKey() {
        return (this.depthBias || 0) + '-' + (this.depthBiasSlopeScale || 0) + '-' + (this.depthCompare || 0) + '-' + (this.depthWriteEnabled || 0) +
            (this.stencilFrontCompare || 0) + '-' + (this.stencilFrontPassOp || 0) +
            (this.blendAlphaSrc || 0) + '-' + (this.blendAlphaDst || 0) + '-' + (this.blendColorSrc || 0) + '-' + (this.blendColorDst || 0) +
            (this.cullMode || 0) + '-' + (this.frontFace || 0) + '-' + (this.topology || 0) + '-' + (this.writeMask || 0);
    }
}

export function isEnable(enable, props) {
    if (!isFunction(enable)) {
        return !!enable;
    }
    enable = enable(null, props);
    return !!enable;
}
