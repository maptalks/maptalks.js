/**
 * @classdesc
 * A control to allows to display attribution content in a small text box on the map.
 * @class
 * @category control
 * @extends maptalks.control.Control
 * @memberOf maptalks.control
 * @name Attribution
 * @param {Object} [options=undefined] - construct options
 * @param {Object} [options.position={'bottom': 0, 'left': 0} - position of the control
 * @param {String} [options.content=maptalks] - content of the attribution control, HTML format
 * @example
 * var attribution = new maptalks.control.Attribution({
 *     position : 'bottom-left',
 *     content : 'hello maptalks'
 * }).addTo(map);
 */
Z.control.Attribution = Z.control.Control.extend(/** @lends maptalks.control.Attribution.prototype */{

    /**
     * @param {Object} options - options
     * @param {Object} options.position - position of the control
     * @param {String} options.content  - content of the attribution control, HTML format
     */
    options:{
        'position' : {
            'bottom': 0,
            'left': 0
        },
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
