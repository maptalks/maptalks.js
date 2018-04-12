function VectorTilePlugin() {

}
VectorTilePlugin.prototype.paint = function (glData) {
    throw new Error('to be implemented.')
};

VectorTilePlugin.prototype.getType = function () {
    return VectorTilePlugin.type;
};

VectorTilePlugin.extend = function (type, props) {
    VectorTilePlugin.type = type;
    for (var p in props) {
        if (props.hasOwnProperty(p)) {
            VectorTilePlugin.prototype[p] = props[p];
        }
    }
}

VectorTilePlugin.getType = function () {
    return VectorTilePlugin.type;
};

if (typeof window !== 'undefined' &&  maptalks.VectorTileLayer) {
    maptalks.VectorTileLayer.registerPlugin(VectorTilePlugin);
}

export default VectorTilePlugin;
