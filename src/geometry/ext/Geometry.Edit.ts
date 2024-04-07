import Geometry from '../Geometry';
import GeometryEditor from '../editor/GeometryEditor';
export type GeometryEditSymbolType = {
    'markerType': string,
    'markerFill': string,
    'markerLineColor': string,
    'markerLineWidth': number,
    'markerWidth': number,
    'markerHeight': number,
    'opacity': number
}

export type GeometryEditOptionsType = {
    symbol?: { [key: string]: any },
    fixAspectRatio?: boolean,
    centerHandleSymbol?: GeometryEditSymbolType,
    vertexHandleSymbol?: GeometryEditSymbolType,
    newVertexHandleSymbol?: GeometryEditSymbolType,
    removeVertexOn?: string;
    collision?: boolean;
    collisionBufferSize?: number;
    vertexZIndex?: number;
    newVertexZIndex?: number;
}

declare module "../Geometry" {

    interface Geometry {
        startEdit(opts?: GeometryEditOptionsType): this;
        endEdit(): this;
        redoEdit(): this;
        undoEdit(): this;
        cancelEdit(): this;
        isEditing(): boolean;
    }
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
    startEdit(opts?: GeometryEditOptionsType) {
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
        if (!this._getParent()) {
            this.fire('canceledit');
        }
        return this;
    },

    /**
     * 是否正在编辑几何图形
     * @english
     * Whether the geometry is being edited.
     * @return {boolean}
     */
    isEditing(): boolean {
        if (this._editor) {
            return this._editor.isEditing();
        }
        return false;
    }
});
