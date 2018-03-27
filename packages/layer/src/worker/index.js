import Dispatcher from './Dispatcher';

export const initialize = function () {
};

export const onmessage = function (message, postResponse) {
    const data = message.data;
    if (!this.dispatcher) {
        this.dispatcher = new Dispatcher();
    }
    this.dispatcher[data.command]({ mapId: data.mapId, layerId : data.layerId, params : data.params }, (err, data, buffers) => {
        postResponse(err, data, buffers);
    });
};

