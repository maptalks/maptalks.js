const registedClazz = {};

function VectorTilePlugin() {
}

const parentProto = VectorTilePlugin.prototype;

parentProto.getType = function () {
    return Object.getPrototypeOf(this).constructor.type;
};

parentProto.isVisible = function () {
    throw new Error('to be implemented.');
}

parentProto.prepareRender = function () {
    throw new Error('to be implemented.');
}

parentProto.updateCollision = function () {
    throw new Error('to be implemented.');
}

parentProto.supportRenderMode = function () {
    throw new Error('to be implemented.');
}

parentProto.startFrame = function () {
    throw new Error('to be implemented.');
};

parentProto.endFrame = function () {
    throw new Error('to be implemented.');
};

parentProto.paintTile = function () {
    throw new Error('to be implemented.');
};

parentProto.getShadowMeshes = function () {
    throw new Error('to be implemented.');
};


parentProto.updateSceneConfig = function () {
    throw new Error('to be implemented.');
};

parentProto.updateDataConfig = function () {
    throw new Error('to be implemented.');
};

parentProto.updateSymbol = function () {
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
    throw new Error('to be implemented.');
};

parentProto.needToRetireFrames = function () {
    throw new Error('to be implemented.');
};

parentProto.outline = function () {
    throw new Error('to be implemented.');
};

parentProto.outlineAll = function () {
    throw new Error('to be implemented.');
};

parentProto.needPolygonOffset = function () {
    throw new Error('to be implemented.');
};


parentProto.constructor = VectorTilePlugin;

const hasOwn = Object.prototype.hasOwnProperty;

VectorTilePlugin.extend = function (type, props) {
    /**
     * @type Class
     */
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
        if (hasOwn.call(props, p)) {
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
