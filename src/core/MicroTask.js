import PromisePolyfill from './Promise';
import { requestAnimFrame } from './util';
import { isFunction, isNil } from './util/common';
import { getGlobalWorkerPool } from './worker/WorkerPool';
import Browser from './Browser';

let tasks = [];

/**
 *
 * @param {Object|Function} task  - a micro task
 * @param {Number} task.count - task run count
 * @param {Function} task.run - task run function
 * @return {Promise}
 * @example
 * const run =()=>{
 * //do some things
 * };
 * runTaskAsync({count:4,run}).then(result=>{})
 * runTaskAsync(run).then(result=>{})
 */
export function runTaskAsync(task) {
    startTasks();
    const promise = new PromisePolyfill((resolve, reject) => {
        if (!task) {
            reject(new Error('task is null'));
            return;
        }
        if (isFunction(task)) {
            task = { count: 1, run: task };
        }
        if (!task.run) {
            reject(new Error('task.run is null'));
            return;
        }
        if (isNil(task.count)) {
            task.count = 1;
        }
        task.count = Math.ceil(task.count);
        task.results = [];
        tasks.push(task);
        task.resolve = resolve;
    });
    return promise;
}

function executeMicroTasks() {
    const runingTasks = [], endTasks = [];
    let len = tasks.length;
    for (let i = 0; i < len; i++) {
        const task = tasks[i];
        task.count--;
        if (task.count === -1) {
            endTasks.push(task);
        } else {
            runingTasks.push(task);
            const result = task.run();
            task.results.push(result);
        }
    }
    len = endTasks.length;
    for (let i = 0; i < len; i++) {
        const task = endTasks[i];
        if (task.resolve) {
            task.resolve(task.results);
        }
    }
    tasks = runingTasks;
}

function loop() {
    getGlobalWorkerPool().commit();
    executeMicroTasks();
}

function frameLoop(deadline) {
    if (Browser.requestIdleCallback) {
        if (deadline && (deadline.timeRemaining() > 10 || deadline.didTimeout)) {
            loop();
        }
        requestIdleCallback(frameLoop, { timeout: 1000 });
    } else {
        loop();
        // Fallback to requestAnimFrame
        requestAnimFrame(frameLoop);
    }
}

let started = false;
export function startTasks() {
    if (started) {
        return;
    }
    started = true;
    frameLoop();
}
