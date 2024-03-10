import Point from './../geo/Point';
type Constructor = new (...args: any[]) => {};
/**
 * Common methods for geometry classes that base on a center, e.g. Marker, Circle, Ellipse , etc
 * @mixin CenterMixin
 */
declare function CenterMixin<TBase extends Constructor>(Base: TBase): {
    new (...args: any[]): {
        _coordinates: any;
        _dirtyCoords: boolean;
        _pcenter: Point;
        /**
         * Get geometry's center
         * @return {Coordinate} - center of the geometry
         * @function CenterMixin.getCoordinates
         */
        getCoordinates(): any;
        /**
         * Set a new center to the geometry
         * @param {Coordinate|Number[]} coordinates - new center
         * @ts-ignore
         * @return {Geometry} this
         * @fires Geometry#positionchange
         * @function CenterMixin.setCoordinates
         */
        setCoordinates(coordinates: any): any;
        _getCenter2DPoint(res?: any): any;
        _getPrjCoordinates(): Point;
        _setPrjCoordinates(pcenter: any): void;
        _updateCache(): void;
        _clearProjection(): void;
        _computeCenter(): any;
    };
} & TBase;
export default CenterMixin;
