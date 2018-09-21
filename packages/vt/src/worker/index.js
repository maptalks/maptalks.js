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
        this.dispatcher[data.command]({ actorId : message.actorId, mapId: data.mapId, layerId : data.layerId, params : data.params }, (err, data, buffers) => {
            postResponse(err, data, buffers);
        });
    }
};

