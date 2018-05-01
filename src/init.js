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
             */
            Enable: function () {
                actuator.debug = true;
            },
            /**
             * disable debug logger
             */
            Disable: function () {
                actuator.debug = false;
            },
            /**
             * executed commands
             */
            GetLogger: function(){
                return actuator.logger;
            }
        },
    }
}