const GLCanvas = require('./gl/GLCanvas');
const actuator = require('./core/Actuator');

module.exports = {
    gl: {
        /**
         * virtual HtmlCanvasElement
         */
        GLCanvas: GLCanvas,
        /**
         * debug settings
         */
        Debug: {
            /**
             * enable debug logger
             * @param {WebGLRenderingContext} gl
             */
            Enable: function (gl) {
                const actuator = gl.actuator;
                actuator.debug = true;
            },
            /**
             * disable debug logger
             * @param {WebGLRenderingContext} gl
             */
            Disable: function (gl) {
                const actuator = gl.actuator;
                actuator.debug = false;
            },
            /**
             * executed commands
             * @param {WebGLRenderingContext} gl
             */
            GetLogger: function(gl){
                const actuator = gl.actuator;
                return actuator.logger;
            }
        },
    }
}