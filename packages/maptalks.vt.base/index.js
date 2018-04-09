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

export default VectorTilePlugin;
