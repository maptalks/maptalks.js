Z.Map.include(/** @lends maptalks.Map.prototype */{
    /**
     * Pan to the given coordinate
     * @param {maptalks.Coordinate} coordinate - coordinate to pan to
     * @param {Object} [options=null] - pan options
     * @param {Boolean} [options.animation=null] - whether pan with animation
     * @param {Boolean} [options.duration=600] - pan animation duration
     * @return {maptalks.Map} this
     */
    panTo:function (coordinate, options) {
        if (!coordinate) {
            return this;
        }
        coordinate = new Z.Coordinate(coordinate);
        var dest = this.coordinateToViewPoint(coordinate),
            current = this.offsetPlatform();
        return this._panBy(dest.substract(current), options, coordinate);
    },

    /**
     * Pan the map by the give point
     * @param  {maptalks.Point} point - distance to pan, in pixel
     * @param {Object} [options=null] - pan options
     * @param {Boolean} [options.animation=null] - whether pan with animation
     * @param {Boolean} [options.duration=600] - pan animation duration
     * @return {maptalks.Map} this
     */
    panBy:function (offset, options) {
        return this._panBy(offset, options);
    },

    _panBy: function (offset, options, destCoord) {
        if (!offset) {
            return this;
        }
        var cb;
        if (destCoord) {
            var map = this;
            cb = function () {
                map.setCenter(destCoord);
            };
        }
        offset = new Z.Point(offset).multi(-1);
        this._onMoveStart();
        if (!options) {
            options = {};
        }
        if (typeof (options['animation']) === 'undefined' || options['animation']) {
            this._panAnimation(offset, options['duration'], destCoord, cb);
        } else {
            this.offsetPlatform(offset);
            this._offsetCenterByPixel(offset);
            this._onMoving();
            if (cb) {
                cb();
            }
            this._onMoveEnd();
        }
        return this;
    },

    _panAnimation:function (offset, t, destCoord, cb) {
        var map = this,
            delta = 200;
        var startZoom = this.getZoom(),
            start = this.offsetPlatform(),
            dest = start.add(offset),
            dist = dest.distanceTo(start);
        this._getRenderer().panAnimation(offset, t, function (frame, player) {
            if (!player) {
                return true;
            }
            if (player.playState !== 'running') {
                if (cb) {
                    cb();
                }
                return true;
            }
            var vCenter = map.offsetPlatform();
            if (Math.abs(vCenter.distanceTo(start) - dist) > dist + delta || map.getZoom() !== startZoom) {
                if (cb) {
                    cb();
                }
                return false;
            }
            return true;
        });
    }

});
