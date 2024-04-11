class StencilHelper {
    constructor() {
        this._id = 1;
    }

    write(quadStencil, transform) {
        const gl = quadStencil.gl;
        const id = this._id++;
        quadStencil.stencilFunc(gl.ALWAYS, id, 0xFF);
        quadStencil.draw(transform);
        return id;
    }

    start(quadStencil) {
        const gl = quadStencil.gl;
        gl.clearStencil(0xFF);
        gl.clear(gl.STENCIL_BUFFER_BIT);
        this._id = 1;
        quadStencil.start();
    }

    end(quadStencil) {
        quadStencil.end();
    }
}

export default StencilHelper;
