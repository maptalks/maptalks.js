Z.Label.include(/** @lends maptalks.Label.prototype */{
    /**
     * Start to edit the label text, editing will be ended automatically whenever map is clicked.
     *
     * @return {maptalks.Label} this
     * @fires maptalks.Label#edittextstart
     */
    startEditText: function () {
        if (!this.getMap()) {
            return this;
        }
        this.hide();
        this.endEditText();
        this._prepareEditor();
        /**
         * edittextstart when starting to edit label's text content
         * @event maptalks.Label#edittextstart
         * @type {Object}
         * @property {String} type - edittextstart
         * @property {maptalks.Label} target - label fires the event
         */
        this._fireEvent('edittextstart');
        return this;
    },

    /**
     * End label text edit.
     *
     * @return {maptalks.Label} this
     * @fires maptalks.Label#edittextend
     */
    endEditText: function () {
        if (this._textEditor) {
            var content = this._textEditor.innerText;
            this.setContent(content);
            this.show();
            Z.DomUtil.off(this._textEditor, 'mousedown dblclick', Z.DomUtil.stopPropagation);
            this.getMap().off('mousedown', this.endEditText, this);
            this._editUIMarker.remove();
            delete this._editUIMarker;
            delete this._textEditor;
            /**
             * edittextend when ended editing label's text content
             * @event maptalks.Label#edittextend
             * @type {Object}
             * @property {String} type - edittextend
             * @property {maptalks.Label} target - label fires the event
             */
            this._fireEvent('edittextend');
        }
        return this;
    },

    /**
     * Whether the label's text is being edited.
     *
     * @return {Boolean}
     */
    isEditingText: function () {
        if (this._textEditor) {
            return true;
        }
        return false;
    },

    /**
     * Get the text editor which is a [maptalks.ui.UIMarker]{@link maptalks.ui.UIMarker}
     *
     * @return {maptalks.ui.UIMarker} text editor
     */
    getTextEditor: function () {
        return this._editUIMarker;
    },

    _prepareEditor:function () {
        var map = this.getMap();
        var editContainer = this._createEditor();
        this._textEditor = editContainer;
        map.on('mousedown',  this.endEditText, this);
        var symbol = this._getInternalSymbol() || {},
            dx = symbol['textDx'] - 2 || 0,
            dy = symbol['textDy'] - 2 || 0;
        this._editUIMarker = new maptalks.ui.UIMarker(this.getCoordinates(), {
            'content' : editContainer,
            'dx' : dx,
            'dy' : dy
        }).addTo(map).show();
    },

    _createEditor: function () {
        var labelSize = this.getSize(),
            symbol = this._getInternalSymbol() || {},
            width = labelSize['width'] || 100,
            textColor = symbol['textFill'] || '#000000',
            textSize = symbol['textSize'] || 12,
            height = labelSize['height'] || textSize,
            fill = symbol['markerFill'] || '#3398CC',
            lineColor = symbol['markerLineColor'] || '#ffffff',
            spacing = symbol['textLineSpacing'] || 0,
            editor = Z.DomUtil.createEl('div');
            editor.contentEditable = true;
            editor.style.cssText = 'background: ' + fill + ';' +
            'border: 1px solid #ff0000;' +
            'color: ' + textColor + ';' +
            'font-size: ' + textSize + 'px;' +
            'width: ' + (width - 2) + 'px;' +
            'height: '+(height - 2) +'px;'+
            // 'min-height: '+(height - spacing)+'px;'+
            // 'max-height: 300px;'+
            'margin-left: auto;' +
            'margin-right: auto;' +
            'line-height: ' + (height - 2) + 'px;' +
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
