/**
 * @classdesc
 * A map tool to help measure distance on the map
 * @class
 * @category maptool
 * @extends maptalks.DrawTool
 * @mixins maptalks.Eventable
 * @param {options} [options=null] - construct options
 * @param {String} [options.language=zh-CN]         - language of the distance tool, zh-CN or en-US
 * @param {Boolean} [options.metric=true]           - display result in metric system
 * @param {Boolean} [options.imperial=false]        - display result in imperial system.
 * @param {Object}  [options.symbol=null]           - symbol of the line
 * @param {Object}  [options.vertexSymbol=null]     - symbol of the vertice
 * @param {Object}  [options.labelOptions=null]     - construct options of the vertice labels.
 * @example
 * var distanceTool = new maptalks.DistanceTool({
 *     'once' : true,
 *     'symbol': {
 *       'lineColor' : '#34495e',
 *       'lineWidth' : 2
 *     },
 *     'vertexSymbol' : {
 *       'markerType'        : 'ellipse',
 *       'markerFill'        : '#1bbc9b',
 *       'markerLineColor'   : '#000',
 *       'markerLineWidth'   : 3,
 *       'markerWidth'       : 10,
 *      'markerHeight'      : 10
 *    },
 *    'language' : 'en-US'
 *  }).addTo(map);
 *
 */
Z.DistanceTool = Z.DrawTool.extend(/** @lends maptalks.DistanceTool.prototype */{

    /**
     * @property {options} options
     * @property {String}  options.language         - language of the distance tool, zh-CN or en-US
     * @property {Boolean} options.metric           - display result in metric system
     * @property {Boolean} options.imperial         - display result in imperial system.
     * @property {Object}  options.symbol           - symbol of the line
     * @property {Object}  options.vertexSymbol     - symbol of the vertice
     * @property {Object}  options.labelOptions     - construct options of the vertice labels.
     */
    options:{
        'mode' : 'LineString',
        'language' : 'zh-CN', //'en-US'
        'metric': true,
        'imperial': false,
        'symbol' : {
            'lineColor':'#000', //'#3388ff',
            'lineWidth':3,
            'lineOpacity':1
        },
        'vertexSymbol' : {
            'markerType'        : 'ellipse',
            'markerFill'        : '#fff', //"#d0d2d6",
            'markerLineColor'   : '#000',
            'markerLineWidth'   : 3,
            'markerWidth'       : 10,
            'markerHeight'      : 10
        },
        'labelOptions' : {
            'symbol':{
                'textWrapCharacter' : '\n',
                'textFaceName' : 'monospace',
                'textLineSpacing' : 1,
                'textHorizontalAlignment' : 'right',
                'markerLineColor' : '#b4b3b3',
                'textDx' : 15
            },
            'boxPadding'   :   {'width' : 6, 'height' : 4}
        }
    },

    initialize: function (options) {
        Z.Util.setOptions(this, options);
        this.on('enable', this._afterEnable, this)
            .on('disable', this._afterDisable, this);
        this._measureLayers = [];
    },

    /**
     * Clear the measurements
     * @return {maptalks.DistanceTool} this
     */
    clear:function () {
        if (Z.Util.isArrayHasData(this._measureLayers)) {
            for (var i = 0; i < this._measureLayers.length; i++) {
                this._measureLayers[i].remove();
            }
        }
        delete this._lastMeasure;
        delete this._lastVertex;
        this._measureLayers = [];
        return this;
    },

    /**
     * Get the VectorLayers with the geometries drawn on the map during measuring.
     * @return {maptalks.Layer[]}
     */
    getMeasureLayers:function () {
        return this._measureLayers;
    },

    /**
     * Get last measuring result
     * @return {Number}
     */
    getLastMeasure:function () {
        if (!this._lastMeasure) {
            return 0;
        }
        return this._lastMeasure;
    },

    _measure:function (toMeasure) {
        var map = this.getMap();
        var length;
        if (toMeasure instanceof Z.Geometry) {
            length = map.computeGeometryLength(toMeasure);
        } else if (Z.Util.isArray(toMeasure)) {
            length = Z.GeoUtil._computeLength(toMeasure, map.getProjection());
        }
        this._lastMeasure = length;
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
            length *= 3.2808399;
            if (content.length > 0) {
                content += '\n';
            }
            content += length < 5280 ? length.toFixed(0) + units[2] : (length / 5280).toFixed(2) + units[3];
        }
        return content;
    },

    _registerMeasureEvents:function () {
        this.on('drawstart', this._msOnDrawStart, this)
            .on('drawvertex', this._msOnDrawVertex, this)
            .on('mousemove', this._msOnMouseMove, this)
            .on('drawend', this._msOnDrawEnd, this);
    },

    _afterEnable:function () {
        this._registerMeasureEvents();
    },

    _afterDisable:function () {
        this.off('drawstart', this._msOnDrawStart, this)
            .off('drawvertex', this._msOnDrawVertex, this)
            .off('mousemove', this._msOnMouseMove, this)
            .off('drawend', this._msOnDrawEnd, this);
    },

    _msOnDrawStart:function (param) {
        var map = this.getMap();
        var uid = Z.Util.UID();
        var layerId = 'distancetool_' + uid;
        var markerLayerId = 'distancetool_markers_' + uid;
        if (!map.getLayer(layerId)) {
            this._measureLineLayer = new maptalks.VectorLayer(layerId, {'drawImmediate' : true}).addTo(map);
            this._measureMarkerLayer = new maptalks.VectorLayer(markerLayerId, {'drawImmediate' : true}).addTo(map);
        } else {
            this._measureLineLayer = map.getLayer(layerId);
            this._measureMarkerLayer = map.getLayer(markerLayerId);
        }
        this._measureLayers.push(this._measureLineLayer);
        this._measureLayers.push(this._measureMarkerLayer);
        //start marker
        new maptalks.Marker(param['coordinate'], {
            'symbol' : this.options['vertexSymbol']
        }).addTo(this._measureMarkerLayer);
        var content = (this.options['language'] === 'zh-CN' ? '起点' : 'start');
        var startLabel = new maptalks.Label(content, param['coordinate'], this.options['labelOptions']);
        this._measureMarkerLayer.addGeometry(startLabel);
    },

    _msOnMouseMove:function (param) {
        var ms = this._measure(param['geometry'].getCoordinates().concat([param['coordinate']]));
        if (!this._tailMarker) {
            var symbol = Z.Util.extendSymbol(this.options['vertexSymbol']);
            symbol['markerWidth'] /= 2;
            symbol['markerHeight'] /= 2;
            this._tailMarker = new maptalks.Marker(param['coordinate'], {
                'symbol' : symbol
            }).addTo(this._measureMarkerLayer);
            this._tailLabel = new maptalks.Label(ms, param['coordinate'], this.options['labelOptions'])
                .addTo(this._measureMarkerLayer);
        }
        this._tailMarker.setCoordinates(param['coordinate']);
        this._tailLabel.setContent(ms);
        this._tailLabel.setCoordinates(param['coordinate']);

    },

    _msOnDrawVertex:function (param) {
        var geometry = param['geometry'];
        //vertex marker
        new maptalks.Marker(param['coordinate'], {
            'symbol' : this.options['vertexSymbol']
        }).addTo(this._measureMarkerLayer);
        var length = this._measure(geometry);
        var vertexLabel = new maptalks.Label(length, param['coordinate'], this.options['labelOptions']);
        this._measureMarkerLayer.addGeometry(vertexLabel);
        this._lastVertex = vertexLabel;
    },

    _msOnDrawEnd:function (param) {
        this._clearTailMarker();
        var size = this._lastVertex.getSize();
        if (!size) {
            size = new Z.Size(10, 10);
        }
        this._addClearMarker(this._lastVertex.getCoordinates(), size['width']);
        var geo = param['geometry'].copy();
        geo.addTo(this._measureLineLayer);
        this._lastMeasure = geo.getLength();
    },

    _addClearMarker:function (coordinates, dx) {
        var endMarker = new maptalks.Marker(coordinates, {
            'symbol' : [
                {
                    'markerType' : 'square',
                    'markerFill' : '#ffffff',
                    'markerLineColor' : '#b4b3b3',
                    'markerLineWidth' : 2,
                    'markerWidth' : 15,
                    'markerHeight' : 15,
                    'markerDx' : 20 + dx
                },
                {
                    'markerType' : 'x',
                    'markerWidth' : 10,
                    'markerHeight' : 10,
                    'markerDx' : 20 + dx
                }
            ]
        });
        var measureLineLayer = this._measureLineLayer,
            measureMarkerLayer = this._measureMarkerLayer;
        endMarker.on('click', function () {
            measureLineLayer.remove();
            measureMarkerLayer.remove();
            //return false to stop propagation of event.
            return false;
        }, this);
        endMarker.addTo(this._measureMarkerLayer);
    },

    _clearTailMarker:function () {
        if (this._tailMarker) {
            this._tailMarker.remove();
            delete this._tailMarker;
        }
        if (this._tailLabel) {
            this._tailLabel.remove();
            delete this._tailLabel;
        }
    }

});

