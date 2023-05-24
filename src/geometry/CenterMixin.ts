import Point from 'src/geo/Point';
import Coordinate from '../geo/Coordinate';
type Constructor = new (...args: any[]) => {};
/**
 * Common methods for geometry classes that base on a center, e.g. Marker, Circle, Ellipse , etc
 * @mixin CenterMixin
 */
function CenterMixin<TBase extends Constructor>(Base: TBase) {
    return class extends Base {
        _coordinates: any;
        _dirtyCoords: boolean;
        _pcenter: Point;

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
         * @ts-ignore
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
            //@ts-ignore
            if (!this.getMap()) {
                //When not on a layer or when creating a new one, temporarily save the coordinates,
                this._dirtyCoords = true;
                //@ts-ignore
                this.onPositionChanged();
                return this;
            }
            //@ts-ignore
            const projection = this._getProjection();
            this._setPrjCoordinates(projection.project(this._coordinates));
            return this;
        }

        //Gets view point of the geometry's center
        _getCenter2DPoint(res?) {
            //@ts-ignore
            const map = this.getMap();
            if (!map) {
                return null;
            }
            const pcenter = this._getPrjCoordinates();
            if (!pcenter) { return null; }
            if (!res) {
                res = map._getResolution();
            }
            return map._prjToPointAtRes(pcenter, res);
        }

        _getPrjCoordinates() {
            //@ts-ignore
            const projection = this._getProjection();
            //@ts-ignore
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
            //@ts-ignore
            this.onPositionChanged();
        }

        //update cached const iables if geometry is updated.
        _updateCache() {
            //@ts-ignore
            this._clearCache();
            //@ts-ignore
            const projection = this._getProjection();
            if (this._pcenter && projection) {
                this._coordinates = projection.unproject(this._pcenter);
            }
        }

        _clearProjection() {
            this._pcenter = null;
            //@ts-ignore
            super._clearProjection();
        }

        _computeCenter() {
            return this._coordinates ? this._coordinates.copy() : null;
        }
    };
}

export default CenterMixin;