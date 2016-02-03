Z.Geometry.include({
    /**
     * 开始编辑Geometry
     * @member maptalks.Geometry
     * @expose
     */
    startEdit: function(opts) {
        this.endEdit();
        this._editor = new Z.Editor(this,opts);
        this._editor.start();
    },

    /**
     * 结束编辑
     * @member maptalks.Geometry
     * @expose
     */
    endEdit: function() {
        if (this._editor) {
            this._editor.stop();
            delete this._editor;
        }
    },

    /**
     * Geometry是否处于编辑状态中
     * @member maptalks.Geometry
     * @return {Boolean} 是否处于编辑状态
     * @expose
     */
    isEditing: function() {
        if (this._editor) {
            return this._editor.isEditing();
        }
        return false;
    }

});
