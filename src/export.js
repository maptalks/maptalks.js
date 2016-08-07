
function exportMaptalks() {
    var old = window['maptalks'];

    Z.noConflict = function () {
        window['maptalks'] = old;
        return this;
    };

    window['maptalks'] = Z;
}

if (typeof module !== 'undefined' && module.exports) {
    exports = module.exports = Z;
} else if (typeof define === 'function' && define.amd) {
    define(Z);
}

if (typeof window !== 'undefined') {
    exportMaptalks(Z);
}

