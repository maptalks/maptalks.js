(function () {
    /**
     * @memberOf maptalks.TextMarker
     * @name TextMarker.Edit
     */
    Z.TextMarkerEditor = {
        /**
         * Start to edit the text, editing will be ended automatically whenever map is clicked.
         *
         * @return {maptalks.TextMarker} this
         * @fires maptalks.TextMarker#edittextstart
         */
        startEditText: function () {
            if (!this.getMap()) {
                return this;
            }
            this.hide();
            this.endEditText();
            this._prepareEditor();
            /**
             * edittextstart when starting to edit text content
             * @event maptalks.TextMarker#edittextstart
             * @type {Object}
             * @property {String} type - edittextstart
             * @property {maptalks.TextMarker} target - fires the event
             */
            this._fireEvent('edittextstart');
            return this;
        },

        /**
         * End text edit.
         *
         * @return {maptalks.TextMarker} this
         * @fires maptalks.TextMarker#edittextend
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
                 * edittextend when ended editing text content
                 * @event maptalks.TextMarker#edittextend
                 * @type {Object}
                 * @property {String} type - edittextend
                 * @property {maptalks.TextMarker} target - textMarker fires the event
                 */
                this._fireEvent('edittextend');
            }
            return this;
        },

        /**
         * Whether the text is being edited.
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
            var offset = this._getEditorOffset();
            this._editUIMarker = new maptalks.ui.UIMarker(this.getCoordinates(), {
                'content' : editContainer,
                'dx' : offset.dx,
                'dy' : offset.dy
            }).addTo(map).show();
            this._setCursorToLast(this._textEditor);
        },

        _getEditorOffset: function() {
            var symbol = this._getInternalSymbol() || {}, dx = 0, dy = 0;
            var textAlign = symbol['textHorizontalAlignment'];
            if(textAlign === 'middle') {
                dx = symbol['textDx'] - 2 || 0, dy = symbol['textDy'] - 2 || 0;
            } else if(textAlign === 'left') {
                dx = symbol['markerDx'] - 2 || 0, dy = symbol['markerDy'] - 2 || 0;
            } else {
                dx = symbol['markerDx'] - 2 || 0, dy = symbol['markerDy'] - 2 || 0;
            }
            return {'dx' : dx, 'dy' : dy};
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
                'line-height: '+(textSize+spacing)+'px;' +
                'outline: 0;' +
                'word-wrap: break-word;' +
                'overflow-x: hidden;' +
                'overflow-y: hidden;' +
                '-webkit-user-modify: read-write-plaintext-only;';
            var content = this.getContent();
            editor.innerText = content;
            Z.DomUtil.on(editor, 'mousedown dblclick', Z.DomUtil.stopPropagation);
            editor.onkeyup =  function(event) {
                var h = editor.style.height;
                if(h)
                    h = h.substring(0, h.indexOf('px'));
                else
                    h = 0;
                if(event.keyCode == 13) {
                    editor.style.height = (parseInt(h) + textSize) +'px';
                }
            };
            return editor;
        },

        _setCursorToLast: function(obj) {
            if (window.getSelection) {
                obj.focus();
                var range = window.getSelection();
                range.selectAllChildren(obj);
                range.collapseToEnd();
            }
            else if (document.selection) {
                var range = document.selection.createRange();
                range.moveToElementText(obj);
                range.collapse(false);
                range.select();
            }
        }
    };

})();
