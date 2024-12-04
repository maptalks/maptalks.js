import GLContext from "../GLContext";
import { include } from "../Utils";
import MockExtensions from "../extensions/Mocks";

include(GLContext.prototype, {
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/compressedTexImage2D
     */
    compressedTexImage2D(
        target,
        level,
        internalformat,
        width,
        height,
        border,
        pixels
    ) {
        this._checkAndRestore();
        return this._gl.compressedTexImage2D(
            target,
            level,
            internalformat,
            width,
            height,
            border,
            pixels
        );
    },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/copyTexImage2D
     */
    copyTexImage2D(target, level, internalformat, x, y, width, height, border) {
        this._checkAndRestore();
        return this._gl.copyTexImage2D(
            target,
            level,
            internalformat,
            x,
            y,
            width,
            height,
            border
        );
    },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/copyTexSubImage2D
     */
    copyTexSubImage2D(target, level, xoffset, yoffset, x, y, width, height) {
        this._checkAndRestore();
        return this._gl.copyTexSubImage2D(
            target,
            level,
            xoffset,
            yoffset,
            x,
            y,
            width,
            height
        );
    },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/createTexture
     */
    createTexture() {
        return this._gl.createTexture();
    },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/deleteTexture
     */
    deleteTexture(texture) {
        const units = this.states.textures.units;
        for (let i = 0; i < units.length; i++) {
            for (const p in units[i]) {
                if (units[i][p] === texture) {
                    units[i][p] = null;
                }
            }
        }
        return this._gl.deleteTexture(texture);
    },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/generateMipmap
     */
    generateMipmap(target) {
        this._checkAndRestore();
        return this._gl.generateMipmap(target);
    },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getTexParameter
     */
    getTexParameter(target, pname) {
        this._checkAndRestore();
        return this._gl.getTexParameter(target, pname);
    },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/isTexture
     */
    isTexture(texture) {
        return this._gl.isTexture(texture);
    },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D
     */
    texImage2D(...args) {
        this._checkAndRestore();
        // if (args[0] === this._gl.TEXTURE_2D && !this._gl.getParameter(this._gl.TEXTURE_BINDING_2D) ||
        //     args[0] === this._gl.TEXTURE_CUBE_MAP && !this._gl.getParameter(this._gl.TEXTURE_BINDING_CUBE_MAP)) {
        //     debugger
        // }
        if (this._is2) {
            //webgl2的texImage2D，存在type不在倒数第二位的情况
            const argType = args[args.length - 2];
            const internalformat = MockExtensions.getInternalFormat(
                this._gl,
                args[2],
                argType
            );
            if (internalformat !== args[2]) {
                args[2] = internalformat;
            }
            const type = MockExtensions.getTextureType(this._gl, argType);
            if (type !== argType) {
                args[args.length - 2] = type;
            }
        }

        return this._gl.texImage2D(...args);
    },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texSubImage2D
     */
    texSubImage2D(...args) {
        this._checkAndRestore();
        if (this._is2) {
            //webgl2的texImage2D，存在type不在倒数第二位的情况
            const argType = args[args.length - 2];
            const type = MockExtensions.getTextureType(this._gl, argType);
            if (type !== argType) {
                args[args.length - 2] = type;
            }
        }
        return this._gl.texSubImage2D(...args);
    },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texParameter
     */
    texParameterf(target, pname, param) {
        this._checkAndRestore();
        return this._gl.texParameterf(target, pname, param);
    },
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texParameter
     */
    texParameteri(target, pname, param) {
        this._checkAndRestore();
        return this._gl.texParameteri(target, pname, param);
    },

    /**
     *https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/texStorage2D
     */
    texStorage2D(target, levels, internalformat, width, height) {
        this._checkAndRestore();
        return this._gl.texStorage2D(
            target,
            levels,
            internalformat,
            width,
            height
        );
    },

    /**
     *https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/texImage3D
     */
    texImage3D(
        target,
        level,
        internalformat,
        width,
        height,
        depth,
        border,
        format,
        type,
        offset
    ) {
        this._checkAndRestore();
        return this._gl.texImage3D(
            target,
            level,
            internalformat,
            width,
            height,
            depth,
            border,
            format,
            type,
            offset
        );
    },

    /**
     *https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/texStorage3D
     */
    texStorage3D(target, levels, internalformat, width, height, depth) {
        this._checkAndRestore();
        return this._gl.texStorage3D(
            target,
            levels,
            internalformat,
            width,
            height,
            depth
        );
    },

    texSubImage3D(
        target,
        level,
        xoffset,
        yoffset,
        zoffset,
        width,
        height,
        depth,
        format,
        type,
        pixels
    ) {
        this._checkAndRestore();
        return this._gl.texSubImage3D(
            target,
            level,
            xoffset,
            yoffset,
            zoffset,
            width,
            height,
            depth,
            format,
            type,
            pixels
        );
    },

    copyTexSubImage3D(
        target,
        level,
        xoffset,
        yoffset,
        zoffset,
        x,
        y,
        width,
        height
    ) {
        this._checkAndRestore();
        return this._gl.copyTexSubImage3D(
            target,
            level,
            xoffset,
            yoffset,
            zoffset,
            x,
            y,
            width,
            height
        );
    },

    compressedTexSubImage3D(
        target,
        level,
        xoffset,
        yoffset,
        zoffset,
        width,
        height,
        depth,
        format,
        imageSize,
        offset
    ) {
        this._checkAndRestore();
        return this._gl.compressedTexSubImage3D(
            target,
            level,
            xoffset,
            yoffset,
            zoffset,
            width,
            height,
            depth,
            format,
            imageSize,
            offset
        );
    },
});
