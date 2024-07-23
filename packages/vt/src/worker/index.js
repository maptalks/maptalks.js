import Dispatcher from './Dispatcher';

export const initialize = function () {
};

export const onmessage = function (message, postResponse) {
    const data = message.data;
    if (!this.dispatcher) {
        this.dispatcher = new Dispatcher(message.workerId);
    }
    if (message.type === '<response>') {
        //sent request to main thread and receiving response
        if (this.dispatcher.workerId === message.workerId) {
            this.dispatcher.receive(message);
        }
    } else {
        const command = data.command;
        this.dispatcher[command]({ actorId: message.actorId, mapId: data.mapId, layerId: data.layerId, params: data.params }, (err, data, buffers) => {
            if (err && err.status !== 404 && err.status !== 204 && !err.loading) {
                // err.loading 为true时，说明geojson-vt正在创建索引
                console.error(command, err);
            }
            postResponse(err, data, buffers);
        });
    }
};

