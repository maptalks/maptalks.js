import { on, off, createEl, stopPropagation } from 'core/util/dom';
import TextBox from 'geometry/TextBox';
import Label from 'geometry/Label';
import { UIMarker } from 'ui';

/**
 * Mixin methods for text editing.
 * @mixin TextEditable
 */
const TextEditable = {
    /**
     * Start to edit the text, editing will be ended automatically whenever map is clicked.
     *
     * @return {TextMarker} this
     * @fires TextMarker#edittextstart
     */
    startEditText() {
        if (!this.getMap()) {
            return this;
        }
        this.hide();
        this.endEditText();
        this._prepareEditor();
        /**
         * edittextstart when starting to edit text content
         * @event TextMarker#edittextstart
         * @type {Object}
         * @property {String} type - edittextstart
         * @property {TextMarker} target - fires the event
         */
        this._fireEvent('edittextstart');
        return this;
    },

    /**
     * End text edit.
     *
     * @return {TextMarker} this
     * @fires TextMarker#edittextend
     */
    endEditText() {
        if (this._textEditor) {
            var content = this._textEditor.innerText;
            content = this._filterContent(content);
            this.setContent(content);
            this.show();
            off(this._textEditor, 'mousedown dblclick', stopPropagation);
            this.getMap().off('mousedown', this.endEditText, this);
            this._editUIMarker.remove();
            delete this._editUIMarker;
            this._textEditor.onkeyup = null;
            delete this._textEditor;
            /**
             * edittextend when ended editing text content
             * @event TextMarker#edittextend
             * @type {Object}
             * @property {String} type - edittextend
             * @property {TextMarker} target - textMarker fires the event
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
    isEditingText() {
        if (this._textEditor) {
            return true;
        }
        return false;
    },

    /**
     * Get the text editor which is an [ui.UIMarker]{@link ui.UIMarker}
     * @return {ui.UIMarker} text editor
     */
    getTextEditor() {
        return this._editUIMarker;
    },

    _prepareEditor() {
        var map = this.getMap();
        var editContainer = this._createEditor();
        this._textEditor = editContainer;
        map.on('mousedown', this.endEditText, this);
        var offset = this._getEditorOffset();
        this._editUIMarker = new UIMarker(this.getCoordinates(), {
            'content': editContainer,
            'dx': offset.dx,
            'dy': offset.dy
        }).addTo(map).show();
        this._setCursorToLast(this._textEditor);
    },

    _getEditorOffset() {
        var symbol = this._getInternalSymbol() || {},
            dx = 0,
            dy = 0;
        var textAlign = symbol['textHorizontalAlignment'];
        if (textAlign === 'middle') {
            dx = symbol['textDx'] - 2 || 0;
            dy = symbol['textDy'] - 2 || 0;
        } else if (textAlign === 'left') {
            dx = symbol['markerDx'] - 2 || 0;
            dy = symbol['markerDy'] - 2 || 0;
        } else {
            dx = symbol['markerDx'] - 2 || 0;
            dy = symbol['markerDy'] - 2 || 0;
        }
        return {
            'dx': dx,
            'dy': dy
        };
    },

    _createEditor() {
        var content = this.getContent();
        var labelSize = this.getSize(),
            symbol = this._getInternalSymbol() || {},
            width = (content && content.length > 0) ? (Math.max(labelSize['width'], this.options['boxMinWidth']) || 100) : 100,
            textColor = symbol['textFill'] || '#000000',
            textSize = symbol['textSize'] || 12,
            height = Math.max(labelSize['height'], this.options['boxMinHeight']) || textSize * 1.5,
            lineColor = symbol['markerLineColor'] || '#000',
            fill = symbol['markerFill'] || '#3398CC',
            spacing = symbol['textLineSpacing'] || 0;
        // opacity = symbol['markerFillOpacity'];
        var editor = createEl('div');
        editor.contentEditable = true;
        editor.style.cssText = 'background: ' + fill + ';' +
            'border: 1px solid ' + lineColor + ';' +
            'color: ' + textColor + ';' +
            'font-size: ' + textSize + 'px;' +
            'width: ' + (width - 2) + 'px;' +
            'height: ' + (height - 2) + 'px;' +
            'margin-left: auto;' +
            'margin-right: auto;' +
            'line-height: ' + (textSize + spacing) + 'px;' +
            'outline: 0;' +
            'word-wrap: break-word;' +
            'overflow-x: hidden;' +
            'overflow-y: hidden;' +
            '-webkit-user-modify: read-write-plaintext-only;';

        editor.innerText = content;
        on(editor, 'mousedown dblclick', stopPropagation);
        editor.onkeyup = function (event) {
            var h = editor.style.height;
            if (!h) {
                h = 0;
            }
            if (event.keyCode === 13) {
                editor.style.height = (parseInt(h) + textSize / 2) + 'px';
            }
        };
        return editor;
    },

    _setCursorToLast(obj) {
        var range;
        if (window.getSelection) {
            obj.focus();
            range = window.getSelection();
            range.selectAllChildren(obj);
            range.collapseToEnd();
        } else if (document.selection) {
            range = document.selection.createRange();
            range.moveToElementText(obj);
            range.collapse(false);
            range.select();
        }
    },

    _filterContent(content) {
        var pattern = /\\[v f t b]{1}/gi;
        var enterPattern = /[\r\n]+$/gi;
        var result = content.replace(pattern, '');
        result = result.replace(enterPattern, '');
        return result;
    }
};

TextBox.include(TextEditable);
Label.include(TextEditable);

export default TextEditable;
