/**
 * @author yellow 2017/5/15
 */
const Event = require('./../utils/Event'),
    merge = require('./../utils/merge'),
    RenderManager = require('./RenderManager'),
    RenderNode = require('./RenderNode');

const defaultOptions = {
    width: 800,
    height: 600,
    renderType: 'webgl',
    roundPixels: false
};
/**
 * container 
 * used to transform accordance
 * @class
 */
class Container extends Event {
    /**
     * 
     * @param {Object} [options] the settings of container 
     * @param {number} [options.width] the html canvas width
     * @param {number} [options.height] the html canvas height
     * @param {String} [options.renderType='webgl'] the renderType,support 'webgl' only currently
     * @param {HTMLCanvasElement} [options.view] the html canvas to use as a view,usually created by container self.
     * @param {boolean} [options.roundPixels] use Math.floor(x/y) values when rendering if true
     */
    constructor(options) {
        super();
        options = merge(defaultOptions, options || {});
        /**
         * container's width
         * @memberof Container
         * @member {number}
         */
        this._width = options.width;
        /**
         * container's height
         * @memberof Container
         * @member {number}
         */
        this._height = options.height;
        /**
         * readerManager
         * @memberof Container
         * @type {RenderManager}
         * @readOnly
        */
        this._renderManager = new RenderManager(options);
        /**
         * add event pop to renderManager
         */
        this.addEventPopNode(this._renderManager);
    }
    /**
     * 获取绘制上下文（逻辑）
     * @return {Context}
     */
    get context() {
        const renderManager = this._renderManager;
        return renderManager.context;
    }
    /**
     * set container's height
     */
    set width(value) {
        this._width = value;
        this.fire(_FUSION_EVENT_RESIZE, { width: value }, true);
    }
    /**
     * set container's width
     */
    set height(value) {
        this._height = value;
        this.fire(_FUSION_EVENT_RESIZE, { height: value }, true);
    }
    /**
     * get cantainer's width
     */
    get width() {
        return this._width;
    }
    /**
     * get cantainer's height
     */
    get height() {
        return this._height;
    }
    /**
     * 
     */
    get camera() {

    }
    /**
     * RenderNode对象不能直接创建
     * 1.通过 Container.createRenderNode
     * 2.通过 load 方法创建
     */
    crateRenderNode() {
        const gl = this.context.gl,
            renderManager = this._renderManager;
        let renderNode = new RenderNode(gl);
        renderManager.addRenderNode(renderNode);
        return renderNode;
    }
}

module.exports = Container;