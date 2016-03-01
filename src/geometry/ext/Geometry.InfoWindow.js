Z.Geometry.include(/** @lends maptalks.Geometry.prototype */{
    /**
     * Set info window settings to the geometry
     * @param {Object} options - construct [options]{@link maptalks.InfoWindow#options} for the info window
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
     * Get info window's options or the instance of info window if it has been already created.
     * @return {Object|maptalks.InfoWindow}
     */
    getInfoWindow:function() {
        if (!this._infoWindow) {
            if (this._infoWinOptions) {
                return this._infoWinOptions;
            }
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
        this._infoWindow = new Z.InfoWindow(options);
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
