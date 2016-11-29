/**
 * @classdesc
 * Class for info window, a popup on the map to display any useful infomation you wanted.
 * @class
 * @category ui
 * @extends maptalks.ui.UIComponent
 * @param {Object} options - options defined in [maptalks.ui.InfoWindow]{@link maptalks.ui.InfoWindow#options}
 * @memberOf maptalks.ui
 * @name InfoWindow
 */
maptalks.ui.InfoWindow = maptalks.ui.UIComponent.extend(/** @lends maptalks.ui.InfoWindow.prototype */{

    /**
     * @property {Object} options
     * @property {Boolean} [options.autoPan=true]  - set it to false if you don't want the map to do panning animation to fit the opened window.
     * @property {Number}  [options.width=300]     - default width
     * @property {Number}  [options.minHeight=120] - minimun height
     * @property {Boolean} [options.custom=false]  - set it to true if you want a customized infowindow, customized html codes or a HTMLElement is set to content.
     * @property {String}  [options.title=null]    - title of the infowindow.
     * @property {String|HTMLElement}  options.content - content of the infowindow.
     */
    options: {
        'autoPan'   : true,
        'width'     : 300,
        'minHeight' : 120,
        'custom'    : false,
        'title'     : null,
        'content'   : null
    },

    /**
     * Adds the UI Component to a geometry or a map
     * @param {maptalks.Geometry|maptalks.Map} owner - geometry or map to addto.
     * @returns {maptalks.ui.UIComponent} this
     * @fires maptalks.ui.UIComponent#add
     */
    addTo:function (owner) {
        if (owner instanceof maptalks.Geometry) {
            if (owner.getInfoWindow() && owner.getInfoWindow() !== this) {
                owner.removeInfoWindow();
            }
            owner._infoWindow = this;
        }
        return maptalks.ui.UIComponent.prototype.addTo.apply(this, arguments);
    },

    /**
     * Set the content of the infowindow.
     * @param {String|HTMLElement} content - content of the infowindow.
     * return {maptalks.ui.InfoWindow} this
     * @fires maptalks.ui.InfoWindow#contentchange
     */
    setContent:function (content) {
        var old = this.options['content'];
        this.options['content'] = content;
        /**
         * contentchange event.
         *
         * @event maptalks.ui.InfoWindow#contentchange
         * @type {Object}
         * @property {String} type - contentchange
         * @property {maptalks.ui.InfoWindow} target - InfoWindow
         * @property {String|HTMLElement} old      - old content
         * @property {String|HTMLElement} new      - new content
         */
        this.fire('contentchange', {'old' : old, 'new' : content});
        if (this.isVisible()) {
            this.show(this._coordinate);
        }
        return this;
    },

    /**
     * Get content of  the infowindow.
     * @return {String|HTMLElement} - content of the infowindow
     */
    getContent:function () {
        return this.options['content'];
    },

    /**
     * Set the title of the infowindow.
     * @param {String|HTMLElement} title - title of the infowindow.
     * return {maptalks.ui.InfoWindow} this
     * @fires maptalks.ui.InfoWindow#titlechange
     */
    setTitle:function (title) {
        var old = title;
        this.options['title'] = title;
        /**
         * titlechange event.
         *
         * @event maptalks.ui.InfoWindow#titlechange
         * @type {Object}
         * @property {String} type - titlechange
         * @property {maptalks.ui.InfoWindow} target - InfoWindow
         * @property {String} old      - old content
         * @property {String} new      - new content
         */
        this.fire('contentchange', {'old' : old, 'new' : title});
        if (this.isVisible()) {
            this.show(this._coordinate);
        }
        return this;
    },

    /**
     * Get title of  the infowindow.
     * @return {String|HTMLElement} - content of the infowindow
     */
    getTitle:function () {
        return this.options['title'];
    },

    buildOn: function () {
        var dom;
        if (this.options['custom']) {
            if (maptalks.Util.isString(this.options['content'])) {
                dom = maptalks.DomUtil.createEl('div');
                dom.innerHTML = this.options['content'];
                return dom;
            } else {
                return this.options['content'];
            }
        } else {
            dom = maptalks.DomUtil.createEl('div');
            dom.className = 'maptalks-msgBox';
            dom.style.width = this._getWindowWidth() + 'px';
            var content = '<em class="maptalks-ico"></em>';
            if (this.options['title']) {
                content += '<h2>' + this.options['title'] + '</h2>';
            }
            content += '<a href="javascript:void(0);" onclick="this.parentNode.style.display=\'none\';return false;" ' +
            ' class="maptalks-close"></a><div class="maptalks-msgContent">' + this.options['content'] + '</div>';
            dom.innerHTML = content;
            return dom;
        }
    },

    /**
     * Gets InfoWindow's transform origin for animation transform
     * @protected
     * @return {maptalks.Point} transform origin
     */
    getTransformOrigin: function () {
        var size = this.getSize();
        var o = new maptalks.Point(size['width'] / 2, size['height']);
        if (!this.options['custom']) {
            o._add(4, 12);
        }
        return o;
    },

    getOffset:function () {
        var size = this.getSize();
        var o = new maptalks.Point(-size['width'] / 2, -size['height']);
        if (!this.options['custom']) {
            o._substract(4, 12);
        }
        if (this.getOwner() instanceof maptalks.Marker) {
            var markerSize = this.getOwner().getSize();
            if (markerSize) {
                o._add(0,  -markerSize['height']);
            }
        }
        return o;
    },

    show: function () {
        if (!this.getMap()) {
            return this;
        }
        if (!this.getMap().options['enableInfoWindow']) {
            return this;
        }
        return maptalks.ui.UIComponent.prototype.show.apply(this, arguments);
    },

    _getWindowWidth:function () {
        var defaultWidth = 300;
        var width = this.options['width'];
        if (!width) {
            width = defaultWidth;
        }
        return width;
    }
});
