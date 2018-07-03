const registedClazz = {};

function VectorTilePlugin() {}

VectorTilePlugin.prototype.paint = function (glData) {
    throw new Error('to be implemented.')
};

VectorTilePlugin.prototype.getType = function () {
    return VectorTilePlugin.type;
};

VectorTilePlugin.prototype.needToRedraw = function () {
    return false;
};

VectorTilePlugin.extend = function (type, props) {
    var clazz = function () {};
    var proto = Object.create(VectorTilePlugin.prototype);
    proto.constructor = clazz;
    clazz.prototype = proto;

    clazz.type = type;
    for (var p in props) {
        if (props.hasOwnProperty(p)) {
            clazz.prototype[p] = props[p];
        }
    }
    clazz.registerAt = registerAt.bind(clazz);
    registedClazz[type] = clazz;
    return clazz;
}

function registerAt(VectorTileLayer) {
    VectorTileLayer.registerPlugin(this);
}

export default VectorTilePlugin;
