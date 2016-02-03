Z.Renderable = {
    registerRenderer : function(name, clazz) {
        if (!this._regRenderers) {
            this._regRenderers = {};
        }
        this._regRenderers[name.toLowerCase()] = clazz;
    },

    getRendererClass : function(name) {
        return this._regRenderers[name.toLowerCase()];
    }
}
