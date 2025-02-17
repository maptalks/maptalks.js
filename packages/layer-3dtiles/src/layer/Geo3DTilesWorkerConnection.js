import * as maptalks from 'maptalks';

const canvas = typeof document === 'undefined' ? null : document.createElement('canvas');

export default class Geo3DTilesWorkerConnection extends maptalks.worker.Actor {
    constructor(workerKey, mapId, supportNPOT) {
        super(workerKey);
        this.mapId = mapId;
        this._supportNPOT = supportNPOT;
    }

    initialize(cb) {
        cb(null);
    }

    loadTile(layerId, params, cb) {
        let buffers = null;
        if (params && params.arraybuffer) {
            buffers = [params.arraybuffer];
        }
        const data = {
            mapId : this.mapId,
            layerId,
            command : 'loadTile',
            params
        };
        this.send(data, buffers, cb);
    }

    abortTileLoading(layerId, url, cb) {
        const data = {
            mapId : this.mapId,
            layerId,
            command : 'abortTileLoading',
            params : {
                url
            }
        };
        this.broadcast(data, null, cb);
    }

    addLayer(layerId, options, cb) {
        const data = {
            actorId: this.actorId,
            mapId : this.mapId,
            layerId,
            command : 'addLayer',
            params : {
                options
            }
        };

        this.broadcast(data, null, cb);
    }

    removeLayer(layerId, cb) {
        const data = {
            mapId : this.mapId,
            layerId,
            command : 'removeLayer'
        };
        this.broadcast(data, null, cb);
    }

    requestImage({ url }, cb) {
        const image = new Image();
        image.onload = () => {
            if (!this.isActive()) {
                return;
            }
            if (!canvas) {
                cb(new Error('There is no canvas to draw image!'));
                return;
            }
            const img = this._supportNPOT ? image : resize(image);
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(img, 0, 0, img.width, img.height);
            const imgData = ctx.getImageData(0, 0, img.width, img.height);
            //TODO, retina may need special operations
            const result = { width : img.width, height : img.height, data : new Uint8Array(imgData.data) };
            cb(null, result, [result.data.buffer]);
        };
        image.onerror = function (err) {
            cb(err);
        };
        image.src = url;
    }
}

function resize(image) {
    if (isPowerOfTwo(image.width) && isPowerOfTwo(image.height)) {
        return image;
    }
    let width = image.width;
    let height = image.height;
    if (!isPowerOfTwo(width)) {
        width = floorPowerOfTwo(width);
    }
    if (!isPowerOfTwo(height)) {
        height = floorPowerOfTwo(height);
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(image, 0, 0, width, height);
    const url = image.src;
    const idx = url.lastIndexOf('/') + 1;
    const filename = url.substring(idx);
    console.warn(`Texture(${filename})'s size is not power of two, resize from (${image.width}, ${image.height}) to (${width}, ${height})`);
    return canvas;
}

function isPowerOfTwo(value) {
    return (value & (value - 1)) === 0 && value !== 0;
}

function floorPowerOfTwo(value) {
    return Math.pow(2, Math.floor(Math.log(value) / Math.LN2));
}
