import Geometry from '../Geometry';
import GeometryEditor from '../editor/GeometryEditor';
interface EditOptions {
    symbol: null,
    fixAspectRatio: false,
    centerHandleSymbol: null,
    vertexHandleSymbol: null,
    newVertexHandleSymbol: null,
    removeVertexOn: any,
}

Geometry.include(/** @lends Geometry.prototype */ {
    /**
     * 开始编辑
     * @english
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
    startEdit(opts: EditOptions): Geometry {
        const map = this.getMap();
        if (!map || !this.options['editable']) {
            return this;
        }
        if (this._editor) {
            this.endEdit();
        }
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
        if (!this._getParent()) {
            this.fire('editstart');
        }
        map.getRenderer().setToRedraw();
        return this;
    },

    /**
     * 结束编辑
     * @english
     * End editing.
     * @return {Geometry} this
     */
    endEdit(): Geometry {
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
            if (!this._getParent()) {
                this.fire('editend');
            }
            const map = this.getMap();
            if (map) {
                map.getRenderer().setToRedraw();
            }
        }
        return this;
    },

    /**
     * 重新编辑
     * @english
     * Redo the edit
     * @return {Geometry} this
     */
    redoEdit(): Geometry {
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
        if (!this._getParent()) {
            this.fire('redoedit');
        }
        return this;
    },

    /**
     * 撤销编辑
     * @english
     * Undo the edit
     * @return {Geometry} this
     */
    undoEdit(): Geometry {
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
        if (!this._getParent()) {
            this.fire('undoedit');
        }
        return this;
    },

    /**
     * 取消编辑
     * @english
     * cancel the edit
     * @return {Geometry} this
     */
    cancelEdit(): Geometry {
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
        if (!this._getParent()) {
            this.fire('canceledit');
        }
        return this;
    },

    /**
     * 是否正在编辑几何图形
     * @english
     * Whether the geometry is being edited.
     * @return {Boolean}
     */
    isEditing(): Boolean {
        if (this._editor) {
            return this._editor.isEditing();
        }
        return false;
    }
});
