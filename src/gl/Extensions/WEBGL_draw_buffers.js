/**
 * mock the drawbuffers(for deferred rendering)
 * @author yellow date 2018/4/2
 */
const GLConstants = require('./../GLConstants'),
    Extension = require('./Extension');
/**
 * https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_draw_buffers
 * @class
 */
class WEBGL_draw_buffers extends Extension{
    /**
     * @param {String} extName 
     * @param {GLContext} glContext 
     */
    constructor(extName,glContext){
        super(extName,glContext);
        //texture attachment(color attachement
        this.COLOR_ATTACHMENT0_WEBGL = GLConstants.COLOR_ATTACHMENT0;
        this.COLOR_ATTACHMENT1_WEBGL = GLConstants.COLOR_ATTACHMENT1;
        this.COLOR_ATTACHMENT2_WEBGL = GLConstants.COLOR_ATTACHMENT2;
        this.COLOR_ATTACHMENT3_WEBGL = GLConstants.COLOR_ATTACHMENT3;
        this.COLOR_ATTACHMENT4_WEBGL = GLConstants.COLOR_ATTACHMENT4;
        this.COLOR_ATTACHMENT5_WEBGL = GLConstants.COLOR_ATTACHMENT5;
        this.COLOR_ATTACHMENT6_WEBGL = GLConstants.COLOR_ATTACHMENT6;
        this.COLOR_ATTACHMENT7_WEBGL = GLConstants.COLOR_ATTACHMENT7;
        this.COLOR_ATTACHMENT8_WEBGL = GLConstants.COLOR_ATTACHMENT8;
        this.COLOR_ATTACHMENT9_WEBGL = GLConstants.COLOR_ATTACHMENT9;
        this.COLOR_ATTACHMENT10_WEBGL = GLConstants.COLOR_ATTACHMENT10;
        this.COLOR_ATTACHMENT11_WEBGL = GLConstants.COLOR_ATTACHMENT11;
        this.COLOR_ATTACHMENT12_WEBGL = GLConstants.COLOR_ATTACHMENT12;
        this.COLOR_ATTACHMENT13_WEBGL = GLConstants.COLOR_ATTACHMENT13;
        this.COLOR_ATTACHMENT14_WEBGL = GLConstants.COLOR_ATTACHMENT14;
        this.COLOR_ATTACHMENT15_WEBGL = GLConstants.COLOR_ATTACHMENT15;
        //buffer attachment
        this.DRAW_BUFFER0_WEBGL = GLConstants.DRAW_BUFFER0;
        this.DRAW_BUFFER1_WEBGL = GLConstants.DRAW_BUFFER1;
        this.DRAW_BUFFER2_WEBGL = GLConstants.DRAW_BUFFER2;
        this.DRAW_BUFFER3_WEBGL = GLConstants.DRAW_BUFFER3;
        this.DRAW_BUFFER4_WEBGL = GLConstants.DRAW_BUFFER4;
        this.DRAW_BUFFER5_WEBGL = GLConstants.DRAW_BUFFER5;
        this.DRAW_BUFFER6_WEBGL = GLConstants.DRAW_BUFFER6;
        this.DRAW_BUFFER7_WEBGL = GLConstants.DRAW_BUFFER7;
        this.DRAW_BUFFER8_WEBGL = GLConstants.DRAW_BUFFER8;
        this.DRAW_BUFFER9_WEBGL = GLConstants.DRAW_BUFFER9;
        this.DRAW_BUFFER10_WEBGL = GLConstants.DRAW_BUFFER10;
        this.DRAW_BUFFER11_WEBGL = GLConstants.DRAW_BUFFER11;
        this.DRAW_BUFFER12_WEBGL = GLConstants.DRAW_BUFFER12;
        this.DRAW_BUFFER13_WEBGL = GLConstants.DRAW_BUFFER13;
        this.DRAW_BUFFER14_WEBGL = GLConstants.DRAW_BUFFER14;
        this.DRAW_BUFFER15_WEBGL = GLConstants.DRAW_BUFFER15;
    }
}

module.exports = WEBGL_draw_buffers;