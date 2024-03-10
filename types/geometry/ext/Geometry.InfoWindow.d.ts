type Constructor = new (...args: any[]) => {};
/**
 *
 * @mixin GeometryInfoWindow
 */
export default function GeometryInfoWindow<TBase extends Constructor>(Base: TBase): {
    new (...args: any[]): {
        _infoWindow: any;
        _infoWinOptions: object;
        /** @lends Geometry.prototype */
        /**
         * Set an InfoWindow to the geometry
         * @param {Object} options - construct [options]{@link ui.InfoWindow#options} for the InfoWindow
         * @return {Geometry} this
         * @function GeometryInfoWindow.setInfoWindow
         * @example
         * geometry.setInfoWindow({
         *     title    : 'This is a title',
         *     content  : '<div style="color:#f00">This is content of the InfoWindow</div>'
         * });
         */
        setInfoWindow(options: any): any;
        /**
         * Get the InfoWindow instance.
         * @return {ui.InfoWindow}
         * @function GeometryInfoWindow.getInfoWindow
         */
        getInfoWindow(): any;
        /**
         * Open the InfoWindow, default on the center of the geometry.
         * @param  {Coordinate} [coordinate=null] - coordinate to open the InfoWindow
         * @return {Geometry} this
         * @function GeometryInfoWindow.openInfoWindow
         */
        openInfoWindow(coordinate: any): any;
        /**
         * Close the InfoWindow
         * @return {Geometry} this
         * @function GeometryInfoWindow.closeInfoWindow
         */
        closeInfoWindow(): any;
        /**
         * Remove the InfoWindow
         * @return {Geometry} this
         * @function GeometryInfoWindow.removeInfoWindow
         */
        removeInfoWindow(): any;
        _bindInfoWindow(): any;
        _unbindInfoWindow(): any;
    };
} & TBase;
export {};
