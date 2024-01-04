// import { resolve } from 'zousan';
import { requestAnimFrame } from './util';
import { isFunction } from './util/common';
import { getGlobalWorkerPool } from './worker/WorkerPool';
import Browser from './Browser';

let tasks = [];

export function pushTask(task) {
    if (!task) {
        return null;
    }
    if (isFunction(task)) {
        task = { count: 1, run: task };
    }
    if (!task.run) {
        return null;
    }
    if (!task.count) {
        task.count = 1;
    }
    task.count = Math.ceil(task.count);
    tasks.push(task);
    const promise = new Promise((resolve) => {
        task.resolve = resolve;
    });
    startGlobalTasks();
    return promise;
}

function runTasks() {
    const runingTasks = [], endTasks = [];
    let len = tasks.length;
    for (let i = 0; i < len; i++) {
        const task = tasks[i];
        task.count--;
        if (task.count === -1) {
            endTasks.push(task);
        } else {
            runingTasks.push(task);
            task.run();
        }
    }
    len = endTasks.length;
    for (let i = 0; i < len; i++) {
        const task = endTasks[i];
        if (task.resolve) {
            task.resolve();
        }
    }
    tasks = runingTasks;
}

function loop() {
    getGlobalWorkerPool().commit();
    runTasks();
}

function frameLoop(deadline) {
    if (Browser.requestIdleCallback) {
        if (deadline && (deadline.timeRemaining() > 10 || deadline.didTimeout)) {
            loop();
        }
        requestIdleCallback(frameLoop, { timeout: 1000 });
    } else {
        loop();
        // Fallback to
        requestAnimFrame(frameLoop);
    }
}

let started = false;
export function startGlobalTasks() {
    if (started) {
        return;
    }
    started = true;
    frameLoop();
}
