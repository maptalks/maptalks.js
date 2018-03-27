/**
 * @author yellow date 2018/2/11
 */
const kiwi = require('kiwi.gl'),
  Model = require('./components/model/Model'),
  Skybox = require('./components/model/Skybox'),
  PointLight = require('./components/light/PointLight'),
  Renderer = require('./core/Renderer'),
  PerspectiveCamera = require('./components/camera/PerspectiveCamera');

module.exports = {
  gl: {
    //webgl
    PerspectiveCamera: PerspectiveCamera,
    Model: Model,
    PointLight: PointLight,
    Renderer: Renderer,
    Skybox:Skybox,
    //container
    HtmlMock: kiwi.gl.HtmlMock,
    GLCanvas: kiwi.gl.GLCanvas
  }
};


