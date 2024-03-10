import Class from '../../core/Class';
import Point from '../../geo/Point';
import Position from '../../geo/Position'
declare const EditHandle_base: {
    new (...args: any[]): {
        _eventMap: object;
        _eventParent: any;
        _eventTarget: any;
        on(eventsOn: string, handler: Function, context?: any): any;
        addEventListener(): any;
        once(eventTypes: string, handler: Function, context?: any): any;
        off(eventsOff: string, handler: Function, context: any): any;
        removeEventListener(): any;
        listens(eventType: string, handler?: Function, context?: any): any;
        getListeningEvents(): string[];
        copyEventListeners(target: any): any;
        fire(): any;
        _wrapOnceHandler(evtType: any, handler: any, context: any): () => void;
        _switch(to: any, eventKeys: any, context: any): any;
        _clearListeners(eventType: any): void;
        _clearAllListeners(): void;
        _setEventParent(parent: any): any;
        _setEventTarget(target: any): any;
        _fire(eventType: string, param: any): any;
    };
} & typeof Class;
export default class EditHandle extends EditHandle_base {
    target: any;
    w: number;
    h: number;
    opacity: number;
    map: any;
    events: any;
    url: string;
    _point: Point;
    _img: any;
    _dragger: any;
    constructor(target: any, map: any, options: any);
    getCursor(): any;
    _fetchImage(): void;
    setContainerPoint(cp: any): void;
    getContainerPoint(): Position;
    offset(p: any): void;
    render(ctx: any): boolean;
    delete(): void;
    hitTest(p: any): boolean;
    addTo(map: any): void;
    onEvent(e: any): void;
    mousedown(e: any): void;
    onDragstart(e: any): void;
    onDragging(e: any): void;
    onDragend(e: any): void;
}
export {};
