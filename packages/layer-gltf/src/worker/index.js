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

function load(actorId, url) {
    const index = url.lastIndexOf('/');
    const root = url.slice(0, index);
    const postfix = url.slice(url.lastIndexOf('.')).toLowerCase();
    const imgRequest = requestImage.bind(this, actorId);
    if (postfix.indexOf('.gltf') > -1) {
        return getJSON(url, {}).then(res => {
            //res.message存在，证明status!==200, 见https://github.com/fuzhenn/gltf-loader/blob/master/src/core/Ajax.js#L82
            if (res.message) {
                return res;
            }
            return loadGLTF(root, res, { requestImage: imgRequest, decoders, transferable: true });
        });
    } else if (postfix.indexOf('.glb') > -1) {
        return getArrayBuffer(url, {}).then(res => {
            if (res.message) {
                return res;
            }
            return loadGLTF(root, { buffer: res.data, byteOffset: 0 }, { requestImage: imgRequest, decoders, transferable: true });
        });
    }
    return null;
}

function requestImage(actorId, url, cb) {
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
    load(actorId, url).then(data => {
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
