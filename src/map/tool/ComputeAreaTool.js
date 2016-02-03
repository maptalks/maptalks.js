/**
 * 测面积鼠标工具类
 * @class maptalks.ComputeAreaTool
 * @extends maptalks.Class
 * @mixins maptalks.Eventable
 * @author Maptalks Team
 */
Z.ComputeAreaTool = Z.Class.extend({
    includes: [Z.Eventable],

    options:{

    },

    /**
     * 初始化测面积工具
     * @constructor
     * @param {Object} opts
     */
    initialize: function(options) {
        //TODO options应该设置到this.options中
        Z.Util.extend(this, options);
        return this;
    },

    /**
     * 将测量面积工具添加到map上
     * @param {maptalks.Map} map
     * @expose
     */
    addTo: function(map) {
        this.map = map;
        if (!this.map) {return;}
        if (!this.mode) {
            this.mode = Z.Geometry.TYPE_POLYGON;
        }
        this.layerId = Z.internalLayerPrefix+'computeareatool';
        this.drawLayer = null;
        this.drawTool = null;
        this.rings = [];
        this.enable();
        return this;
    },

    /**
     * 激活测面积鼠标工具
     * @expose
     */
    enable: function() {
        if (!this.map) {
            return;
        }
        this.drawLayer = this.map.getLayer(this.layerId);
        if (this.drawLayer !== null && this.drawTool !== null) {
            this.drawTool.enable();
            return;
        }
        if (this.drawLayer !== null) {
            this.map.removeLayer(this.layerId);
        }
        // var _canvas = this.map.canvasDom;

        this.drawLayer = new Z.VectorLayer(this.layerId);
        this.map.addLayer(this.drawLayer);

        var drawTool = new Z.DrawTool({
            'mode':Z.Geometry.TYPE_POLYGON,
            'symbol': {
                'strokeSymbol':{'stroke':'#ff0000', 'stroke-width':2, 'opacity':1},
                'fillSymbol':{'fill':'#ff0000', 'fill-opacity':0.2}
            },
            'disableOnDrawEnd': true
        }).addTo(this.map);

        drawTool.on('drawstart', Z.Util.bind(this._startMeasure, this));
        drawTool.on('drawvertex', Z.Util.bind(this._measureRing, this));
        drawTool.on('drawend', Z.Util.bind(this._afterMeasure, this));

        this.drawTool = drawTool;

        this.counter = 0;
        this.pointCounter = 0;
        this.tmpMarkers = [];
    },

    /**
     * 停止测面积鼠标工具
     * @expose
     */
    disable: function() {
        this.clear();
        if (this.drawTool !== null) {
            this.drawTool.disable();
        }
    },

    /**
     * 清除测量过程中产生的标注
     * @expose
     */
    clear:function(){
        if (!this.map) {
            return;
        }
        if (this.drawLayer !== null) {
            this.drawLayer.clear();
        }
        var _canvas = this.map.canvasDom;
        if (!_canvas) {
            this._changeCursor('default');
        }
        this.rings = [];
    },

    _measureRing: function (param) {
        var coordinate = param['coordinate'];
        this.pointCounter ++;
        var point = this._genMeasurePoint(coordinate,this.layerId + '_ringp_' + this.pointCounter + '_' + this.counter);
        this.drawLayer.addGeometry([point]);
        this.tmpMarkers.push(point);
    },

    _startMeasure: function(param) {
        var coordinate = param['coordinate'];
        var point = this._genMeasurePoint(coordinate,this.layerId + '_ringp_' + this.pointCounter +'_' + this.counter);
        this.drawLayer.addGeometry([point]);
        this.tmpMarkers.push(point);
    },

    _afterMeasure: function(param) {
        var coordinate = param['coordinate'];
        var polygon = param['geometry'];
        var area = this.map._computeGeodesicArea(polygon);
        var divContent = null;
        if (area > 1000000) {
            divContent = (area/1000000).toFixed(1)+'平方公里';
        } else {
            divContent = area.toFixed(1)+'平方米';
        }

        this._endMeasure(coordinate, divContent, polygon);
        this._changeCursor('default');
        this.counter++;
        /**
         * 面积量算结束事件
         * @event measureend
         * @param result: 总面积
         */
        this.fire('measureend', {'result' : area});
    },



    _outline: Z.DistanceTool.prototype._outline,
    _genMeasurePoint: Z.DistanceTool.prototype._genMeasurePoint,
    _endMeasure: Z.DistanceTool.prototype._endMeasure,
    _changeCursor: Z.DistanceTool.prototype._changeCursor
});
