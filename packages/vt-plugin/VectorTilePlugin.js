const registedClazz = {};

function VectorTilePlugin() {
}

const parentProto = VectorTilePlugin.prototype;

parentProto.getType = function () {
    return Object.getPrototypeOf(this).constructor.type;
};

parentProto.startFrame = function () {
    throw new Error('to be implemented.');
};

parentProto.endFrame = function () {
    throw new Error('to be implemented.');
};

parentProto.paintTile = function () {
    throw new Error('to be implemented.');
};

parentProto.pick = function () {
    throw new Error('to be implemented.');
};

parentProto.resize = function () {
    throw new Error('to be implemented.');
};

parentProto.deleteTile = function () {
    throw new Error('to be implemented.');
};

parentProto.remove = function () {
    throw new Error('to be implemented.');
};

parentProto.needToRedraw = function () {
    return false;
};

parentProto.constructor = VectorTilePlugin;

VectorTilePlugin.extend = function (type, props) {
    const clazz = function () {
        if (this.init) {
            this.init();
        }
    };
    const proto = Object.create(parentProto);
    proto.constructor = clazz;
    clazz.prototype = proto;

    clazz.type = type;
    for (const p in props) {
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
