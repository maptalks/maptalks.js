import * as gltf from '@maptalks/gltf-loader';
import transcoders from '@maptalks/gl/dist/transcoders';

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
    return gltf.Ajax.getJSON(url, options);
}

function getArrayBuffer(url, options) {
    return gltf.Ajax.getArrayBuffer(url, options);
}

function loadGLTF(root, data, options) {
    const loader = new gltf.GLTFLoader(root, data, options);
    return loader.load({
        skipAttributeTransform: true
    });
}

function load(actorId, url, fetchOptions) {
    const index = url.lastIndexOf('/');
    const root = url.slice(0, index);
    const imgRequest = requestImage.bind(this, actorId);
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
                return loadGLTF(root, res, { requestImage: imgRequest, decoders, transferable: true, fetchOptions });
            });
        } else {
            return loadGLTF(root, { buffer: res.data, byteOffset: 0 }, { requestImage: imgRequest, decoders, transferable: true, fetchOptions });
        }
    });
}

function requestImage(actorId, url, fetchOptions, cb) {
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
    load(actorId, url, fetchOptions).then(data => {
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
