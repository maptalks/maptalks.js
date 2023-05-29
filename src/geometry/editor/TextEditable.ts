import { on, off, createEl, stopPropagation } from '../../core/util/dom';
import { isNil } from '../../core/util';
// import TextMarker from '../TextMarker';
import UIMarker from '../../ui/UIMarker';
type Constructor = new (...args: any[]) => {};
/**
 * Mixin methods for text editing.
 * @mixin TextEditable
 */

export default function TextEditable<TBase extends Constructor>(Base: TBase) {

    return class extends Base {
        _textEditor: any;
        _editUIMarker: UIMarker;
        /**
         * Start to edit the text, editing will be ended automatically whenever map is clicked.
         *
         * @return {TextMarker} this
         * @fires TextMarker#edittextstart
         * @function TextEditable.startEditText
         */
        startEditText() {
            //@ts-ignore
            if (!this.getMap()) {
                return this;
            }
            //@ts-ignore
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
            //@ts-ignore
            this._fireEvent('edittextstart');
            return this;
        }

        /**
         * End text edit.
         *
         * @return {TextMarker} this
         * @function TextEditable.endEditText
         * @fires TextMarker#edittextend
         */
        endEditText() {
            if (this._textEditor) {
                let html = this._textEditor.innerHTML;
                html = html.replace(/<p>/ig, '').replace(/<\/p>/ig, '<br/>');
                this._textEditor.innerHTML = html;
                // trim enter chars in the end of text for IE
                const content = this._textEditor.innerText.replace(/[\r\n]+$/gi, '');
                //@ts-ignore
                this.setContent(content);
                off(this._textEditor, 'mousedown dblclick', stopPropagation);
                //@ts-ignore
                this.getMap().off('mousedown', this.endEditText, this);

                this._editUIMarker.remove();
                //@ts-ignore
                delete this._editUIMarker;
                this._textEditor.onkeyup = null;
                delete this._textEditor;
                //@ts-ignore
                this.show();
                /**
                 * edittextend when ended editing text content
                 * @event TextMarker#edittextend
                 * @type {Object}
                 * @property {String} type - edittextend
                 * @property {TextMarker} target - textMarker fires the event
                 */
                //@ts-ignore
                this._fireEvent('edittextend');
            }
            return this;
        }

        /**
         * Whether the text is being edited.
         *
         * @return {Boolean}
         * @function TextEditable.isEditingText
         */
        isEditingText() {
            if (this._textEditor) {
                return true;
            }
            return false;
        }

        /**
         * Get the text editor which is an [ui.UIMarker]{@link ui.UIMarker}
         * @return {ui.UIMarker} text editor
         * @function TextEditable.getTextEditor
         */
        getTextEditor() {
            return this._editUIMarker;
        }

        _prepareEditor() {
            //@ts-ignore
            const map = this.getMap();
            const editContainer = this._createEditor();
            this._textEditor = editContainer;
            map.on('mousedown', this.endEditText, this);
            const offset = this._getEditorOffset();
            //@ts-ignore
            this._editUIMarker = new UIMarker(this.getCoordinates(), {
                'animation': null,
                'content': editContainer,
                'dx': offset.dx,
                'dy': offset.dy
            }).addTo(map);
            this._setCursorToLast(this._textEditor);
        }

        _getEditorOffset() {
            //@ts-ignore
            const symbol = this._getInternalSymbol() || {};
            let dx = 0,
                dy = 0;
            const textAlign = symbol['textHorizontalAlignment'];
            if (textAlign === 'middle' || isNil(textAlign)) {
                dx = (symbol['textDx'] || 0) - 2;
                dy = (symbol['textDy'] || 0) - 2;
            } else {
                dx = (symbol['markerDx'] || 0) - 2;
                dy = (symbol['markerDy'] || 0) - 2;
            }
            return {
                'dx': dx,
                'dy': dy
            };
        }

        _createEditor() {
            //@ts-ignore
            const content = this.getContent();
            //@ts-ignore
            const labelSize = this.getSize(),
                //@ts-ignore
                symbol = this._getInternalSymbol() || {},
                width = labelSize.width,
                textColor = symbol['textFill'] || '#000000',
                textSize = symbol['textSize'] || 12,
                height = labelSize.height,
                lineColor = symbol['markerLineColor'] || '#000',
                fill = symbol['markerFill'] || '#3398CC',
                spacing = symbol['textLineSpacing'] || 0;
            const editor = createEl('div');
            //@ts-ignore
            editor.contentEditable = true;
            editor.style.cssText = `background:${fill}; border:1px solid ${lineColor};
            color:${textColor};font-size:${textSize}px;width:${width - 2}px;height:${height - 2}px;margin: auto;
            line-height:${textSize + spacing}px;outline: 0; padding:0; margin:0;word-wrap: break-word;
            overflow: hidden;-webkit-user-modify: read-write-plaintext-only;`;

            editor.innerText = content;
            on(editor, 'mousedown dblclick', stopPropagation);
            editor.onkeyup = function (event) {
                const h = editor.style.height || 0;
                if (event.keyCode === 13) {
                    //@ts-ignore
                    editor.style.height = (parseInt(h) + textSize / 2) + 'px';
                }
            };
            return editor;
        }

        _setCursorToLast(obj) {
            let range;
            if (window.getSelection) {
                obj.focus();
                range = window.getSelection();
                range.selectAllChildren(obj);
                range.collapseToEnd();
                //@ts-ignore
            } else if (document.selection) {
                //@ts-ignore
                range = document.selection.createRange();
                range.moveToElementText(obj);
                range.collapse(false);
                range.select();
            }
        }
    }
}

// TextMarker.include(TextEditable);
