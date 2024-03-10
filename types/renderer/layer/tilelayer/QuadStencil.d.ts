declare class QuadStencil {
    gl: any;
    quadVertices: any;
    attributes: any;
    debug: boolean;
    buffer: any;
    program: any;
    transformLoc: any;
    colorLoc: any;
    ref: any;
    _savedProgram: any;
    constructor(gl: any, vertices: any, debug: any);
    start(): void;
    end(): void;
    draw(transform: any): void;
    remove(): this;
    stencilMask(mask: any): this;
    stencilFunc(func: any, ref: any, mask: any): this;
    stencilOp(fail: any, zfail: any, zpass: any): this;
    resetFunc(): this;
    _save(): void;
    _restore(): void;
    _createBuffer(): void;
    _createProgram(): void;
}
export default QuadStencil;
