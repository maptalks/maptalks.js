/**
 * @author yellow date 2018/2/11
 */
const kiwi = require('kiwi.gl'),
  PerspectiveCamera = require('./camera/PerspectiveCamera');

module.exports = {
  /**
   * WebGL namespace
   */
  gl: {
    PerspectiveCamera:PerspectiveCamera,
    HtmlMock: kiwi.gl.HtmlMock,
    GLCanvas: kiwi.gl.GLCanvas
  }
}