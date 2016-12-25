import GeometryEditor from '../editor/GeometryEditor';

export const Editing = /** @lends Geometry.prototype */ {
    /**
     * Start to edit
     * @param {Object} [options=null]        - edit options
     * @param {Object} [options.symbol=null] - symbol for the geometry during editing
     * @return {Geometry} this
     */
    startEdit: function (opts) {
        if (!this.getMap() || !this.options['editable']) {
            return this;
        }
        this.endEdit();
        this._editor = new GeometryEditor(this, opts);
        this._editor.start();
        this.fire('editstart');
        return this;
    },

    /**
     * End editing.
     * @return {Geometry} this
     */
    endEdit: function () {
        if (this._editor) {
            this._editor.stop();
            delete this._editor;
            this.fire('editend');
        }
        return this;
    },

    /**
     * Whether the geometry is being edited.
     * @return {Boolean}
     */
    isEditing: function () {
        if (this._editor) {
            return this._editor.isEditing();
        }
        return false;
    }

};

export function initEdit(Geometry) {
    Geometry.include(Editing);
}
