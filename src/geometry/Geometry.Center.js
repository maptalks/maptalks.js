import Coordinate from 'geo/Coordinate';

/**
 * Common methods for geometry classes that base on a center, e.g. Marker, Circle, Ellipse , etc
 * @mixin
 */
export const Center = {
    /**
     * Get geometry's center
     * @return {Coordinate} - center of the geometry
     */
    getCoordinates: function () {
        return this._coordinates;
    },

    /**
     * Set a new center to the geometry
     * @param {Coordinate|Number[]} coordinates - new center
     * @return {Geometry} this
     * @fires Geometry#positionchange
     */
    setCoordinates: function (coordinates) {
        var center = new Coordinate(coordinates);
        if (center.equals(this._coordinates)) {
            return this;
        }
        this._coordinates = center;
        if (!this.getMap()) {
            this.onPositionChanged();
            return this;
        }
        var projection = this._getProjection();
        this._setPrjCoordinates(projection.project(this._coordinates));
        return this;
    },

    //Gets view point of the geometry's center
    _getCenter2DPoint: function (zoom) {
        var map = this.getMap();
        if (!map) {
            return null;
        }
        var z = maptalks.Util.isNil(zoom) ? map.getZoom() : map.getMaxZoom();
        var pcenter = this._getPrjCoordinates();
        if (!pcenter) { return null; }

        return map._prjToPoint(pcenter, z);
    },

    _getPrjCoordinates: function () {
        var projection = this._getProjection();
        if (!projection) {
            return null;
        }
        if (!this._pcenter) {
            if (this._coordinates) {
                this._pcenter = projection.project(this._coordinates);
            }
        }
        return this._pcenter;
    },

    //Set center by projected coordinates
    _setPrjCoordinates: function (pcenter) {
        this._pcenter = pcenter;
        this.onPositionChanged();
    },

    //update cached variables if geometry is updated.
    _updateCache: function () {
        delete this._extent;
        var projection = this._getProjection();
        if (this._pcenter && projection) {
            this._coordinates = projection.unproject(this._pcenter);
        }
    },

    _clearProjection: function () {
        this._pcenter = null;
    },

    _computeCenter: function () {
        return this._coordinates;
    }
};
