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
        var map = this;
        coordinate = new Z.Coordinate(coordinate);
        var dest = this.coordinateToContainerPoint(coordinate),
            current = this.coordinateToContainerPoint(this.getCenter());
        return this._panBy(dest.substract(current), options, function () {
            var c = map.getProjection().project(coordinate);
            map._setPrjCenterAndMove(c);
        });
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

    _panBy: function (offset, options, cb) {
        if (!offset) {
            return this;
        }
        offset = new Z.Point(offset).multi(-1);
        this._onMoveStart();
        if (!options) {
            options = {};
        }
        if (typeof (options['animation']) === 'undefined' || options['animation']) {
            this._panAnimation(offset, options['duration'], cb);
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

    _panAnimation:function (offset, t, onFinish) {
        this._getRenderer().panAnimation(offset, t, onFinish);
    }

});
