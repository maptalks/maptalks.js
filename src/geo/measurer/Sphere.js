Z.measurer.Sphere = function (radius) {
    this.radius = radius;
};

Z.Util.extend(Z.measurer.Sphere.prototype, {
    rad: function (a) { return a * Math.PI / 180; },

    measureLength:function (c1, c2) {
        if (!c1 || !c2) { return 0; }
        var b = this.rad(c1.y), d = this.rad(c2.y), e = b - d, f = this.rad(c1.x) - this.rad(c2.x);
        b = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(e / 2), 2) + Math.cos(b) * Math.cos(d) * Math.pow(Math.sin(f / 2), 2))); b *= this.radius;
        return Math.round(b * 1E6) / 1E6;
    },
    measureArea:function (coordinates) {
        var a = this.radius * Math.PI / 180,
            b = 0,
            c = coordinates,
            d = c.length;
        if (d < 3) { return 0; }
        for (var i = 0; i < d - 1; i++) {
            var e = c[i],
                f = c[i + 1];
            b += e.x * a * Math.cos(e.y * Math.PI / 180) * f.y * a - f.x * a * Math.cos(f.y * Math.PI / 180) * e.y * a;
        }
        d = c[i];
        c = c[0];
        b += d.x * a * Math.cos(d.y * Math.PI / 180) * c.y * a - c.x * a * Math.cos(c.y * Math.PI / 180) * d.y * a;
        return 0.5 * Math.abs(b);
    },
    locate:function (c, xDist, yDist) {
        if (!c) { return null; }
        if (!xDist) { xDist = 0; }
        if (!yDist) { yDist = 0; }
        if (!xDist && !yDist) { return c; }
        var dx = Math.abs(xDist);
        var dy = Math.abs(yDist);
        var ry = this.rad(c.y);
        var rx = this.rad(c.x);
        var sy = Math.sin(dy / (2 * this.radius)) * 2;
        ry = ry + sy * (yDist > 0 ? 1 : -1);
        var sx = 2 * Math.sqrt(Math.pow(Math.sin(dx / (2 * this.radius)), 2) / Math.pow(Math.cos(ry), 2));
        rx = rx + sx * (xDist > 0 ? 1 : -1);
        return new Z.Coordinate(rx * 180 / Math.PI, ry * 180 / Math.PI);
    }
});

/**
 * WGS84 Sphere measurer.
 * @class
 * @category geo
 * @protected
 * @memberOf maptalks.measurer
 * @name WGS84Sphere
 */
Z.measurer.WGS84Sphere = {
    'measure' : 'EPSG:4326',
    sphere : new Z.measurer.Sphere(6378137),
    /**
     * Measure the length between 2 coordinates.
     * @param  {maptalks.Coordinate} c1
     * @param  {maptalks.Coordinate} c2
     * @return {Number}
     */
    measureLength: function () {
        return this.sphere.measureLength.apply(this.sphere, arguments);
    },
    /**
     * Measure the area closed by the given coordinates.
     * @param  {maptalks.Coordinate[]} coordinates
     * @return {number}
     */
    measureArea: function () {
        return this.sphere.measureArea.apply(this.sphere, arguments);
    },
    /**
     * Locate a coordinate from the given source coordinate with a x-axis distance and a y-axis distance.
     * @param  {maptalks.Coordinate} c     - source coordinate
     * @param  {Number} xDist              - x-axis distance
     * @param  {Number} yDist              - y-axis distance
     * @return {maptalks.Coordinate}
     */
    locate: function () {
        return this.sphere.locate.apply(this.sphere, arguments);
    }
};

/**
 * Baidu sphere measurer
 * @class
 * @category geo
 * @protected
 * @memberOf maptalks.measurer
 * @name BaiduSphere
 */
Z.measurer.BaiduSphere = {
    'measure' : 'BAIDU',
    sphere : new Z.measurer.Sphere(6370996.81),
    /**
     * Measure the length between 2 coordinates.
     * @param  {maptalks.Coordinate} c1
     * @param  {maptalks.Coordinate} c2
     * @return {Number}
     */
    measureLength: function () {
        return this.sphere.measureLength.apply(this.sphere, arguments);
    },
    /**
     * Measure the area closed by the given coordinates.
     * @param  {maptalks.Coordinate[]} coordinates
     * @return {number}
     */
    measureArea: function () {
        return this.sphere.measureArea.apply(this.sphere, arguments);
    },
    /**
     * Locate a coordinate from the given source coordinate with a x-axis distance and a y-axis distance.
     * @param  {maptalks.Coordinate} c     - source coordinate
     * @param  {Number} xDist              - x-axis distance
     * @param  {Number} yDist              - y-axis distance
     * @return {maptalks.Coordinate}
     */
    locate: function () {
        return this.sphere.locate.apply(this.sphere, arguments);
    }
};
