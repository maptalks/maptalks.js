/**
 * A mixin providing image support in WebGL env
 * @mixin ImageGLRenderable
 * @protected
 */
type Constructor = new (...args: any[]) => {};
declare function ImageGLRenderable<TBase extends Constructor>(Base: TBase): {
    new (...args: any[]): {
        gl: any;
        program: any;
        canvas: any;
        layer: any;
        canvas2: any;
        _textures: Array<any>;
        _imageBuffers: Array<any>;
        _debugBuffer: any;
        _buffers: any;
        _debugInfoCanvas: any;
        /**
         * Draw an image at x, y at map's gl zoom
         * @param {Image|Canvas} image
         * @param {Number} x - x at map's gl zoom
         * @param {Number} y - y at map's gl zoom
         * @param {Number} w - width at map's gl zoom
         * @param {Number} h - height at map's gl zoom
         * @param {Number} opacity
         */
        drawGLImage(image: any, x: any, y: any, w: any, h: any, scale: any, opacity: any, debug?: any, baseColor?: any): void;
        drawDebug(uMatrix: any, x: any, y: any, w: any, h: any, debugInfo: any): void;
        bufferTileData(x: any, y: any, w: any, h: any, buffer?: any): any;
        /**
         * Draw the tile image as tins
         * @param {HtmlElement} image
         * @param {Array} vertices  - tin vertices
         * @param {Array} texCoords - texture coords
         * @param {Array} indices   - element indexes
         * @param {number} opacity
         */
        drawTinImage(image: any, vertices: any, texCoords: any, indices: any, opacity: any): void;
        /**
         * Create another GL canvas to draw gl images
         * For layer renderer that needs 2 seperate canvases for 2d and gl
         */
        createCanvas2(): void;
        /**
         * Get webgl context(this.gl). It prefers canvas2, and will change to this.canvas if canvas2 is not created
         */
        createGLContext(): void;
        /**
         * Resize GL canvas with renderer's 2D canvas
         */
        resizeGLCanvas(): void;
        /**
         * Clear gl canvas
         */
        clearGLCanvas(): void;
        disposeImage(image: any): void;
        _createTexture(image: any): any;
        /**
         * Get a texture from cache or create one if cache is empty
         * @returns {WebGLTexture}
         */
        getTexture(): any;
        /**
         * Save a texture to the cache
         * @param {WebGLTexture} texture
         */
        saveTexture(texture: any): void;
        /**
         * Load image into a text and bind it with WebGLContext
         * @param {Image|Canvas} image
         * @returns {WebGLTexture}
         */
        loadTexture(image: any): any;
        /**
         * Get a texture from cache or create one if cache is empty
         * @returns {WebGLTexture}
         */
        getImageBuffer(): any;
        /**
         * Save a texture to the cache
         * @param {WebGLTexture} texture
         */
        saveImageBuffer(buffer: any): void;
        /**
         * Load image into a text and bind it with WebGLContext
         * @returns {WebGLTexture}
         */
        loadImageBuffer(data: any, glBuffer: any): any;
        createImageBuffer(): any;
        /**
         * remove all the resources and remove gl canvas
         */
        removeGLCanvas(): void;
        /**
         * Create a WebGL buffer
         * @returns {WebGLBuffer}
         */
        createBuffer(): any;
        /**
         * Enable vertex attributes
         * @param {Array} attributes [[name, stride, type], [name, stride, type]...]
         * @example
         * rendererr.enableVertexAttrib([
         *  ['a_position', 3, 'FLOAT'],
         *  ['a_normal', 3, 'FLOAT']
         * ]);
         */
        enableVertexAttrib(attributes: any): void;
        /**
         * Create the linked program object
         * @param {String} vert a vertex shader program (string)
         * @param {String} frag a fragment shader program (string)
         * @return {WebGLProgram} created program object, or null if the creation has failed
         */
        createProgram(vert: any, frag: any): any;
        /**
         * use the given program
         * @param {WebGLProgram} program
         */
        useProgram(program: any): any;
        /**
         * Enable a sampler, and set texture
         * @param {WebGLSampler} sampler
         * @param {ptr} texture id
         */
        enableSampler(sampler: any, texIdx: any): any;
        _initUniforms(program: any, uniforms: any): void;
        _getUniform(program: any, uniformName: any): any;
    };
} & TBase;
export default ImageGLRenderable;
