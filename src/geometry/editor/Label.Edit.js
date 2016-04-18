Z.Label.include(/** @lends maptalks.Label.prototype */{
    /**
     * Start to edit the label text
     * @return {maptalks.Label} this
     */
    startEditText: function() {
        this.hide();
        this.endEditText();
        this._prepareEditor();
        this.fire('edittextstart', this);
        return this;
    },

    /**
     * End label text edit.
     * @return {maptalks.Label} this
     */
    endEditText: function() {
        if(this._textEditor) {
            this.getMap().off('click', this.endEditText, this);
            var content = this._textEditor.value;
            this.setContent(content);
            this.show();
            Z.DomUtil.removeDomNode(this._container);
            delete this._container;
            delete this._textEditor;
            this.fire('edittextend', this);
        }
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
        var zIndex = map._panels.control.style.zIndex+1;
        var viewPoint = this._computeViewPoint();
        this._container = Z.DomUtil.createEl('div');
        this._container.style.cssText='position:absolute;top:'+viewPoint['y']
                                    +'px;left:'+viewPoint['x']+'px;z-index:'+zIndex+';';
        map._panels.ui.appendChild(this._container);
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
        var width = labelSize['width']||100;
        var height = labelSize['height']||100;
        var textColor = symbol['textFill']||'#ffffff';
        var textSize = symbol['textSize']||12;
        var fill = symbol['markerFill']||'#3398CC';
        var lineColor = symbol['markerLineColor']||'#ffffff';
        var spacing = symbol['textLineSpacing']||0;
        var inputDom = Z.DomUtil.createEl('textarea');
        inputDom.style.cssText ='background:'+fill+';'+
            'border:1px solid '+lineColor+';'+
            'color:'+textColor+';'+
            'font-size:'+textSize+'px;'+
            'width:'+(width)+'px;'+
            'height:'+(height)+'px;'+
            'min-height:'+height+'px;'+
            'margin-left: auto;'+
            'margin-right: auto;'+
            'outline: 0;'+
            'word-wrap: break-word;'+
            'overflow-x: hidden;'+
            'overflow-y: auto;'+
            '-webkit-user-modify: read-write-plaintext-only;';
        var content = this.getContent();
        inputDom.value = content;
        Z.DomUtil.on(inputDom, 'mousedown dblclick', Z.DomUtil.stopPropagation);
        this.getMap().on('click', this.endEditText, this);
        return inputDom;
    }

});
