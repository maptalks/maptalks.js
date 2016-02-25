!(function(context) {
    var h = {},
        events = {
            mouse: ['click', 'mousedown', 'mouseup', 'mousemove',
                'mouseover', 'mouseout'],
            key: ['keydown', 'keyup', 'keypress'],
            touch:['touchstart', 'touchmove', 'touchend']
        },
        s, i;

    // Make inheritance bearable: clone one level of properties
    function extend(child, parent) {
        for (var property in parent) {
            if (typeof child[property] == 'undefined') {
                child[property] = parent[property];
            }
        }
        return child;
    }

    // IE<9 doesn't support indexOf
    function has(x, y) {
        for (var i = 0; i < x.length; i++) if (x[i] == y) return true;
        return false;
    }

    h.makeEvent = function(o) {
        var evt;
        if (has(events.key, o.type)) {
            if (typeof Event === 'function') {
                evt = new Event(o.type);
                evt.keyCode = o.keyCode || 0;
                evt.charCode = o.charCode || 0;
                evt.shiftKey = o.shiftKey || false;
                evt.metaKey = o.metaKey || false;
                evt.ctrlKey = o.ctrlKey || false;
                evt.altKey = o.altKey || false;
                evt.relatedTarget = o.relatedTarget;
            } else {
                evt = document.createEvent('KeyboardEvent');
                // https://developer.mozilla.org/en/DOM/event.initKeyEvent
                // https://developer.mozilla.org/en/DOM/KeyboardEvent
                evt[(evt.initKeyEvent) ? 'initKeyEvent'
                    : 'initKeyboardEvent'](
                    o.type, //  in DOMString typeArg,
                    true,   //  in boolean canBubbleArg,
                    true,   //  in boolean cancelableArg,
                    null,   //  in nsIDOMAbstractView viewArg,  Specifies UIEvent.view. This value may be null.
                    o.ctrlKey || false,  //  in boolean ctrlKeyArg,
                    o.altKey || false,  //  in boolean altKeyArg,
                    o.shiftKey || false,  //  in boolean shiftKeyArg,
                    o.metaKey || false,  //  in boolean metaKeyArg,
                    o.keyCode || 0,     //  in unsigned long keyCodeArg,
                    o.charCode || 0       //  in unsigned long charCodeArg);
                );

                // Workaround for https://bugs.webkit.org/show_bug.cgi?id=16735
                if (evt.ctrlKey != (o.ctrlKey || 0) ||
                  evt.altKey != (o.altKey || 0) ||
                  evt.shiftKey != (o.shiftKey || 0) ||
                  evt.metaKey != (o.metaKey || 0) ||
                  evt.keyCode != (o.keyCode || 0) ||
                  evt.charCode != (o.charCode || 0)) {
                    evt = document.createEvent('Event');
                    evt.initEvent(o.type, true, true);
                    evt.ctrlKey  = o.ctrlKey || false;
                    evt.altKey   = o.altKey || false;
                    evt.shiftKey = o.shiftKey || false;
                    evt.metaKey  = o.metaKey || false;
                    evt.keyCode  = o.keyCode || 0;
                    evt.charCode = o.charCode || 0;
                }
            }
        } else {
            if (typeof document.createEvent === 'undefined' &&
                typeof document.createEventObject !== 'undefined') {
                evt = document.createEventObject();
                extend(evt, o);
            } else if (typeof document.createEvent !== 'undefined') {
                if (has(events.touch, o.type)) {
                    evt = document.createEvent('UIEvent');
                    evt.initUIEvent(o.type, true, true, window, o.detail || 1);
                    extend(evt, o);
                } else {
                    // both MouseEvent and MouseEvents work in Chrome
                    evt = document.createEvent('MouseEvents');
                    // https://developer.mozilla.org/en/DOM/event.initMouseEvent
                    evt.initMouseEvent(o.type,
                        true, // canBubble
                        true, // cancelable
                        window, // 'AbstractView'
                        o.detail || 0, // click count or mousewheel detail
                        o.screenX || 0, // screenX
                        o.screenY || 0, // screenY
                        o.clientX || 0, // clientX
                        o.clientY || 0, // clientY
                        o.ctrlKey || 0, // ctrl
                        o.altKey || false, // alt
                        o.shiftKey || false, // shift
                        o.metaKey || false, // meta
                        o.button || false, // mouse button
                        o.relatedTarget // relatedTarget
                    );
                }
            }
        }
        return evt;
    };

    h.dispatchEvent = function(x, evt) {
        // not ie before 9
        if (typeof x.dispatchEvent !== 'undefined') {
            x.dispatchEvent(evt);
        } else if (typeof x.fireEvent !== 'undefined') {
            x.fireEvent('on' + evt.type, evt);
        }
    };

    h.once = function(x, o) {
        h.dispatchEvent(x, h.makeEvent(o || {}));
    };

    for (var type in events) {
        if (!events.hasOwnProperty(type)) continue;
        var shortcuts = events[type];
        for (i = 0; i < shortcuts.length; i++) {
            s = shortcuts[i];
            h[s] = (function(s) {
                return function(x, o) {
                    h.once(x, extend(o || {}, { type: s }));
                };
            })(s);
        }
    }

    h.dblclick = function(x, o) {
        h.once(x, extend(o || {}, { type: 'dblclick', detail: 2 }));
    };

    if (typeof window !== 'undefined') window.happen = h;
    if (typeof module !== 'undefined') module.exports = h;

    // Provide jQuery plugin
    if (typeof jQuery !== 'undefined' && jQuery.fn) {
        jQuery.fn.happen = function(o) {
            if (typeof o === 'string') o = { type: o };
            for (var i = 0; i < this.length; i++) {
                happen.once(this[i], o);
            }
            return this;
        };
    }
})(this);
