/**
 * @class
 */
class Extension {
    /**
     * @param {String} extName 
     * @param {GLContext} glContext 
     */
    constructor(extName, glContext) {
        /**
         * @type {String}
         */
        this._name = extName;
        /**
         * @type {GLContext}
         */
        this._glContext = glContext;
    }
    /**
     * 
     * @param {WebGLRenderingContext} gl 
     */
    useExtension(gl) {
        const extName = this._name;
        const _ext = this._getExtension(gl, extName);
        return _ext;
    }
    /**
     * 
     * @param {WebGLRenderingContext} gl 
     * @param {String} extNames 
     */
    _getExtension(gl, ...extNames) {
        const names = [].concat(...extNames);
        for (let i = 0, len = names.length; i < len; ++i) {
            const extension = gl.getExtension(names[i]);
            if (extension)
                return extension;
        }
        return null;
    }

}

module.exports = Extension;