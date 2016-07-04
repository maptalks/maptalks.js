/**
 * @classdesc
 * A control to allows to display attribution data in a small text box on the map.
 * @class
 * @category control
 * @extends maptalks.Control
 * @memberOf maptalks.control
 * @name Attribution
 * @param {Object} options - construct options
 * @param {String} options.content - content of the attribution control, HTML format
 */
Z.control.Attribution = Z.Control.extend(/** @lends maptalks.control.Attribution.prototype */{

    /**
     * @param {Object} options - options
     * @param {Object} [options.position={"bottom":0,"right":0}] - position of the control
     * @param {String} options.content  - content of the attribution control, HTML format
     */
    options:{
        'position' : {
            'bottom': '0',
            'right': '0'
        },
        'content' : '<a href="http://www.maptalks.org" target="_blank">Powered By MapTalks</a>'
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
        if (!this._map) { return; }
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
