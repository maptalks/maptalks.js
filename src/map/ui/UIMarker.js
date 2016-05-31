/**
 * @classdesc
 * Class for UI Marker, a html based marker positioned by geographic coordinate.
 *
 * As it's an actual html element, it:
 * 1. always on the top of all the map layers
 * 2. can't be snapped as it's not drawn on the canvas.
 *
 * @class
 * @category ui
 * @extends maptalks.ui.UIComponent
 * @param {Object} options - construct options
 * @memberOf maptalks.ui
 * @name UIMarker
 */
Z.ui.UIMarker = Z.ui.UIComponent.extend(/** @lends maptalks.ui.UIMarker.prototype */{
    options : {
        'single' : false,
        'content' : null
    },

    initialize: function (coordinate, options) {
        this._markerCoord = new Z.Coordinate(coordinate);
        Z.Util.setOptions(this, options);
    },

    setCoordinates: function (coordinates) {
        this._markerCoord = coordinates;
        if (this.isVisible()) {
            this.show();
        }
        return this;
    },

    getCoordinates: function () {
        return this._markerCoord;
    },

    setContent: function (content) {
        this.options['content'] = content;
        if (this.isVisible()) {
            this.show();
        }
        return this;
    },

    getContent: function () {
        return this.options['content'];
    },

    show: function (coordinates) {
        return Z.ui.UIComponent.prototype.show.call(this, coordinates || this._markerCoord);
    },

    _getDomOffset: function () {
        var size = this.getSize();
        return new Z.Point(-size['width'] / 2, -size['height'] / 2);
    },

    _createDOM: function () {
        if (Z.Util.isString(this.options['content'])) {
            var dom = Z.DomUtil.createEl('div');
            dom.innerHTML = this.options['content'];
            return dom;
        } else {
            return this.options['content'];
        }
    },

    _getEvents: function () {
        return {
            'zoomstart' : this._onZoomStart,
            'zoomend'   : this._onZoomEnd
        };
    },

    _onZoomStart: function () {
        this.hide();
    },

    _onZoomEnd: function () {
        this.show();
    }

});
