maptalks.MassivePointLayer = maptalks.VectorLayer.extend(/** @lends maptalks.MassivePointLayer.prototype */{

    options: {
        'tolerance' : 5,
        'geometryEvents' : false
    },

    addGeometry: function (points) {
        if (!maptalks.Util.isArray(points)) {
            points = [points];
        }
        for (var i = 0, len = points.length; i <= len; i++) {
            if (!points[i]) {
                continue;
            }
            if (!(points[i] instanceof maptalks.Marker)) {
                throw new Error('Only a point(Marker) can be added into a MassivePointLayer');
            }
        }
        return maptalks.VectorLayer.prototype.addGeometry.apply(this, arguments);
    }

});

maptalks.MassivePointLayer.registerRenderer('canvas', maptalks.renderer.vectorlayer.Canvas.extend({
    initialize: function () {
        maptalks.renderer.vectorlayer.Canvas.prototype.initialize.apply(this, arguments);
        this._simplify();
        this.layer.on('addgeo', this._onGeoUpdated, this);
        this.layer.on('removegeo', this._onGeoUpdated, this);
    },

    remove: function () {
        delete this._simplified;
        delete this._simplifiedCache;
        this.layer.off('addgeo', this._onGeoUpdated, this);
        this.layer.off('removegeo', this._onGeoUpdated, this);
        maptalks.renderer.vectorlayer.Canvas.prototype.remove.apply(this, arguments);
    },

    _simplify: function () {
        if (this.layer.options['tolerance'] === 0) {
            return;
        }
        var map = this.getMap(),
            zoom = map.getZoom();
        if (!this._simplifiedCache) {
            this._simplifiedCache = {};
        }
        var pre = map._getResolution(map.getMinZoom()) > map._getResolution(map.getMaxZoom()) ? zoom - 1 : zoom + 1;
        if (this._simplifiedCache[pre] && this._simplifiedCache[pre].length === this.layer.getCount()) {
            this._simplifiedCache[zoom] = this._simplifiedCache[pre];
        }
        if (!this._simplifiedCache[zoom]) {
            var t = map._getResolution() * this.layer.options['tolerance'];
            var extent = null,
                points = [],
                c;
            this.layer.forEach(function (g, index) {
                c = g._getPrjCoordinates();
                if (!extent) {
                    extent = g._getPrjExtent();
                } else {
                    extent = extent._combine(g._getPrjExtent());
                }
                points.push({
                    x : c.x,
                    y : c.y,
                    idx : index
                });
            }, this);
            if (!extent) {
                return;
            }
            var _simplified = [];
            var grid = [],
                min = extent.getMin(),
                gx, gy;
            for (var i = 0, len = points.length; i < len; i++) {
                gx = Math.floor((points[i].x - min.x) / t);
                gy = Math.floor((points[i].y - min.y) / t);
                if (!grid[gx]) {
                    grid[gx] = [];
                }
                if (!grid[gx][gy]) {
                    _simplified.push(points[i].idx);
                    grid[gx][gy] = 1;
                }
            }
            this._simplifiedCache[zoom] = _simplified;
        }
        this._simplified = this._simplifiedCache[zoom];
    },

    _forEachGeo: function (fn, context) {
        if (!this._simplified) {
            this.layer.forEach(fn, context);
            return;
        }
        if (!context) {
            context = this;
        }
        for (var i = 0, len = this._simplified.length; i < len; i++) {
            fn.call(context, this.layer._geoList[this._simplified[i]]);
        }
    },

    _onGeoUpdated: function () {
        delete this._simplified;
        delete this._simplifiedCache;
        this._simplify();
    },

    onZoomEnd: function () {
        this._simplify();
        maptalks.renderer.vectorlayer.Canvas.prototype.onZoomEnd.apply(this, arguments);
    }
}));
