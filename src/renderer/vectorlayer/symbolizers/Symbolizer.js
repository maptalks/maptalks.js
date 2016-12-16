/**
 * @namespace
 * @protected
 */
maptalks.symbolizer = {};
/**
 * @classdesc
 * Base class for all the symbolilzers, a symbolizers contains the following methods:
 * refresh: 刷新逻辑, 例如地图放大缩小时需要刷新像素坐标时
 * svg:     在svg/vml上的绘制逻辑
 * canvas:  在canvas上的绘制逻辑
 * show:    显示
 * hide:    隐藏
 * setZIndex:设置ZIndex
 * remove:  删除逻辑
 * test: 定义在类上, 测试传入的geometry和symbol是否应由该Symbolizer渲染
 * @class
 * @extends maptalks.Class
 * @abstract
 * @protected
 */
maptalks.Symbolizer = maptalks.Class.extend(/** @lends maptalks.Symbolizer.prototype */{
    getMap:function () {
        return this.geometry.getMap();
    },

    getPainter: function () {
        return this.painter;
    }
});


maptalks.Symbolizer.resourceProperties = [
    'markerFile', 'polygonPatternFile', 'linePatternFile', 'markerFillPatternFile', 'markerLinePatternFile'
];

maptalks.Symbolizer.resourceSizeProperties = [
    ['markerWidth', 'markerHeight'], [], [null, 'lineWidth'], [], [null, 'markerLineWidth']
];

maptalks.Symbolizer.numberProperties = {
    'lineWidth'     : 1,
    'lineOpacity'   : 1,
    'polygonOpacity' : 1,
    'markerWidth'   : 1,
    'markerHeight'   : 1,
    'markerDx'   : 1,
    'markerDy'   : 1,
    'markerOpacity'   : 1,
    'markerFillOpacity'   : 1,
    'markerLineWidth' : 1,
    'markerLineOpacity'   : 1,
    'textSize'   : 1,
    'textOpacity'   : 1,
    'textHaloRadius'   : 1,
    'textWrapWidth'   : 1,
    'textLineSpacing'   : 1,
    'textDx'   : 1,
    'textDy'   : 1
};

/**
 * @property {String[]} colorProperties - Symbol properties related with coloring
 * @static
 * @constant
 */
maptalks.Symbolizer.colorProperties = [
    'lineColor', 'polygonFill', 'markerFill', 'markerLineColor', 'textFill'
];

maptalks.Symbolizer.DEFAULT_STROKE_COLOR = '#000';
maptalks.Symbolizer.DEFAULT_FILL_COLOR = 'rgba(255,255,255,0)';
maptalks.Symbolizer.DEFAULT_TEXT_COLOR = '#000';

/**
 * Test if the property is a property related with coloring
 * @param {String} prop - property name to test
 * @static
 * @function
 * @return {Boolean}
 */
maptalks.Symbolizer.testColor = function (prop) {
    if (!prop || !maptalks.Util.isString(prop)) { return false; }
    if (maptalks.Util.indexOfArray(prop, maptalks.Symbolizer.colorProperties) >= 0) {
        return true;
    }
    return false;
};
