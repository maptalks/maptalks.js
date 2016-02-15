/**
 * 测距鼠标工具类
 * @class maptalks.DrawTool
 * @extends maptalks.Class
 * @mixins maptalks.Eventable
 * @author Maptalks Team
 */
Z.DistanceTool = Z.DrawTool.extend({
    /**
     * 默认的线型
     * @type {Object}
     */
    defaultStrokeSymbol: {
        'lineColor':'#000000',//'#3388ff',
        'lineWidth':3,
        'lineOpacity':1
    },



    options:{
        'language' : 'zh-CN', //'en-US'
        'metric': true,
        'imperial': false,
        'startSymbol' : {
            'markerType' : 'ellipse',
            "markerFill"        : "#ffffff",//"#d0d2d6",
            "markerLineColor"   : "#000000",
            "markerLineWidth"   : 3,
            "markerWidth"       : 10,
            "markerHeight"      : 10
        },
        'labelOptions' : {
            'symbol':{
                'textWrapCharacter' : '\n',
                'textFaceName' : '"microsoft yahei",sans-serif',
                'textLineSpacing' : 1,
                'textHorizontalAlignment' : 'right',
                'markerLineColor' : '#b4b3b3',
                'textDx' : 15
            },
            'boxPadding'   :   new Z.Size(6,4)
        }
    },

    /**
     * 初始化绘制工具
     * @constructor
     * @param {Object} options:{mode:Z.Geometry.TYPE_CIRCLE, disableOnDrawEnd: true}
     */
    initialize: function(options) {
        Z.Util.setOptions(this,options);
        this.config('mode',Z.Geometry['TYPE_LINESTRING']);
        this._registerDistEvents();
        this._measureLayers = [];
    },

    clearMeasurement:function() {
        if (Z.Util.isArrayHasData(this._measureLayers)) {
            for (var i = 0; i < this._measureLayers.length; i++) {
                this._measureLayers[i].remove();
            }
        }
        return this;
    },

    getMeasureLayers:function() {
        return this._measureLayers;
    },

    _registerDistEvents:function() {
        this.on('enable', this._onEnable, this)
            .on('drawstart', this._distOnDrawStart, this)
            .on('drawvertex', this._distOnDrawVertex, this)
            .on('mousemove', this._distOnMouseMove, this)
            .on('drawend', this._distOnDrawEnd, this)
            .on('disable', this._onDisable, this);
    },

    _onEnable:function(param) {

    },

    _onDisable:function() {
        this.off('enable', this._onEnable, this)
            .off('drawstart', this._distOnDrawStart, this)
            .off('drawvertex', this._distOnDrawVertex, this)
            .off('mousemove', this._distOnMouseMove, this)
            .off('drawend', this._distOnDrawEnd, this)
            .off('disable', this._onDisable, this);
    },


    _distOnDrawStart:function(param) {
        var map = this.getMap();
        var guid = Z.Util.GUID();
        var layerId = Z.internalLayerPrefix+'distancetool_'+guid;
        var markerLayerId = Z.internalLayerPrefix+'distancetool_markers_'+guid;
        if (!map.getLayer(layerId)) {
            this._measureLineLayer = new maptalks.VectorLayer(layerId).addTo(map);
            this._measureMarkerLayer = new maptalks.VectorLayer(markerLayerId).addTo(map);
        } else {
            this._measureLineLayer = map.getLayer(layerId);
            this._measureMarkerLayer = map.getLayer(markerLayerId);
        }
        this._measureLayers.push(this._measureLineLayer);
        this._measureLayers.push(this._measureMarkerLayer);
        var startMarker = new maptalks.Marker(param['coordinate'], {
            'symbol' : this.options['startSymbol']
        }).addTo(this._measureMarkerLayer);
        var content = (this.options['language'] === 'zh-CN' ? '起点' : 'start');
        var startLabel = new maptalks.Label(content, param['coordinate'], this.options['labelOptions']);
        this._measureMarkerLayer.addGeometry(startLabel);
    },

    _distOnMouseMove:function(param) {
        if (!this._tailMarker) {
            var symbol = Z.Util.extendSymbol(this.options['startSymbol']);
            symbol['markerWidth'] /= 2;
            symbol['markerHeight'] /= 2;
            this._tailMarker = new maptalks.Marker(param['coordinate'], {
                'symbol' : symbol
            }).addTo(this._measureMarkerLayer);
            this._tailMarker._isRenderImmediate(true);
        }
        this._tailMarker.setCoordinates(param['coordinate']);
    },

    _distOnDrawVertex:function(param) {
        var geometry = param['geometry'];
        var vertexMarker = new maptalks.Marker(param['coordinate'], {
            'symbol' : this.options['startSymbol']
        }).addTo(this._measureMarkerLayer);
        var length = geometry._computeGeodesicLength(this.getMap().getProjection());
        var units;
        if (this.options['language'] === 'zh-CN') {
            units = [' 米', ' 公里', ' 英尺', ' 英里'];
        } else {
            units = [' m', ' km', ' feet', ' mile'];
        }
        var content = '';
        if (this.options['metric']) {
            content += length < 1000 ? length.toFixed(0) + units[0] : (length / 1000).toFixed(2) + units[1];
        }
        if (this.options['imperial']) {
            length *= 3.2808399
            if (content.length > 0) {
                content += '\n';
            }
            content += length < 5280 ? length.toFixed(0) + units[2] : (length / 5280).toFixed(2) + units[3];
        }
        var vertexLabel = new maptalks.Label(content, param['coordinate'], this.options['labelOptions']);
        this._measureMarkerLayer.addGeometry(vertexLabel);
        this._lastVertex = vertexLabel;
    },

    _distOnDrawEnd:function(param) {
        if (this._tailMarker) {
            this._tailMarker.remove();
            delete this._tailMarker;
        }
        var size = this._lastVertex.getSize();
        if (!size) {
            size = new Z.Size(10,10);
        }
        var endMarker = new maptalks.Marker(this._lastVertex.getCoordinates(), {
            'symbol' : [
                        {
                            'markerType' : 'x',
                            'markerWidth' : 10,
                            'markerHeight' : 10,
                            'markerDx' : 20 + size['width']
                        },
                        {
                            'markerType' : 'square',
                            'markerFill' : '#ffffff',
                            'markerLineColor' : '#b4b3b3',
                            'markerLineWidth' : 2,
                            'markerWidth' : 15,
                            'markerHeight' : 15,
                            'markerDx' : 20 + size['width']
                        }
                        ]
        });
        var measureLineLayer = this._measureLineLayer,
            measureMarkerLayer = this._measureMarkerLayer;
        endMarker.on('click',function() {
            measureLineLayer.remove();
            measureMarkerLayer.remove();
            //return false to stop propagation of event.
            return false;
        }, this);
        endMarker.addTo(this._measureMarkerLayer);
        var geo = param['geometry'].copy();
        geo._isRenderImmediate(true);
        geo.addTo(this._measureLineLayer);
    }

});

