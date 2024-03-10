import UIMarker from '../../ui/UIMarker';
type Constructor = new (...args: any[]) => {};
/**
 * Mixin methods for text editing.
 * @mixin TextEditable
 */
export default function TextEditable<TBase extends Constructor>(Base: TBase): {
    new (...args: any[]): {
        _textEditor: any;
        _editUIMarker: UIMarker;
        /**
         * Start to edit the text, editing will be ended automatically whenever map is clicked.
         *
         * @return {TextMarker} this
         * @fires TextMarker#edittextstart
         * @function TextEditable.startEditText
         */
        startEditText(): any;
        /**
         * End text edit.
         *
         * @return {TextMarker} this
         * @function TextEditable.endEditText
         * @fires TextMarker#edittextend
         */
        endEditText(): any;
        /**
         * Whether the text is being edited.
         *
         * @return {Boolean}
         * @function TextEditable.isEditingText
         */
        isEditingText(): boolean;
        /**
         * Get the text editor which is an [ui.UIMarker]{@link ui.UIMarker}
         * @return {ui.UIMarker} text editor
         * @function TextEditable.getTextEditor
         */
        getTextEditor(): UIMarker;
        _prepareEditor(): void;
        _getEditorOffset(): {
            dx: number;
            dy: number;
        };
        _createEditor(): HTMLElement;
        _setCursorToLast(obj: any): void;
    };
} & TBase;
export {};
