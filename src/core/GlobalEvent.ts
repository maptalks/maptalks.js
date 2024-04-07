import Eventable from './Eventable';
import Browser from './Browser';
import { addDomEvent } from './util/dom';

class Base {

}

class GlobalEventable extends Eventable(Base) {

}

// this is global event bus for doc state change
// such as : devicePixelRatio ,visibilitychange,... etc

export const GlobalEvent = new GlobalEventable();

export const EVENT_DPR_CHANGE = 'dprchange';
export const EVENT_DOC_VISIBILITY_CHANGE = 'docvisibilitychange';
export const EVENT_DOC_DRAGSTART = 'dragstart';
export const EVENT_DOC_DRAGEND = 'dragend';


//monitor devicePixelRatio change
if (typeof window !== 'undefined' && window.matchMedia) {
    for (let i = 1; i < 500; i++) {
        const dpi = (i * 0.01).toFixed(2);
        const screen = window.matchMedia(`screen and (resolution: ${dpi}dppx)`);
        if (screen) {
            if (screen.addEventListener) {
                screen.addEventListener('change', Browser.checkDevicePixelRatio);
            } else if (screen.addListener) {
                screen.addListener(Browser.checkDevicePixelRatio);
            }
        }
    }

}

if (Browser.devicePixelRatio) {
    let tempDPI = Browser.devicePixelRatio;
    Object.defineProperty(Browser, 'devicePixelRatio', {
        get: () => {
            return tempDPI;
        },
        set: (value) => {
            if (value === tempDPI) {
                return;
            }
            //when devicePixelRatio change force resize all layers
            tempDPI = value;
            if (!Browser.monitorDPRChange) {
                return;
            }
            GlobalEvent.fire(EVENT_DPR_CHANGE, { devicePixelRatio: value });
        }
    });
}

//monitor document visibilitychange change
if (Browser.webgl && typeof document !== 'undefined') {
    addDomEvent(document, 'visibilitychange', () => {
        GlobalEvent.fire(EVENT_DOC_VISIBILITY_CHANGE, { visibilityState: document.visibilityState });
    });
    addDomEvent(document, 'dragstart', () => {
        GlobalEvent.fire(EVENT_DOC_DRAGSTART);
    });
    addDomEvent(document, 'dragend', () => {
        GlobalEvent.fire(EVENT_DOC_DRAGEND);
    });
}
