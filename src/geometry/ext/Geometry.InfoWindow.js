import { extend, setOptions } from 'core/util';
import Geometry from 'geometry/Geometry';
import { InfoWindow } from 'ui';

Geometry.include(/** @lends Geometry.prototype */ {
    /**
     * Set an InfoWindow to the geometry
     * @param {Object} options - construct [options]{@link ui.InfoWindow#options} for the InfoWindow
     * @return {Geometry} this
     * @example
     * geometry.setInfoWindow({
     *     title    : 'This is a title',
     *     content  : '<div style="color:#f00">This is content of the InfoWindow</div>'
     * });
     */
    setInfoWindow: function (options) {
        this._infoWinOptions = extend({}, options);
        if (this._infoWindow) {
            setOptions(this._infoWindow, options);
        } else if (this.getMap()) {
            this._bindInfoWindow(this._infoWinOptions);
        }

        return this;
    },

    /**
     * Get the InfoWindow instance.
     * @return {ui.InfoWindow}
     */
    getInfoWindow: function () {
        if (!this._infoWindow) {
            return null;
        }
        return this._infoWindow;
    },

    /**
     * Open the InfoWindow, default on the center of the geometry.
     * @param  {Coordinate} [coordinate=null] - coordinate to open the InfoWindow
     * @return {Geometry} this
     */
    openInfoWindow: function (coordinate) {
        if (!this.getMap()) {
            return this;
        }
        if (!coordinate) {
            coordinate = this.getCenter();
        }
        if (!this._infoWindow) {
            if (this._infoWinOptions && this.getMap()) {
                this._bindInfoWindow(this._infoWinOptions);
                this._infoWindow.show(coordinate);
            }
        } else {
            this._infoWindow.show(coordinate);
        }
        return this;
    },

    /**
     * Close the InfoWindow
     * @return {Geometry} this
     */
    closeInfoWindow: function () {
        if (this._infoWindow) {
            this._infoWindow.hide();
        }
        return this;
    },

    /**
     * Remove the InfoWindow
     * @return {Geometry} this
     */
    removeInfoWindow: function () {
        this._unbindInfoWindow();
        delete this._infoWinOptions;
        delete this._infoWindow;
        return this;
    },

    _bindInfoWindow: function (options) {
        this._infoWindow = new InfoWindow(options);
        this._infoWindow.addTo(this);

        return this;
    },

    _unbindInfoWindow: function () {
        if (this._infoWindow) {
            this.closeInfoWindow();
            this._infoWindow.remove();
            delete this._infoWindow;
        }
        return this;
    }
});
