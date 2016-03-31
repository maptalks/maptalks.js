/**
 * @classdesc
 * Class for info window, a popup on the map to display any useful infomation you wanted.
 * @class
 * @category ui
 * @extends maptalks.ui.UIComponent
 * @param {Object} options
 * @param {Boolean} [options.autoPan=true]  - set it to false if you don't want the map to do panning animation to fit the opened window.
 * @param {Number}  [options.width=300]     - default width
 * @param {Number}  [options.minHeight=120] - minimun height
 * @param {String|HTMLElement} [options.custom=false]  - set it to true if you want a customized infowindow, customized html codes or a HTMLElement is set to content.
 * @param {String}  [options.title=null]    - title of the infowindow.
 * @param {String}  options.content         - content of the infowindow.
 * @memberOf maptalks.ui
 * @name InfoWindow
 */
Z.ui.InfoWindow = Z.ui.UIComponent.extend(/** @lends maptalks.ui.InfoWindow.prototype */{

    statics : {
        'single' : true
    },

    /**
     * @property {Object} options
     * @property {Boolean} [options.autoPan=true]  - set it to false if you don't want the map to do panning animation to fit the opened window.
     * @property {Number}  [options.width=300]     - default width
     * @property {Number}  [options.minHeight=120] - minimun height
     * @property {String|HTMLElement} [options.custom=false]  - set it to true if you want a customized infowindow, customized html codes or a HTMLElement is set to content.
     * @property {String}  [options.title=null]    - title of the infowindow.
     * @property {String}  options.content         - content of the infowindow.
     */
    options: {
        'autoPan'   : true,
        'width'     : 300,
        'minHeight' : 120,
        'custom'    : false,
        'title'     : null,
        'content'   : null
    },

    initialize:function(options) {
        Z.Util.setOptions(this,options);
    },

    /**
     * Adds the infowindow to a geometry or a map
     * @param {maptalks.Geometry|maptalks.Map} target - geometry or map to addto.
     * @returns {maptalks.ui.InfoWindow} this
     */
    addTo:function(target) {
        this._target = target;
    },

    /**
     * Get the map instance it displayed
     * @return {maptalks.Map} map instance
     * @override
     */
    getMap:function() {
        if (this._target instanceof Z.Map) {
            return this._target;
        }
        return this._target.getMap();
    },

    /**
     * Set the content of the infowindow.
     * @param {String|HTMLElement} content - content of the infowindow.
     * return {maptalks.ui.InfoWindow} this
     */
    setContent:function(content) {
        this.options['content'] = content;
        if (this.isVisible()) {
            this.show(this._coordinate);
        }
        return this;
    },

    /**
     * Get content of  the infowindow.
     * @return {String|HTMLElement} - content of the infowindow
     */
    getContent:function() {
        return this.options['content'];
    },

    /**
     * Set the title of the infowindow.
     * @param {String|HTMLElement} title - title of the infowindow.
     * return {maptalks.ui.InfoWindow} this
     */
    setTitle:function(title) {
        this.options['title'] = title;
        if (this.isVisible()) {
            this.show(this._coordinate);
        }
        return this;
    },

    /**
     * Get title of  the infowindow.
     * @return {String|HTMLElement} - content of the infowindow
     */
    getTitle:function() {
        return this.options['title'];
    },

    _createDOM: function(){
        if (this.options['custom']) {
            if (Z.Util.isString(this.options['content'])) {
                var dom = Z.DomUtil.createEl('div');
                dom.innerHTML = this.options['content'];
                return dom;
            } else {
                return this.options['content'];
            }
        } else {
            var dom = Z.DomUtil.createEl('div');
            dom.className = 'maptalks-msgBox';
            dom.style.width = this._getWindowWidth()+'px';
            var content = '<em class="maptalks-ico"></em>';
            if (this.options['title']) {
                content += '<h2>'+this.options['title']+'</h2>';
            }
            content += '<a href="javascript:void(0);" onclick="this.parentNode.style.display=\'none\';return false;" '+
            ' class="maptalks-close"></a><div class="maptalks-msgContent">'+this.options['content']+'</div>';
            dom.innerHTML = content;
            return dom;
        };
    },

    _getDomOffset:function() {
        var size = this.getSize();
        var o = new Z.Point(-size['width']/2, -size['height'])._add(-4, -12);
        if (this._target instanceof Z.Marker) {
            var markerSize = this._target.getSize();
            if (markerSize) {
                o._add(0,  -markerSize['height']);
            }
        }
        return o;
    },

    _getWindowWidth:function() {
        var defaultWidth = 300;
        var width = this.options['width'];
        if (!width) {
            width = defaultWidth;
        }
        return width;
    },

    _registerEvents:function() {
        this.getMap().on('_zoomstart', this._onZoomStart, this)
            .on('_zoomend', this._onZoomEnd, this);
    },

    _removeEvents:function() {
        this.getMap().off('_zoomstart', this._onZoomStart, this)
                     .off('_zoomend', this._onZoomEnd, this);
    },

    _onZoomStart:function() {
        if (this.isVisible()) {
            this._getDOM().style.left = -999999+'px';
            this._getDOM().style.top = -999999+'px';
        }
    },

    _onZoomEnd:function() {
        if (this.isVisible()) {
            var point = this._getPosition();
            this._getDOM().style.left = point.x+'px';
            this._getDOM().style.top = point.y+'px';
        }
    }
});
