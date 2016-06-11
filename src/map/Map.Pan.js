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
        var projection = this.getProjection();
        var p = projection.project(new Z.Coordinate(coordinate));
        var span = this._getPixelDistance(p);
        this.panBy(span, options);
        return this;
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
        this._onMoveStart();
        if (!options) {
            options = {};
        }
        if (typeof (options['animation']) === 'undefined' || options['animation']) {
            this._panAnimation(offset, options['duration']);
        } else {
            this.offsetPlatform(offset);
            this._offsetCenterByPixel(offset);
            this._onMoving();
            this._onMoveEnd();
        }
        return this;
    },

    _panAnimation:function (offset, t) {
        var map = this,
            delta = 200;
        var changed = false;
        var startCenter = this.getCenter(),
            startZoom = this.getZoom(),
            start = this.offsetPlatform(),
            dest = start.add(offset),
            destCoord = map.viewPointToCoordinate(dest),
            dist = dest.distanceTo(start);
        this._getRenderer().panAnimation(offset, t, function(frame, player) {
            if (changed || !player || player.playState !== 'running') {
                return true;
            }
            var vCenter = map.offsetPlatform();
            if (Math.abs(vCenter.distanceTo(start) - dist) > dist + delta || map.getZoom() !== startZoom) {
                changed = true;
                player.finish();
                var newOffset = map.coordinateToViewPoint(destCoord).substract(vCenter);
                map._panAnimation(newOffset, t);
                return false;
            }
            return true;
        });
    }

});
