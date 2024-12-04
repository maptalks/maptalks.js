export default class VertexArrayObjectExt {
    constructor(context) {
        this.context = context;
        this['VERTEX_ARRAY_BINDING_OES'] = 0x85B5;
    }

    createVertexArrayOES() {
        return this.context.createVertexArray();
    }

    deleteVertexArrayOES() {
        return this.context.deleteVertexArray.apply(this.context, arguments);
    }

    isVertexArrayOES() {
        return this.context.isVertexArray.apply(this.context, arguments);
    }

    bindVertexArrayOES() {
        return this.context.bindVertexArray.apply(this.context, arguments);
    }
}
