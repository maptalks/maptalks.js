import Geometry from '../Geometry';
import GeometryEditor from '../editor/GeometryEditor';

Geometry.include(/** @lends Geometry.prototype */ {
    /**
     * Start to edit
     * @param {Object} [options=null]        - edit options
     * @param {Object} [options.symbol=null] - symbol for the geometry during editing
     * @param {Object} [options.fixAspectRatio=false]    - fix outline's aspect ratio when resizing
     * @param {Object} [options.centerHandleSymbol=null] - symbol of center handle
     * @param {Object} [options.vertexHandleSymbol=null] - symbol of vertex handle
     * @param {Object} [options.newVertexHandleSymbol=null] - symbol of new vertex handle
     * @param {Object} [options.removeVertexOn=contextmenu] - event to remove a vertex from line or polygon, contextmenu by default
     * @return {Geometry} this
     */
    startEdit(opts) {
        if (!this.getMap() || !this.options['editable']) {
            return this;
        }
        this.endEdit();
        this._editor = new GeometryEditor(this, opts);
        this._editor.start();
        /**
         * start edit event
         *
         * @event Geometry#editstart
         * @type {Object}
         * @property {String} type - editstart
         * @property {Geometry} target - the geometry fires the event
         */
        this.fire('editstart');
        return this;
    },

    /**
     * End editing.
     * @return {Geometry} this
     */
    endEdit() {
        if (this._editor) {
            this._editor.stop();
            delete this._editor;
            /**
             * end edit event
             *
             * @event Geometry#editend
             * @type {Object}
             * @property {String} type - editend
             * @property {Geometry} target - the geometry fires the event
             */
            this.fire('editend');
        }
        return this;
    },

    /**
     * Redo the edit
     * @return {Geometry} this
     */
    redoEdit() {
        if (!this.isEditing()) {
            return this;
        }
        this._editor.redo();
        /**
         * redo edit event
         *
         * @event Geometry#redoedit
         * @type {Object}
         * @property {String} type - redoedit
         * @property {Geometry} target - the geometry fires the event
         */
        this.fire('redoedit');
        return this;
    },

    /**
     * Undo the edit
     * @return {Geometry} this
     */
    undoEdit() {
        if (!this.isEditing()) {
            return this;
        }
        this._editor.undo();
        /**
         * undo edit event
         *
         * @event Geometry#undoedit
         * @type {Object}
         * @property {String} type - undoedit
         * @property {Geometry} target - the geometry fires the event
         */
        this.fire('undoedit');
        return this;
    },

    /**
     * cancel the edit
     * @return {Geometry} this
     */
    cancelEdit() {
        if (!this.isEditing()) {
            return this;
        }
        this._editor.cancel();
        /**
         * cancel edit event
         *
         * @event Geometry#canceledit
         * @type {Object}
         * @property {String} type - canceledit
         * @property {Geometry} target - the geometry fires the event
         */
        this.fire('canceledit');
        return this;
    },

    /**
     * Whether the geometry is being edited.
     * @return {Boolean}
     */
    isEditing() {
        if (this._editor) {
            return this._editor.isEditing();
        }
        return false;
    }
});
