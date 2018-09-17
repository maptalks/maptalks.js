const registedClazz = {};

function VectorTilePlugin() {
    if (this.init) {
        this.init();
    }
}

VectorTilePlugin.prototype.getType = function () {
    return Object.getPrototypeOf(this).constructor.type;
};

VectorTilePlugin.prototype.startFrame = function () {
    throw new Error('to be implemented.');
};

VectorTilePlugin.prototype.endFrame = function () {
    throw new Error('to be implemented.');
};

VectorTilePlugin.prototype.paintTile = function () {
    throw new Error('to be implemented.');
};

VectorTilePlugin.prototype.pick = function () {
    throw new Error('to be implemented.');
};

VectorTilePlugin.prototype.resize = function () {
    throw new Error('to be implemented.');
};

VectorTilePlugin.prototype.deleteTile = function () {
    throw new Error('to be implemented.');
};

VectorTilePlugin.prototype.remove = function () {
    throw new Error('to be implemented.');
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
};

function registerAt(VectorTileLayer) {
    VectorTileLayer.registerPlugin(this);
}

export default VectorTilePlugin;
