import transcoders, { getGLTFLoaderBundle } from '@maptalks/gl/dist/transcoders';

const gltfloader = getGLTFLoaderBundle();

const decoders = {
    'image/crn': transcoders.crn && transcoders.crn(),
    'image/ktx2': transcoders.ktx2 && transcoders.ktx2(),
    'image/cttf': transcoders.ktx2 && transcoders.ktx2(),
    'draco': transcoders.draco && transcoders.draco()
};

// 保存当前的workerId，用于告知主线程结果回传给哪个worker
let workerId;

const callbacks = {
};

function getJSON(url, options) {
    return gltfloader.Ajax.getJSON(url, options);
}

function getArrayBuffer(url, options) {
    return gltfloader.Ajax.getArrayBuffer(url, options);
}

function load(root, data, options) {
    const loader = new gltfloader.GLTFLoader(root, data, options);
    return loader.load({
        skipAttributeTransform: true
    });
}

export function loadGLTF(actorId, url, fetchOptions, urlModifier) {
    const index = url.lastIndexOf('/');
    const root = url.slice(0, index);
    if (urlModifier) {
        url = urlModifier(url);
    }
    const imgRequest = (...args) => {
        return requestImage.call(this, actorId, ...args);
    };
    return getArrayBuffer(url, fetchOptions).then(res => {
        if (res.message) {
            return res;
        }
        const data = res.data;
        const dataView = new DataView(data, data.byteOffset, data.byteLength);
        const version = dataView.getUint32(4, true);
        if (version > 2) { //version is 1 or 2
            return getJSON(url, fetchOptions).then(res => {
                if (res.message) {
                    return res;
                }
                return load(root, res, { requestImage: imgRequest, decoders, transferable: true, fetchOptions, urlModifier });
            });
        } else {
            return load(root, { buffer: res.data, byteOffset: 0 }, { requestImage: imgRequest, decoders, transferable: true, fetchOptions, urlModifier });
        }
    });
}

function requestImage(actorId, url, fetchOptions, cb) {
    if (!actorId) {
        requestImageInMainThread(url, cb);
        return;
    }
    if (callbacks[url]) {
        callbacks[url].push(cb);
        return;
    }
    // 保存回调方法，在获取到imageData后调用
    // 用数组为了防止相同url的重复调用
    callbacks[url] = [cb];
    //向主进程传递url
    self.postMessage({type: '<request>', command: 'sendImageData', actorId, workerId, params: url });
}

function gltfload(message) {
    const data = message.data;
    const callback = message.callback;
    const actorId = message.actorId;
    const url = data.url;
    const fetchOptions = data.fetchOptions || {};
    fetchOptions.referrerPolicy = fetchOptions.referrerPolicy || 'origin';
    fetchOptions.referrer = data.referrer;
    loadGLTF(actorId, url, fetchOptions).then(data => {
        if (data.message) {
            self.postMessage({callback, error: data});
        } else {
            self.postMessage({callback, data}, data.transferables);
        }
    }).catch(e => {
        self.postMessage({callback, error: e});
    });
    callbacks['receive'] = callback;
}

export const onmessage = function (message) {
    const data = message.data;
    const url = data.url;
    if (data.command === 'addLayer' || data.command === 'removeLayer') {
        // 保存当前worker的workerId。
        workerId = message.workerId;
        self.postMessage({type: '<response>', actorId: data.actorId, workerId, params: 'ok' });
    } else if (url) {
        //加载gltf数据的逻辑
        gltfload(message);
    } else if (data.imageUrl) {
        //获取主进程传递的imageData的逻辑
        const fns = callbacks[data.imageUrl];
        delete callbacks[data.imageUrl];
        if (fns) {
            for (let i = 0; i < fns.length; i++) {
                fns[i](null, data.result);
            }
        }
    }
}

const canvas = typeof document === 'undefined' ? null : document.createElement('canvas');
function requestImageInMainThread(url, cb) {
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
