Z.Geometry.include({
    /**
     * 设置Geometry的信息提示框设置
     * @param {Object} options 信息提示框设置
     * @member maptalks.Geometry
     * @expose
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
     * 获取Geometry的信息提示框设置
     * @return {Object} 信息提示框设置
     * @member maptalks.Geometry
     * @expose
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
     * 打开geometry的信息提示框
     * @param  {Coordinate} coordinate 提示框位置,可以为空
     * @member maptalks.Geometry
     * @expose
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
     * 关闭Geometry的信息提示框
     * @member maptalks.Geometry
     * @expose
     */
    closeInfoWindow:function() {
        if (this._infoWindow) {
            this._infoWindow.hide();
        }
        return this;
    },

    /**
     * 移除信息提示框
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
