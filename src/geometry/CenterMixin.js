import { isNil } from '../core/util';
import Coordinate from '../geo/Coordinate';

/**
 * Common methods for geometry classes that base on a center, e.g. Marker, Circle, Ellipse , etc
 * @mixin CenterMixin
 */
export default function (Base) {
    return class extends Base {

        /**
         * Get geometry's center
         * @return {Coordinate} - center of the geometry
         * @function CenterMixin.getCoordinates
         */
        getCoordinates() {
            return this._coordinates;
        }

        /**
         * Set a new center to the geometry
         * @param {Coordinate|Number[]} coordinates - new center
         * @return {Geometry} this
         * @fires Geometry#positionchange
         * @function CenterMixin.setCoordinates
         */
        setCoordinates(coordinates) {
            const center = (coordinates instanceof Coordinate) ? coordinates : new Coordinate(coordinates);
            if (center.equals(this._coordinates)) {
                return this;
            }
            this._coordinates = center;
            if (!this.getMap()) {
                //When not on a layer or when creating a new one, temporarily save the coordinates,
                this._dirtyCoords  = true;
                this.onPositionChanged();
                return this;
            }
            const projection = this._getProjection();
            this._setPrjCoordinates(projection.project(this._coordinates));
            return this;
        }

        //Gets view point of the geometry's center
        _getCenter2DPoint(zoom) {
            const map = this.getMap();
            if (!map) {
                return null;
            }
            const z = isNil(zoom) ? map.getZoom() : map.getGLZoom();
            const pcenter = this._getPrjCoordinates();
            if (!pcenter) { return null; }

            return map._prjToPoint(pcenter, z);
        }

        _getPrjCoordinates() {
            const projection = this._getProjection();
            this._verifyProjection();
            if (!this._pcenter && projection) {
                if (this._coordinates) {
                    this._pcenter = projection.project(this._coordinates);
                }
            }
            return this._pcenter;
        }

        //Set center by projected coordinates
        _setPrjCoordinates(pcenter) {
            this._pcenter = pcenter;
            this.onPositionChanged();
        }

        //update cached const iables if geometry is updated.
        _updateCache() {
            this._clearCache();
            const projection = this._getProjection();
            if (this._pcenter && projection) {
                this._coordinates = projection.unproject(this._pcenter);
            }
        }

        _clearProjection() {
            this._pcenter = null;
            super._clearProjection();
        }

        _computeCenter() {
            return this._coordinates ? this._coordinates.copy() : null;
        }
    };
}
