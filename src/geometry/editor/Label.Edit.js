Z.Label.include(/** @lends maptalks.Label.prototype */{
    /**
     * Start to edit the label text
     * @return {maptalks.Label} this
     */
    startEditText: function() {
        this.hide();
        this._prepareEditor();
        return this;
    },

    /**
     * End label text edit.
     * @member maptalks.Label
     * @return {maptalks.Label} this
     */
    endEditText: function() {
        var content = this._textEditor.value;
        this.setContent(content);
        this.show();
        Z.DomUtil.removeDomNode(this._container);
        delete this._container;
        delete this._textEditor;
        return this;
    },

    /**
     * Whether the label is being edited text.
     * @return {Boolean}
     */
    isEditingText: function() {
        if (this._container) {
            return true;
        }
        return false;
    },

    _prepareEditor:function() {
        var map = this.getMap();
        var zIndex = map._panels.controlWrapper.style.zIndex+1;
        var viewPoint = this._computeViewPoint();
        this._container = Z.DomUtil.createEl('div');
        this._container.style.cssText='position:absolute;top:'+viewPoint['y']
                                    +'px;left:'+viewPoint['x']+'px;z-index:'+zIndex+';';
        map._panels.uiContainer.appendChild(this._container);
        this._textEditor = this._createInputDom();
        this._container.appendChild(this._textEditor);
    },

    _computeViewPoint: function() {
        var map = this.getMap();
        var symbol = this.getSymbol();
        var labelSize = this.getSize();
        var dx = Z.Util.getValueOrDefault(symbol['textDx'],0),
            dy = Z.Util.getValueOrDefault(symbol['textDy'],0);
        var align = Z.StringUtil.getAlignPoint(labelSize, symbol['textHorizontalAlignment'], symbol['textVerticalAlignment'])
                    .add(new Z.Point(dx,dy));
        var viewPoint = map.coordinateToViewPoint(this.getCenter()).add(align);
        return viewPoint;
    },

    _createInputDom: function() {
        var labelSize = this.getSize();
        var symbol = this.getSymbol();
        var width = labelSize['width'];
        var height = labelSize['height'];
        var textColor = symbol['textFill'];
        var textSize = symbol['textSize'];
        var fill = symbol['markerFill'];
        var lineColor = symbol['markerLineColor'];
        var spacing = Z.Util.getValueOrDefault(symbol['textLineSpacing'],0);
        var inputDom = Z.DomUtil.createEl('textarea');
        inputDom.style.cssText ='background:'+fill+';'+
            'border:1px solid '+lineColor+';'+
            'color:'+textColor+';'+
            'font-size:'+textSize+'px;'+
            'width:'+(width-spacing)+'px;'+
            'height:'+(height-spacing)+'px;';
        var content = this.getContent();
        inputDom.value = content;
        var me = this;
        Z.DomUtil.on(inputDom, 'blur', function(param){
             me.endEditText();
        });
        return inputDom;

    }

});
