import Actor from "./Actor";
import { registerWorkerAdapter } from './Worker';

const WORKER_KEY = 'check_browser_max_fps';
const WORKER_CODE = `function (exports) {
    exports.initialize = function () {};
    function now(){
        return  new Date().getTime();
    }
    function checkFPS(cb) {
        if (!requestAnimationFrame) {
            cb(-1);
            return;
        }
        const count = 100;
        let idx = 0;
        let id;
        let startTime;
        function loop() {
            idx++;
            if (idx === count) {
                cancelAnimationFrame(id);
                const endTime = now();
                const timePerFPS = (endTime - startTime) / count;
                const fps = Math.floor(1000 / timePerFPS);
                cb(fps);
            } else {
                id = requestAnimationFrame(loop);
            }
        }
        startTime = now();
        id = requestAnimationFrame(loop);
    }
    //recive message
    exports.onmessage = function (msg, postResponse) {
        checkFPS((fps) => {
            if (fps < -1) {
                postResponse('check fps fail');
            } else {
                postResponse(null, { fps });
            }
        })
    }
}`;

registerWorkerAdapter(WORKER_KEY, function () { return WORKER_CODE; });

let actor: Actor;

class FPSCheckActor extends Actor {

    constructor() {
        super(WORKER_KEY);
    }
}

export function checkFPS(cb: Function) {
    if (!actor) {
        actor = new FPSCheckActor();
    }
    actor.send({}, [], (err, data) => {
        if (err) {
            console.error(err);
            cb();
        } else {
            cb(data.fps as number);
        }
    })
}