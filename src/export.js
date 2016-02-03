
function exportZ() {
    var oldZ = window['layertalks'];

    Z.noConflict = function () {
        window['maptalks'] = oldZ;
        return this;
    };

    window['maptalks'] = Z;
}

if (Z.runningInNode) {
    exports = module.exports = Z;
} else if (typeof define === 'function' && define.amd) {
    define(Z);
}

if (typeof window !== 'undefined') {
    exportZ(Z);
}

