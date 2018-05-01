/**
 * reference:
 * https://github.com/greggman/oes-vertex-array-object-polyfill/blob/master/OESVertexArrayObject-polyfill.js
 * https://github.com/KhronosGroup/WebGL/blob/master/sdk/demos/google/resources/OESVertexArrayObject.js
 * 
 */
const Extension = require('./Extension'),
    GLConstants = require('./../GLConstants'),
    GLVertexAttrib = require('./../GLVertexAttrib'),
    GLLimits = require('./../GLLimits');
/**
 * vao object
 * @class
 */
class WebGLVertexArrayObjectOES {

    constructor(ext) {
        this.isAlive = true;
        this.hasBeenBound = false;
        this._ext = ext;
        this._maxVertexAttribs = GLLimits.getInstance()[GLConstants.MAX_VERTEX_ATTRIBS];
        this.elementArrayBuffer = null;
        this.attribs = new Array(this._maxVertexAttribs);
        this._initVertexAttrib();
        this.maxAttrib = 0;
    }

    _initVertexAttrib() {
        const attribs = this.attribs;
        for (let n = 0, len = attribs.length; n < len; n++) {
            attribs[n] = new GLVertexAttrib();
        }
    }

}
/**
 * @class
 */
class OES_vertex_array_object extends Extension {
    /**
     * 
     * @param {String} extName 
     * @param {GLContext} glContext 
     */
    constructor(extName, glContext) {
        /**
         * 
         */
        super(extName, glContext);
        /**
         * self object
         */
        const self = this;
        /**
         * @type {number}
         */
        this.VERTEX_ARRAY_BINDING_OES = GLConstants.VERTEX_ARRAY_BINDING_OES;
        /**
         * @type {object}
         */
        this.original = {
            getParameter: this._glContext.getParameter,
            enableVertexAttribArray: this._glContext.enableVertexAttribArray,
            disableVertexAttribArray: this._glContext.disableVertexAttribArray,
            bindBuffer: this._glContext.bindBuffer,
            getVertexAttrib: this._glContext.getVertexAttrib,
            vertexAttribPointer: this._glContext.vertexAttribPointer
        };
        /**
         * overwrite
         */
        this._glContext.getParameter = function (pName) {
            if (pName === GLConstants.VERTEX_ARRAY_BINDING_OES) {
                if (self.currentVertexArrayObject == self.defaultVertexArrayObject) {
                    return null;
                } else {
                    return self.currentVertexArrayObject;
                }
            }
            return self.original.getParameter.apply(this, arguments);
        };
        /**
         * 
         */
        this._glContext.enableVertexAttribArray = function (index) {
            var vao = self.currentVertexArrayObject;
            vao.maxAttrib = Math.max(vao.maxAttrib, index);
            var attrib = vao.attribs[index];
            attrib.enabled = true;
            return self.original.enableVertexAttribArray.apply(this, arguments);
        }
        /**
         * 
         * @param {*} index 
         */
        this._glContext.disableVertexAttribArray = function disableVertexAttribArray(index) {
            var vao = self.currentVertexArrayObject;
            vao.maxAttrib = Math.max(vao.maxAttrib, index);
            var attrib = vao.attribs[index];
            attrib.enabled = false;
            return self.original.disableVertexAttribArray.apply(this, arguments);
        };
        /**
         * @param
         */
        this._glContext.bindBuffer = function bindBuffer(target, buffer) {
            switch (target) {
                case GLConstants.ARRAY_BUFFER:
                    self.currentArrayBuffer = buffer;
                    break;
                case GLConstants.ELEMENT_ARRAY_BUFFER:
                    self.currentVertexArrayObject.elementArrayBuffer = buffer;
                    break;
            }
            return self.original.bindBuffer.apply(this, arguments);
        };
        /**
         * 
         * @param {*} index 
         * @param {*} pname 
         */
        this._glContext.getVertexAttrib = function getVertexAttrib(index, pname) {
            var vao = self.currentVertexArrayObject;
            var attrib = vao.attribs[index];
            switch (pname) {
                case GLConstants.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING:
                    return attrib.buffer;
                case GLConstants.VERTEX_ATTRIB_ARRAY_ENABLED:
                    return attrib.enabled;
                case GLConstants.VERTEX_ATTRIB_ARRAY_SIZE:
                    return attrib.size;
                case GLConstants.VERTEX_ATTRIB_ARRAY_STRIDE:
                    return attrib.stride;
                case GLConstants.VERTEX_ATTRIB_ARRAY_TYPE:
                    return attrib.type;
                case GLConstants.VERTEX_ATTRIB_ARRAY_NORMALIZED:
                    return attrib.normalized;
                default:
                    return self.original.getVertexAttrib.apply(this, arguments);
            }
        };
        /**
         * 
         * @param {*} indx 
         * @param {*} size 
         * @param {*} type 
         * @param {*} normalized 
         * @param {*} stride 
         * @param {*} offset 
         */
        this._glContext.vertexAttribPointer = function vertexAttribPointer(indx, size, type, normalized, stride, offset) {
            var vao = self.currentVertexArrayObject;
            vao.maxAttrib = Math.max(vao.maxAttrib, indx);
            var attrib = vao.attribs[indx];
            attrib.buffer = self.currentArrayBuffer;
            attrib.size = size;
            attrib.type = type;
            attrib.normalized = normalized;
            attrib.stride = stride;
            attrib.offset = offset;
            attrib.recache();
            return self.original.vertexAttribPointer.apply(this, arguments);
        };
        /**
         * 
         */
        if (this._glContext.instrumentExtension) {
            gl.instrumentExtension(this, "OES_vertex_array_object");
        }
        /**
         * reset all default vertex array object
         */
        this._reset();
    }
    /**
     * reset
     * -vertexArrayObjects
     * -defaultVertexArrayObject
     * -currentVertexArrayObject
     */
    _reset() {
        /**
         * @type {WebGLVertexArrayObjectOES}
         */
        this.defaultVertexArrayObject = new WebGLVertexArrayObjectOES(this);
        /**
         * @type {Array}
         */
        this.vertexArrayObjects = [this.defaultVertexArrayObject];
        /**
         * @type {WebGLVertexArrayObjectOES}
         */
        this.currentVertexArrayObject;
    }
    /**
     * create WebGLVertexArrayObjectOES
     */
    createVertexArrayOES() {
        const arrayObject = new WebGLVertexArrayObjectOES(this);
        this.vertexArrayObjects.push(arrayObject);
        return arrayObject;
    }
    /**
     * delete WebGLVertexArrayObjectOES
     * @param {WebGLVertexArrayObjectOES} arrayObject 
     */
    deleteVertexArrayOES(arrayObject) {
        arrayObject.isAlive = false;
        const idx = this.vertexArrayObjects.indexOf(arrayObject);
        this.vertexArrayObjects.splice(idx, 1);
        this.currentVertexArrayObject == arrayObject ? this.bindVertexArrayOES(null) : null;
    }
    /**
     * infer object
     * @param {WebGLVertexArrayObjectOES} arrayObject 
     */
    isVertexArrayOES(arrayObject) {
        if (arrayObject && arrayObject instanceof WebGLVertexArrayObjectOES)
            if (arrayObject.hasBeenBound && arrayObject._ext == this)
                return true;
        return false;
    }
    /**
     * 
     * @param {WebGLVertexArrayObjectOES} arrayObject 
     */
    bindVertexArrayOES(arrayObject) {
        var gl = this._glContext;
        if (arrayObject && !arrayObject.isAlive) {
            synthesizeGLError(gl.INVALID_OPERATION, "bindVertexArrayOES: attempt to bind deleted arrayObject");
            return;
        }
        var original = this.original;
        var oldVAO = this.currentVertexArrayObject;
        this.currentVertexArrayObject = arrayObject || this.defaultVertexArrayObject;
        this.currentVertexArrayObject.hasBeenBound = true;
        var newVAO = this.currentVertexArrayObject;
        if (oldVAO == newVAO) {
            return;
        }
        if (!oldVAO || newVAO.elementArrayBuffer != oldVAO.elementArrayBuffer) {
            original.bindBuffer.call(gl, gl.ELEMENT_ARRAY_BUFFER, newVAO.elementArrayBuffer);
        }
        var currentBinding = this.currentArrayBuffer;
        var maxAttrib = Math.max(oldVAO ? oldVAO.maxAttrib : 0, newVAO.maxAttrib);
        for (var n = 0; n <= maxAttrib; n++) {
            var attrib = newVAO.attribs[n];
            var oldAttrib = oldVAO ? oldVAO.attribs[n] : null;
            if (!oldVAO || attrib.enabled != oldAttrib.enabled) {
                if (attrib.enabled) {
                    original.enableVertexAttribArray.call(gl, n);
                } else {
                    original.disableVertexAttribArray.call(gl, n);
                }
            }
            if (attrib.enabled) {
                var bufferChanged = false;
                if (!oldVAO || attrib.buffer != oldAttrib.buffer) {
                    if (currentBinding != attrib.buffer) {
                        original.bindBuffer.call(gl, gl.ARRAY_BUFFER, attrib.buffer);
                        currentBinding = attrib.buffer;
                    }
                    bufferChanged = true;
                }

                if (bufferChanged || attrib.cached != oldAttrib.cached) {
                    original.vertexAttribPointer.call(gl, n, attrib.size, attrib.type, attrib.normalized, attrib.stride, attrib.offset);
                }
            }
        }
        if (this.currentArrayBuffer != currentBinding) {
            original.bindBuffer.call(gl, gl.ARRAY_BUFFER, this.currentArrayBuffer);
        }
    }
}

module.exports = OES_vertex_array_object;