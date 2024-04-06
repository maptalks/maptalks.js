import { on, off, createEl, stopPropagation } from '../../core/util/dom';
import { isNil } from '../../core/util';
import TextMarker from '../../geometry/TextMarker';
import UIMarker from '../../ui/UIMarker';

/**
 * Mixin methods for text editing.
 * @mixin TextEditable
 */
const TextEditable = {
    /**
     * 开始编辑文本，每当点击地图时，编辑将自动结束
     * @english
     * Start to edit the text, editing will be ended automatically whenever map is clicked.
     *
     * @return {TextMarker} this
     * @fires TextMarker#edittextstart
     */
    startEditText(): TextMarker {
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
     * 结束编辑
     * @english
     * End text edit.
     *
     * @return {TextMarker} this
     * @fires TextMarker#edittextend
     */
    endEditText() {
        if (this._textEditor) {
            let html = this._textEditor.innerHTML;
            html = html.replace(/<p>/ig, '').replace(/<\/p>/ig, '<br/>');
            this._textEditor.innerHTML = html;
            // trim enter chars in the end of text for IE
            const content = this._textEditor.innerText.replace(/[\r\n]+$/gi, '');
            this.setContent(content);
            off(this._textEditor, 'mousedown dblclick', stopPropagation);
            this.getMap().off('mousedown', this.endEditText, this);
            this._editUIMarker.remove();
            delete this._editUIMarker;
            this._textEditor.onkeyup = null;
            delete this._textEditor;
            this.show();
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
     * 是否正在编辑文本
     * @english
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
     * 获取正在编辑的文本对象
     * @english
     * Get the text editor which is an [ui.UIMarker]{@link ui.UIMarker}
     * @return {ui.UIMarker} text editor
     */
    getTextEditor(): UIMarker {
        return this._editUIMarker;
    },

    _prepareEditor(): void {
        const map = this.getMap();
        const editContainer = this._createEditor();
        this._textEditor = editContainer;
        map.on('mousedown', this.endEditText, this);
        const offset = this._getEditorOffset();
        this._editUIMarker = new UIMarker(this.getCoordinates(), {
            'animation': null,
            'content': editContainer,
            'dx': offset.dx,
            'dy': offset.dy
        })
            .addTo(map);
        this._setCursorToLast(this._textEditor);
    },

    _getEditorOffset(): object {
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
    },

    _createEditor(): HTMLElement {
        const content = this.getContent();
        const labelSize = this.getSize(),
            symbol = this._getInternalSymbol() || {},
            width = labelSize.width,
            textColor = symbol['textFill'] || '#000000',
            textSize = symbol['textSize'] || 12,
            height = labelSize.height,
            lineColor = symbol['markerLineColor'] || '#000',
            fill = symbol['markerFill'] || '#3398CC',
            spacing = symbol['textLineSpacing'] || 0;
        const editor = createEl('div');
        // @ts-expect-error todo
        editor.contentEditable = true;
        editor.style.cssText = `background:${fill}; border:1px solid ${lineColor};
            color:${textColor};font-size:${textSize}px;width:${width - 2}px;height:${height - 2}px;margin: auto;
            line-height:${textSize + spacing}px;outline: 0; padding:0; margin:0;word-wrap: break-word;
            overflow: hidden;-webkit-user-modify: read-write-plaintext-only;`;

        editor.innerText = content;
        on(editor, 'mousedown dblclick', stopPropagation);
        editor.onkeyup = function (event) {
            const h: any = editor.style.height || 0;
            if (event.keyCode === 13) {
                editor.style.height = (parseInt(h) + textSize / 2) + 'px';
            }
        };
        return editor;
    },

    _setCursorToLast(obj) {
        let range;
        if (window.getSelection) {
            obj.focus();
            range = window.getSelection();
            range.selectAllChildren(obj);
            range.collapseToEnd();
            // @ts-expect-error todo待确认document
        } else if (document.selection) {
            // @ts-expect-error todo待确认document
            range = document.selection.createRange();
            range.moveToElementText(obj);
            range.collapse(false);
            range.select();
        }
    }
};

TextMarker.include(TextEditable);

export default TextEditable;
