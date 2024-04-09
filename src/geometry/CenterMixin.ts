import { MixinConstructor } from '../core/Mixin';

import Coordinate from '../geo/Coordinate';
import Point from '../geo/Point';
import { CommonProjectionType } from '../geo/projection';
import type { Map } from '../map';

/**
 * 基于几何图形的通用方法
 * @english
 * Common methods for geometry classes that base on a center, e.g. Marker, Circle, Ellipse , etc
 * @mixin CenterMixin
 */
export default function <T extends MixinConstructor>(Base: T) {
    return class extends Base {
        public _coordinates: Coordinate
        public _pcenter: Coordinate
        public _dirtyCoords: boolean
        getMap?(): Map
        _getProjection?(): CommonProjectionType
        onPositionChanged?(): void
        _verifyProjection?(): void
        _clearCache?(): void
        /**
         * 获取几何图形的中心点
         * @english
         * Get geometry's center
         * @return {Coordinate} - center of the geometry
         * @function CenterMixin.getCoordinates
         */
        getCoordinates(): Coordinate {
            return this._coordinates;
        }

        /**
         * 设置几何图形的中心点
         * @english
         * Set a new center to the geometry
         * @param {Coordinate|Number[]} coordinates - new center
         * @return {Geometry} this
         * @fires Geometry#positionchange
         * @function CenterMixin.setCoordinates
         */
        setCoordinates(coordinates: Coordinate | Array<number>) {
            const center = (coordinates instanceof Coordinate) ? coordinates : new Coordinate(coordinates as [number, number, number]);
            this._coordinates = center;
            if (!this.getMap()) {
                //When not on a layer or when creating a new one, temporarily save the coordinates,
                this._dirtyCoords = true;
                this.onPositionChanged();
                return this;
            }
            const projection = this._getProjection();
            this._setPrjCoordinates(projection.project(this._coordinates));
            return this;
        }

        //Gets view point of the geometry's center
        _getCenter2DPoint(res?: number): Point {
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

        _getPrjCoordinates(): Coordinate {
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
        _setPrjCoordinates(pcenter: Coordinate): void {
            this._pcenter = pcenter;
            this.onPositionChanged();
        }

        //update cached const iables if geometry is updated.
        _updateCache(): void {
            this._clearCache();
            const projection = this._getProjection();
            if (this._pcenter && projection) {
                this._coordinates = projection.unproject(this._pcenter);
            }
        }

        _clearProjection(): void {
            this._pcenter = null;
            // @ts-expect-error todo
            super._clearProjection();
        }

        _computeCenter(): Coordinate | null {
            return this._coordinates ? this._coordinates.copy() : null;
        }
    };
}
