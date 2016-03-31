Z.Geometry.include(/** @lends maptalks.Geometry.prototype */{
    /**
     * Set info window settings to the geometry
     * @param {Object} options - construct [options]{@link maptalks.ui.InfoWindow#options} for the info window
     * @return {maptalks.Geometry} this
     */
    setInfoWindow:function(options) {
        this._infoWinOptions = Z.Util.extend({},options);
        if (this._infoWindow) {
            Z.Util.setOptions(this._infoWindow, options);
        } else {
            if (this.getMap()) {
                this._bindInfoWindow(this._infoWinOptions);
            }
        }
        return this;
    },

    /**
     * Get infowindow's options.
     * @return {Object}
     */
    getInfoWindowOptions:function() {
        if (!this._infoWinOptions) {
            return null;
        }
        return this._infoWinOptions;
    },

    /**
     * Get info window's instance of infowindow if it has been already created.
     * @return {maptalks.ui.InfoWindow}
     */
    getInfoWindow:function() {
        if (!this._infoWindow) {
            return null;
        }
        return this._infoWindow;
    },

    /**
     * Open the info window.
     * @param  {maptalks.Coordinate} [coordinate=null] - coordinate to open the info window
     * @return {maptalks.Geometry} this
     */
    openInfoWindow:function(coordinate) {
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
     * close the info window
     * @return {maptalks.Geometry} this
     */
    closeInfoWindow:function() {
        if (this._infoWindow) {
            this._infoWindow.hide();
        }
        return this;
    },

    /**
     * remove the info window
     * @return {maptalks.Geometry} this
     */
    removeInfoWindow:function() {
        this._unbindInfoWindow();
        delete this._infoWinOptions;
        delete this._infoWindow;
        return this;
    },

    _bindInfoWindow: function(options) {
        this._infoWindow = new Z.ui.InfoWindow(options);
        this._infoWindow.addTo(this);

        return this;
    },

    _unbindInfoWindow:function() {
        if (this._infoWindow) {
            this.closeInfoWindow();
            this._infoWindow.remove();
            delete this._infoWindow;
        }
        return this;
    },

});
