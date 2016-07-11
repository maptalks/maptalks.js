Z.Label.include(/** @lends maptalks.Label.prototype */{
    /**
     * Start to edit the label text
     * @return {maptalks.Label} this
     */
    startEditText: function () {
        if (!this.getMap()) {
            return this;
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
    endEditText: function () {
        if (this._textEditor) {
            var content = this._textEditor.innerText;
            this.setContent(content);
            this.show();
            Z.DomUtil.off(this._textEditor, 'mousedown dblclick', Z.DomUtil.stopPropagation);
            map.off('mousedown',  this.endEditText, this);
            this._editUIMarker.remove();
            delete this._editUIMarker;
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
        if (this._textEditor) {
            return true;
        }
        return false;
    },

    getTextEditor: function () {
        return this._editUIMarker;
    },

    _prepareEditor:function () {
        var map = this.getMap();
        var editContainer = this._createEditor();
        this._textEditor = editContainer;
        map.on('mousedown',  this.endEditText, this);
        this._editUIMarker = new maptalks.ui.UIMarker(this.getCoordinates(), {
            'content' : editContainer
        }).addTo(map).show();
    },

    _createEditor: function () {
        var labelSize = this.getSize(),
            symbol = this._getInternalSymbol() || {},
            width = labelSize['width'] || 100,
            // height = labelSize['height'] || 100,
            textColor = symbol['textFill'] || '#000000',
            textSize = symbol['textSize'] || 12,
            fill = symbol['markerFill'] || '#3398CC',
            lineColor = symbol['markerLineColor'] || '#ffffff',
            spacing = symbol['textLineSpacing'] || 0,
            editor = Z.DomUtil.createEl('div');
        editor.contentEditable = true;
        editor.style.cssText = 'background: ' + fill + ';' +
            'border: 1px solid ' + lineColor + ';' +
            'color: ' + textColor + ';' +
            'font-size: ' + textSize + 'px;' +
            'width: ' + (width + 10) + 'px;' +
            // 'height: '+(height - spacing) +'px;'+
            // 'min-height: '+(height - spacing)+'px;'+
            // 'max-height: 300px;'+
            'margin-left: auto;' +
            'margin-right: auto;' +
            'line-height: ' + (textSize + spacing) + 'px;' +
            'outline: 0;' +
            'word-wrap: break-word;' +
            'overflow-x: hidden;' +
            'overflow-y: auto;' +
            '-webkit-user-modify: read-write-plaintext-only;';
        var content = this.getContent();
        editor.innerText = content;
        Z.DomUtil.on(editor, 'mousedown dblclick', Z.DomUtil.stopPropagation);
        return editor;
    }

});
