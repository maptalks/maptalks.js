import * as maptalks from 'maptalks';
import { getAbsoluteURL } from './Util';

const canvas = typeof document === 'undefined' ? null : document.createElement('canvas');
function requestImage(url, cb) {
    const image = new Image();
    image.onload = () => {
        if (!canvas) {
            cb(new Error('There is no canvas to draw image!'));
            return;
        }
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, image.width, image.height);
        const imageData = ctx.getImageData(0, 0, image.width, image.height);
        const result = { width : image.width, height : image.height, data : new Uint8Array(imageData.data) };
        cb(null, result, [result.data.buffer]);
    };
    image.onerror = function (err) {
        cb(err);
    };
    image.src = url;
}
export default class GLTFWorkerConnection extends maptalks.worker.Actor {
    constructor(workerKey, layer) {
        super(workerKey);
        this.mapId = layer.getMap().id;
        this._layer = layer;
    }

    loadGLTF(url) {
        const reqUrl = getAbsoluteURL(url);
        const data = {
            url: reqUrl,
            referrer: window && window.location.href,
            fetchOptions: this._layer.options.fetchOptions
        };
        return new Promise((resolve, reject) => {
            this.send(data, null, (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(data);
            });
        });
    }

    sendImageData(url, cb) {
        requestImage(url, (err, result) => {
            if (err) {
                return;
            }
            //worker connection在非激活状态下终止向worker进程传数据
            if (!this.isActive()) {
                return;
            }
            // cb 是 Actor receive方法的回调函数，负责接收到数据并回传给worker
            cb(null, { result, imageUrl: url });
        });
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

    removeLayer(layerId, options, cb) {
        const data = {
            mapId : this.mapId,
            layerId,
            command : 'removeLayer'
        };
        this.broadcast(data, null, cb);
    }
}
