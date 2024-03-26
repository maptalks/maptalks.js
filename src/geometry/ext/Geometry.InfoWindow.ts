import { extend } from '../../core/util';
import Geometry from '../Geometry';
import InfoWindow from '../../ui/InfoWindow';

Geometry.include(/** @lends Geometry.prototype */ {
    /**
     * 给要素设置信息窗口
     * @english
     * Set an InfoWindow to the geometry
     * @param {Object} options - construct [options]{@link ui.InfoWindow#options} for the InfoWindow
     * @return {Geometry} this
     * @example
     * geometry.setInfoWindow({
     *     title    : 'This is a title',
     *     content  : '<div style="color:#f00">This is content of the InfoWindow</div>'
     * });
     */
    setInfoWindow(options: InfoWindow): Geometry {
        this.removeInfoWindow();
        if (options instanceof InfoWindow) {
            this._infoWindow = options;
            this._infoWinOptions = extend({}, this._infoWindow.options);
            this._infoWindow.addTo(this);
            return this;
        }
        this._infoWinOptions = extend({}, options);
        if (this._infoWindow) {
            this._infoWindow.setOptions(options);
        } else if (this.getMap()) {
            this._bindInfoWindow();
        }

        return this;
    },

    /**
     * 获取InfoWindow实例
     * @english
     * Get the InfoWindow instance.
     * @return {ui.InfoWindow}
     */
    getInfoWindow(): InfoWindow {
        if (!this._infoWindow) {
            return null;
        }
        return this._infoWindow;
    },

    /**
     * 打开信息窗口，默认位于几何图形的中心。
     * @english
     * Open the InfoWindow, default on the center of the geometry.
     * @param  {Coordinate} [coordinate=null] - coordinate to open the InfoWindow
     * @return {Geometry} this
     */
    openInfoWindow(coordinate: any): Geometry {
        if (!this.getMap()) {
            return this;
        }
        if (!coordinate) {
            coordinate = this.getCenter();
        }
        if (!this._infoWindow) {
            if (this._infoWinOptions && this.getMap()) {
                this._bindInfoWindow();
                this._infoWindow.show(coordinate);
            }
        } else {
            this._infoWindow.show(coordinate);
        }
        return this;
    },

    /**
     * 关闭信息窗口
     * @english
     * Close the InfoWindow
     * @return {Geometry} this
     */
    closeInfoWindow(): Geometry {
        if (this._infoWindow) {
            this._infoWindow.hide();
        }
        return this;
    },

    /**
     * 移除信息窗口
     * @english
     * Remove the InfoWindow
     * @return {Geometry} this
     */
    removeInfoWindow(): Geometry {
        this._unbindInfoWindow();
        delete this._infoWinOptions;
        delete this._infoWindow;
        return this;
    },

    /**
     * 给要素绑定信息窗口
     * @english
     * Bing InfoWindow to Geometry
     * @returns {Geometry} this
     */
    _bindInfoWindow(): Geometry {
        const options = this._infoWinOptions;
        if (!options) {
            return this;
        }
        // @ts-ignore
        this._infoWindow = new InfoWindow(options);
        this._infoWindow.addTo(this);

        return this;
    },

    /**
     * 解绑要素窗口
     * @english
     * Unbind InfoWindow
     * @returns {Geometry} this
     */
    _unbindInfoWindow(): Geometry {
        if (this._infoWindow) {
            this.closeInfoWindow();
            this._infoWindow.remove();
            delete this._infoWindow;
        }
        return this;
    }
});
