/**
 * @classdesc
 * A control to allows to display attribution content in a small text box on the map.
 * @class
 * @category control
 * @extends maptalks.control.Control
 * @memberOf maptalks.control
 * @name Attribution
 * @param {Object} [options=null] - options defined in [maptalks.control.Attribution]{@link maptalks.control.Attribution#options}
 * @example
 * var attribution = new maptalks.control.Attribution({
 *     position : 'bottom-left',
 *     content : 'hello maptalks'
 * }).addTo(map);
 */
Z.control.Attribution = Z.control.Control.extend(/** @lends maptalks.control.Attribution.prototype */{

    /**
     * @property {Object} options - options
     * @property {Object} [options.position='bottom-left'] - position of the control
     * @property {String} [options.content='Powered By <a href="http://www.maptalks.org" target="_blank">MapTalks</a>']  - content of the attribution control, HTML format
     */
    options:{
        'position' : 'bottom-left',
        'content' : 'Powered By <a href="http://www.maptalks.org" target="_blank">MapTalks</a>'
    },

    buildOn: function () {
        this._attributionContainer = Z.DomUtil.createEl('div', 'maptalks-attribution');
        this._update();
        return this._attributionContainer;
    },

    /**
     * Set content of the attribution
     * @param {String} content - attribution content
     * @return {maptalks.control.Attribution} this
     */
    setContent: function (content) {
        this.options['content'] = content;
        this._update();
        return this;
    },

    _update: function () {
        if (!this.getMap()) { return; }
        this._attributionContainer.innerHTML = this.options['content'];
    }
});

Z.Map.mergeOptions({

    'attributionControl' : false
});

Z.Map.addOnLoadHook(function () {
    if (this.options['attributionControl']) {
        this.attributionControl = new Z.control.Attribution(this.options['attributionControl']);
        this.addControl(this.attributionControl);
    }
});
