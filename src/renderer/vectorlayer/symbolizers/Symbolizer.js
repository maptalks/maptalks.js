/**
 * @namespace
 */
Z.symbolizer = {};
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
Z.Symbolizer = Z.Class.extend(/** @lends maptalks.Symbolizer.prototype */{
    getMap:function() {
        return this.geometry.getMap();
    }
});

/**
 * Symbol properties related with coloring
 * @static
 * @memeberOf maptalks.Symbolizer
 * @name  colorProperties
 */
Z.Symbolizer.colorProperties = [
        "lineColor", "polygonFill", "markerFill", "markerLineColor", "textFill", "shieldFill", "shieldHaloFill"
    ];

/**
 * Test if the property is a property related with coloring
 * @static
 * @memeberOf maptalks.Symbolizer
 * @name  colorProperties
 * @return {Boolean}
 */
Z.Symbolizer.testColor = function(prop) {
    if (!prop || !Z.Util.isString(prop)) {return false;}
    if (Z.Util.searchInArray(prop, colorProperties) >= 0) {
        return true;
    }
    return false;
}
