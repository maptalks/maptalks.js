/**
 * @author yellow date 2018/2/11
 */
const kiwi = require('kiwi.gl'),
  Model = require('./components/model/Model'),
  PerspectiveCamera = require('./components/camera/PerspectiveCamera');

module.exports = {
  /**
   * WebGL namespace
   */
  gl: {
    PerspectiveCamera:PerspectiveCamera,
    Model:Model,

    HtmlMock: kiwi.gl.HtmlMock,
    GLCanvas: kiwi.gl.GLCanvas
  }
}