
function exportMaptalks() {
    var old = window['maptalks'];

    maptalks.noConflict = function () {
        window['maptalks'] = old;
        return this;
    };

    window['maptalks'] = maptalks;
}

if (typeof module !== 'undefined' && module.exports) {
    exports = module.exports = maptalks;
} else if (typeof define === 'function' && define.amd) {
    define(maptalks);
}

if (typeof window !== 'undefined') {
    exportMaptalks(maptalks);
}

