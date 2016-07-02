Z.Label.include(/** @lends maptalks.Label.prototype */{
    /**
     * Start to edit the label text
     * @return {maptalks.Label} this
     */
    startEditText: function() {
        if (!this.getMap()) {
            return;
        }
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
            var content = this._textEditor.innerText;
            this.setContent(content);
            this.show();
            Z.DomUtil.off(this._textEditor, 'mousedown dblclick', Z.DomUtil.stopPropagation)
                .off(this._textEditor, 'blur', this.endEditText, this);
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
    isEditingText: function () {
        if (this._container) {
            return true;
        }
        return false;
    },

    getEditor: function() {
        return this._textEditor;
    },

    _prepareEditor:function () {
        var map = this.getMap(),
            zIndex = map._panels.control.style.zIndex + 1,
            viewPoint = this._computeViewPoint();
        this._container = Z.DomUtil.createEl('div');
        this._container.style.cssText = 'position:absolute;top:' + viewPoint['y']
                                    + 'px;left:' + viewPoint['x'] + 'px;z-index:' + zIndex + ';';
        map._panels.ui.appendChild(this._container);
        this._textEditor = this._createEditor();
        this._container.appendChild(this._textEditor);
    },


    _computeViewPoint: function () {
        var map = this.getMap(),
            symbol = this._getInternalSymbol(),
            labelSize = this.getSize(),
            dx = symbol['textDx'] || 0,
            dy = symbol['textDy'] || 0,
            align = Z.StringUtil.getAlignPoint(labelSize, symbol['textHorizontalAlignment'], symbol['textVerticalAlignment'])
                    .add(dx, dy),
            viewPoint = map.coordinateToViewPoint(this.getCenter()).add(align);
        return viewPoint;
    },

    _createEditor: function () {
        var labelSize = this.getSize(),
            symbol = this._getInternalSymbol() || {},
            width = labelSize['width'] || 100,
            height = labelSize['height'] || 100,
            textColor = symbol['textFill'] || '#000000',
            textSize = symbol['textSize'] || 12,
            fill = symbol['markerFill'] || '#3398CC',
            lineColor = symbol['markerLineColor'] || '#ffffff',
            spacing = symbol['textLineSpacing'] || 0,
            editor = Z.DomUtil.createEl('div');
        editor.contentEditable = true;
        editor.style.cssText ='background: '+fill+';'+
            'border: 1px solid '+lineColor+';'+
            'color: '+textColor+';'+
            'font-size: '+textSize+'px;'+
            'width: '+(width + 10)+'px;'+
            // 'height: '+(height - spacing) +'px;'+
            // 'min-height: '+(height - spacing)+'px;'+
            // 'max-height: 300px;'+
            'margin-left: auto;'+
            'margin-right: auto;'+
            'line-height: '+(textSize+spacing)+'px;'+
            'outline: 0;'+
            'word-wrap: break-word;'+
            'overflow-x: hidden;'+
            'overflow-y: auto;'+
            '-webkit-user-modify: read-write-plaintext-only;';
        var content = this.getContent();
        editor.innerText = content;
        Z.DomUtil.on(editor, 'mousedown dblclick', Z.DomUtil.stopPropagation)
            .on(editor, 'blur', this.endEditText, this);
        return editor;
    }

});
