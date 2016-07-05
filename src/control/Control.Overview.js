/**
 * @classdesc
 * A control to allows to display attribution data in a small text box on the map.
 * @class
 * @category control
 * @extends maptalks.Control
 * @memberOf maptalks.control
 * @name Attribution
 * @param {Object} options - construct options
 */
Z.control.Overview = Z.Control.extend(/** @lends maptalks.control.Attribution.prototype */{

    loadDelay : 1600,

    /**
     * @param {Object} options - options
     * @param {Object} [options.position={"bottom":0,"right":0}] - position of the control
     * @param {Number} [options.level=4]  - the zoom level of the overview
     * @param {Object} [options.size={"width":300, "height":200}  - size of the Control
     * @param {Object} [options.style={"color":"#1bbc9b"}] - style of the control, color is the overview rectangle's color
     */
    options:{
        'level' : 4,
        'position' : {
            'bottom': '0',
            'right': '0'
        },
        'size' : {
            'width' : 300,
            'height' : 200
        },
        'style' : {
            'color' : '#1bbc9b'
        }
    },

    buildOn: function (map) {
        var container = Z.DomUtil.createEl('div');
        container.style.cssText = 'border:1px solid #000;width:' + this.options['size']['width'] + 'px;height:' + this.options['size']['height'] + 'px;';
        if (map.isLoaded()) {
            this._initOverview();
        } else {
            map.on('load', this._initOverview, this);
        }
        return container;
    },

    _initOverview : function () {
        var me = this;
        setTimeout(function () {
            me._createOverview();
        }, this.loadDelay);
    },

    _createOverview : function (container) {
        var map = this.getMap(),
            dom = container || this.getDOM(),
            extent = map.getExtent();
        var options = map.config();
        Z.Util.extend(options, {
            'center' : map.getCenter(),
            'zoom'   : this._getOverviewZoom(),
            'scrollWheelZoom' : false,
            'checkSize' : false,
            'doubleClickZoom' : false,
            'touchZoom' : false,
            'control' : false
        });
        this._overview = new Z.Map(dom, options);
        this._updateBaseLayer();
        this._perspective = new Z.Polygon(extent.toArray(), {
            'draggable' : true,
            'cursor' : 'move',
            'symbol' : {
                'lineWidth' : 3,
                'lineColor' : this.options['style']['color'],
                'polygonFill' : this.options['style']['color'],
                'polygonOpacity' : 0.4,
            }
        })
        .on('dragstart', this._onDragStart, this)
        .on('dragend', this._onDragEnd, this);
        map.on('resize moveend zoomend', this._update, this)
            .on('setbaselayer', this._updateBaseLayer, this);
        new Z.VectorLayer('v').addGeometry(this._perspective).addTo(this._overview);
        this.fire('load');
    },

    _onRemove : function (map) {
        map.off('load', this._initOverview, this)
            .off('resize moveend zoomend', this._update, this)
            .off('setbaselayer', this._updateBaseLayer, this);
    },

    _getOverviewZoom : function () {
        var map = this.getMap(),
            zoom = map.getZoom(),
            minZoom = map.getMinZoom(),
            level = this.options['level'];
        var i;
        if (level > 0) {
            for (i = level; i > 0; i--) {
                if (zoom - i >= minZoom) {
                    return zoom - i;
                }
            }
        } else {
            for (i = level; i < 0; i++) {
                if (zoom - i >= minZoom) {
                    return zoom - i;
                }
            }
        }

        return zoom;
    },

    _onDragStart: function () {
        this._origDraggable = this.getMap().options['draggable'];
        this.getMap().config('draggable', false);
    },

    _onDragEnd : function () {
        var center = this._perspective.getCenter();
        this._overview.setCenter(center);
        this.getMap().panTo(center);
        this.getMap().config('draggable', this._origDraggable);
    },

    _update : function () {
        this._perspective.setCoordinates(this.getMap().getExtent().toArray());
        this._overview.setCenterAndZoom(this.getMap().getCenter(), this._getOverviewZoom());
    },

    _updateBaseLayer: function () {
        var map = this.getMap();
        if (map.getBaseLayer()) {
            this._overview.setBaseLayer(Z.Layer.fromJSON(map.getBaseLayer().toJSON()));
        } else {
            this._overview.setBaseLayer(null);
        }
    }

});

Z.Map.mergeOptions({
    'overviewControl' : false
});

Z.Map.addOnLoadHook(function () {
    if (this.options['overviewControl']) {
        this.overviewControl = new Z.control.Overview(this.options['overviewControl']);
        this.addControl(this.overviewControl);
    }
});
