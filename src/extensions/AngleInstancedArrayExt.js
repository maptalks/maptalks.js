export default class AngleInstancedArrayExt {
    constructor(context) {
        this.context = context;
        this['VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE'] = 0x88FE;
    }

    drawArraysInstancedANGLE() {
        return this.context.drawArraysInstanced.apply(this.context, arguments);
    }
    drawElementsInstancedANGLE() {
        return this.context.drawElementsInstanced.apply(this.context, arguments);
    }
    vertexAttribDivisorANGLE() {
        return this.context.vertexAttribDivisor.apply(this.context, arguments);
    }
}
